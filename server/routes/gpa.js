import { Router } from 'express';
import Subject from '../models/Subject.js';
import { requireAuth } from '../middleware/auth.js';
import {
    computeSubjectStats,
    calculateSGPA,
    validateAssumedMarks,
} from '../utils/gpa.js';
import { calculateTargetSGPA } from '../utils/targetGpa.js';

const router = Router();
router.use(requireAuth);

// GET /api/gpa - Current SGPA & stats
router.get('/', async (req, res, next) => {
    try {
        const subjects = await Subject.find({ userId: req.userId }).sort({ name: 1 });
        const stats = subjects.map((s) => computeSubjectStats(s));
        const currentSGPA = calculateSGPA(stats);
        const totalCredits = subjects.reduce((acc, s) => acc + s.credits, 0);
        const completedCredits = stats
            .filter((s) => s.complete)
            .reduce((acc, s) => acc + s.credits, 0);

        res.json({
            currentSGPA,
            totalCredits,
            completedCredits,
            subjects: stats,
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/gpa/project - Projected SGPA with assumed marks
router.post('/project', async (req, res, next) => {
    try {
        const { assumedMarks } = req.body ?? {};
        const subjects = await Subject.find({ userId: req.userId }).sort({ name: 1 });

        validateAssumedMarks(subjects, assumedMarks ?? {});

        const currentStats = subjects.map((s) => computeSubjectStats(s));
        const projectedStats = subjects.map((s) =>
            computeSubjectStats(s, assumedMarks?.[s._id.toString()] || {})
        );

        const currentSGPA = calculateSGPA(currentStats);
        const projectedSGPA = calculateSGPA(projectedStats);
        const totalCredits = subjects.reduce((acc, s) => acc + s.credits, 0);
        const projectedCompletedCredits = projectedStats
            .filter((s) => s.complete)
            .reduce((acc, s) => acc + s.credits, 0);

        res.json({
            currentSGPA,
            projectedSGPA,
            totalCredits,
            projectedCompletedCredits,
            subjects: projectedStats,
        });
    } catch (err) {
        if (err.message && (err.message.includes('must be between') || err.message.includes('Unknown component') || err.message.includes('not found') || err.message.includes('must be an object'))) {
            return res.status(400).json({ error: err.message });
        }
        next(err);
    }
});

// POST /api/gpa/target - Target SGPA calculator
router.post('/target', async (req, res, next) => {
    try {
        const { targetSGPA } = req.body ?? {};
        if (typeof targetSGPA !== 'number' || isNaN(targetSGPA)) {
            return res.status(400).json({ error: 'targetSGPA must be a valid number' });
        }

        const subjects = await Subject.find({ userId: req.userId }).sort({ name: 1 });
        const result = calculateTargetSGPA(subjects, targetSGPA);
        res.json(result);
    } catch (err) {
        if (err.message && err.message.includes('targetSGPA')) {
            return res.status(400).json({ error: err.message });
        }
        next(err);
    }
});

export default router;
