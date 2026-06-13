const { Attendance, AttendanceSession, Student, Course, Enrollment, User } = require('../models');
const { Op } = require('sequelize');

class AIInsightsService {
  constructor() {
    this.attendanceThreshold = parseFloat(process.env.ATTENDANCE_THRESHOLD) || 75;
  }

  /**
   * Identify students at risk of falling below threshold
   */
  async getAtRiskStudents(courseId = null, department = null) {
    const where = { isActive: true };
    if (department) where.department = department;

    const students = await Student.findAll({ where });
    const atRisk = [];

    for (const student of students) {
      const enrollments = await Enrollment.findAll({
        where: { studentId: student.id, status: 'active' },
        include: [{
          association: 'course',
          where: courseId ? { id: courseId } : {},
          attributes: ['id', 'courseCode', 'courseName']
        }]
      });

      if (enrollments.length === 0) continue;

      let totalClasses = 0;
      let totalPresent = 0;
      const courseDetails = [];

      for (const enrollment of enrollments) {
        const total = await Attendance.count({
          where: { studentId: student.id, courseId: enrollment.courseId }
        });
        const present = await Attendance.count({
          where: { studentId: student.id, courseId: enrollment.courseId, status: 'present' }
        });
        totalClasses += total;
        totalPresent += present;

        courseDetails.push({
          courseId: enrollment.course.id,
          courseCode: enrollment.course.courseCode,
          courseName: enrollment.course.courseName,
          percentage: total > 0 ? parseFloat(((present / total) * 100).toFixed(2)) : 0,
          totalClasses: total,
          attendedClasses: present
        });
      }

      const overallPercentage = totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0;
      const riskLevel = overallPercentage < this.attendanceThreshold ? 'critical' : 
                       overallPercentage < this.attendanceThreshold + 10 ? 'warning' : 'safe';

      if (riskLevel !== 'safe') {
        atRisk.push({
          student: {
            id: student.id,
            studentId: student.studentId,
            fullName: student.fullName,
            department: student.department,
            semester: student.semester
          },
          overallAttendance: parseFloat(overallPercentage.toFixed(2)),
          riskLevel,
          deficit: Math.max(0, parseFloat((this.attendanceThreshold - overallPercentage).toFixed(2))),
          coursesNeeded: this.calculateClassesNeeded(overallPercentage, totalClasses),
          courses: courseDetails
        });
      }
    }

    return atRisk.sort((a, b) => a.overallAttendance - b.overallAttendance);
  }

  calculateClassesNeeded(currentPercentage, totalClasses) {
    // Calculate how many consecutive classes need to be attended to reach threshold
    let needed = 0;
    let tempPercentage = currentPercentage;
    let tempTotal = totalClasses;
    
    while (tempPercentage < this.attendanceThreshold && needed < 50) {
      tempTotal++;
      tempPercentage = ((tempPercentage * totalClasses) + (100 * (needed + 1))) / (totalClasses + (needed + 1));
      needed++;
    }
    
    return needed > 0 ? needed : 0;
  }

  /**
   * Predict future attendance patterns
   */
  async predictAttendance(studentId, courseId = null) {
    const where = { studentId };
    if (courseId) where.courseId = courseId;

    const attendances = await Attendance.findAll({
      where,
      order: [['timestamp', 'ASC']],
      limit: 20
    });

    if (attendances.length < 3) {
      return { confidence: 'low', prediction: 'Insufficient data for prediction' };
    }

    // Simple trend prediction based on recent behavior
    const recentAttendances = attendances.slice(-10);
    const recentPresent = recentAttendances.filter(a => a.status === 'present').length;
    const recentRate = recentPresent / recentAttendances.length;

    // Calculate trend direction
    const firstHalf = attendances.slice(0, Math.floor(attendances.length / 2));
    const secondHalf = attendances.slice(Math.floor(attendances.length / 2));
    const firstRate = firstHalf.filter(a => a.status === 'present').length / firstHalf.length;
    const secondRate = secondHalf.filter(a => a.status === 'present').length / secondHalf.length;
    const trend = secondRate - firstRate;

    // Predict next 5 sessions
    const predictions = [];
    let predictedRate = recentRate;
    
    for (let i = 1; i <= 5; i++) {
      // Apply trend momentum
      predictedRate = predictedRate + (trend * 0.1);
      const predictedStatus = predictedRate > 0.5 ? 'present' : 'absent';
      predictions.push({
        session: i,
        predictedStatus,
        probability: parseFloat((Math.abs(predictedRate)).toFixed(2))
      });
    }

    const riskScore = recentRate < 0.75 ? 'high' : recentRate < 0.85 ? 'medium' : 'low';
    const nextWeekLikelyAbsent = predictions.filter(p => p.predictedStatus === 'absent').length;

    return {
      confidence: 'medium',
      studentId,
      currentRate: parseFloat((recentRate * 100).toFixed(2)),
      trendDirection: trend > 0 ? 'improving' : 'declining',
      trendStrength: parseFloat(Math.abs(trend).toFixed(2)),
      riskScore,
      predictedSessions: predictions,
      nextWeekRisk: nextWeekLikelyAbsent >= 2 ? 'high' : 'low',
      recommendation: this.getRecommendation(recentRate, trend, riskScore)
    };
  }

