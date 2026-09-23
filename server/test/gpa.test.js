import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    mapPercentageToGradePoint,
    computeSubjectStats,
    calculateSGPA,
    validateAssumedMarks,
} from '../utils/gpa.js';

describe('GPA Engine Unit Tests', () => {
    test('Strict >= grade point thresholds', () => {
        assert.equal(mapPercentageToGradePoint(100), 10);
        assert.equal(mapPercentageToGradePoint(90), 10);
        assert.equal(mapPercentageToGradePoint(89.99), 9, '89.99 must not round up to 90');
        assert.equal(mapPercentageToGradePoint(80), 9);
        assert.equal(mapPercentageToGradePoint(79.99), 8);
        assert.equal(mapPercentageToGradePoint(70), 8);
        assert.equal(mapPercentageToGradePoint(60), 7);
        assert.equal(mapPercentageToGradePoint(50), 6);
        assert.equal(mapPercentageToGradePoint(40), 5);
        assert.equal(mapPercentageToGradePoint(39.99), 0, '39.99 must be 0 (F)');
        assert.equal(mapPercentageToGradePoint(0), 0);
    });

    test('Incomplete subject is marked complete: false and does not drag SGPA down', () => {
        const subject = {
            _id: 'subj1',
            name: 'DBMS',
            type: 'theory',
            credits: 4,
            markingScheme: [
                { name: 'CCA1', maxMarks: 15, obtainedMarks: 14 },
                { name: 'Midsem', maxMarks: 30, obtainedMarks: null },
                { name: 'CCA2', maxMarks: 15, obtainedMarks: null },
                { name: 'Endsem', maxMarks: 40, obtainedMarks: null },
            ],
        };

        const stats = computeSubjectStats(subject);
        assert.equal(stats.complete, false);
        assert.equal(stats.percentage, null);
        assert.equal(stats.percentageSoFar, 93.33);
        assert.equal(stats.gradePoint, null);

        // calculateSGPA must return null because no subjects are complete
        assert.equal(calculateSGPA([stats]), null);
    });

    test('Calculates SGPA correctly for completed subjects (9.67 case)', () => {
        const subjectA = {
            _id: 'subjA',
            name: 'DBMS',
            type: 'theory',
            credits: 4,
            markingScheme: [
                { name: 'CCA1', maxMarks: 15, obtainedMarks: 14 },
                { name: 'Midsem', maxMarks: 30, obtainedMarks: 27 },
                { name: 'CCA2', maxMarks: 15, obtainedMarks: 13 },
                { name: 'Endsem', maxMarks: 40, obtainedMarks: 36 }, // 90 / 100 = 90% -> GP 10
            ],
        };

        const subjectB = {
            _id: 'subjB',
            name: 'WT Lab',
            type: 'lab',
            credits: 2,
            markingScheme: [
                { name: 'LCA1', maxMarks: 25, obtainedMarks: 20 },
                { name: 'LCA2', maxMarks: 25, obtainedMarks: 20 },
                { name: 'LCA3', maxMarks: 50, obtainedMarks: 40 }, // 80 / 100 = 80% -> GP 9
            ],
        };

        const statsA = computeSubjectStats(subjectA);
        const statsB = computeSubjectStats(subjectB);

        assert.equal(statsA.complete, true);
        assert.equal(statsA.percentage, 90);
        assert.equal(statsA.gradePoint, 10);

        assert.equal(statsB.complete, true);
        assert.equal(statsB.percentage, 80);
        assert.equal(statsB.gradePoint, 9);

        // SGPA = (4 * 10 + 2 * 9) / 6 = 58 / 6 = 9.6666... -> 9.67
        const sgpa = calculateSGPA([statsA, statsB]);
        assert.equal(sgpa, 9.67);
    });

    test('Projected SGPA fills pending marks from assumedMarks', () => {
        const subject = {
            _id: 'subj1',
            name: 'DBMS',
            type: 'theory',
            credits: 4,
            markingScheme: [
                { name: 'CCA1', maxMarks: 15, obtainedMarks: 14 },
                { name: 'Midsem', maxMarks: 30, obtainedMarks: 27 },
                { name: 'CCA2', maxMarks: 15, obtainedMarks: 13 },
                { name: 'Endsem', maxMarks: 40, obtainedMarks: null }, // incomplete
            ],
        };

        // Before assumed marks
        const before = computeSubjectStats(subject);
        assert.equal(before.complete, false);
        assert.equal(calculateSGPA([before]), null);

        // With assumed Endsem mark of 36 -> total 90/100 -> 90% -> GP 10
        const after = computeSubjectStats(subject, { Endsem: 36 });
        assert.equal(after.complete, true);
        assert.equal(after.percentage, 90);
        assert.equal(after.gradePoint, 10);
        assert.equal(calculateSGPA([after]), 10);
    });

    test('validateAssumedMarks rejects invalid marks or non-existent components', () => {
        const subjects = [
            {
                _id: 'subj1',
                name: 'DBMS',
                markingScheme: [{ name: 'Endsem', maxMarks: 40 }],
            },
        ];

        // Score exceeds maxMarks
        assert.throws(
            () => validateAssumedMarks(subjects, { subj1: { Endsem: 45 } }),
            /must be between 0 and 40/
        );

        // Score is negative
        assert.throws(
            () => validateAssumedMarks(subjects, { subj1: { Endsem: -5 } }),
            /must be between 0 and 40/
        );

        // Non-existent component
        assert.throws(
            () => validateAssumedMarks(subjects, { subj1: { CCA3: 10 } }),
            /Unknown component "CCA3"/
        );

        // Non-existent subject
        assert.throws(
            () => validateAssumedMarks(subjects, { fakeId: { Endsem: 30 } }),
            /not found/
        );
    });
});
