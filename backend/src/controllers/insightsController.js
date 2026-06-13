const aiInsightsService = require('../services/aiInsightsService');

const getAtRiskStudents = async (req, res, next) => {
  try {
    const { courseId, department } = req.query;
    const data = await aiInsightsService.getAtRiskStudents(courseId, department);
    res.status(200).json({
      success: true,
      data,
      summary: {
        total: data.length,
        critical: data.filter(s => s.riskLevel === 'critical').length,
        warning: data.filter(s => s.riskLevel === 'warning').length
      }
    });
  } catch (error) { next(error); }
};

const predictAttendance = async (req, res, next) => {
  try {
    const { studentId, courseId } = req.query;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }
    const data = await aiInsightsService.predictAttendance(parseInt(studentId), courseId ? parseInt(courseId) : null);
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

const detectAbsenteeism = async (req, res, next) => {
  try {
    const { department, courseId } = req.query;
    const data = await aiInsightsService.detectAbsenteeism(department, courseId);
    res.status(200).json({ success: true, data, total: data.length });
  } catch (error) { next(error); }
};

const getWeeklySummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await aiInsightsService.generateWeeklySummary(startDate, endDate);
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

const getMonthlySummary = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const data = await aiInsightsService.generateMonthlySummary(year ? parseInt(year) : null, month ? parseInt(month) : null);
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

module.exports = {
  getAtRiskStudents, predictAttendance, detectAbsenteeism,
  getWeeklySummary, getMonthlySummary
};