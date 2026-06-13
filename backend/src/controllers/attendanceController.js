const { Attendance, AttendanceSession, Student, Course, Enrollment } = require('../models');
const { Op } = require('sequelize');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const createSession = async (req, res, next) => {
  try {
    const { courseId, sessionDate, startTime } = req.body;

    if (!courseId || !startTime) {
      return res.status(400).json({ success: false, message: 'Course and start time are required' });
    }

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const activeSession = await AttendanceSession.findOne({
      where: { courseId, status: 'active' }
    });
    if (activeSession) {
      return res.status(409).json({
        success: false,
        message: 'An active session already exists for this course. End it first.'
      });
    }

    const enrolledStudents = await Enrollment.count({ where: { courseId, status: 'active' } });

    const session = await AttendanceSession.create({
      courseId,
      sessionDate: sessionDate || new Date().toISOString().split('T')[0],
      startTime,
      totalStudents: enrolledStudents
    });

    res.status(201).json({
      success: true,
      message: 'Attendance session created successfully',
      data: session
    });
  } catch (error) {
    next(error);
  }
};

const endSession = async (req, res, next) => {
  try {
    const session = await AttendanceSession.findByPk(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Session is not active' });
    }

    session.status = 'completed';
    session.endTime = new Date().toTimeString().split(' ')[0];
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Session ended successfully',
      data: session
    });
  } catch (error) {
    next(error);
  }
};

const markAttendance = async (req, res, next) => {
  try {
    const { studentId, courseId, sessionId, status, confidence } = req.body;

    if (!studentId || !courseId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'studentId, courseId, and sessionId are required'
      });
    }

    // Verify session exists and is active
    const session = await AttendanceSession.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    if (session.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Session is not active' });
    }

    // Verify student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Check if attendance already marked (prevent duplicates)
    const existingAttendance = await Attendance.findOne({
      where: { studentId, sessionId }
    });
    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already marked for this student in this session',
        data: existingAttendance
      });
    }

    const attendance = await Attendance.create({
      studentId,
      courseId,
      sessionId,
      status: status || 'present',
      markedBy: req.body.markedBy || 'face_recognition',
      confidence: confidence || null
    });

    // Update session present count
    session.presentCount = (session.presentCount || 0) + 1;
    await session.save();

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

