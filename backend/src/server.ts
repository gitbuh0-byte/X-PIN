import express, { Application } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config, frontendOrigins } from './config.js';
import { logger } from './utils/logger.js';
import { connectDatabase, closeDatabase } from './database/db.js';
import { runMigrations } from './database/migrations.js';
import { connectRedis, closeRedis } from './utils/redis.js';
import { setupWebSocket } from './websocket/index.js';
import { initializeQueues } from './queues/index.js';
import { authenticate, errorHandler, rateLimiter } from './middleware/auth.js';

// Routes
import authRouter from './routes/auth.js';
import gameRouter from './routes/games.js';
import tournamentRouter from './routes/tournaments.js';
import paymentRouter from './routes/payments.js';
import userRouter from './routes/users.js';
import adminRouter from './routes/admin.js';

const app: Application = express();

const isAllowedOrigin = (origin?: string) => {
  if (!origin) return true;
  if (frontendOrigins.includes(origin)) return true;
  return /^https:\/\/.*\.vercel\.app$/.test(origin);
};

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin not allowed'));
    },
    credentials: true,
  },
});

// Global middleware
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('CORS origin not allowed'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(rateLimiter(100, 60000)); // 100 requests per minute

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/games', gameRouter);
app.use('/api/tournaments', tournamentRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/users', userRouter);
app.use('/api/admin', adminRouter);

// Error handling
app.use(errorHandler);

// Initialize function
async function start() {
  try {
    logger.info('Starting X-SPIN backend server...');

    // Connect to database
    await connectDatabase();
    await runMigrations();

    // Connect to Redis
    await connectRedis();

    // Initialize BullMQ queues
    await initializeQueues();

    // Setup WebSocket
    await setupWebSocket(io);

    // Start server
    const PORT = config.PORT || 3000;

    httpServer.listen(PORT, () => {
      logger.info(`✅ Server running on port ${PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      logger.info('Shutting down gracefully...');

      io.close();
      await closeDatabase();
      await closeRedis();

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
