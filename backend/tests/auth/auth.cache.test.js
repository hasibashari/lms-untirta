/**
 * Auth Middleware — Redis Cache Unit Tests
 *
 * Uses jest.unstable_mockModule to mock Redis and Prisma so we can
 * verify the caching logic inside authenticateToken() without
 * requiring a live Redis instance.
 *
 * What we test:
 *   ✓ Cache miss → DB lookup → caches result in Redis
 *   ✓ Cache hit → skips DB lookup entirely
 *   ✓ Redis unavailable → falls back to DB gracefully
 *   ✓ Redis read error → falls back to DB gracefully
 *   ✓ Redis write error → user still returned (fire-and-forget cache)
 *   ✓ Invalid/expired token → 401
 *   ✓ Missing token → 401
 *   ✓ User deleted from DB → 401
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ── Mocks (must be declared before dynamic import) ──────────

const mockRedisGet = jest.fn();
const mockRedisSet = jest.fn();
const mockRedisClient = {
  isOpen: true,
  get: mockRedisGet,
  set: mockRedisSet,
};

const mockFindUnique = jest.fn();
const mockPrisma = {
  user: { findUnique: mockFindUnique },
};

jest.unstable_mockModule('../../src/config/redis.js', () => ({
  default: mockRedisClient,
}));

jest.unstable_mockModule('../../src/config/prisma.js', () => ({
  default: mockPrisma,
}));

jest.unstable_mockModule('../../src/config/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// ── Import after mocks ──────────────────────────────────────

const { authenticateToken } = await import('../../src/middlewares/auth.middleware.js');
const jwt = (await import('jsonwebtoken')).default;

// ── Test Data ───────────────────────────────────────────────

const TEST_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';

const fakeUser = {
  id: 'user-001',
  email: 'test@test.com',
  name: 'Test User',
  role: 'MAHASISWA',
  isDospem: false,
  advisorId: null,
};

function makeToken(userId = fakeUser.id) {
  return jwt.sign({ userId }, TEST_SECRET, { expiresIn: '1h' });
}

function mockReqRes(token) {
  const req = {
    headers: token
      ? { authorization: `Bearer ${token}` }
      : {},
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

// ═════════════════════════════════════════════════════════════
// Tests
// ═════════════════════════════════════════════════════════════

describe('authenticateToken — Redis cache behaviour', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisClient.isOpen = true;
  });

  // ─── Cache Miss Flow ───────────────────────────────────

  it('should query DB on cache miss and cache the result', async () => {
    mockRedisGet.mockResolvedValue(null);          // cache miss
    mockFindUnique.mockResolvedValue(fakeUser);    // DB returns user
    mockRedisSet.mockResolvedValue('OK');

    const token = makeToken();
    const { req, res, next } = mockReqRes(token);
    await authenticateToken(req, res, next);

    // DB should have been queried
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: fakeUser.id },
      select: expect.objectContaining({ id: true, email: true, role: true }),
    });

    // Result should be cached
    expect(mockRedisSet).toHaveBeenCalledWith(
      `user:${fakeUser.id}`,
      JSON.stringify(fakeUser),
      { EX: 300 },
    );

    // Middleware should proceed
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(fakeUser);
  });

  // ─── Cache Hit Flow ────────────────────────────────────

  it('should skip DB query when cache hits', async () => {
    mockRedisGet.mockResolvedValue(JSON.stringify(fakeUser)); // cache hit

    const token = makeToken();
    const { req, res, next } = mockReqRes(token);
    await authenticateToken(req, res, next);

    // DB should NOT be called
    expect(mockFindUnique).not.toHaveBeenCalled();

    // Cache write should NOT happen (already cached)
    expect(mockRedisSet).not.toHaveBeenCalled();

    // Middleware should proceed with cached user
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(fakeUser);
  });

  // ─── Redis Down — Falls Back to DB ─────────────────────

  it('should fall back to DB when Redis is not open', async () => {
    mockRedisClient.isOpen = false;
    mockFindUnique.mockResolvedValue(fakeUser);

    const token = makeToken();
    const { req, res, next } = mockReqRes(token);
    await authenticateToken(req, res, next);

    // Redis should not be touched at all
    expect(mockRedisGet).not.toHaveBeenCalled();

    // DB should be queried
    expect(mockFindUnique).toHaveBeenCalled();

    // Still proceeds
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(fakeUser);
  });

  it('should fall back to DB when Redis read throws', async () => {
    mockRedisGet.mockRejectedValue(new Error('ECONNREFUSED'));
    mockFindUnique.mockResolvedValue(fakeUser);
    mockRedisSet.mockResolvedValue('OK');

    const token = makeToken();
    const { req, res, next } = mockReqRes(token);
    await authenticateToken(req, res, next);

    // DB should be queried as fallback
    expect(mockFindUnique).toHaveBeenCalled();

    // Middleware should still proceed
    expect(next).toHaveBeenCalled();
  });

  // ─── Redis Write Error — Fire-and-Forget ───────────────

  it('should still return user when Redis write fails', async () => {
    mockRedisGet.mockResolvedValue(null);          // cache miss
    mockFindUnique.mockResolvedValue(fakeUser);    // DB found
    mockRedisSet.mockRejectedValue(new Error('ECONNREFUSED'));

    const token = makeToken();
    const { req, res, next } = mockReqRes(token);
    await authenticateToken(req, res, next);

    // User is returned despite cache write failure
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(fakeUser);
  });

  // ─── Token Errors ─────────────────────────────────────

  it('should return 401 when no token provided', async () => {
    const { req, res, next } = mockReqRes(null);
    await authenticateToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 401 when token is invalid', async () => {
    const { req, res, next } = mockReqRes('invalid.jwt.token');
    await authenticateToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 401 when token is expired', async () => {
    const expired = jwt.sign({ userId: fakeUser.id }, TEST_SECRET, { expiresIn: '-1s' });
    const { req, res, next } = mockReqRes(expired);
    await authenticateToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  // ─── User Deleted ─────────────────────────────────────

  it('should return 401 when user not found in DB (cache miss)', async () => {
    mockRedisGet.mockResolvedValue(null);
    mockFindUnique.mockResolvedValue(null); // user deleted

    const token = makeToken();
    const { req, res, next } = mockReqRes(token);
    await authenticateToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);

    // Should NOT cache a null user
    expect(mockRedisSet).not.toHaveBeenCalled();
  });
});
