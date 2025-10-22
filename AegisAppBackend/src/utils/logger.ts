/**
 * Logger Utility
 * Winston tabanlı logging sistemi
 */

import winston from 'winston';
import path from 'path';

// Log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format (development için)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'aegis-backend' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat
    }),
    
    // File transport (sadece production'da)
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    ] : [])
  ]
});

// Development'da unhandled exception'ları logla
if (process.env.NODE_ENV !== 'production') {
  logger.exceptions.handle(
    new winston.transports.Console({
      format: consoleFormat
    })
  );
}
