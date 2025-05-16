const request = require('supertest');
const app = require('../server');
const { pool } = require('../config/database');

describe('Auth Endpoints', () => {
  beforeEach(async () => {
    // Clean up users table
    await pool.query('DELETE FROM users');
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should not create duplicate user', async () => {
      // First signup
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      // Duplicate signup
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });
}); 