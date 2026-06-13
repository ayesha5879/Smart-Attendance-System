const analyticsService = require('../services/analyticsService');
const aiInsightsService = require('../services/aiInsightsService');

const getDashboardAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, courseId, department } = req.query;
    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const [trend, weekly, courses, departments, atRisk] = await Promise.all([
      analyticsService.getAttendanceTrend(start, end, courseId, department),
      analyticsService.getWeeklyStats(start, end, courseId),
      analyticsService.getCourseComparison(start, end),
      analyticsService.getDepartmentComparison(start, end),
      aiInsightsService.getAtRiskStudents(courseId, department)
    ]);

    res.status(200).json({
      success: true,
      data: { trend, weekly, courseComparison: courses, departmentComparison: departments, atRiskStudents: atRisk }
    });
  } catch (error) {
    next(error);
  }
};

const getAttendanceTrend = async (req, res, next) => {
  try {
    const { startDate, endDate, courseId, department } = req.query;
    const data = await analyticsService.getAttendanceTrend(startDate, endDate, courseId, department);
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

const getWeeklyStats = async (req, res, next) => {
  try {
    const { startDate, endDate, courseId } = req.query;
    const data = await analyticsService.getWeeklyStats(startDate, endDate, courseId);
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

const getMonthlyStats = async (req, res, next) => {
  try {
    const { year, courseId } = req.query;
    const data = await analyticsService.getMonthlyStats(year, courseId);
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

const getDepartmentComparison = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await analyticsService.getDepartmentComparison(startDate, endDate);
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

const getCourseComparison = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await analyticsService.getCourseComparison(startDate, endDate);
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

const getStudentRanking = async (req, res, next) => {
  try {
    const { startDate, endDate, department, limit } = req.query;
    const data = await analyticsService.getStudentRanking(startDate, endDate, department, parseInt(limit) || 50);
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

const getHeatmapData = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await analyticsService.getHeatmapData(startDate, endDate);
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

const getDistributionData = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await analyticsService.getDistributionData(startDate, endDate);
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

module.exports = {
  getDashboardAnalytics, getAttendanceTrend, getWeeklyStats, getMonthlyStats,
  getDepartmentComparison, getCourseComparison, getStudentRanking,
  getHeatmapData, getDistributionData
};