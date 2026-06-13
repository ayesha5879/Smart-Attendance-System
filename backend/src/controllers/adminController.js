const { User, Student, Course, Attendance, AttendanceSession, AuditLog, LoginHistory } = require('../models');
const { Op } = require('sequelize');
const { Parser } = require('json2csv');

const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action, severity, userId } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (action) where.action = action;
    if (severity) where.severity = severity;
    if (userId) where.userId = userId;

    const { count, rows } = await AuditLog.findAndCountAll({
      where, limit: parseInt(limit), offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [{ association: 'user', attributes: ['name', 'email', 'role'] }]
    });

    res.status(200).json({ success: true, data: { logs: rows, total: count, totalPages: Math.ceil(count / limit) } });
  } catch (error) { next(error); }
};

const getSystemStats = async (req, res, next) => {
  try {
    const totalUsers = await User.count();
    const totalStudents = await Student.count();
    const totalCourses = await Course.count();
    const totalSessions = await AttendanceSession.count();
    const totalAttendance = await Attendance.count();
    
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await Attendance.count({
      where: { timestamp: { [Op.gte]: new Date(today) } }
    });

    const activeSessions = await AttendanceSession.count({ where: { status: 'active' } });
    const loginCount = await LoginHistory.count({ where: { success: true, createdAt: { [Op.gte]: new Date(today) } } });

    res.status(200).json({ success: true, data: {
      totalUsers, totalStudents, totalCourses, totalSessions,
      totalAttendance, todayAttendance, activeSessions, loginCount
    }});
  } catch (error) { next(error); }
};

const getLoginHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const { count, rows } = await LoginHistory.findAndCountAll({
      limit: parseInt(limit), offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [{ association: 'user', attributes: ['name', 'email', 'role'] }]
    });
    res.status(200).json({ success: true, data: { history: rows, total: count } });
  } catch (error) { next(error); }
};

const bulkImportStudents = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a CSV file' });
    }
    const fs = require('fs');
    const csvData = fs.readFileSync(req.file.path, 'utf-8');
    const lines = csvData.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const results = { imported: 0, failed: 0, errors: [] };
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((h, idx) => { row[h] = values[idx]; });
        
        if (!row.studentid || !row.fullname || !row.email || !row.department) {
          results.failed++;
          results.errors.push(`Row ${i}: Missing required fields`);
          continue;
        }

        const user = await User.create({
          name: row.fullname, email: row.email,
          password: row.password || 'student123', role: 'student'
        });
        await Student.create({
          studentId: row.studentid, fullName: row.fullname, email: row.email,
          department: row.department, semester: parseInt(row.semester) || 1, userId: user.id
        });
        results.imported++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Row ${i}: ${err.message}`);
      }
    }
    
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    
    res.status(200).json({ success: true, data: results });
  } catch (error) { next(error); }
};

const bulkExportStudents = async (req, res, next) => {
  try {
    const students = await Student.findAll({ where: { isActive: true } });
    const data = students.map(s => ({
      StudentID: s.studentId, FullName: s.fullName, Email: s.email,
      Department: s.department, Semester: s.semester, IsActive: s.isActive ? 'Yes' : 'No'
    }));
    
    const parser = new Parser();
    const csv = parser.parse(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students-export.csv');
    res.send(csv);
  } catch (error) { next(error); }
};

const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Search query required' });

    const [students, courses, users] = await Promise.all([
      Student.findAll({
        where: {
          [Op.or]: [
            { fullName: { [Op.like]: `%${q}%` } },
            { studentId: { [Op.like]: `%${q}%` } },
            { email: { [Op.like]: `%${q}%` } },
            { department: { [Op.like]: `%${q}%` } }
          ]
        },
        limit: 10
      }),
      Course.findAll({
        where: {
          [Op.or]: [
            { courseCode: { [Op.like]: `%${q}%` } },
            { courseName: { [Op.like]: `%${q}%` } },
            { instructor: { [Op.like]: `%${q}%` } }
          ]
        },
        limit: 10
      }),
      User.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${q}%` } },
            { email: { [Op.like]: `%${q}%` } }
          ]
        },
        attributes: ['id', 'name', 'email', 'role'],
        limit: 10
      })
    ]);

    res.status(200).json({ success: true, data: { students, courses, users, total: students.length + courses.length + users.length } });
  } catch (error) { next(error); }
};

module.exports = { getAuditLogs, getSystemStats, getLoginHistory, bulkImportStudents, bulkExportStudents, globalSearch };