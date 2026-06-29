import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: '7d', // 7 days for production convenience, can be shorter
  });
};