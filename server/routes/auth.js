import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15,
    message: { error: 'Too many authentication attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function createToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '7d',
        algorithm: 'HS256',
    });
}

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res, next) => {
    try {
        const { name, email, password } = req.body ?? {};

        if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100) {
            return res.status(400).json({ error: 'Name is required (1-100 characters)' });
        }

        if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return res.status(400).json({ error: 'Valid email is required' });
        }

        if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
            return res.status(400).json({ error: 'Password must be between 8 and 72 characters' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(400).json({ error: 'Email is already registered' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
        });

        const token = createToken(user._id);
        res.cookie('token', token, COOKIE_OPTIONS);

        res.status(201).json({
            user: { id: user._id, name: user.name, email: user.email },
            token,
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res, next) => {
    try {
        const { email, password } = req.body ?? {};

        // Type checks prevent NoSQL operator injection
        if (typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ error: 'Invalid input format' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = createToken(user._id);
        res.cookie('token', token, COOKIE_OPTIONS);

        res.json({
            user: { id: user._id, name: user.name, email: user.email },
            token,
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    });
    res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
    try {
        const user = await User.findById(req.userId).select('name email');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        next(err);
    }
});

export default router;
