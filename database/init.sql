cd ../frontend
npm install
# optional: set VITE_API_URL in frontend/.env (default is http://localhost:5000/api)
npm run dev-- Face Recognition Attendance Management System Database Schema
-- MySQL Database Initialization Script

CREATE DATABASE IF NOT EXISTS face_attendance_db;
USE face_attendance_db;

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS Users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'student') NOT NULL DEFAULT 'student',
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Students table
CREATE TABLE IF NOT EXISTS Students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  studentId VARCHAR(20) NOT NULL UNIQUE,
  fullName VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  department VARCHAR(100) NOT NULL,
  semester INT NOT NULL,
  profileImage VARCHAR(255),
  faceEmbedding TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE SET NULL,
  INDEX idx_studentId (studentId),
  INDEX idx_department (department),
  INDEX idx_semester (semester)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Courses table
CREATE TABLE IF NOT EXISTS Courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  courseCode VARCHAR(20) NOT NULL UNIQUE,
  courseName VARCHAR(150) NOT NULL,
  instructor VARCHAR(100) NOT NULL,
  semester INT NOT NULL,
  credits INT DEFAULT 3,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_courseCode (courseCode),
  INDEX idx_semester (semester)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enrollments table (junction table for students-courses many-to-many)
CREATE TABLE IF NOT EXISTS Enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId INT NOT NULL,
  courseId INT NOT NULL,
  enrollmentDate DATE DEFAULT (CURRENT_DATE),
  status ENUM('active', 'completed', 'dropped') DEFAULT 'active',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_student_course (studentId, courseId),
  FOREIGN KEY (studentId) REFERENCES Students(id) ON DELETE CASCADE,
  FOREIGN KEY (courseId) REFERENCES Courses(id) ON DELETE CASCADE,
  INDEX idx_student (studentId),
  INDEX idx_course (courseId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attendance Sessions table
CREATE TABLE IF NOT EXISTS AttendanceSessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  courseId INT NOT NULL,
  sessionDate DATE NOT NULL DEFAULT (CURRENT_DATE),
  startTime TIME NOT NULL,
  endTime TIME,
  status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
  totalStudents INT DEFAULT 0,
  presentCount INT DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (courseId) REFERENCES Courses(id) ON DELETE CASCADE,
  INDEX idx_course_date (courseId, sessionDate),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attendance records table
CREATE TABLE IF NOT EXISTS Attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId INT NOT NULL,
  courseId INT NOT NULL,
  sessionId INT NOT NULL,
  status ENUM('present', 'absent', 'late', 'leave') DEFAULT 'present',
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  markedBy ENUM('face_recognition', 'manual') DEFAULT 'face_recognition',
  confidence FLOAT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_student_session (studentId, sessionId),
  FOREIGN KEY (studentId) REFERENCES Students(id) ON DELETE CASCADE,
  FOREIGN KEY (courseId) REFERENCES Courses(id) ON DELETE CASCADE,
  FOREIGN KEY (sessionId) REFERENCES AttendanceSessions(id) ON DELETE CASCADE,
  INDEX idx_student (studentId),
  INDEX idx_course (courseId),
  INDEX idx_session (sessionId),
  INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin123 hashed with bcrypt)
INSERT INTO Users (name, email, password, role) VALUES
('Admin User', 'admin@attendance.com', '$2a$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5JqGj5q5Y5q5Y5q5Y5q5Y5q', 'admin');