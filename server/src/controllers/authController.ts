import type { Request, Response, CookieOptions } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { generateToken } from '../services/tokenService.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { env } from '../config/env.js';


// Helper function to send token in HttpOnly cookie
const sendTokenResponse = (user: any, statusCode: number, res: Response) => {
  const token = generateToken(user.id);

  const options: CookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', 
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  };

  res
    .status(statusCode)
    .cookie('accessguard_token', token, options)
    .json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
};

// @route POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ success: false, error: 'Email already in use' });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, provider: 'LOCAL' },
    });

    sendTokenResponse(user, 201, res);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    sendTokenResponse(user, 200, res);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.user.update({
      where: { email },
      data: { resetPasswordToken, resetPasswordExpire },
    });

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(user.email, resetUrl);

    res.status(200).json({ success: true, message: 'Email sent' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body;
  const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken,
        resetPasswordExpire: { gt: new Date() },
      },
    });

    if (!user) {
      res.status(400).json({ success: false, error: 'Invalid or expired token' });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpire: null,
      },
    });

    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route GET /api/auth/oauth/callback
export const oauthCallback = (req: Request, res: Response): void => {
  const user = req.user as any;
  if (!user) {
    res.redirect(`${env.FRONTEND_URL}/login?error=OAuthFailed`);
    return;
  }

  const token = generateToken(user.id);
  const options: CookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  };

  res
    .cookie('accessguard_token', token, options)
    .redirect(`${env.FRONTEND_URL}/dashboard`);
};

// @route GET /api/auth/me
// Depends on protect middleware
export const getMe = async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user;
  const token = req.cookies.accessguard_token || req.headers.authorization?.split(' ')[1];
  
  if (!user) {
    res.status(401).json({ success: false, error: 'User not found' });
    return;
  }

  res.status(200).json({
    success: true,
    token, // Send back token to hydrate frontend localStorage if needed
    user: { id: user.id, name: user.name, email: user.email, provider: user.provider },
  });
};