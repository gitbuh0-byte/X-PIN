import pino from 'pino';
import { config } from '../config.js';

const transport = pino.transport({
  target: 'pino-pretty',
  options: {
    colorize: true,
    singleLine: config.NODE_ENV === 'production',
  },
});

export const logger = pino(
  {
    level: config.LOG_LEVEL,
    enabled: true,
  },
  config.NODE_ENV === 'production' ? undefined : transport
);
