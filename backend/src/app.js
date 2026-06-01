// File: backend/src/app.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import multer from 'multer';
import { sendError } from './utils/response.js';
import logger from './config/logger.js';
import { authenticateToken } from './middlewares/auth.middleware.js';
import authRoutes from './modules/auth/auth.routes.js';
import courseRoutes from './modules/course/course.routes.js';
import userRoutes from './modules/user/user.routes.js';
import assignmentRoutes from './modules/assignment/assignment.routes.js';
import submissionRoutes from './modules/submission/submission.routes.js';
import materialRoutes from './modules/material/material.routes.js';
import classRoutes from './modules/class/class.routes.js';
import krsRoutes from './modules/krs/krs.routes.js';
import transcriptRoutes from './modules/transcript/transcript.routes.js';
import academicSemesterRoutes from './modules/academic/academic.routes.js';
import gradeRoutes from './modules/grade/grade.routes.js';

import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './config/swagger.js'

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Beritahu Express bahwa aplikasi berada di belakang reverse proxy (mis. Nginx / Cloudflare)
// agar req.protocol, req.secure, dan redirect otomatis menggunakan skema asli (HTTPS jika relevan)
app.set('trust proxy', true);

// -- MIDDLEWARE --
// Header keamanan dasar (mis. HSTS, XSS Protection)
// HSTS dinonaktifkan: jika aktif, browser akan cache redirect ke HTTPS
// sehingga semua request HTTP otomatis di-redirect ke HTTPS oleh browser.
// Aktifkan HSTS hanya jika aplikasi sudah berjalan di belakang HTTPS/SSL.
// Catatan: Lewati global helmet untuk rute Swagger (/docs) agar header CSP tidak bertabrakan.
// Catatan Tambahan: Nonaktifkan 'upgrade-insecure-requests' agar browser tidak memaksa HTTP ke HTTPS secara otomatis.
app.use((req, res, next) => {
  if (req.path.startsWith('/docs')) {
    return next();
  }
  helmet({
    hsts: false,
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'upgrade-insecure-requests': null,
      },
    },
  })(req, res, next);
});

// Logging terstruktur untuk setiap request (abaikan root '/')
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/' } }));

// CORS — baca daftar origin yang diizinkan dari env, fallback untuk dev lokal dan produksi
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'https://lms-untirta.my.id',
      'http://lms-untirta.my.id'
    ];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Parsing body JSON
app.use(express.json());

// Akses file statis di /uploads dilindungi oleh JWT
app.use('/uploads', authenticateToken, express.static(path.join(__dirname, '..', 'public', 'uploads')));

// Swagger: JSON spec dan UI untuk dokumentasi API
// Catatan: Nonaktifkan CSP secara spesifik pada rute Swagger agar browser mengizinkan inline scripts/styles bawaan Swagger UI.
app.get('/docs.json', (_req, res) => res.json(swaggerSpec))
app.use(
  '/docs',
  helmet({
    contentSecurityPolicy: false,
    hsts: false,
  }),
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
)

import chatRoutes from './modules/chatbot/chat.routes.js';
import { forumRouter } from './modules/forum/forum.routes.js';

// -- PASANG ROUTE UTAMA --
app.use('/api/auth', authRoutes); // Otentikasi: login / register
app.use('/api/courses', courseRoutes); // Manajemen mata kuliah / kelas
app.use('/api/users', userRoutes); // Manajemen pengguna (biasanya admin)
app.use('/api/submissions', submissionRoutes); // Pengiriman tugas/berkas
app.use('/api/assignments', assignmentRoutes); // Tugas (create/list/update)
app.use('/api/materials', materialRoutes); // Materi per mata kuliah
app.use('/api/classes', classRoutes); // Penawaran kelas / jadwal
app.use('/api/krs', krsRoutes); // Pengelolaan KRS
app.use('/api/transcript', transcriptRoutes); // Transkrip / riwayat nilai
app.use('/api/academic-semesters', academicSemesterRoutes); // Semester akademik
app.use('/api/grades', gradeRoutes); // Pengelolaan nilai akhir
app.use('/api/chat', chatRoutes); // API chatbot
app.use('/api/forum', forumRouter); // Forum thread-level (detail, reply, pin)

// -- GLOBAL ERROR HANDLER --
// Handler error global: menangani error upload, error aplikasi, dan error tak terduga
app.use((err, _req, res, _next) => {
  // Error dari multer (upload file)
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: 'Ukuran file melebihi batas maksimum (5 MB)',
      LIMIT_UNEXPECTED_FILE: 'Field file tidak sesuai',
      LIMIT_FILE_COUNT: 'Jumlah file melebihi batas',
    };
    return sendError(res, {
      statusCode: 400,
      message: messages[err.code] || `Upload error: ${err.message}`,
    });
  }

  // Error aplikasi terspesialisasi yang sudah memiliki statusCode
  if (err.statusCode) {
    return sendError(res, {
      statusCode: err.statusCode,
      message: err.message,
      code: err.code || undefined,
      details: err.details || undefined,
    });
  }

  // Error tak terduga — log untuk investigasi, kembalikan 500 ke client
  logger.error({ err }, 'Unhandled error in global handler');
  return sendError(res, { statusCode: 500, message: 'Internal Server Error' });
});

export default app;