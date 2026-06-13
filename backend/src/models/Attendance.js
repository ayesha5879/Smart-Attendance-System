const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Students', key: 'id' }
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Courses', key: 'id' }
  },
  sessionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'AttendanceSessions', key: 'id' }
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'present'
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  markedBy: {
    type: DataTypes.STRING(20),
    defaultValue: 'face_recognition'
  },
  confidence: {
    type: DataTypes.FLOAT,
    allowNull: true
  }
}, {
  tableName: 'Attendance',
  indexes: [
    { fields: ['studentId', 'sessionId'], unique: true },
    { fields: ['courseId', 'sessionId'] },
    { fields: ['sessionId'] }
  ]
});

module.exports = Attendance;