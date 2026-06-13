require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const seed = async () => {
  try {
    const { sequelize } = require('../config/database');
    const User = require('../models/User');
    const Student = require('../models/Student');
    const Course = require('../models/Course');
    const Enrollment = require('../models/Enrollment');
    const AttendanceSession = require('../models/AttendanceSession');
    const Attendance = require('../models/Attendance');

    await sequelize.authenticate();
    console.log('Database connected.');

    // Sync all models (force: true drops existing tables and recreates them)
    await sequelize.sync({ force: true });
    console.log('Database tables created.');

    // Create admin user (password: admin123)
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@attendance.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('✓ Admin user: admin@attendance.com / admin123');

    // Create student users
    const studentUsers = await User.bulkCreate([
      { name: 'John Doe', email: 'john@example.com', password: 'student123', role: 'student' },
      { name: 'Jane Smith', email: 'jane@example.com', password: 'student123', role: 'student' },
      { name: 'Bob Johnson', email: 'bob@example.com', password: 'student123', role: 'student' },
      { name: 'Alice Brown', email: 'alice@example.com', password: 'student123', role: 'student' },
      { name: 'Charlie Wilson', email: 'charlie@example.com', password: 'student123', role: 'student' }
    ]);

    // Create students
    const students = await Student.bulkCreate([
      { studentId: 'STU001', fullName: 'John Doe', email: 'john@example.com', department: 'Computer Science', semester: 3, userId: studentUsers[0].id },
      { studentId: 'STU002', fullName: 'Jane Smith', email: 'jane@example.com', department: 'Computer Science', semester: 3, userId: studentUsers[1].id },
      { studentId: 'STU003', fullName: 'Bob Johnson', email: 'bob@example.com', department: 'Electrical Engineering', semester: 5, userId: studentUsers[2].id },
      { studentId: 'STU004', fullName: 'Alice Brown', email: 'alice@example.com', department: 'Mechanical Engineering', semester: 3, userId: studentUsers[3].id },
      { studentId: 'STU005', fullName: 'Charlie Wilson', email: 'charlie@example.com', department: 'Computer Science', semester: 5, userId: studentUsers[4].id }
    ]);

    // Create courses
    const courses = await Course.bulkCreate([
      { courseCode: 'CS201', courseName: 'Data Structures', instructor: 'Dr. Williams', semester: 3, credits: 4 },
      { courseCode: 'CS202', courseName: 'Database Systems', instructor: 'Prof. Davis', semester: 3, credits: 3 },
      { courseCode: 'EE301', courseName: 'Digital Signal Processing', instructor: 'Dr. Martinez', semester: 5, credits: 4 },
      { courseCode: 'ME201', courseName: 'Thermodynamics', instructor: 'Prof. Taylor', semester: 3, credits: 3 },
      { courseCode: 'CS301', courseName: 'Artificial Intelligence', instructor: 'Dr. Anderson', semester: 5, credits: 4 }
    ]);

    // Create enrollments
    await Enrollment.bulkCreate([
      { studentId: students[0].id, courseId: courses[0].id },
      { studentId: students[0].id, courseId: courses[1].id },
      { studentId: students[1].id, courseId: courses[0].id },
      { studentId: students[1].id, courseId: courses[1].id },
      { studentId: students[2].id, courseId: courses[2].id },
      { studentId: students[3].id, courseId: courses[3].id },
      { studentId: students[4].id, courseId: courses[4].id },
      { studentId: students[4].id, courseId: courses[0].id }
    ]);

    // Create attendance sessions
    const sessions = await AttendanceSession.bulkCreate([
      { courseId: courses[0].id, sessionDate: new Date().toISOString().split('T')[0], startTime: '09:00:00', endTime: '10:30:00', status: 'completed', totalStudents: 3, presentCount: 2 },
      { courseId: courses[1].id, sessionDate: new Date().toISOString().split('T')[0], startTime: '11:00:00', endTime: '12:30:00', status: 'completed', totalStudents: 2, presentCount: 2 },
      { courseId: courses[0].id, sessionDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], startTime: '09:00:00', endTime: '10:30:00', status: 'completed', totalStudents: 3, presentCount: 3 },
      { courseId: courses[4].id, sessionDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], startTime: '14:00:00', endTime: '15:30:00', status: 'completed', totalStudents: 1, presentCount: 1 }
    ]);

    // Create attendance records
    await Attendance.bulkCreate([
      { studentId: students[0].id, courseId: courses[0].id, sessionId: sessions[0].id, status: 'present', markedBy: 'face_recognition' },
      { studentId: students[1].id, courseId: courses[0].id, sessionId: sessions[0].id, status: 'present', markedBy: 'face_recognition' },
      { studentId: students[0].id, courseId: courses[1].id, sessionId: sessions[1].id, status: 'present', markedBy: 'manual' },
      { studentId: students[1].id, courseId: courses[1].id, sessionId: sessions[1].id, status: 'present', markedBy: 'face_recognition' },
      { studentId: students[0].id, courseId: courses[0].id, sessionId: sessions[2].id, status: 'present', markedBy: 'face_recognition' },
      { studentId: students[1].id, courseId: courses[0].id, sessionId: sessions[2].id, status: 'present', markedBy: 'face_recognition' },
      { studentId: students[4].id, courseId: courses[0].id, sessionId: sessions[2].id, status: 'present', markedBy: 'face_recognition' },
      { studentId: students[4].id, courseId: courses[4].id, sessionId: sessions[3].id, status: 'present', markedBy: 'manual' }
    ]);

    console.log('\n✅ Seed data created successfully!');
    console.log('====================================');
    console.log('  Admin Login: admin@attendance.com');
    console.log('  Password:   admin123');
    console.log('------------------------------------');
    console.log('  Student Login: john@example.com');
    console.log('  Password:     student123');
    console.log('====================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
};

seed();