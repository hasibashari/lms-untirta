import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

// Hash a plain text password
const hashPassword = async password => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

// Compare a plain text password with a hashed password
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export { hashPassword, comparePassword };
