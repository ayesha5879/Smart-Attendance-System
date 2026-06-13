const { Attendance, AttendanceSession, Student, Course, Enrollment } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

class AnalyticsService {
  /**
   * Get attendance trend data for specified period
   */
  async getAttendanceTrend(startDate, endDate, courseId = null, department = null) {
    const where = {};
    if (courseId) where.courseId = courseId;
    
    const sessions = await AttendanceSession.findAll({
      where: {
        sessionDate: { [Op.between]: [startDate, endDate] },
        status: 'completed',
        ...where
      },
      order: [['sessionDate', 'ASC']],
      include: [{ association: 'course', attributes: ['courseCode', 'courseName', 'department'] }]
    });

    if (department && sessions.length > 0) {
      const filtered = sessions.filter(s => s.course?.department === department);
      return this.processTrendData(filtered);
    }

    return this.processTrendData(sessions);
  }

  processTrendData(sessions) {
    const dailyData = {};
    sessions.forEach(session => {
      const date = session.sessionDate;
      if (!dailyData[date]) {
        dailyData[date] = { date, total: 0, present: 0, percentage: 0, sessions: [] };
      }
      dailyData[date].total += session.totalStudents || 0;
      dailyData[date].present += session.presentCount || 0;
      dailyData[date].sessions.push(session.course?.courseCode || '');
    });

    Object.values(dailyData).forEach(d => {
      d.percentage = d.total > 0 ? parseFloat(((d.present / d.total) * 100).toFixed(2)) : 0;
    });

    return Object.values(dailyData);
  }

  /**
   * Get weekly attendance statistics
   */
  async getWeeklyStats(startDate, endDate, courseId = null) {
    const where = {};
    if (courseId) where.courseId = courseId;
    
    const attendances = await Attendance.findAll({
      where: {
        timestamp: { [Op.between]: [new Date(startDate), new Date(endDate)] },
        ...where
      },
      include: [
        { association: 'course', attributes: ['courseCode', 'courseName', 'department'] }
      ]
    });

    const weeklyData = {};
    attendances.forEach(a => {
      const date = new Date(a.timestamp);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const key = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[key]) {
        weeklyData[key] = { week: key, total: 0, present: 0, absent: 0, late: 0 };
      }
      weeklyData[key].total++;
      if (a.status === 'present') weeklyData[key].present++;
      else if (a.status === 'absent') weeklyData[key].absent++;
      else if (a.status === 'late') weeklyData[key].late++;
    });

