import * as authService from '../services/authService.js';

// Register controller
const register = async (req, res) => {
  try {
    const userData = req.body; // Data sudah divalidasi oleh Zod sebelumnya
    const result = await authService.registerUser(userData);

    res.status(201).json({
      message: 'Registrasi berhasil',
      data: result,
    });
  } catch (err) {
    console.error(err);
    // Menangani error spesifik dari service (misal email duplikat)
    if (err.message === 'Email sudah terdaftar') {
      return res.status(409).json({ message: err.message });
    }
    res.status(500).json({
      message: 'Internal Server Error',
      error: err.message,
    });
  }
};

// Login controller
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });

    res.status(200).json({
      message: 'Login berhasil',
      data: result,
    });
  } catch (err) {
    console.error(err);
    if (err.message === 'Email atau password salah') {
      return res.status(401).json({ message: err.message });
    }
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// getMe Controller
const getMe = async (req, res) => {
  try {
    const userId = req.user.id; // Dari middleware JWT
    const userData = await authService.getUserById(userId);
    res.status(200).json({
      message: 'Berhasil mengambil data user',
      data: userData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { register, login, getMe };
