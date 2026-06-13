const fs = require('fs');
const path = require('path');
const { Student, Attendance, AttendanceSession, Enrollment } = require('../models');
const faceService = require('../services/faceService');
const sharp = require('sharp');

const registerFace = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a face image'
      });
    }

    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Process image with sharp
    const processedImagePath = req.file.path.replace(/\.[^/.]+$/, '_processed.jpg');
    await sharp(req.file.path)
      .resize(640, 480, { fit: 'cover' })
      .jpeg({ quality: 90 })
      .toFile(processedImagePath);

    // Get face descriptor
    const descriptor = await faceService.getFaceDescriptor(processedImagePath);

    if (!descriptor) {
      // Clean up files
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      if (fs.existsSync(processedImagePath)) fs.unlinkSync(processedImagePath);

      return res.status(400).json({
        success: false,
        message: 'No face detected in the image. Please try again with a clearer image.'
      });
    }

    // Update student with face embedding and profile image
    student.faceEmbedding = descriptor;
    student.profileImage = processedImagePath;
    await student.save();

    // Clean up original file
    if (fs.existsSync(req.file.path) && req.file.path !== processedImagePath) {
      fs.unlinkSync(req.file.path);
    }

    res.status(200).json({
      success: true,
      message: 'Face registered successfully',
      data: {
        studentId: student.id,
        fullName: student.fullName,
        faceRegistered: true
      }
    });
  } catch (error) {
    next(error);
  }
};

const recognizeFace = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a face image'
      });
    }

    const { sessionId } = req.body;

    // Verify session exists
    if (sessionId) {
      const session = await AttendanceSession.findByPk(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false, message: 'Attendance session not found'
        });
      }
      if (session.status !== 'active') {
        return res.status(400).json({
          success: false, message: 'Attendance session is not active'
        });
      }
    }

    // Process image
    const processedImagePath = req.file.path.replace(/\.[^/.]+$/, '_processed.jpg');
    await sharp(req.file.path)
      .resize(640, 480, { fit: 'cover' })
      .jpeg({ quality: 90 })
      .toFile(processedImagePath);

    // Get face descriptor from uploaded image
    const faceDescriptor = await faceService.getFaceDescriptor(processedImagePath);

    if (!faceDescriptor) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      if (fs.existsSync(processedImagePath)) fs.unlinkSync(processedImagePath);

      return res.status(400).json({
        success: false,
        message: 'No face detected in the image'
      });
    }

    // Get all students with face embeddings
    const students = await Student.findAll({
      where: { isActive: true },
      attributes: ['id', 'studentId', 'fullName', 'faceEmbedding']
    });

    // Prepare embeddings for matching
    const embeddings = students
      .filter(s => s.faceEmbedding)
      .map(s => ({
        studentId: s.id,
        fullName: s.fullName,
        studentIdCode: s.studentId,
        descriptor: s.faceEmbedding
      }));

    if (embeddings.length === 0) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      if (fs.existsSync(processedImagePath)) fs.unlinkSync(processedImagePath);

      return res.status(400).json({
        success: false,
        message: 'No registered faces found in the database'
      });
    }

    // Find best match
    const threshold = parseFloat(process.env.FACE_CONFIDENCE_THRESHOLD) || 0.6;
    const match = faceService.findBestMatch(faceDescriptor, embeddings, threshold);

    // Clean up files
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    if (fs.existsSync(processedImagePath)) fs.unlinkSync(processedImagePath);

    if (!match) {
      return res.status(200).json({
        success: true,
        message: 'No matching face found',
        data: {
          recognized: false,
          confidence: 0
        }
      });
    }

    // Check for duplicate attendance if session is provided
    let attendanceMarked = false;
    let attendance = null;

    if (sessionId) {
      const existingAttendance = await Attendance.findOne({
        where: { studentId: match.studentId, sessionId }
      });

      if (!existingAttendance) {
        // Also need courseId from session
        const session = await AttendanceSession.findByPk(sessionId);
        if (session) {
          attendance = await Attendance.create({
            studentId: match.studentId,
            courseId: session.courseId,
            sessionId,
            status: 'present',
            markedBy: 'face_recognition',
            confidence: match.confidence
          });

          session.presentCount = (session.presentCount || 0) + 1;
          await session.save();
          attendanceMarked = true;
        }
      } else {
        attendanceMarked = true;
        attendance = existingAttendance;
      }
    }

    const matchedStudent = students.find(s => s.id === match.studentId);

    res.status(200).json({
      success: true,
      message: attendanceMarked ? 'Face recognized and attendance marked' : 'Face recognized',
      data: {
        recognized: true,
        confidence: match.confidence,
        student: {
          id: matchedStudent?.id,
          studentId: matchedStudent?.studentId,
          fullName: matchedStudent?.fullName
        },
        attendance: attendance,
        attendanceMarked
      }
    });
  } catch (error) {
    next(error);
  }
};

const checkFaceRegistered = async (req, res, next) => {
  try {
    const studentId = req.params.studentId;
    const student = await Student.findByPk(studentId, {
      attributes: ['id', 'fullName', 'faceEmbedding']
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        registered: !!student.faceEmbedding,
        studentId: student.id,
        fullName: student.fullName
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerFace,
  recognizeFace,
  checkFaceRegistered
};