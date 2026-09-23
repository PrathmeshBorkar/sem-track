import { Router } from 'express';
import Subject from '../models/Subject.js';
import Deadline from '../models/Deadline.js';
import { requireAuth } from '../middleware/auth.js';
import { validateObjectId, isValidUrl } from '../middleware/validate.js';
import { computeSubjectStats } from '../utils/gpa.js';

const router = Router();
router.use(requireAuth);

const VALID_TYPES = ['theory', 'lab'];
const RESOURCE_TYPES = ['notes', 'link', 'project', 'file'];

// GET /api/subjects
router.get('/', async (req, res, next) => {
    try {
        const subjects = await Subject.find({ userId: req.userId }).sort({ name: 1 });
        const data = subjects.map((s) => ({
            ...s.toObject(),
            stats: computeSubjectStats(s),
        }));
        res.json(data);
    } catch (err) {
        next(err);
    }
});

// POST /api/subjects
router.post('/', async (req, res, next) => {
    try {
        const { name, code, type, credits, markingScheme, resources } = req.body ?? {};

        if (typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ error: 'Subject name is required' });
        }
        if (!VALID_TYPES.includes(type)) {
            return res.status(400).json({ error: 'Type must be "theory" or "lab"' });
        }
        if (typeof credits !== 'number' || credits < 0) {
            return res.status(400).json({ error: 'Credits must be a non-negative number' });
        }

        const cleanMarkingScheme = [];
        if (Array.isArray(markingScheme)) {
            for (const c of markingScheme) {
                if (typeof c.name !== 'string' || typeof c.maxMarks !== 'number' || c.maxMarks < 0) {
                    return res.status(400).json({ error: 'Invalid marking scheme component' });
                }
                const obtained = typeof c.obtainedMarks === 'number' && c.obtainedMarks >= 0 ? c.obtainedMarks : null;
                cleanMarkingScheme.push({
                    name: c.name.trim(),
                    maxMarks: c.maxMarks,
                    obtainedMarks: obtained,
                });
            }
        }

        const cleanResources = [];
        if (Array.isArray(resources)) {
            for (const r of resources) {
                if (!r.title || !RESOURCE_TYPES.includes(r.type) || !isValidUrl(r.url)) {
                    return res.status(400).json({ error: 'Invalid resource (title, valid type, and http/https URL required)' });
                }
                cleanResources.push({
                    title: r.title.trim(),
                    type: r.type,
                    url: r.url.trim(),
                    description: typeof r.description === 'string' ? r.description.trim() : '',
                });
            }
        }

        const subject = await Subject.create({
            userId: req.userId,
            name: name.trim(),
            code: typeof code === 'string' ? code.trim() : '',
            type,
            credits,
            markingScheme: cleanMarkingScheme,
            resources: cleanResources,
        });

        res.status(201).json({
            ...subject.toObject(),
            stats: computeSubjectStats(subject),
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: 'A subject with this name already exists' });
        }
        next(err);
    }
});

// GET /api/subjects/:id
router.get('/:id', validateObjectId('id'), async (req, res, next) => {
    try {
        const subject = await Subject.findOne({ _id: req.params.id, userId: req.userId });
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }
        res.json({
            ...subject.toObject(),
            stats: computeSubjectStats(subject),
        });
    } catch (err) {
        next(err);
    }
});

// PUT /api/subjects/:id - strictly whitelisted fields
router.put('/:id', validateObjectId('id'), async (req, res, next) => {
    try {
        const subject = await Subject.findOne({ _id: req.params.id, userId: req.userId });
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        const { name, code, type, credits, markingScheme, resources } = req.body ?? {};

        if (name !== undefined) {
            if (typeof name !== 'string' || !name.trim()) {
                return res.status(400).json({ error: 'Subject name cannot be empty' });
            }
            subject.name = name.trim();
        }

        if (code !== undefined) {
            subject.code = typeof code === 'string' ? code.trim() : '';
        }

        if (type !== undefined) {
            if (!VALID_TYPES.includes(type)) {
                return res.status(400).json({ error: 'Type must be "theory" or "lab"' });
            }
            subject.type = type;
        }

        if (credits !== undefined) {
            if (typeof credits !== 'number' || credits < 0) {
                return res.status(400).json({ error: 'Credits must be a non-negative number' });
            }
            subject.credits = credits;
        }

        if (markingScheme !== undefined) {
            if (!Array.isArray(markingScheme)) {
                return res.status(400).json({ error: 'markingScheme must be an array' });
            }
            const clean = [];
            for (const c of markingScheme) {
                if (typeof c.name !== 'string' || typeof c.maxMarks !== 'number' || c.maxMarks < 0) {
                    return res.status(400).json({ error: 'Invalid marking scheme component' });
                }
                const obtained = typeof c.obtainedMarks === 'number' && c.obtainedMarks >= 0 ? c.obtainedMarks : null;
                clean.push({
                    name: c.name.trim(),
                    maxMarks: c.maxMarks,
                    obtainedMarks: obtained,
                });
            }
            subject.markingScheme = clean;
        }

        if (resources !== undefined) {
            if (!Array.isArray(resources)) {
                return res.status(400).json({ error: 'resources must be an array' });
            }
            const clean = [];
            for (const r of resources) {
                if (!r.title || !RESOURCE_TYPES.includes(r.type) || !isValidUrl(r.url)) {
                    return res.status(400).json({ error: 'Invalid resource (title, valid type, and http/https URL required)' });
                }
                clean.push({
                    title: r.title.trim(),
                    type: r.type,
                    url: r.url.trim(),
                    description: typeof r.description === 'string' ? r.description.trim() : '',
                });
            }
            subject.resources = clean;
        }

        await subject.save();
        res.json({
            ...subject.toObject(),
            stats: computeSubjectStats(subject),
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: 'A subject with this name already exists' });
        }
        next(err);
    }
});

// DELETE /api/subjects/:id
router.delete('/:id', validateObjectId('id'), async (req, res, next) => {
    try {
        const subject = await Subject.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        // Explicit cascading delete
        await Deadline.deleteMany({ subjectId: req.params.id, userId: req.userId });

        res.json({ ok: true, message: 'Subject and associated deadlines deleted' });
    } catch (err) {
        next(err);
    }
});

export default router;
