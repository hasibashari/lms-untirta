import * as userService from '../services/userService.js';

// Controller untuk membuat user baru oleh Admin
const createUser = async (req, res) => {
  try {
    const newUser = await userService.createUserByAdmin(req.body);
    res.status(201).json({ message: 'User berhasil dibuat', data: newUser });
  } catch (err) {
    if (err.message === 'Email sudah terdaftar') {
      return res.status(409).json({ message: err.message });
    }
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;

    // Validasi role jika ada
    if (role && !['DOSEN', 'MAHASISWA', 'ADMIN'].includes(role)) {
      return res.status(400).json({
        message: 'Invalid role. Use DOSEN, MAHASISWA, or ADMIN',
      });
    }

    const users = await userService.getAllUsers(role);
    res.json({
      message: 'Success',
      data: users,
      count: users.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export { createUser, getAllUsers };
