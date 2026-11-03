import { prisma } from '../db/prisma.js';
import { config } from '../config/index.js';
import { encrypt } from '../utils/crypto.js';
import { signToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

export interface GitHubUserResponse {
  id: number;
  login: string;
  email: string | null;
  avatar_url: string;
}

export class AuthService {
  /**
   * Exchanges GitHub OAuth authorization code for an access token and user profile
   */
  async handleGitHubCallback(code: string): Promise<{ token: string; user: any }> {
    // 1. Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: config.GITHUB_CLIENT_ID,
        client_secret: config.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenData.access_token) {
      throw new Error(tokenData.error_description || 'Failed to exchange GitHub authorization code');
    }

    // 2. Fetch GitHub user profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'DeployForge-API',
      },
    });

    const ghUser = (await userResponse.json()) as GitHubUserResponse;

    // 3. Upsert user in database
    const encryptedToken = encrypt(tokenData.access_token);
    const user = await prisma.user.upsert({
      where: { githubId: String(ghUser.id) },
      update: {
        username: ghUser.login,
        email: ghUser.email,
        avatarUrl: ghUser.avatar_url,
        accessToken: encryptedToken,
      },
      create: {
        githubId: String(ghUser.id),
        username: ghUser.login,
        email: ghUser.email,
        avatarUrl: ghUser.avatar_url,
        accessToken: encryptedToken,
      },
    });

    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role as any,
    });

    return { token, user };
  }

  /**
   * Fast 1-click dev login for local development without GitHub credentials
   */
  async handleDevLogin(username = 'dev-engineer'): Promise<{ token: string; user: any }> {
    const user = await prisma.user.upsert({
      where: { username },
      update: {
        avatarUrl: `https://avatars.githubusercontent.com/u/1024025?v=4`,
      },
      create: {
        githubId: `mock-dev-${username}`,
        username,
        email: `${username}@deployforge.local`,
        avatarUrl: `https://avatars.githubusercontent.com/u/1024025?v=4`,
        role: 'ADMIN',
      },
    });

    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role as any,
    });

    logger.info(`Dev login successful for user ${user.username}`);
    return { token, user };
  }

  /**
   * Get user profile by ID
   */
  async getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });
  }
}

export const authService = new AuthService();
