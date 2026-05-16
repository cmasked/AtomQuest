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
    // Allow requests from any localhost port (dev) or the production Vercel URL
    const allowedPatterns = [
      /^http:\/\/localhost:\d+$/,
      /^https:\/\/atomquest\.vercel\.app$/,
    ];
    if (!origin || allowedPatterns.some(p => p.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
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