const getAttendance = async (req, res, next) => {
  try {
    const { sessionId, courseId, studentId, date, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (sessionId) where.sessionId = sessionId;
    if (courseId) where.courseId = courseId;
    if (studentId) where.studentId = studentId;
    if (date) {
      where.timestamp = {
        [Op.gte]: new Date(date),
        [Op.lt]: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
      };
    }

    const { count, rows } = await Attendance.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['timestamp', 'DESC']],
      include: [
        { association: 'student', attributes: ['studentId', 'fullName', 'email', 'department', 'semester'] },
        { association: 'course', attributes: ['courseCode', 'courseName'] },
        { association: 'session', attributes: ['sessionDate', 'startTime', 'endTime'] }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        attendances: rows,
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getStudentAttendanceSummary = async (req, res, next) => {
  try {
    const studentId = req.params.studentId;
    const { Attendance } = require('../models');

    const totalClasses = await Attendance.count({
      where: { studentId }
    });

    const presentClasses = await Attendance.count({
      where: { studentId, status: 'present' }
    });

    const absentClasses = await Attendance.count({
      where: { studentId, status: 'absent' }
    });

    const lateClasses = await Attendance.count({
      where: { studentId, status: 'late' }
    });

    const percentage = totalClasses > 0 ? ((presentClasses / totalClasses) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalClasses,
        presentClasses,
        absentClasses,
        lateClasses,
        percentage: parseFloat(percentage)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const { courseId, status, date } = req.query;
    const where = {};

    if (courseId) where.courseId = courseId;
    if (status) where.status = status;
    if (date) where.sessionDate = date;

    const sessions = await AttendanceSession.findAll({
      where,
      order: [['sessionDate', 'DESC'], ['startTime', 'DESC']],
      include: [
        { association: 'course', attributes: ['courseCode', 'courseName', 'instructor'] }
      ]
    });

    res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    next(error);
  }
};

const getSessionById = async (req, res, next) => {
  try {
    const session = await AttendanceSession.findByPk(req.params.id, {
      include: [
        { association: 'course', attributes: ['courseCode', 'courseName', 'instructor'] },
        {
          association: 'attendances',
          include: [
            { association: 'student', attributes: ['studentId', 'fullName', 'email', 'department', 'semester'] }
          ]
        }
      ]
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

const getReport = async (req, res, next) => {
  try {
    const { type, courseId, studentId, startDate, endDate } = req.query;
    const where = {};

    if (courseId) where.courseId = courseId;
    if (studentId) where.studentId = studentId;
    if (startDate && endDate) {
      where.timestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const attendances = await Attendance.findAll({
      where,
      include: [
        { association: 'student', attributes: ['studentId', 'fullName', 'email', 'department', 'semester'] },
        { association: 'course', attributes: ['courseCode', 'courseName'] },
        { association: 'session', attributes: ['sessionDate', 'startTime'] }
      ],
      order: [['timestamp', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: attendances
    });
  } catch (error) {
    next(error);
  }
};

const exportReport = async (req, res, next) => {
  try {
    const { format, type, courseId, studentId, startDate, endDate } = req.query;
    const where = {};

    if (courseId) where.courseId = courseId;
    if (studentId) where.studentId = studentId;
    if (startDate && endDate) {
      where.timestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const attendances = await Attendance.findAll({
      where,
      include: [
        { association: 'student', attributes: ['studentId', 'fullName', 'email', 'department', 'semester'] },
        { association: 'course', attributes: ['courseCode', 'courseName'] },
        { association: 'session', attributes: ['sessionDate', 'startTime'] }
      ],
      order: [['timestamp', 'DESC']]
    });

    const data = attendances.map(a => ({
      'Student ID': a.student?.studentId,
      'Student Name': a.student?.fullName,
      'Department': a.student?.department,
      'Course Code': a.course?.courseCode,
      'Course Name': a.course?.courseName,
      'Date': a.session?.sessionDate,
      'Time': a.session?.startTime,
      'Status': a.status,
      'Marked By': a.markedBy,
      'Timestamp': a.timestamp
    }));

    if (format === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.csv');
      return res.send(csv);
    }

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Attendance Report');
      worksheet.columns = Object.keys(data[0] || {}).map(key => ({ header: key, key, width: 20 }));
      data.forEach(row => worksheet.addRow(row));
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.xlsx');
      return await workbook.xlsx.write(res).then(() => res.end());
    }

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.pdf');
      doc.pipe(res);
      doc.fontSize(20).text('Attendance Report', { align: 'center' });
      doc.moveDown();
      data.forEach((row, i) => {
        doc.fontSize(9).text(
          `${row['Student Name']} | ${row['Course Code']} | ${row['Date']} | ${row['Status']}`
        );
      });
      doc.end();
    }
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const totalStudents = await Student.count({ where: { isActive: true } });
    const totalCourses = await Course.count({ where: { isActive: true } });
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = await AttendanceSession.count({
      where: { sessionDate: today, status: 'completed' }
    });
    const presentToday = await Attendance.count({
      where: {
        timestamp: {
          [Op.gte]: new Date(today),
          [Op.lt]: new Date(new Date(today).setDate(new Date(today).getDate() + 1))
        },
        status: 'present'
      }
    });

    const totalAttendance = await Attendance.count();
    const presentAttendance = await Attendance.count({ where: { status: 'present' } });
    const attendanceRate = totalAttendance > 0
      ? ((presentAttendance / totalAttendance) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalCourses,
        todaySessions,
        presentToday,
        attendanceRate: parseFloat(attendanceRate)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSession,
  endSession,
  markAttendance,
  getAttendance,
  getStudentAttendanceSummary,
  getSessions,
  getSessionById,
  getReport,
  exportReport,
  getDashboardStats
};