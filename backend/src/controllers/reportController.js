const reportService = require('../services/reportService');
const path = require('path');

const generateReport = async (req, res, next) => {
  try {
    const { type, format, courseId, studentId, startDate, endDate } = req.query;
    const reportType = type || 'attendance';

    const data = await reportService.getReportData(reportType, { courseId, studentId, startDate, endDate });

    if (format === 'csv') {
      const csv = reportService.generateCSV(data.records);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report.csv`);
      return res.send(csv);
    }

    if (format === 'excel') {
      const workbook = await reportService.generateExcel(reportType, data, {
        title: `${reportType.replace(/_/g, ' ').toUpperCase()} Report`,
        period: { startDate, endDate }
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report.xlsx`);
      return await workbook.xlsx.write(res).then(() => res.end());
    }

    if (format === 'pdf') {
      const logoPath = path.join(__dirname, '../../uploads/logo.png');
      const pdfBuffer = await reportService.generatePDF(reportType, data, {
        logoPath,
        institutionName: process.env.INSTITUTION_NAME || 'Attendance Management System',
        period: { startDate, endDate },
        columns: ['Student ID', 'Student Name', 'Course Code', 'Date', 'Status', 'Confidence']
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report.pdf`);
      return res.send(pdfBuffer);
    }

    // Default: Return JSON
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getReportData = async (req, res, next) => {
  try {
    const { type, courseId, studentId, startDate, endDate } = req.query;
    const data = await reportService.getReportData(type || 'attendance', { courseId, studentId, startDate, endDate });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateReport, getReportData };