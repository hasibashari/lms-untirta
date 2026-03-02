import app from './app.js';
import { initRedis, closeRedis } from './config/redis.js';
import logger from './config/logger.js';

const PORT = process.env.PORT || 3000;

// -- API --

/**
 * Health check endpoint.
 * Returns a simple welcome message to confirm the server is reachable.
 */
app.get('/', (req, res) => {
  res.send('Welcome to the server LMS Informatika API');
});

/**
 * Bootstrap: connect Redis → start HTTP server.
 * If Redis is unavailable the process exits so orchestrators can restart it.
 */
const start = async () => {
  try {
    await initRedis();
  } catch {
    logger.fatal('Failed to connect to Redis — aborting startup');
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    logger.info(`Server running at http://localhost:${PORT}`);
  });

  // ── Graceful shutdown ────────────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await closeRedis();
      process.exit(0);
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      logger.error('Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

start();
