const { pool } = require('../config/database');
const migrations = require('../migrations/001_initial_setup');

beforeAll(async () => {
  // Run migrations
  await migrations.up();
});

afterAll(async () => {
  // Clean up database
  await migrations.down();
  await pool.end();
}); 