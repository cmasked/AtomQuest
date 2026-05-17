import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import apiRoutes from './routes/index';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    // Always allow localhost
    if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    
    // Allow the specific frontend URL from environment variable
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return callback(null, true);
    
    // Allow any vercel deployment (bulletproof for hackathons)
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
}));
app.use(express.json());
app.use(morgan(':method :url :status :response-time ms'));

// ─── Health check ───────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ─── API Routes ─────────────────────────────────────────────
app.use('/api', apiRoutes);

// ─── Global Error Handler ───────────────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 AtomQuest backend running on port ${PORT}`);
});

export default app;
