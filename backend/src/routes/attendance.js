const express = require('express');
const router = express.Router();
const {
  createSession, endSession, markAttendance, getAttendance,
  getStudentAttendanceSummary, getSessions, getSessionById,
  getReport, exportReport, getDashboardStats
} = require('../controllers/attendanceController');
const { auth, authorize } = require('../middleware/auth');

router.get('/stats/dashboard', auth, getDashboardStats);
router.get('/sessions', auth, getSessions);
router.get('/sessions/:id', auth, getSessionById);
router.post('/sessions', auth, authorize('admin'), createSession);
router.put('/sessions/:id/end', auth, authorize('admin'), endSession);
router.post('/mark', auth, markAttendance);
router.get('/', auth, getAttendance);
router.get('/report', auth, getReport);
router.get('/export', auth, exportReport);
router.get('/summary/:studentId', auth, getStudentAttendanceSummary);

module.exports = router;