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

// -- MIDDLEWARE --
// Security headers
app.use(helmet());

// Structured request logging
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/' } }));

// CORS — read allowed origins from env, fall back to localhost for dev
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parser untuk JSON
app.use(express.json());

// Protected static file access — requires valid JWT
app.use('/uploads', authenticateToken, express.static(path.join(__dirname, '..', 'public', 'uploads')));

// Swagger UI & JSON spec for Postman import
app.get('/docs.json', (_req, res) => res.json(swaggerSpec))
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

import chatRoutes from './modules/chatbot/chat.routes.js';
import { forumRouter } from './modules/forum/forum.routes.js';

// -- MOUNT ROUTES --
app.use('/api/auth', authRoutes); // Login/Register
app.use('/api/courses', courseRoutes); // Kelas
app.use('/api/users', userRoutes); // User Management (Admin Only)
app.use('/api/submissions', submissionRoutes); // Submission Routes
app.use('/api/assignments', assignmentRoutes); // Assignment Routes
app.use('/api/materials', materialRoutes); // Material Routes (Detail)
app.use('/api/classes', classRoutes); // Class Offering Routes
app.use('/api/krs', krsRoutes); // KRS (Kartu Rencana Studi)
app.use('/api/transcript', transcriptRoutes); // Transcript (Hasil Studi)
app.use('/api/academic-semesters', academicSemesterRoutes); // Academic Semester Management
app.use('/api/grades', gradeRoutes); // Final Grade Management
app.use('/api/chat', chatRoutes); // Chatbot API
app.use('/api/forum', forumRouter); // Forum Routes (Thread & Reply)

// -- GLOBAL ERROR HANDLER --
app.use((err, _req, res, _next) => {
  // Multer upload errors
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

  // AppError (known application errors with statusCode)
  if (err.statusCode) {
    return sendError(res, {
      statusCode: err.statusCode,
      message: err.message,
      code: err.code || undefined,
      details: err.details || undefined,
    });
  }

  // Unexpected errors
  logger.error({ err }, 'Unhandled error in global handler');
  return sendError(res, { statusCode: 500, message: 'Internal Server Error' });
});

export default app;