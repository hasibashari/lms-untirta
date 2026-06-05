// File: backend/src/server.js
import app from './app.js';
import { initRedis, closeRedis } from './config/redis.js';
import logger from './config/logger.js';
import { startGrpcServer } from './grpc/server.js';

// Port server (fallback ke 3000 jika tidak diset di env)
const PORT = process.env.PORT || 3000;

// Route root sederhana untuk quick health-check / pesan sambutan
app.get('/', (req, res) => {
  res.send('Welcome to the server LMS Informatika API');
});


const start = async () => {
  // Inisialisasi koneksi Redis; jika gagal maka hentikan proses
  try {
    await initRedis();
  } catch {
    logger.fatal('Failed to connect to Redis — aborting startup');
    process.exit(1);
  }

  // Jalankan HTTP server Express
  const server = app.listen(PORT, () => {
    logger.info(`Server running at http://localhost:${PORT}`);
  });

  // Mulai gRPC server (aplikasi gRPC berjalan terpisah)
  const grpcServer = startGrpcServer();

  // Fungsi shutdown untuk menutup server dan menutup koneksi Redis
  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);

    server.close(() => {
      logger.info('HTTP server closed');

      grpcServer.tryShutdown(async () => {
        logger.info('gRPC server closed');

        // Tutup koneksi Redis sebelum keluar
        await closeRedis();
        process.exit(0);
      });
    });

    // Jika shutdown lambat, paksa keluar setelah timeout
    setTimeout(() => {
      logger.error('Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, 10_000);
  };

  // Tangani sinyal OS untuk shutdown yang rapi
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

// Mulai aplikasi
start();
