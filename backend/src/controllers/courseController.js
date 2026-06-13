const { Course, Enrollment, AttendanceSession } = require('../models');
const { Op } = require('sequelize');

const getAllCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, semester } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where[Op.or] = [
        { courseCode: { [Op.like]: `%${search}%` } },
        { courseName: { [Op.like]: `%${search}%` } },
        { instructor: { [Op.like]: `%${search}%` } }
      ];
    }
    if (semester) where.semester = semester;

    const { count, rows } = await Course.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [{
        association: 'enrollments',
        attributes: ['id', 'studentId']
      }]
    });

    res.status(200).json({
      success: true,
      data: {
        courses: rows,
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          association: 'students',
          through: { attributes: ['enrollmentDate', 'status'] },
          attributes: ['id', 'studentId', 'fullName', 'email', 'department', 'semester']
        },
        {
          association: 'sessions',
          attributes: ['id', 'sessionDate', 'startTime', 'endTime', 'status', 'presentCount', 'totalStudents'],
          order: [['sessionDate', 'DESC']]
        }
      ]
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

const createCourse = async (req, res, next) => {
  try {
    const { courseCode, courseName, instructor, semester, credits } = req.body;

    if (!courseCode || !courseName || !instructor || !semester) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    const existingCourse = await Course.findOne({ where: { courseCode } });
    if (existingCourse) {
      return res.status(409).json({
        success: false,
        message: 'Course with this code already exists'
      });
    }

    const course = await Course.create({
      courseCode,
      courseName,
      instructor,
      semester,
      credits: credits || 3
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    next(error);
  }
};

const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const { courseCode, courseName, instructor, semester, credits, isActive } = req.body;

    if (courseCode) {
      const existingCourse = await Course.findOne({
        where: { courseCode, id: { [Op.ne]: course.id } }
      });
      if (existingCourse) {
        return res.status(409).json({
          success: false,
          message: 'Course code already in use'
        });
      }
      course.courseCode = courseCode;
    }
    if (courseName) course.courseName = courseName;
    if (instructor) course.instructor = instructor;
    if (semester) course.semester = semester;
    if (credits) course.credits = credits;
    if (isActive !== undefined) course.isActive = isActive;

    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    next(error);
  }
};

const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    await course.destroy();

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
};