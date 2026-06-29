import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  service: 'Gmail', // or SendGrid, AWS SES in production
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS, // Use Google App Password here
  },
});

export const sendPasswordResetEmail = async (to: string, resetUrl: string) => {
  const mailOptions = {
    from: `"AccessGuard Security" <${env.EMAIL_USER}>`,
    to,
    subject: 'Password Reset Request',
    html: `
      <h2>AccessGuard Password Reset</h2>
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <a href="${resetUrl}" target="_blank">Reset Password</a>
      <p>If you did not request this, please ignore this email. This link expires in 15 minutes.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};