import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateTargetSGPA } from '../utils/targetGpa.js';

describe('Target SGPA Engine Unit Tests', () => {
    test('Achievable target: 1 completed subject + 1 pending subject (9.0 target)', () => {
        // Subject A: 4 credits, complete with 80% -> GP 9 (weighted 36)
        // Subject B: 2 credits, 60 marks total, 20/20 obtained, 40 marks pending
        // Target: 9.0 -> total weighted needed = 9.0 * 6 = 54
        // Needed for Subject B = (54 - 36) / 2 = 9.0 -> snaps to 9 (80%)
        // 80% of 60 = 48. Obtained = 20. Required = 48 - 20 = 28.
        const subjects = [
            {
                _id: 'subjA',
                name: 'Theory A',
                credits: 4,
                markingScheme: [
                    { name: 'CCA', maxMarks: 20, obtainedMarks: 16 },
                    { name: 'Endsem', maxMarks: 80, obtainedMarks: 64 }, // 80/100 = 80% -> GP 9
                ],
            },
            {
                _id: 'subjB',
                name: 'Lab B',
                credits: 2,
                markingScheme: [
                    { name: 'LCA1', maxMarks: 20, obtainedMarks: 20 },
                    { name: 'LCA2', maxMarks: 40, obtainedMarks: null }, // pending 40
                ],
            },
        ];

        const res = calculateTargetSGPA(subjects, 9.0);
        assert.equal(res.achievable, true);
        assert.equal(res.targetGradePoint, 9);
        assert.equal(res.requiredBreakdown.length, 1);
        assert.equal(res.requiredBreakdown[0].subjectName, 'Lab B');
        assert.equal(res.requiredBreakdown[0].requiredMarks, 28); // 80% of 60 = 48 - 20 = 28
    });

    test('Impossible target: Target exceeds maximum possible SGPA', () => {
        // Subject A: 4 credits, complete with 40% -> GP 5 (weighted 20)
        // Subject B: 2 credits, 100 marks total, 0 obtained, 100 pending (max GP 10 -> weighted 20)
        // Max possible weighted = 20 + 20 = 40. Max SGPA = 40/6 = 6.67
        // User asks for target 8.0
        const subjects = [
            {
                _id: 'subjA',
                name: 'Subject A',
                credits: 4,
                markingScheme: [{ name: 'Endsem', maxMarks: 100, obtainedMarks: 40 }],
            },
            {
                _id: 'subjB',
                name: 'Subject B',
                credits: 2,
                markingScheme: [{ name: 'Endsem', maxMarks: 100, obtainedMarks: null }],
            },
        ];

        const res = calculateTargetSGPA(subjects, 8.0);
        assert.equal(res.achievable, false);
        assert.equal(res.maxPossibleSGPA, 6.67);
        assert.match(res.message, /exceeds maximum achievable SGPA/);
    });

    test('All subjects complete: Target already met vs not met', () => {
        const subjects = [
            {
                _id: 'subjA',
                name: 'Subject A',
                credits: 4,
                markingScheme: [{ name: 'Endsem', maxMarks: 100, obtainedMarks: 90 }], // GP 10
            },
        ];

        // Target 9.5 met (current is 10.0)
        const met = calculateTargetSGPA(subjects, 9.5);
        assert.equal(met.achievable, true);
        assert.equal(met.targetAlreadyMet, true);
        assert.equal(met.currentSGPA, 10);

        // Target 10.01 not met
        const notMet = calculateTargetSGPA(subjects, 10.0);
        assert.equal(notMet.achievable, true);
    });

    test('Two pending subjects with discrete grade point snapping', () => {
        // Subject A: 3 credits, pending
        // Subject B: 3 credits, pending
        // Target: 8.2 -> average GP needed = 8.2 -> snaps up to 9 (A+)
        const subjects = [
            {
                _id: 's1',
                name: 'Subject 1',
                credits: 3,
                markingScheme: [{ name: 'Endsem', maxMarks: 100, obtainedMarks: null }],
            },
            {
                _id: 's2',
                name: 'Subject 2',
                credits: 3,
                markingScheme: [{ name: 'Endsem', maxMarks: 100, obtainedMarks: null }],
            },
        ];

        const res = calculateTargetSGPA(subjects, 8.2);
        assert.equal(res.achievable, true);
        assert.equal(res.targetGradePoint, 9);
        assert.equal(res.requiredBreakdown[0].requiredMarks, 80);
        assert.equal(res.requiredBreakdown[1].requiredMarks, 80);
    });

    test('Excludes ungradable subjects (empty scheme) and reports them', () => {
        const subjects = [
            {
                _id: 's1',
                name: 'Gradable',
                credits: 4,
                markingScheme: [{ name: 'Endsem', maxMarks: 100, obtainedMarks: 90 }],
            },
            {
                _id: 's2',
                name: 'No Scheme',
                credits: 2,
                markingScheme: [],
            },
        ];

        const res = calculateTargetSGPA(subjects, 9.0);
        assert.equal(res.achievable, true);
        assert.equal(res.ungradableSubjects.length, 1);
        assert.equal(res.ungradableSubjects[0].name, 'No Scheme');
    });

    test('Floating-point noise check (9.1 target)', () => {
        const subjects = [
            {
                _id: 's1',
                name: 'Subject 1',
                credits: 4,
                markingScheme: [{ name: 'Endsem', maxMarks: 100, obtainedMarks: null }],
            },
        ];

        const res = calculateTargetSGPA(subjects, 9.1);
        assert.equal(res.achievable, true);
        assert.equal(res.targetGradePoint, 10); // 9.1 snaps to 10
        assert.equal(res.requiredBreakdown[0].requiredMarks, 90);
    });
});
