const Sentry = require('@sentry/node');
const config = require('../config');
const { getDb } = require('./db');

function initSentry() {
  if (!config.sentry.enabled || !config.sentry.dsn) {
    console.log('Sentry monitoring is disabled.');
    return;
  }

  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.env,
    tracesSampleRate: 1.0,
  });

  console.log('Sentry monitoring initialized successfully.');
}

function captureError(error, context = {}) {
  if (config.sentry.enabled && config.sentry.dsn) {
    Sentry.withScope((scope) => {
      Object.keys(context).forEach((key) => {
        scope.setExtra(key, context[key]);
      });
      Sentry.captureException(error);
    });
  }

  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO system_logs (log_level, module, message, details)
      VALUES (?, ?, ?, ?)
    `).run('error', context.module || 'unknown', error.message, JSON.stringify({
      stack: error.stack,
      ...context,
    }));
  } catch (dbError) {
    console.error('Failed to save error log:', dbError.message);
  }

  console.error(`[ERROR] ${error.message}`, context);
}

function captureMessage(message, level = 'info', context = {}) {
  if (config.sentry.enabled && config.sentry.dsn) {
    Sentry.withScope((scope) => {
      Object.keys(context).forEach((key) => {
        scope.setExtra(key, context[key]);
      });
      Sentry.captureMessage(message, level);
    });
  }

  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO system_logs (log_level, module, message, details)
      VALUES (?, ?, ?, ?)
    `).run(level, context.module || 'unknown', message, JSON.stringify(context));
  } catch (dbError) {
    console.error('Failed to save log:', dbError.message);
  }

  if (level === 'error') {
    console.error(`[${level.toUpperCase()}] ${message}`, context);
  } else {
    console.log(`[${level.toUpperCase()}] ${message}`, context);
  }
}

module.exports = {
  initSentry,
  captureError,
  captureMessage,
};
