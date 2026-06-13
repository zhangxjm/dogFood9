const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  return moment(date).format(format);
}

function generateId(prefix = '') {
  return prefix + uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
}

function generateOrderNo() {
  const dateStr = moment().format('YYYYMMDD');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `WO-${dateStr}-${random}`;
}

function addDays(date, days) {
  return moment(date).add(days, 'days').toDate();
}

function daysBetween(date1, date2) {
  return moment(date1).diff(moment(date2), 'days');
}

function successResponse(data, message = '操作成功') {
  return {
    success: true,
    code: 200,
    message,
    data,
    timestamp: Date.now(),
  };
}

function errorResponse(message = '操作失败', code = 500, details = null) {
  return {
    success: false,
    code,
    message,
    details,
    timestamp: Date.now(),
  };
}

function calculateHealthScore(readings) {
  const { temperature = 0, vibration = 0, pressure = 0, power_consumption = 0, error_codes = '' } = readings;
  
  let score = 100;
  
  if (temperature > 70) score -= 20;
  else if (temperature > 60) score -= 10;
  else if (temperature > 50) score -= 5;
  
  if (vibration > 5) score -= 25;
  else if (vibration > 4) score -= 15;
  else if (vibration > 3) score -= 8;
  
  if (pressure > 1.0) score -= 15;
  else if (pressure > 0.8) score -= 8;
  
  if (power_consumption > 50) score -= 10;
  else if (power_consumption > 40) score -= 5;
  
  const errorCount = error_codes ? error_codes.split(',').length : 0;
  score -= errorCount * 10;
  
  return Math.max(0, Math.min(100, score));
}

function getHealthAssessment(score) {
  if (score >= 90) return { level: 'excellent', text: '优秀', color: '#52c41a' };
  if (score >= 75) return { level: 'good', text: '良好', color: '#1890ff' };
  if (score >= 60) return { level: 'fair', text: '一般', color: '#faad14' };
  if (score >= 40) return { level: 'poor', text: '较差', color: '#fa8c16' };
  return { level: 'critical', text: '严重', color: '#f5222d' };
}

function getStatusText(status) {
  const statusMap = {
    purchased: '已采购',
    installed: '已安装',
    running: '运行中',
    maintenance: '维保中',
    fault: '故障',
    idle: '闲置',
    scrapped: '已报废',
  };
  return statusMap[status] || status;
}

function getPriorityText(priority) {
  const priorityMap = {
    low: '低',
    normal: '普通',
    high: '高',
    urgent: '紧急',
  };
  return priorityMap[priority] || priority;
}

module.exports = {
  formatDate,
  generateId,
  generateOrderNo,
  addDays,
  daysBetween,
  successResponse,
  errorResponse,
  calculateHealthScore,
  getHealthAssessment,
  getStatusText,
  getPriorityText,
};
