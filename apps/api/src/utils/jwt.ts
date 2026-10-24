import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface JwtPayload {
  userId: string;
  username: string;
  role: 'USER' | 'ADMIN';
}

export function signToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: config.SESSION_EXPIRES_IN as any,
  };
  return jwt.sign(payload, config.JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.JWT_SECRET) as JwtPayload;
}
