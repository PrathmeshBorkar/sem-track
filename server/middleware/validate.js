import mongoose from 'mongoose';

export function validateObjectId(paramName = 'id') {
    return (req, res, next) => {
        const id = req.params[paramName];
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: `Invalid ${paramName} format` });
        }
        next();
    };
}

export function isValidUrl(str) {
    if (typeof str !== 'string' || !str.trim()) return false;
    try {
        const parsed = new URL(str);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}
