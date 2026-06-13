const express = require('express');
const router = express.Router();
const {
  getAtRiskStudents, predictAttendance, detectAbsenteeism,
  getWeeklySummary, getMonthlySummary
} = require('../controllers/insightsController');
const { auth, authorize } = require('../middleware/auth');

router.get('/at-risk', auth, getAtRiskStudents);
router.get('/predict', auth, predictAttendance);
router.get('/absenteeism', auth, detectAbsenteeism);
router.get('/weekly-summary', auth, getWeeklySummary);
router.get('/monthly-summary', auth, getMonthlySummary);

module.exports = router;