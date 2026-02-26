/**
 * User Fixtures
 *
 * Static data factories for User-related tests.
 *
 * Convention:
 *   - `valid*` — data that should pass validation
 *   - `invalid*` — data that should fail validation
 *   - Functions return new objects each call to prevent cross-test mutation
 */

// ─── Valid Payloads ──────────────────────────────────────────

export const validAdmin = (overrides = {}) => ({
  email: 'admin@test.com',
  password: 'password123',
  name: 'Admin Test',
  role: 'ADMIN',
  ...overrides,
});

export const validDosen = (overrides = {}) => ({
  email: 'dosen@test.com',
  password: 'password123',
  name: 'Dr. Budi Santoso',
  role: 'DOSEN',
  ...overrides,
});

export const validMahasiswa = (overrides = {}) => ({
  email: 'mahasiswa@test.com',
  password: 'password123',
  name: 'Andi Pratama',
  role: 'MAHASISWA',
  ...overrides,
});

/**
 * Generate a unique user payload (prevents email collisions in integration tests).
 */
export const uniqueUser = (role = 'MAHASISWA', overrides = {}) => ({
  email: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`,
  password: 'password123',
  name: `Test ${role.charAt(0) + role.slice(1).toLowerCase()}`,
  role,
  ...overrides,
});

// ─── Invalid Payloads ────────────────────────────────────────

export const invalidUserNoEmail = () => ({
  password: 'password123',
  name: 'No Email User',
  role: 'ADMIN',
});

export const invalidUserShortPassword = () => ({
  email: 'short@test.com',
  password: '123', // min 8
  name: 'Short Password',
  role: 'ADMIN',
});

export const invalidUserBadRole = () => ({
  email: 'badrole@test.com',
  password: 'password123',
  name: 'Bad Role',
  role: 'SUPERADMIN', // not in enum
});

export const invalidUserShortName = () => ({
  email: 'shortname@test.com',
  password: 'password123',
  name: 'AB', // min 3
  role: 'ADMIN',
});