  getRecommendation(rate, trend, riskScore) {
    if (riskScore === 'high') {
      return 'Immediate intervention required. Student at severe risk of falling below attendance threshold.';
    }
    if (riskScore === 'medium') {
      return 'Monitor closely. Consider sending attendance warning notification.';
    }
    if (trend < -0.1) {
      return 'Attendance declining. Proactive counseling recommended.';
    }
    return 'Attendance is satisfactory. Continue current pattern.';
  }

  /**
   * Detect absenteeism patterns
   */
  async detectAbsenteeism(department = null, courseId = null) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const where = { isActive: true };
    if (department) where.department = department;

    const students = await Student.findAll({ where });
    const patterns = [];

    for (const student of students) {
      const condition = {
        studentId: student.id,
        timestamp: { [Op.gte]: startDate }
      };
      if (courseId) condition.courseId = courseId;

      const absences = await Attendance.findAll({
        where: { ...condition, status: { [Op.in]: ['absent', 'late'] } },
        order: [['timestamp', 'ASC']]
      });

      if (absences.length === 0) continue;

      // Detect consecutive absences
      let maxConsecutiveAbsences = 0;
      let currentStreak = 0;
      let lastDate = null;

      for (const absence of absences) {
        const currentDate = new Date(absence.timestamp).toDateString();
        if (lastDate && currentDate !== lastDate) {
          const gap = (new Date(currentDate) - new Date(lastDate)) / (1000 * 60 * 60 * 24);
          if (gap <= 3) {
            currentStreak++;
          } else {
            maxConsecutiveAbsences = Math.max(maxConsecutiveAbsences, currentStreak);
            currentStreak = 1;
          }
        } else {
          currentStreak = 1;
        }
        lastDate = currentDate;
      }
      maxConsecutiveAbsences = Math.max(maxConsecutiveAbsences, currentStreak);

      if (maxConsecutiveAbsences >= 2) {
        patterns.push({
          student: {
            id: student.id,
            studentId: student.studentId,
            fullName: student.fullName,
            department: student.department
          },
          totalAbsences: absences.length,
          consecutiveAbsences: maxConsecutiveAbsences,
          pattern: maxConsecutiveAbsences >= 5 ? 'chronic' : maxConsecutiveAbsences >= 3 ? 'frequent' : 'occasional',
          lastAbsence: absences[absences.length - 1]?.timestamp,
          risk: maxConsecutiveAbsences >= 3 ? 'high' : 'medium'
        });
      }
    }

