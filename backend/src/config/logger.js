// config/logger.js — Structured logging with pino
import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Application logger.
 * - Development: pretty-printed, debug level
 * - Production : JSON output, info level (pipe to pino-pretty if needed)
 */
const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),

  ...(isDev && {
    transport: {
      target: 'pino/file',
      options: { destination: 1 }, // stdout
    },
  }),

  // Redact sensitive fields from logs
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie'],
    censor: '[REDACTED]',
  },

  // Standard serializers
  serializers: pino.stdSerializers,
});

export default logger;
