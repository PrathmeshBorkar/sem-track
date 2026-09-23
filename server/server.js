import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import subjectRoutes from './routes/subjects.js';
import deadlineRoutes from './routes/deadlines.js';
import gpaRoutes from './routes/gpa.js';
import smartAddRoutes from './routes/smartAdd.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('FATAL: JWT_SECRET environment variable is missing or shorter than 32 characters.');
    process.exit(1);
}

const app = express();

// Enable trust proxy so rate limiters see real client IPs behind reverse proxies (Render, Vercel)
app.set('trust proxy', 1);

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/deadlines', deadlineRoutes);
app.use('/api/gpa', gpaRoutes);
app.use('/api/smart-add', smartAddRoutes);

// Unknown /api/* routes must return a JSON 404, never falling through to index.html
app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Primary unified deployment: Serve static frontend when SERVE_STATIC === 'true'
if (process.env.SERVE_STATIC === 'true') {
    const distPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../client/dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

// central error handler
app.use((err, _req, res, _next) => {
    if (err.name === 'ValidationError') return res.status(400).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 5000;

try {
    mongoose.set('sanitizeFilter', true);
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sem-track');
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
} catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
}