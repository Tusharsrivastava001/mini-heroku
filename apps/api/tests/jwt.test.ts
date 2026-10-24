import { signToken, verifyToken } from '../src/utils/jwt.js';

describe('JWT Utility', () => {
  it('should sign and verify a valid JWT token', () => {
    const payload = {
      userId: 'user-uuid-1234',
      username: 'alice',
      role: 'USER' as const,
    };

    const token = signToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.username).toBe(payload.username);
    expect(decoded.role).toBe(payload.role);
  });

  it('should throw an error for malformed token', () => {
    expect(() => verifyToken('invalid.token.string')).toThrow();
  });
});
