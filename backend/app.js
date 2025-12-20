import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './router/authRoutes.js';
import courseRoutes from './router/courseRoutes.js';
import userRoutes from './router/userRoutes.js';
import assignmentRoutes from './router/assignmentRoutes.js';
import materialRoutes from './router/materialRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// -- MIDDLEWARE --
app.use(cors());
app.use(express.json()); // Wajib! Agar bisa baca JSON body

// Logging sederhana (Middleware)
// Setiap request yang masuk akan dicatat di console
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next(); // Lanjut ke proses berikutnya (Route Handler)
});

// -- API --
app.get('/', (req, res) => {
  res.send('Welcome to the LMS Informatika API');
});

// -- MOUNT ROUTES --
app.use('/api/auth', authRoutes); // Login/Register
app.use('/api/courses', courseRoutes); // Kelas
app.use('/api/users', userRoutes); // User Management (Admin Only)
app.use('/api/assignments', assignmentRoutes); // Assignment Routes
app.use('/api/materials', materialRoutes); // Material Routes (Detail)

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
