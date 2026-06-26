import express from 'express';
import cors from 'cors';
import { join } from 'path';
import urlRoutes from './routes/urlRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint (used by frontend to verify backend is alive)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.use('/api', urlRoutes);
app.use('/reports', express.static(join(process.cwd(), 'public', 'reports')));

export default app;
