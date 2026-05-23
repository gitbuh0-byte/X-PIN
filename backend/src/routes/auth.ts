import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../types/index.js';

const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response, next) => {
  try {
    const { email, password, username } = req.body;

    const user = await authService.register(email, password, username);

    res.json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req: Request, res: Response, next) => {
  try {
    const { email, password } = req.body;

    const { user, token, refreshToken } = await authService.login(email, password);

    res.json({
      success: true,
      data: { user, token, refreshToken },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/refresh', async (req: Request, res: Response, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('MISSING_REFRESH_TOKEN', 'Refresh token required', 400);
    }

    const token = await authService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      data: { token },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/oauth', authenticate, async (req: Request, res: Response, next) => {
  try {
    const user = await authService.getUserById(req.user!.user_id);

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'Authenticated user not found', 404);
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.get('/session', authenticate, async (req: Request, res: Response, next) => {
  try {
    const user = await authService.getUserById(req.user!.user_id);

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'Authenticated user not found', 404);
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
});

export default authRouter;
