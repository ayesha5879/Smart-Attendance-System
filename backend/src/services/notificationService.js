const nodemailer = require('nodemailer');
const { Notification } = require('../models');

class NotificationService {
  constructor() {
    this.transporter = null;
    this.emailConfigured = false;
    this.initEmail();
  }

  initEmail() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      this.emailConfigured = true;
    } else {
      console.log('Email not configured. Using console logging for emails.');
    }
  }

  // ================ IN-APP NOTIFICATIONS ================

  async createNotification(userId, type, title, message, data = null, actionable = false, actionUrl = null) {
    try {
      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        data,
        isActionable: actionable,
        actionUrl
      });
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error.message);
      return null;
    }
  }

  async getNotifications(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const { count, rows } = await Notification.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    return { notifications: rows, total: count, unread: rows.filter(n => !n.isRead).length };
  }

  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({ where: { id: notificationId, userId } });
    if (notification) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }
    return notification;
  }

  async markAllAsRead(userId) {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId, isRead: false } }
    );
  }

  async getUnreadCount(userId) {
    return await Notification.count({ where: { userId, isRead: false } });
  }

  // ================ ATTENDANCE NOTIFICATIONS ================

  async sendAttendanceMarked(studentName, courseName, status, email) {
    const title = 'Attendance Marked';
    const message = `Your attendance for ${courseName} has been marked as ${status}.`;
    
    if (email && this.emailConfigured) {
      await this.sendEmail({
        to: email,
        subject: title,
        html: this.getAttendanceEmailTemplate(studentName, courseName, status)
      });
    }
    return message;
  }

  async sendLowAttendanceWarning(userId, studentName, percentage, threshold, email) {
    const title = '⚠️ Low Attendance Warning';
    const message = `Your attendance is ${percentage.toFixed(1)}%, below the minimum ${threshold}% threshold.`;
    
    await this.createNotification(userId, 'warning', title, message, { percentage, threshold });
    
    if (email && this.emailConfigured) {
      await this.sendEmail({
        to: email,
        subject: title,
        html: this.getWarningEmailTemplate(studentName, percentage, threshold)
      });
    }
  }

  async sendAttendanceConfirmation(userId, studentName, courseName, sessionDate, email) {
    const title = 'Attendance Confirmed';
    const message = `Your attendance for ${courseName} on ${sessionDate} has been confirmed.`;
    
    await this.createNotification(userId, 'success', title, message);
    
    if (email && this.emailConfigured) {
      await this.sendEmail({
        to: email,
        subject: title,
        html: `<p>Dear ${studentName},</p><p>${message}</p>`
      });
    }
  }

  async sendCorrectionRequest(userId, reviewerId, studentName, courseName, reason) {
    const title = 'Attendance Correction Request';
    const message = `${studentName} has requested a correction for ${courseName}. Reason: ${reason}`;
    
    await this.createNotification(reviewerId, 'action_required', title, message, {
      studentName, courseName, reason
    }, true, '/admin/corrections');
  }

  async sendCorrectionStatus(userId, studentName, courseName, status, remarks) {
    const title = `Correction Request ${status}`;
    const message = `Your attendance correction request for ${courseName} has been ${status}. ${remarks ? `Remarks: ${remarks}` : ''}`;
    
    await this.createNotification(userId, status === 'approved' ? 'success' : 'error', title, message);
  }

  // ================ INSIGHT NOTIFICATIONS ================

  async sendWeeklySummary(userId, email, studentName, summary) {
    const title = '📊 Weekly Attendance Summary';
    const message = `Your weekly attendance: ${summary.percentage.toFixed(1)}% (${summary.present}/${summary.total} classes)`;
    
    await this.createNotification(userId, 'info', title, message, summary);
    
    if (email && this.emailConfigured) {
      await this.sendEmail({
        to: email,
        subject: title,
        html: this.getSummaryEmailTemplate(studentName, summary, 'Weekly')
      });
    }
  }

  async sendMonthlySummary(userId, email, studentName, summary) {
    const title = '📈 Monthly Attendance Summary';
    const message = `Your monthly attendance: ${summary.percentage.toFixed(1)}% (${summary.present}/${summary.total} classes)`;
    
    await this.createNotification(userId, 'info', title, message, summary);
    
    if (email && this.emailConfigured) {
      await this.sendEmail({
        to: email,
        subject: title,
        html: this.getSummaryEmailTemplate(studentName, summary, 'Monthly')
      });
    }
  }

  // ================ EMAIL METHODS ================

  async sendEmail({ to, subject, html }) {
    if (!this.emailConfigured) {
      console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
      return;
    }
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@attendance-system.com',
        to,
        subject,
        html
      });
    } catch (error) {
      console.error('Email sending failed:', error.message);
    }
  }

  getAttendanceEmailTemplate(name, course, status) {
    return `
      <div style="font-family: Arial; padding: 20px;">
        <h2>Attendance Marked</h2>
        <p>Dear ${name},</p>
        <p>Your attendance has been recorded:</p>
        <table style="border-collapse: collapse;">
          <tr><td style="padding: 8px; font-weight: bold;">Course:</td><td>${course}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Status:</td><td>${status}</td></tr>
        </table>
      </div>`;
  }

  getWarningEmailTemplate(name, percentage, threshold) {
    return `
      <div style="font-family: Arial; padding: 20px;">
        <h2 style="color: #dc2626;">⚠️ Low Attendance Warning</h2>
        <p>Dear ${name},</p>
        <p>Your current attendance is <strong>${percentage.toFixed(1)}%</strong>.</p>
        <p>This is below the minimum requirement of <strong>${threshold}%</strong>.</p>
        <p>Please ensure regular attendance to meet the requirements.</p>
      </div>`;
  }

  getSummaryEmailTemplate(name, summary, period) {
    return `
      <div style="font-family: Arial; padding: 20px; max-width: 600px;">
        <h2>${period} Attendance Summary</h2>
        <p>Dear ${name},</p>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 8px;">Total Classes:</td><td>${summary.total}</td></tr>
          <tr><td style="padding: 8px;">Present:</td><td>${summary.present}</td></tr>
          <tr><td style="padding: 8px;">Absent:</td><td>${summary.absent}</td></tr>
          <tr><td style="padding: 8px;">Percentage:</td><td>${summary.percentage.toFixed(1)}%</td></tr>
        </table>
      </div>`;
  }
}

module.exports = new NotificationService();