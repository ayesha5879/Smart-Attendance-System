const express = require('express');
const router = express.Router();
const {
  getAllCourses, getCourseById, createCourse,
  updateCourse, deleteCourse
} = require('../controllers/courseController');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, getAllCourses);
router.get('/:id', auth, getCourseById);
router.post('/', auth, authorize('admin'), createCourse);
router.put('/:id', auth, authorize('admin'), updateCourse);
router.delete('/:id', auth, authorize('admin'), deleteCourse);

module.exports = router;