import express, { Application } from 'express';
import cors from 'cors';
import { config, frontendOrigins } from './config.js';
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

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin not allowed'));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(rateLimiter(100, 60000));

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.use('/api/auth', authRouter);
app.use('/api/games', gameRouter);
app.use('/api/tournaments', tournamentRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/users', userRouter);
app.use('/api/admin', adminRouter);

app.use(errorHandler);

export const createApp = (): Application => app;
export default app;
