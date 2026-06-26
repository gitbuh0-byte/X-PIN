import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { setupWebSocket } from './websocket/index.js';
import { initializeQueues } from './queues/index.js';
import { createApp } from './app.js';
import { initializeBackend } from './init.js';

const app = createApp();

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || config.FRONTEND_URLS.split(',').includes(origin) || /^https:\/\/.*\.vercel\.app$/.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin not allowed'));
    },
    credentials: true,
  },
});

async function start() {
  try {
    logger.info('Starting X-SPIN backend server...');

    await initializeBackend();

    await setupWebSocket(io);

    const PORT = config.PORT || 3000;

    httpServer.listen(PORT, () => {
      logger.info(`✅ Server running on port ${PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
    });

    const gracefulShutdown = async () => {
      logger.info('Shutting down gracefully...');

      io.close();
      process.exit(0);
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

export { app, io };
