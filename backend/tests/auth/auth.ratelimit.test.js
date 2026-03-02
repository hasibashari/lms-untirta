/**
 * Auth Rate Limiting — Integration Tests
 *
 * Tests that the express-rate-limit middleware on auth routes
 * correctly blocks excessive requests.
 *
 * Config under test:
 *   windowMs: 15 * 60 * 1000 (15 minutes)
 *   max: 15 requests per window
 *   standardHeaders: true (RateLimit-* headers)
 *   legacyHeaders: false (no X-RateLimit-*)
 *
 * What we test:
 *   ✓ First 15 requests are not rate-limited (status != 429)
 *   ✓ 16th request returns 429 with correct message
 *   ✓ RateLimit-Limit and RateLimit-Remaining headers are present
 *   ✓ Rate limiter applies to both /login and /register
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { getApp } from '../helpers/request.js';
import { cleanDatabase } from '../helpers/db.js';

const app = getApp();

// ═════════════════════════════════════════════════════════════
// Rate Limiting Tests
// ═════════════════════════════════════════════════════════════

describe('Auth Rate Limiting', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  // ─── Login Rate Limit ──────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('should allow up to 15 requests, then return 429 on the 16th', async () => {
      const payload = { email: 'anyone@test.com', password: 'wrongpass123' };

      // Fire 15 requests — all should get through (400/401, but NOT 429)
      for (let i = 0; i < 15; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .send(payload);

        expect(res.status).not.toBe(429);
      }

      // 16th request should be rate-limited
      const blocked = await request(app)
        .post('/api/auth/login')
        .send(payload);

      expect(blocked.status).toBe(429);
      expect(blocked.body.success).toBe(false);
      expect(blocked.body.message).toMatch(/Terlalu banyak percobaan/i);
    });

    it('should return RateLimit-* standard headers', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'wrongpass123' });

      // standardHeaders: true sends these headers
      expect(res.headers).toHaveProperty('ratelimit-limit');
      expect(res.headers).toHaveProperty('ratelimit-remaining');

      // legacyHeaders: false means NO X-RateLimit-* headers
      expect(res.headers['x-ratelimit-limit']).toBeUndefined();
    });
  });

  // ─── Register Rate Limit ───────────────────────────────────

  describe('POST /api/auth/register', () => {
    it('should block registration after 15 attempts', async () => {
      // Exhaust the rate limit with 15 registration attempts
      for (let i = 0; i < 15; i++) {
        await request(app)
          .post('/api/auth/register')
          .send({
            email: `ratelimit-${i}@test.com`,
            password: 'password123',
            name: `User ${i}`,
          });
      }

      // 16th should be blocked
      const blocked = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'blocked@test.com',
          password: 'password123',
          name: 'Blocked User',
        });

      expect(blocked.status).toBe(429);
      expect(blocked.body.success).toBe(false);
      expect(blocked.body.message).toMatch(/Terlalu banyak percobaan/i);
    });
  });
});
