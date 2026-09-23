import { Router } from 'express';
import mongoose from 'mongoose';
import Deadline from '../models/Deadline.js';
import Subject from '../models/Subject.js';
import { requireAuth } from '../middleware/auth.js';
import { validateObjectId, isValidUrl } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

const VALID_TYPES = ['assignment', 'lab', 'project', 'exam'];
const VALID_STATUSES = ['pending', 'in_progress', 'done'];

// GET /api/deadlines
router.get('/', async (req, res, next) => {
    try {
        const query = { userId: req.userId };

        if (req.query.subjectId) {
            if (!mongoose.isValidObjectId(req.query.subjectId)) {
                return res.status(400).json({ error: 'Invalid subjectId format' });
            }
            query.subjectId = req.query.subjectId;
        }

        if (req.query.status) {
            if (!VALID_STATUSES.includes(req.query.status)) {
                return res.status(400).json({ error: 'Invalid status filter' });
            }
            query.status = req.query.status;
        }

        const deadlines = await Deadline.find(query)
            .sort({ dueDate: 1 })
            .populate('subjectId', 'name code type');

        res.json(deadlines);
    } catch (err) {
        next(err);
    }
});

// POST /api/deadlines
router.post('/', async (req, res, next) => {
    try {
        const { title, subjectId, dueDate, type, status, notes, link } = req.body ?? {};

        if (typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }

        if (!mongoose.isValidObjectId(subjectId)) {
            return res.status(400).json({ error: 'Invalid subjectId format' });
        }

        // Verify subject belongs to user
        const subject = await Subject.findOne({ _id: subjectId, userId: req.userId });
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        const parsedDate = new Date(dueDate);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ error: 'Valid dueDate is required' });
        }

        const deadlineType = VALID_TYPES.includes(type) ? type : 'assignment';
        const deadlineStatus = VALID_STATUSES.includes(status) ? status : 'pending';

        if (link && !isValidUrl(link)) {
            return res.status(400).json({ error: 'Link must be a valid http:// or https:// URL' });
        }

        const deadline = await Deadline.create({
            userId: req.userId,
            title: title.trim(),
            subjectId,
            dueDate: parsedDate,
            type: deadlineType,
            status: deadlineStatus,
            notes: typeof notes === 'string' ? notes.trim() : '',
            link: typeof link === 'string' ? link.trim() : '',
        });

        const populated = await deadline.populate('subjectId', 'name code type');
        res.status(201).json(populated);
    } catch (err) {
        next(err);
    }
});

// PUT /api/deadlines/:id
router.put('/:id', validateObjectId('id'), async (req, res, next) => {
    try {
        const deadline = await Deadline.findOne({ _id: req.params.id, userId: req.userId });
        if (!deadline) {
            return res.status(404).json({ error: 'Deadline not found' });
        }

        const { title, subjectId, dueDate, type, status, notes, link } = req.body ?? {};

        if (title !== undefined) {
            if (typeof title !== 'string' || !title.trim()) {
                return res.status(400).json({ error: 'Title cannot be empty' });
            }
            deadline.title = title.trim();
        }

        if (subjectId !== undefined) {
            if (!mongoose.isValidObjectId(subjectId)) {
                return res.status(400).json({ error: 'Invalid subjectId format' });
            }
            const subject = await Subject.findOne({ _id: subjectId, userId: req.userId });
            if (!subject) {
                return res.status(404).json({ error: 'Subject not found' });
            }
            deadline.subjectId = subjectId;
        }

        if (dueDate !== undefined) {
            const parsedDate = new Date(dueDate);
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({ error: 'Invalid dueDate' });
            }
            deadline.dueDate = parsedDate;
        }

        if (type !== undefined) {
            if (!VALID_TYPES.includes(type)) {
                return res.status(400).json({ error: 'Invalid deadline type' });
            }
            deadline.type = type;
        }

        if (status !== undefined) {
            if (!VALID_STATUSES.includes(status)) {
                return res.status(400).json({ error: 'Invalid deadline status' });
            }
            deadline.status = status;
        }

        if (notes !== undefined) {
            deadline.notes = typeof notes === 'string' ? notes.trim() : '';
        }

        if (link !== undefined) {
            if (link && !isValidUrl(link)) {
                return res.status(400).json({ error: 'Link must be a valid http:// or https:// URL' });
            }
            deadline.link = typeof link === 'string' ? link.trim() : '';
        }

        await deadline.save();
        const populated = await deadline.populate('subjectId', 'name code type');
        res.json(populated);
    } catch (err) {
        next(err);
    }
});

// DELETE /api/deadlines/:id
router.delete('/:id', validateObjectId('id'), async (req, res, next) => {
    try {
        const deadline = await Deadline.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!deadline) {
            return res.status(404).json({ error: 'Deadline not found' });
        }
        res.json({ ok: true, message: 'Deadline deleted' });
    } catch (err) {
        next(err);
    }
});

export default router;
