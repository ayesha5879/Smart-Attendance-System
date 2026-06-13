const express = require('express');
const router = express.Router();
const {
  getAllStudents, getStudentById, createStudent,
  updateStudent, deleteStudent, enrollCourse, getStudentAttendance
} = require('../controllers/studentController');
const { auth, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', auth, getAllStudents);
router.get('/:id', auth, getStudentById);
router.post('/', auth, authorize('admin'), upload.single('profileImage'), createStudent);
router.put('/:id', auth, authorize('admin'), upload.single('profileImage'), updateStudent);
router.delete('/:id', auth, authorize('admin'), deleteStudent);
router.post('/enroll', auth, authorize('admin'), enrollCourse);
router.get('/:id/attendance', auth, getStudentAttendance);

module.exports = router;