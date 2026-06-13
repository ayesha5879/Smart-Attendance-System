const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AttendanceCorrection = sequelize.define('AttendanceCorrection', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  attendanceId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  sessionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  currentStatus: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  requestedStatus: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending'
  },
  reviewedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reviewerRemarks: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'AttendanceCorrections',
  indexes: [
    { fields: ['studentId'] },
    { fields: ['status'] },
    { fields: ['sessionId'] }
  ]
});

module.exports = AttendanceCorrection;