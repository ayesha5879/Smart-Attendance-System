const express = require('express');
const router = express.Router();
const { registerFace, recognizeFace, checkFaceRegistered } = require('../controllers/faceController');
const { auth, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register', auth, authorize('admin'), upload.single('image'), registerFace);
router.post('/recognize', auth, upload.single('image'), recognizeFace);
router.get('/check/:studentId', auth, checkFaceRegistered);

module.exports = router;