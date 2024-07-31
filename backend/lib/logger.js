const winston = require('winston');
const { combine, timestamp, printf, errors } = winston.format;
const path = require('path');

// Create a custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});

// Create a winston logger instance
const logger = winston.createLogger({
    level: 'info',
    format: combine(
        timestamp(),
        errors({ stack: true }), 
        logFormat
    ),
    transports: [
        new winston.transports.File({ filename: path.join(__dirname, '../public/logs/application.log') }),
    ],
});

// Add console transport only if not in production
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: combine(
            timestamp(),
            winston.format.colorize(),
            logFormat
        )
    }));
}

module.exports = logger;
