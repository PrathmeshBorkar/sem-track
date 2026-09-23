import { Router } from 'express';
import { parseSmartAdd } from '../nlp/parser.js';
import Subject from '../models/Subject.js';
import Deadline from '../models/Deadline.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// POST /api/smart-add/parse   { text } -> { subjects, deadlines, warnings }
router.post('/parse', (req, res) => {
    const { text } = req.body ?? {};
    if (typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ error: 'text is required' });
    }
    res.json(parseSmartAdd(text));
});

// POST /api/smart-add/apply   { subjects, deadlines } -> creates documents
router.post('/apply', async (req, res, next) => {
    try {
        const { subjects = [], deadlines = [] } = req.body ?? {};
        if (!Array.isArray(subjects) || !Array.isArray(deadlines)) {
            return res.status(400).json({ error: 'subjects and deadlines must be arrays' });
        }

        const skipped = [];
        const idByName = new Map();
        let createdSubjects = 0;
        let createdDeadlines = 0;

        for (const s of subjects) {
            try {
                let doc = await Subject.findOne({ name: s.name, userId: req.userId })
                    .collation({ locale: 'en', strength: 2 });

                if (doc) {
                    if (s.code) doc.code = s.code;
                    if (s.type) doc.type = s.type;
                    if (s.credits != null) doc.credits = s.credits;
                    if (s.markingScheme?.length > 0) {
                        doc.markingScheme = s.markingScheme.map((c) => ({
                            name: c.name,
                            maxMarks: c.maxMarks,
                            obtainedMarks: null,
                        }));
                    }
                    await doc.save();
                } else {
                    doc = await Subject.create({
                        userId: req.userId,
                        name: s.name,
                        code: s.code || '',
                        type: s.type,
                        credits: s.credits,
                        markingScheme: (s.markingScheme ?? []).map((c) => ({
                            name: c.name,
                            maxMarks: c.maxMarks,
                            obtainedMarks: null,
                        })),
                    });
                    createdSubjects++;
                }
                idByName.set(doc.name.toLowerCase(), doc._id);
            } catch (err) {
                if (err.code === 11000) {
                    skipped.push(`Subject "${s.name}" already exists`);
                } else {
                    throw err;
                }
            }
        }

        for (const d of deadlines) {
            const key = String(d.subjectName ?? '').toLowerCase();
            let subjectId = idByName.get(key);
            if (!subjectId) {
                const existing = await Subject.findOne({
                    name: String(d.subjectName ?? ''),
                    userId: req.userId,
                }).collation({ locale: 'en', strength: 2 });
                subjectId = existing?._id;
            }
            if (!subjectId) {
                skipped.push(`No subject named "${d.subjectName}" for deadline "${d.title}"`);
                continue;
            }

            await Deadline.create({
                userId: req.userId,
                title: d.title,
                subjectId,
                dueDate: d.dueDate,
                type: d.type,
            });
            createdDeadlines++;
        }

        res.status(201).json({ createdSubjects, createdDeadlines, skipped });
    } catch (err) {
        next(err);
    }
});

export default router;