import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        req.userId = decoded.userId;
        next();
    } catch (_err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
