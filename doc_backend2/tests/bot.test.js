const request = require('supertest');
const app = require('../server');
const botService = require('../services/botService');

describe('Bot Endpoints', () => {
  let authToken;

  beforeAll(async () => {
    // Create test user and get token
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'bot@test.com',
        password: 'password123'
      });
    authToken = res.body.token;
  });

  describe('GET /api/bot/status', () => {
    it('should return bot status', async () => {
      const res = await request(app)
        .get('/api/bot/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('isRunning');
      expect(res.body).toHaveProperty('metrics');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/bot/status');

      expect(res.statusCode).toBe(401);
    });
  });
}); 