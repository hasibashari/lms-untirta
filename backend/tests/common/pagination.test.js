import { describe, it, expect } from '@jest/globals';
import { paginate } from '../../src/utils/pagination.js';

describe('paginate()', () => {
  // ─── Default behaviour ──────────────────────────────────────

  it('should return defaults when query is empty', () => {
    const { skip, take, meta } = paginate({});

    expect(skip).toBe(0);
    expect(take).toBe(20);

    const m = meta(0);
    expect(m).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 });
  });

  it('should respect custom defaultLimit', () => {
    const { take } = paginate({}, { defaultLimit: 10 });
    expect(take).toBe(10);
  });

  // ─── Page clamping ──────────────────────────────────────────

  it('should clamp page=0 to 1', () => {
    const { skip, meta } = paginate({ page: '0' });

    expect(skip).toBe(0);
    expect(meta(100).page).toBe(1);
  });

  it('should clamp negative page to 1', () => {
    const { skip, meta } = paginate({ page: '-5' });

    expect(skip).toBe(0);
    expect(meta(100).page).toBe(1);
  });

  it('should treat non-numeric page as 1', () => {
    const { skip, meta } = paginate({ page: 'abc' });

    expect(skip).toBe(0);
    expect(meta(50).page).toBe(1);
  });

  // ─── Limit clamping ────────────────────────────────────────

  it('should clamp limit above maxLimit to maxLimit (default 100)', () => {
    const { take } = paginate({ limit: '999' });
    expect(take).toBe(100);
  });

  it('should fallback limit=0 to defaultLimit (0 is falsy)', () => {
    const { take } = paginate({ limit: '0' });
    expect(take).toBe(20); // parseInt('0') === 0, falsy → uses defaultLimit
  });

  it('should clamp negative limit to 1', () => {
    const { take } = paginate({ limit: '-10' });
    expect(take).toBe(1);
  });

  it('should treat non-numeric limit as defaultLimit', () => {
    const { take } = paginate({ limit: 'xyz' });
    expect(take).toBe(20);
  });

  it('should respect custom maxLimit', () => {
    const { take } = paginate({ limit: '50' }, { maxLimit: 30 });
    expect(take).toBe(30);
  });

  // ─── Skip calculation ──────────────────────────────────────

  it('should calculate skip correctly for page > 1', () => {
    const { skip } = paginate({ page: '3', limit: '10' });
    expect(skip).toBe(20); // (3-1)*10
  });

  it('should calculate skip correctly for large page', () => {
    const { skip } = paginate({ page: '100', limit: '50' });
    expect(skip).toBe(4950); // (100-1)*50
  });

  // ─── Meta accuracy ─────────────────────────────────────────

  it('should compute totalPages correctly when total is exact multiple', () => {
    const m = paginate({ limit: '10' }).meta(50);
    expect(m.totalPages).toBe(5);
  });

  it('should compute totalPages correctly when total is not exact multiple', () => {
    const m = paginate({ limit: '10' }).meta(51);
    expect(m.totalPages).toBe(6);
  });

  it('should return totalPages=0 when total is 0', () => {
    const m = paginate({ limit: '10' }).meta(0);
    expect(m.totalPages).toBe(0);
  });

  it('should return totalPages=1 when total equals limit', () => {
    const m = paginate({ limit: '25' }).meta(25);
    expect(m.totalPages).toBe(1);
  });

  it('should return totalPages=1 when total is 1', () => {
    const m = paginate({ limit: '20' }).meta(1);
    expect(m.totalPages).toBe(1);
  });

  // ─── Page beyond data ──────────────────────────────────────

  it('should allow page beyond totalPages (returns empty data from Prisma)', () => {
    const { skip, take, meta } = paginate({ page: '999', limit: '20' });

    expect(skip).toBe(19960);
    expect(take).toBe(20);

    const m = meta(50);
    expect(m.page).toBe(999);
    expect(m.totalPages).toBe(3);
    // Prisma would return [] for skip > total — that's by design
  });

  // ─── Integer coercion edge cases ───────────────────────────

  it('should handle float page by truncating to integer', () => {
    const { meta } = paginate({ page: '2.9' });
    expect(meta(100).page).toBe(2);
  });

  it('should handle float limit by truncating to integer', () => {
    const { take } = paginate({ limit: '15.7' });
    expect(take).toBe(15);
  });
});
