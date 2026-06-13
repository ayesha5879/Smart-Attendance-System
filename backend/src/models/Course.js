const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  courseCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: { msg: 'Course code already exists' },
    validate: {
      notEmpty: { msg: 'Course code is required' }
    }
  },
  courseName: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Course name is required' }
    }
  },
  instructor: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Instructor name is required' }
    }
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: { msg: 'Semester must be an integer' },
      min: { args: [1], msg: 'Semester must be at least 1' },
      max: { args: [8], msg: 'Semester must be at most 8' }
    }
  },
  credits: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
    validate: {
      isInt: { msg: 'Credits must be an integer' },
      min: { args: [1], msg: 'Credits must be at least 1' },
      max: { args: [6], msg: 'Credits must be at most 6' }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'Courses',
  indexes: [
    { unique: true, fields: ['courseCode'] }
  ]
});

module.exports = Course;