    return patterns.sort((a, b) => b.consecutiveAbsences - a.consecutiveAbsences);
  }

  /**
   * Generate weekly attendance summary
   */
  async generateWeeklySummary(startDate = null, endDate = null) {
    const now = new Date();
    if (!endDate) endDate = now.toISOString().split('T')[0];
    if (!startDate) {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      startDate = weekAgo.toISOString().split('T')[0];
    }

    const totalSessions = await AttendanceSession.count({
      where: { sessionDate: { [Op.between]: [startDate, endDate] }, status: 'completed' }
    });
    const totalAttendances = await Attendance.count({
      where: { timestamp: { [Op.between]: [new Date(startDate), new Date(endDate)] } }
    });
    const presentCount = await Attendance.count({
      where: { timestamp: { [Op.between]: [new Date(startDate), new Date(endDate)] }, status: 'present' }
    });
    const absentCount = await Attendance.count({
      where: { timestamp: { [Op.between]: [new Date(startDate), new Date(endDate)] }, status: 'absent' }
    });

    const atRisk = await this.getAtRiskStudents();
    const absenteeism = await this.detectAbsenteeism();

    return {
      period: { startDate, endDate },
      summary: {
        totalSessions,
        totalAttendances,
        present: presentCount,
        absent: absentCount,
        late: totalAttendances - presentCount - absentCount,
        overallPercentage: totalAttendances > 0 ? parseFloat(((presentCount / totalAttendances) * 100).toFixed(2)) : 0
      },
      insights: {
        studentsAtRisk: atRisk.length,
        chronicAbsentees: absenteeism.filter(a => a.pattern === 'chronic').length,
        departmentsBelowAverage: [] // Populated if needed
      },
      recommendations: this.generateRecommendations(atRisk.length, presentCount / (totalAttendances || 1))
    };
  }

  /**
   * Generate monthly attendance summary
   */
  async generateMonthlySummary(year = null, month = null) {
    year = year || new Date().getFullYear();
    month = month || new Date().getMonth() + 1;
    
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const weeklyData = [];
    let weekStart = new Date(startDate);
    while (weekStart <= new Date(endDate)) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekSummary = await this.generateWeeklySummary(
        weekStart.toISOString().split('T')[0],
        Math.min(weekEnd, new Date(endDate)).toISOString().split('T')[0]
      );
      weeklyData.push(weekSummary);
      
      weekStart.setDate(weekStart.getDate() + 7);
    }

    const totalPresent = weeklyData.reduce((sum, w) => sum + w.summary.present, 0);
    const totalAttendances = weeklyData.reduce((sum, w) => sum + w.summary.totalAttendances, 0);
    const totalStudentsAtRisk = weeklyData[weeklyData.length - 1]?.insights.studentsAtRisk || 0;

    const departments = await Student.findAll({
      attributes: [[require('sequelize').fn('DISTINCT', require('sequelize').col('department')), 'department']],
      where: { isActive: true }
    });

    const deptComparison = [];
    for (const dept of departments) {
      const deptStudents = await Student.findAll({ where: { department: dept.department } });
      const studentIds = deptStudents.map(s => s.id);
      const deptTotal = await Attendance.count({
        where: { studentId: { [Op.in]: studentIds }, timestamp: { [Op.between]: [new Date(startDate), new Date(endDate)] } }
      });
      const deptPresent = await Attendance.count({
        where: { studentId: { [Op.in]: studentIds }, status: 'present', timestamp: { [Op.between]: [new Date(startDate), new Date(endDate)] } }
      });
      deptComparison.push({
        department: dept.department,
        percentage: deptTotal > 0 ? parseFloat(((deptPresent / deptTotal) * 100).toFixed(2)) : 0
      });
    }

    return {
      month: `${year}-${String(month).padStart(2, '0')}`,
      monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long' }),
      year,
      overallPercentage: totalAttendances > 0 ? parseFloat(((totalPresent / totalAttendances) * 100).toFixed(2)) : 0,
      weeklyBreakdown: weeklyData,
      departmentComparison: deptComparison,
      insights: {
        studentsAtRisk: totalStudentsAtRisk,
        bestPerformingDept: deptComparison.sort((a, b) => b.percentage - a.percentage)[0],
        needsImprovement: deptComparison.sort((a, b) => a.percentage - b.percentage)[0]
      },
      recommendations: this.generateRecommendations(totalStudentsAtRisk, totalPresent / (totalAttendances || 1))
    };
  }

  generateRecommendations(atRiskCount, overallRate) {
    const recommendations = [];
    
    if (atRiskCount > 20) {
      recommendations.push(`${atRiskCount} students are likely to fall below ${this.attendanceThreshold}% attendance. Immediate intervention required.`);
    } else if (atRiskCount > 10) {
      recommendations.push(`${atRiskCount} students are at risk of low attendance. Send warning notifications.`);
    } else if (atRiskCount > 0) {
      recommendations.push(`${atRiskCount} students need attention for attendance improvement.`);
    }

    if (overallRate < 0.75) {
      recommendations.push('Overall attendance rate is critically low. Implement mandatory attendance policy.');
    } else if (overallRate < 0.85) {
      recommendations.push('Overall attendance rate needs improvement. Consider awareness campaigns.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Overall attendance is satisfactory. Continue monitoring. Keep up the good work!');
    }

    return recommendations;
  }
}

module.exports = new AIInsightsService();