const express = require('express');
const router = express.Router();
const { generateReport, getReportData } = require('../controllers/reportController');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, getReportData);
router.get('/download', auth, generateReport);

module.exports = router;