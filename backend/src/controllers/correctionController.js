const { AttendanceCorrection, Student, AttendanceSession, Attendance, Course } = require('../models');
const notificationService = require('../services/notificationService');

const requestCorrection = async (req, res, next) => {
  try {
    const { attendanceId, sessionId, currentStatus, requestedStatus, reason, remarks } = req.body;

    if (!sessionId || !requestedStatus || !reason) {
      return res.status(400).json({ success: false, message: 'Session ID, requested status, and reason are required' });
    }

    // Get the student ID from the user context
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const correction = await AttendanceCorrection.create({
      studentId: student.id,
      attendanceId,
      sessionId,
      currentStatus: currentStatus || 'absent',
      requestedStatus,
      reason,
      remarks,
      status: 'pending'
    });

    // Notify admin/faculty about the correction request
    const session = await AttendanceSession.findByPk(sessionId, {
      include: [{ association: 'course', attributes: ['courseName'] }]
    });
    await notificationService.sendCorrectionRequest(
      student.id, 1, student.fullName,
      session?.course?.courseName || 'Unknown Course', reason
    );

    res.status(201).json({ success: true, message: 'Correction request submitted', data: correction });
  } catch (error) { next(error); }
};

const getMyCorrections = async (req, res, next) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    const corrections = await AttendanceCorrection.findAll({
      where: { studentId: student?.id },
      include: [{ association: 'session', attributes: ['sessionDate', 'startTime'] }],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ success: true, data: corrections });
  } catch (error) { next(error); }
};

const getAllCorrections = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const corrections = await AttendanceCorrection.findAll({
      where,
      include: [
        { association: 'student', attributes: ['studentId', 'fullName', 'email', 'department'] },
        { association: 'session', attributes: ['sessionDate', 'startTime'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ success: true, data: corrections });
  } catch (error) { next(error); }
};

const reviewCorrection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reviewerRemarks } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }

    const correction = await AttendanceCorrection.findByPk(id, {
      include: [
        { association: 'student', attributes: ['id', 'fullName'] },
        { association: 'session', attributes: ['courseId'] }
      ]
    });

    if (!correction) {
      return res.status(404).json({ success: false, message: 'Correction not found' });
    }
    if (correction.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Correction already reviewed' });
    }

    correction.status = status;
    correction.reviewedBy = req.user.id;
    correction.reviewedAt = new Date();
    correction.reviewerRemarks = reviewerRemarks || null;
    await correction.save();

    // If approved, update the actual attendance record
    if (status === 'approved' && correction.attendanceId) {
      const attendance = await Attendance.findByPk(correction.attendanceId);
      if (attendance) {
        attendance.status = correction.requestedStatus;
        await attendance.save();
      }
    }

    // Notify student
    const course = await Course.findByPk(correction.session.courseId);
    await notificationService.sendCorrectionStatus(
      correction.student.id, correction.student.fullName,
      course?.courseName || 'Course', status, reviewerRemarks
    );

    res.status(200).json({ success: true, message: `Correction ${status}`, data: correction });
  } catch (error) { next(error); }
};

module.exports = { requestCorrection, getMyCorrections, getAllCorrections, reviewCorrection };