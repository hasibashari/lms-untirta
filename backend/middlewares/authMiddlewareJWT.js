// middlewares/authMiddlewareJWT.js
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js'; // Pastikan prisma sudah dikonfigurasi dengan benar

const authenticateToken = async (req, res, next) => {
  // 1. Ambil token dari header Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }

  try {
    // 2. Verifikasi token menggunakan jwt.verify
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. (Opsional tapi Recommended) Cek apakah user masih aktif di DB
    // Strategi User Context: Kita "suntikkan" data user ke object `req`.
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }, // Jangan ambil password!
    });

    if (!user) {
      return res.status(401).json({ message: 'User tidak ditemukan' });
    }

    // INI KUNCINYA: Sekarang di controller selanjutnya, kita bisa akses req.user
    req.user = user;
    next(); // Lanjut ke controller
  } catch (err) {
    console.error(err);
    return res.status(403).json({ message: 'Token tidak valid atau kadaluwarsa.' });
  }
};

// Authorization
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    // 1. Cek apakah user ada (Defensive programming)
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' }); // Belum login
    }

    // 2. Cek apakah role user termasuk dalam allowedRoles
    if (!allowedRoles.includes(req.user.role)) {
      // 403 Forbidden = Kamu login, tapi levelmu tidak cukup
      return res.status(403).json({
        message: 'Akses Ditolak: Anda tidak memiliki izin untuk akses ini.',
      });
    }
    next(); // Lanjut ke controller
  };
};

export { authenticateToken, authorizeRole };
