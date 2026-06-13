const { AuditLog } = require('../models');

const auditLog = (action, resource) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = async function(body) {
      try {
        await AuditLog.create({
          userId: req.user?.id || null,
          action,
          resource,
          resourceId: req.params.id || body?.data?.id || null,
          details: {
            method: req.method,
            path: req.originalUrl,
            body: req.method !== 'GET' ? this.sanitizeBody(req.body) : undefined,
            responseStatus: res.statusCode,
            query: Object.keys(req.query).length > 0 ? req.query : undefined
          },
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.headers['user-agent'],
          severity: res.statusCode >= 400 ? 'warning' : res.statusCode >= 500 ? 'error' : 'info'
        });
      } catch (err) {
        console.error('Audit log error:', err.message);
      }
      
      return originalJson(body);
    };
    
    next();
  };
};

auditLog.sanitizeBody = (body) => {
  if (!body) return {};
  const sanitized = { ...body };
  delete sanitized.password;
  delete sanitized.currentPassword;
  delete sanitized.newPassword;
  delete sanitized.token;
  delete sanitized.faceEmbedding;
  return sanitized;
};

module.exports = auditLog;