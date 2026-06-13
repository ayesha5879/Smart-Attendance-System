const express = require('express');
const router = express.Router();
const { getAuditLogs, getSystemStats, getLoginHistory, bulkImportStudents, bulkExportStudents, globalSearch } = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/audit-logs', auth, authorize('admin'), getAuditLogs);
router.get('/stats', auth, authorize('admin'), getSystemStats);
router.get('/login-history', auth, authorize('admin'), getLoginHistory);
router.post('/students/import', auth, authorize('admin'), upload.single('file'), bulkImportStudents);
router.get('/students/export', auth, authorize('admin'), bulkExportStudents);
router.get('/search', auth, globalSearch);

module.exports = router;