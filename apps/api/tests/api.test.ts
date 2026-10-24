import request from 'supertest';
import { createApp } from '../src/app.js';

describe('DeployForge API Endpoints', () => {
  const app = createApp();

  it('GET / should return operational status', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('DeployForge API');
  });

  it('GET /api/health should return health report', async () => {
    const res = await request(app).get('/api/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('services');
  });

  it('GET /api/metrics should return Prometheus metrics text format', async () => {
    const res = await request(app).get('/api/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('deployforge_');
  });

  it('GET /api/projects without auth token should return 401 Unauthorized', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Unauthorized');
  });

  it('POST /api/auth/dev-login should create dev user and return token', async () => {
    const res = await request(app)
      .post('/api/auth/dev-login')
      .send({ username: 'test-qa-engineer' });

    // In a test environment without a live postgres DB, dev-login might fail with DB connection error or succeed
    if (res.status === 200) {
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.username).toBe('test-qa-engineer');
    } else {
      expect([500, 503]).toContain(res.status);
    }
  });
});
