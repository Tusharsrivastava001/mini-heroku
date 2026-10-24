import { encrypt, decrypt, verifyGitHubWebhookSignature } from '../src/utils/crypto.js';
import crypto from 'crypto';

describe('Crypto Utility', () => {
  it('should encrypt and decrypt a plaintext string correctly', () => {
    const secret = 'SUPER_SECRET_DATABASE_PASSWORD_123!';
    const encrypted = encrypt(secret);

    expect(encrypted).not.toBe(secret);
    expect(encrypted).toContain(':');

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(secret);
  });

  it('should return empty string when encrypting or decrypting empty input', () => {
    expect(encrypt('')).toBe('');
    expect(decrypt('')).toBe('');
  });

  it('should throw an error when decrypting tampered ciphertext', () => {
    const encrypted = encrypt('sensitive-data');
    const parts = encrypted.split(':');
    // Tamper with the ciphertext
    parts[2] = 'deadbeef' + parts[2].substring(8);
    const tampered = parts.join(':');

    expect(() => decrypt(tampered)).toThrow();
  });

  it('should verify a valid GitHub webhook HMAC signature', () => {
    const payload = JSON.stringify({ ref: 'refs/heads/main', repository: { name: 'demo' } });
    const secret = 'my-webhook-secret';
    const hmac = crypto.createHmac('sha256', secret);
    const signature = `sha256=${hmac.update(payload).digest('hex')}`;

    const isValid = verifyGitHubWebhookSignature(payload, signature, secret);
    expect(isValid).toBe(true);
  });

  it('should reject an invalid GitHub webhook HMAC signature', () => {
    const payload = JSON.stringify({ ref: 'refs/heads/main' });
    const secret = 'my-webhook-secret';
    const invalidSignature = 'sha256=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    const isValid = verifyGitHubWebhookSignature(payload, invalidSignature, secret);
    expect(isValid).toBe(false);
  });
});
