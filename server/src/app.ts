import express from 'express';
import cors from 'cors';
import { join } from 'path';
import urlRoutes from './routes/urlRoutes.js';
import authRoutes from './routes/authRoutes.js';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';
import projectRoutes from './routes/projectRoutes.js';
import repoRoutes from './routes/repoRoutes.js'

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true, // Crucial for cookies
}));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Health check endpoint (used by frontend to verify backend is alive)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.use('/api', urlRoutes);
app.use('/reports', express.static(join(process.cwd(), 'public', 'reports')));
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/repo',repoRoutes);


export default app;
