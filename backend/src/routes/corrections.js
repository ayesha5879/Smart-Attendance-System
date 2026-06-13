const express = require('express');
const router = express.Router();
const { requestCorrection, getMyCorrections, getAllCorrections, reviewCorrection } = require('../controllers/correctionController');
const { auth, authorize } = require('../middleware/auth');

router.post('/', auth, requestCorrection);
router.get('/mine', auth, getMyCorrections);
router.get('/', auth, authorize('admin', 'faculty'), getAllCorrections);
router.put('/:id/review', auth, authorize('admin', 'faculty'), reviewCorrection);

module.exports = router;