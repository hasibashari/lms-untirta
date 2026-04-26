/**
 * Request Helper for Integration Tests
 *
 * Wraps supertest with the Express app instance.
 * Provides a pre-configured agent for making HTTP requests.
 *
 * Usage:
 *   import { getApp } from '../helpers/request.js';
 *   const app = getApp();
 *   const res = await request(app).get('/api/users');
 */

import app from '../../src/app.js';

/**
 * Returns the Express app for use with supertest.
 * The app is imported once — Express apps are stateless between requests,
 * so sharing a single instance is safe.
 */
export function getApp() {
  return app;
}
