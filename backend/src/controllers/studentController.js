const { Student, User, Course, Enrollment } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

const getAllStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, department, semester } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { studentId: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    if (department) where.department = department;
    if (semester) where.semester = semester;

    const { count, rows } = await Student.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        students: rows,
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: [
        { association: 'courses', through: { attributes: [] } },
        { association: 'enrollments', include: ['course'] },
        { association: 'attendances', include: ['session', 'course'] }
      ]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    next(error);
  }
};

const createStudent = async (req, res, next) => {
  try {
    const { studentId, fullName, email, department, semester, password } = req.body;

    if (!studentId || !fullName || !email || !department || !semester) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Create user account for student
    const user = await User.create({
      name: fullName,
      email,
      password: password || 'student123',
      role: 'student'
    });

    // Create student profile
    const student = await Student.create({
      studentId,
      fullName,
      email,
      department,
      semester,
      userId: user.id,
      profileImage: req.file ? req.file.path : null
    });

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student
    });
  } catch (error) {
    next(error);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const { fullName, email, department, semester, isActive } = req.body;

    if (fullName) student.fullName = fullName;
    if (email) student.email = email;
    if (department) student.department = department;
    if (semester) student.semester = semester;
    if (isActive !== undefined) student.isActive = isActive;
    if (req.file) student.profileImage = req.file.path;

    await student.save();

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
  } catch (error) {
    next(error);
  }
};

const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Delete profile image if exists
    if (student.profileImage) {
      const imagePath = path.resolve(student.profileImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete associated user
    if (student.userId) {
      await User.destroy({ where: { id: student.userId } });
    }

    await student.destroy();

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const enrollCourse = async (req, res, next) => {
  try {
    const { studentId, courseId } = req.body;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const existingEnrollment = await Enrollment.findOne({
      where: { studentId, courseId }
    });
    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        message: 'Student is already enrolled in this course'
      });
    }

    const enrollment = await Enrollment.create({ studentId, courseId });

    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
};

const getStudentAttendance = async (req, res, next) => {
  try {
    const { Attendance } = require('../models');
    const studentId = req.params.id;

    const attendance = await Attendance.findAll({
      where: { studentId },
      include: [
        { association: 'session', attributes: ['sessionDate', 'startTime'] },
        { association: 'course', attributes: ['courseCode', 'courseName'] }
      ],
      order: [['timestamp', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  enrollCourse,
  getStudentAttendance
};