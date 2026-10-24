import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { requireAuth } from '../middleware/auth.js';
import { config } from '../config/index.js';

const router = Router();

// Redirect to GitHub OAuth login
router.get('/github', (req: Request, res: Response) => {
  const redirectUri = `${config.API_PUBLIC_URL}/api/auth/github/callback`;
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${config.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=read:user,repo,admin:repo_hook`;

  res.redirect(githubAuthUrl);
});

// GitHub OAuth callback
router.get('/github/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      res.status(400).json({ error: 'Missing OAuth authorization code' });
      return;
    }

    const { token } = await authService.handleGitHubCallback(code);

    // Set secure HTTP-only cookie and redirect to dashboard
    res.cookie('deployforge_token', token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${config.DASHBOARD_PUBLIC_URL}/auth/callback?token=${token}`);
  } catch (error) {
    next(error);
  }
});

// Fast Dev Login (bypasses GitHub OAuth for local dev / testing)
router.post('/dev-login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      username: z.string().optional().default('dev-engineer'),
    });
    const { username } = schema.parse(req.body);

    const { token, user } = await authService.handleDevLogin(username);

    res.cookie('deployforge_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ token, user });
  } catch (error) {
    next(error);
  }
});

// Current User Profile
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('deployforge_token');
  res.json({ message: 'Successfully logged out' });
});

export const authRoutes = router;
