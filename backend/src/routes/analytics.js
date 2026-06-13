const express = require('express');
const router = express.Router();
const {
  getDashboardAnalytics, getAttendanceTrend, getWeeklyStats, getMonthlyStats,
  getDepartmentComparison, getCourseComparison, getStudentRanking,
  getHeatmapData, getDistributionData
} = require('../controllers/analyticsController');
const { auth } = require('../middleware/auth');

router.get('/dashboard', auth, getDashboardAnalytics);
router.get('/trend', auth, getAttendanceTrend);
router.get('/weekly', auth, getWeeklyStats);
router.get('/monthly', auth, getMonthlyStats);
router.get('/departments', auth, getDepartmentComparison);
router.get('/courses', auth, getCourseComparison);
router.get('/ranking', auth, getStudentRanking);
router.get('/heatmap', auth, getHeatmapData);
router.get('/distribution', auth, getDistributionData);

module.exports = router;