import jwt from 'jsonwebtoken';
import 'dotenv/config';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const MIN_JWT_SECRET_LENGTH = 64;

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('Missing required environment variable: JWT_SECRET');
  }

  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `Invalid JWT_SECRET: minimum length is ${MIN_JWT_SECRET_LENGTH} characters`,
    );
  }

  return secret;
};

export const validateJwtConfig = () => {
  getJwtSecret();
};

export const generateToken = (payload) => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};
