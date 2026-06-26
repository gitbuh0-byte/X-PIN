import { logger } from './utils/logger.js';
import { connectDatabase } from './database/db.js';
import { runMigrations } from './database/migrations.js';
import { connectRedis } from './utils/redis.js';
import { initializeQueues } from './queues/index.js';

let initialized = false;

export const initializeBackend = async () => {
  if (initialized) return;

  logger.info('Initializing X-SPIN backend...');

  await connectDatabase();
  await runMigrations();
  await connectRedis();
  await initializeQueues();

  initialized = true;
  logger.info('X-SPIN backend initialized');
};
