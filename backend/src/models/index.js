const User = require('./User');
const Student = require('./Student');
const Course = require('./Course');
const Enrollment = require('./Enrollment');
const AttendanceSession = require('./AttendanceSession');
const Attendance = require('./Attendance');
const AuditLog = require('./AuditLog');
const LoginHistory = require('./LoginHistory');
const Notification = require('./Notification');
const AttendanceCorrection = require('./AttendanceCorrection');

// User - Student relationship (one-to-one)
User.hasOne(Student, { foreignKey: 'userId', as: 'studentProfile' });
Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Student - Enrollment relationships
Student.hasMany(Enrollment, { foreignKey: 'studentId', as: 'enrollments' });
Enrollment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Course - Enrollment relationships
Course.hasMany(Enrollment, { foreignKey: 'courseId', as: 'enrollments' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Course - AttendanceSession relationships
Course.hasMany(AttendanceSession, { foreignKey: 'courseId', as: 'sessions' });
AttendanceSession.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Student - Attendance relationships
Student.hasMany(Attendance, { foreignKey: 'studentId', as: 'attendances' });
Attendance.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Course - Attendance relationships
Course.hasMany(Attendance, { foreignKey: 'courseId', as: 'attendances' });
Attendance.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// AttendanceSession - Attendance relationships
AttendanceSession.hasMany(Attendance, { foreignKey: 'sessionId', as: 'attendances' });
Attendance.belongsTo(AttendanceSession, { foreignKey: 'sessionId', as: 'session' });

// Student - Course many-to-many through Enrollment
Student.belongsToMany(Course, { through: Enrollment, foreignKey: 'studentId', as: 'courses' });
Course.belongsToMany(Student, { through: Enrollment, foreignKey: 'courseId', as: 'students' });

// User - LoginHistory relationship
User.hasMany(LoginHistory, { foreignKey: 'userId', as: 'loginHistories' });
LoginHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User - Notification relationship
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User - AuditLog relationship
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Student - AttendanceCorrection relationships
Student.hasMany(AttendanceCorrection, { foreignKey: 'studentId', as: 'corrections' });
AttendanceCorrection.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// AttendanceSession - AttendanceCorrection relationships
AttendanceSession.hasMany(AttendanceCorrection, { foreignKey: 'sessionId', as: 'corrections' });
AttendanceCorrection.belongsTo(AttendanceSession, { foreignKey: 'sessionId', as: 'session' });

module.exports = {
  User,
  Student,
  Course,
  Enrollment,
  AttendanceSession,
  Attendance,
  AuditLog,
  LoginHistory,
  Notification,
  AttendanceCorrection
};
