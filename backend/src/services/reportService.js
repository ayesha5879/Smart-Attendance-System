const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { Parser } = require('json2csv');
const { Attendance, AttendanceSession, Student, Course, Enrollment, User } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

class ReportService {
  /**
   * Generate PDF report
   */
  async generatePDF(type, data, options = {}) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        info: {
          Title: `${type} Attendance Report`,
          Author: 'Face Recognition Attendance System',
          Subject: 'Attendance Report'
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      this.addReportHeader(doc, type, options);

      // Institution info
      if (options.institutionName) {
        doc.fontSize(10).text(options.institutionName, { align: 'center' });
        doc.moveDown(0.5);
      }

      // Summary section
      if (data.summary) {
        this.addSummarySection(doc, data.summary);
      }

      // Charts area (placeholder for chart descriptions)
      if (data.charts) {
        this.addChartsSection(doc, data.charts);
      }

      // Main data table
      if (data.records && data.records.length > 0) {
        doc.addPage();
        this.addDataTable(doc, data.records, options.columns);
      }

      // Statistics footer
      if (data.statistics) {
        this.addStatisticsFooter(doc, data.statistics);
      }

      // Footer
      doc.fontSize(8).text(
        `Generated on: ${new Date().toLocaleString()} | Face Recognition Attendance System`,
        40,
        doc.page.height - 50,
        { align: 'center', width: doc.page.width - 80 }
      );

      doc.end();
    });
  }

  addReportHeader(doc, type, options) {
    // Add logo if available
    if (options.logoPath && fs.existsSync(options.logoPath)) {
      doc.image(options.logoPath, 40, 30, { width: 60 });
    }

    doc.fontSize(20).font('Helvetica-Bold')
      .text(type.replace(/_/g, ' ').toUpperCase(), 40, 40, { align: 'center' });
    
    if (options.period) {
      doc.fontSize(12).font('Helvetica')
        .text(`Period: ${options.period.startDate} to ${options.period.endDate}`, { align: 'center' });
    }
    
    doc.moveDown();
    doc.strokeColor('#2563eb').lineWidth(2).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
  }

  addSummarySection(doc, summary) {
    doc.fontSize(14).font('Helvetica-Bold').text('Summary Statistics', { underline: true });
    doc.moveDown(0.5);

    const items = [
      ['Total Students', summary.totalStudents],
      ['Total Courses', summary.totalCourses],
      ['Total Sessions', summary.totalSessions],
      ['Total Attendance Records', summary.totalRecords],
      ['Present Count', summary.presentCount],
      ['Absent Count', summary.absentCount],
      ['Attendance Rate', `${summary.attendanceRate}%`]
    ];

    items.forEach(([label, value]) => {
      doc.fontSize(10).font('Helvetica')
        .text(`${label}: `, { continued: true })
        .font('Helvetica-Bold')
        .text(`${value || 0}`);
    });
    doc.moveDown();
  }

  addChartsSection(doc, charts) {
    doc.fontSize(14).font('Helvetica-Bold').text('Attendance Charts', { underline: true });
    doc.moveDown(0.5);

    charts.forEach(chart => {
      doc.fontSize(10).font('Helvetica')
        .text(`• ${chart.title}: ${chart.description}`);
    });
    doc.moveDown();
  }

  addDataTable(doc, records, columns = null) {
    if (!records || records.length === 0) return;

    const headers = columns || Object.keys(records[0]);
    const columnWidth = 470 / headers.length;
    const startY = doc.y;

    // Table header
    doc.fontSize(8).font('Helvetica-Bold');
    let x = 40;
    headers.forEach(header => {
      doc.text(header, x, startY, { width: columnWidth, align: 'left' });
      x += columnWidth;
    });

    // Header underline
    doc.moveDown(0.3);
    doc.strokeColor('#000').lineWidth(0.5)
      .moveTo(40, doc.y)
      .lineTo(510, doc.y)
      .stroke();
    doc.moveDown(0.3);

    // Table rows
    doc.fontSize(7).font('Helvetica');
    records.forEach((record, index) => {
      if (doc.y > 720) {
        doc.addPage();
      }

      const rowY = doc.y;
      x = 40;
      
      headers.forEach(header => {
        const value = record[header] || '-';
        doc.text(String(value), x, rowY, { width: columnWidth, align: 'left' });
        x += columnWidth;
      });

      doc.moveDown(0.8);
    });
  }

  addStatisticsFooter(doc, stats) {
    if (doc.y > 650) doc.addPage();
    doc.moveDown();
    doc.strokeColor('#2563eb').lineWidth(1).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold').text('Additional Statistics');
    doc.fontSize(9).font('Helvetica');
    Object.entries(stats).forEach(([key, value]) => {
      doc.text(`${key.replace(/_/g, ' ')}: ${value}`);
    });
  }

  /**
   * Generate Excel report
   */
  async generateExcel(type, data, options = {}) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Face Recognition Attendance System';
    workbook.created = new Date();

    // Summary sheet
    if (data.summary) {
      const summarySheet = workbook.addWorksheet('Summary');
      this.populateSummarySheet(summarySheet, data.summary, options);
    }

    // Data sheet
    if (data.records && data.records.length > 0) {
      const dataSheet = workbook.addWorksheet('Attendance Data');
      this.populateDataSheet(dataSheet, data.records, options.columns);
    }

    // Charts sheet (if available)
    if (data.chartsData) {
      const chartSheet = workbook.addWorksheet('Charts Data');
      this.populateChartDataSheet(chartSheet, data.chartsData);
    }

    return workbook;
  }

  populateSummarySheet(sheet, summary, options) {
    // Title
    sheet.mergeCells('A1:G1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = options.title || 'Attendance Report';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF2563EB' } };
    titleCell.alignment = { horizontal: 'center' };

    // Period
    if (options.period) {
      sheet.mergeCells('A2:G2');
      sheet.getCell('A2').value = `Period: ${options.period.startDate} to ${options.period.endDate}`;
      sheet.getCell('A2').alignment = { horizontal: 'center' };
    }

    // Summary table
    sheet.getCell('A4').value = 'Metric';
    sheet.getCell('B4').value = 'Value';
    sheet.getCell('A4').font = { bold: true };
    sheet.getCell('B4').font = { bold: true };

    const metrics = [
      ['Total Students', summary.totalStudents],
      ['Total Courses', summary.totalCourses],
      ['Total Sessions', summary.totalSessions],
      ['Total Records', summary.totalRecords],
      ['Present', summary.presentCount],
      ['Absent', summary.absentCount],
      ['Attendance Rate', `${summary.attendanceRate}%`]
    ];

    metrics.forEach(([metric, value], index) => {
      const row = index + 5;
      sheet.getCell(`A${row}`).value = metric;
      sheet.getCell(`B${row}`).value = value;
    });

    sheet.columns = [
      { key: 'metric', width: 25 },
      { key: 'value', width: 15 }
    ];
  }

  populateDataSheet(sheet, records, columns) {
    const headers = columns || Object.keys(records[0]);
    
    // Header row
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    headerRow.alignment = { horizontal: 'center' };

    // Data rows
    records.forEach(record => {
      const row = sheet.addRow(headers.map(h => record[h] || '-'));
      row.alignment = { horizontal: 'left' };
    });

    // Auto-fit columns
    headers.forEach((header, index) => {
      const maxLength = Math.max(
        header.length,
        ...records.map(r => String(r[header] || '').length)
      );
      sheet.getColumn(index + 1).width = Math.min(maxLength + 2, 30);
    });
  }

  populateChartDataSheet(sheet, chartsData) {
    sheet.getCell('A1').value = 'Chart Data Export';
    sheet.getCell('A1').font = { bold: true, size: 14 };

    let currentRow = 3;
    Object.entries(chartsData).forEach(([chartName, data]) => {
      sheet.getCell(`A${currentRow}`).value = chartName;
      sheet.getCell(`A${currentRow}`).font = { bold: true };
      currentRow++;

      if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]);
        const headerRow = sheet.addRow(headers);
        headerRow.font = { bold: true };
        currentRow++;

        data.forEach(item => {
          sheet.addRow(headers.map(h => item[h]));
          currentRow++;
        });
      }
      currentRow++;
    });
  }

  /**
   * Generate CSV
   */
  generateCSV(records, fields = null) {
    const parser = new Parser({
      fields: fields || Object.keys(records[0] || {})
    });
    return parser.parse(records);
  }

  /**
   * Get attendance records for reports
   */
  async getReportData(type, filters = {}) {
    const { courseId, studentId, startDate, endDate, department } = filters;
    const where = {};

    if (courseId) where.courseId = courseId;
    if (studentId) where.studentId = studentId;
    if (startDate && endDate) {
      where.timestamp = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const records = await Attendance.findAll({
      where,
      include: [
        { association: 'student', attributes: ['studentId', 'fullName', 'email', 'department', 'semester'] },
        { association: 'course', attributes: ['courseCode', 'courseName', 'instructor'] },
        { association: 'session', attributes: ['sessionDate', 'startTime', 'endTime'] }
      ],
      order: [['timestamp', 'DESC']]
    });

    const totalStudents = await Student.count({ where: { isActive: true } });
    const totalCourses = await Course.count({ where: { isActive: true } });
    const totalSessions = await AttendanceSession.count({
      where: { status: 'completed' }
    });

    const presentCount = records.filter(r => r.status === 'present').length;
    const absentCount = records.filter(r => r.status === 'absent').length;
    const lateCount = records.filter(r => r.status === 'late').length;

    const attendanceRate = records.length > 0
      ? ((presentCount / records.length) * 100).toFixed(2)
      : 0;

    const formattedRecords = records.map(r => ({
      'Student ID': r.student?.studentId,
      'Student Name': r.student?.fullName,
      'Department': r.student?.department,
      'Semester': r.student?.semester,
      'Course Code': r.course?.courseCode,
      'Course Name': r.course?.courseName,
      'Instructor': r.course?.instructor,
      'Date': r.session?.sessionDate,
      'Start Time': r.session?.startTime,
      'Status': r.status,
      'Confidence': r.confidence ? `${(r.confidence * 100).toFixed(1)}%` : '-',
      'Marked By': r.markedBy,
      'Recorded At': r.timestamp
    }));

    return {
      summary: {
        totalStudents,
        totalCourses,
        totalSessions,
        totalRecords: records.length,
        presentCount,
        absentCount,
        lateCount,
        attendanceRate: parseFloat(attendanceRate)
      },
      records: formattedRecords,
      statistics: {
        total_present: presentCount,
        total_absent: absentCount,
        total_late: lateCount,
        present_percentage: `${attendanceRate}%`,
        absent_percentage: `${records.length > 0 ? ((absentCount / records.length) * 100).toFixed(2) : 0}%`
      }
    };
  }
}

module.exports = new ReportService();