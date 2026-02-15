import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes.js';
import courseRoutes from './modules/course/course.routes.js';
import userRoutes from './modules/user/user.routes.js';
import assignmentRoutes from './modules/assignment/assignment.routes.js';
import materialRoutes from './modules/material/material.routes.js';
import classRoutes from './modules/class/class.routes.js';
import krsRoutes from './modules/krs/krs.routes.js';
import transcriptRoutes from './modules/transcript/transcript.routes.js';

dotenv.config();

const app = express();

// -- MIDDLEWARE --
// Konfigurasi CORS untuk mengizinkan request dari frontend (Vite dev server)
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parser untuk JSON
app.use(express.json());

// Logging sederhana (Middleware)
// Setiap request yang masuk akan dicatat di console
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next(); // Lanjut ke proses berikutnya (Route Handler)
});


// -- MOUNT ROUTES --
app.use('/api/auth', authRoutes); // Login/Register
app.use('/api/courses', courseRoutes); // Kelas
app.use('/api/users', userRoutes); // User Management (Admin Only)
app.use('/api/assignments', assignmentRoutes); // Assignment Routes
app.use('/api/materials', materialRoutes); // Material Routes (Detail)
app.use('/api/classes', classRoutes); // Class Offering Routes
app.use('/api/krs', krsRoutes); // KRS (Kartu Rencana Studi)
app.use('/api/transcript', transcriptRoutes); // Transcript (Hasil Studi)

export default app;