    return Object.values(weeklyData).map(w => ({
      ...w,
      percentage: parseFloat(((w.present / w.total) * 100).toFixed(2))
    }));
  }

  /**
   * Get monthly statistics
   */
  async getMonthlyStats(year = null, courseId = null) {
    year = year || new Date().getFullYear();
    const where = {};
    if (courseId) where.courseId = courseId;

    const months = [];
    for (let m = 1; m <= 12; m++) {
      const startDate = `${year}-${String(m).padStart(2, '0')}-01`;
      const endDate = new Date(year, m, 0).toISOString().split('T')[0];
      
      const total = await Attendance.count({
        where: { timestamp: { [Op.between]: [new Date(startDate), new Date(endDate)] }, ...where }
      });
      const present = await Attendance.count({
        where: { 
          timestamp: { [Op.between]: [new Date(startDate), new Date(endDate)] },
          status: 'present',
          ...where
        }
      });

      months.push({
        month: new Date(year, m - 1).toLocaleString('default', { month: 'short' }),
        monthNum: m,
        total,
        present,
        absent: total - present,
        percentage: total > 0 ? parseFloat(((present / total) * 100).toFixed(2)) : 0
      });
    }

    return months;
  }

  /**
   * Department-wise attendance comparison
   */
  async getDepartmentComparison(startDate, endDate) {
    const departments = await Student.findAll({
      attributes: [[fn('DISTINCT', col('department')), 'department']],
      where: { isActive: true }
    });

    const results = [];
    for (const dept of departments) {
      const deptName = dept.department;
      const students = await Student.findAll({ where: { department: deptName } });
      const studentIds = students.map(s => s.id);

      const total = await Attendance.count({
        where: {
          studentId: { [Op.in]: studentIds },
          timestamp: { [Op.between]: [new Date(startDate), new Date(endDate)] }
        }
      });
      const present = await Attendance.count({
        where: {
          studentId: { [Op.in]: studentIds },
          status: 'present',
          timestamp: { [Op.between]: [new Date(startDate), new Date(endDate)] }
        }
      });

      results.push({
        department: deptName,
        totalStudents: students.length,
        totalAttendance: total,
        present,
        percentage: total > 0 ? parseFloat(((present / total) * 100).toFixed(2)) : 0
      });
    }

    return results;
  }

  /**
   * Course-wise attendance comparison
   */
  async getCourseComparison(startDate, endDate) {
    const courses = await Course.findAll({ where: { isActive: true } });
    const results = [];

    for (const course of courses) {
      const total = await Attendance.count({
        where: {
          courseId: course.id,
          timestamp: { [Op.between]: [new Date(startDate), new Date(endDate)] }
        }
      });
      const present = await Attendance.count({
        where: {
          courseId: course.id,
          status: 'present',
          timestamp: { [Op.between]: [new Date(startDate), new Date(endDate)] }
        }
      });

      results.push({
        courseId: course.id,
        courseCode: course.courseCode,
        courseName: course.courseName,
        instructor: course.instructor,
        total,
        present,
        percentage: total > 0 ? parseFloat(((present / total) * 100).toFixed(2)) : 0
      });
    }

    return results;
  }

  /**
   * Student attendance ranking
   */
  async getStudentRanking(startDate, endDate, department = null, limit = 50) {
    const where = { isActive: true };
    if (department) where.department = department;

    const students = await Student.findAll({ where });
    const rankings = [];

    for (const student of students) {
      const total = await Attendance.count({
        where: {
          studentId: student.id,
          timestamp: { [Op.between]: [new Date(startDate), new Date(endDate)] }
        }
      });
      const present = await Attendance.count({
        where: {
          studentId: student.id,
          status: 'present',
          timestamp: { [Op.between]: [new Date(startDate), new Date(endDate)] }
        }
      });

      rankings.push({
        studentId: student.id,
        studentCode: student.studentId,
        fullName: student.fullName,
        department: student.department,
        semester: student.semester,
        total,
        present,
        percentage: total > 0 ? parseFloat(((present / total) * 100).toFixed(2)) : 0
      });
    }

    return rankings.sort((a, b) => b.percentage - a.percentage).slice(0, limit);
  }

  /**
   * Get attendance heatmap data (hourly/daily)
   */
  async getHeatmapData(startDate, endDate) {
    const attendances = await Attendance.findAll({
      where: {
        timestamp: { [Op.between]: [new Date(startDate), new Date(endDate)] }
      }
    });

    const heatmap = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let d = 0; d < 7; d++) {
      heatmap[days[d]] = {};
      for (let h = 0; h < 24; h++) {
        heatmap[days[d]][h] = 0;
      }
    }

    attendances.forEach(a => {
      const date = new Date(a.timestamp);
      const day = days[date.getDay()];
      const hour = date.getHours();
      if (heatmap[day] && heatmap[day][hour] !== undefined) {
        heatmap[day][hour]++;
      }
    });

    return heatmap;
  }

  /**
   * Attendance distribution statistics
   */
  async getDistributionData(startDate, endDate) {
    const ranges = [
      { label: '90-100%', min: 90, max: 101 },
      { label: '75-89%', min: 75, max: 90 },
      { label: '60-74%', min: 60, max: 75 },
      { label: '40-59%', min: 40, max: 60 },
      { label: 'Below 40%', min: 0, max: 40 }
    ];

    const students = await Student.findAll({ where: { isActive: true } });
    const distribution = ranges.map(r => ({ ...r, count: 0 }));

    for (const student of students) {
      const total = await Attendance.count({
        where: { studentId: student.id, timestamp: { [Op.between]: [new Date(startDate), new Date(endDate)] } }
      });
      if (total === 0) continue;
      
      const present = await Attendance.count({
        where: { studentId: student.id, status: 'present', timestamp: { [Op.between]: [new Date(startDate), new Date(endDate)] } }
      });
      const percentage = (present / total) * 100;

      for (const range of distribution) {
        if (percentage >= range.min && percentage < range.max) {
          range.count++;
          break;
        }
      }
    }

    return distribution.map(r => ({ label: r.label, count: r.count }));
  }
}

module.exports = new AnalyticsService();