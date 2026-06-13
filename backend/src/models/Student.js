const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Users', key: 'id' }
  },
  studentId: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: { msg: 'Student ID already exists' },
    validate: {
      notEmpty: { msg: 'Student ID is required' }
    }
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Full name is required' },
      len: { args: [2, 100], msg: 'Name must be between 2 and 100 characters' }
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: { msg: 'Email already exists' },
    validate: {
      isEmail: { msg: 'Invalid email format' },
      notEmpty: { msg: 'Email is required' }
    }
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Department is required' }
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
  profileImage: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  faceEmbedding: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('faceEmbedding');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('faceEmbedding', value ? JSON.stringify(value) : null);
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'Students',
  indexes: [
    { unique: true, fields: ['studentId'] },
    { unique: true, fields: ['email'] }
  ]
});

module.exports = Student;