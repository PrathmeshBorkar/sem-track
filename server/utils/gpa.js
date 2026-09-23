/**
 * Strict >= thresholds for Grade Points (no rounding before mapping):
 * >= 90 -> 10 (O)
 * >= 80 -> 9 (A+)
 * >= 70 -> 8 (A)
 * >= 60 -> 7 (B+)
 * >= 50 -> 6 (B)
 * >= 40 -> 5 (C)
 * < 40  -> 0 (F)
 */
export function mapPercentageToGradePoint(percentage) {
    if (typeof percentage !== 'number' || isNaN(percentage)) return 0;
    if (percentage >= 90) return 10;
    if (percentage >= 80) return 9;
    if (percentage >= 70) return 8;
    if (percentage >= 60) return 7;
    if (percentage >= 50) return 6;
    if (percentage >= 40) return 5;
    return 0;
}

export function computeSubjectStats(subject, assumedScores = {}) {
    const markingScheme = subject.markingScheme || [];
    let isComplete = markingScheme.length > 0;
    let totalMax = 0;
    let totalObtained = 0;
    let gradedMax = 0;
    let gradedObtained = 0;
    let anyGraded = false;

    const components = markingScheme.map((comp) => {
        const hasActual = comp.obtainedMarks !== null && comp.obtainedMarks !== undefined;
        const assumed = assumedScores[comp.name];
        const hasAssumed = typeof assumed === 'number';

        const effectiveMark = hasActual ? comp.obtainedMarks : hasAssumed ? assumed : null;

        totalMax += comp.maxMarks;
        if (effectiveMark !== null) {
            totalObtained += effectiveMark;
            gradedMax += comp.maxMarks;
            gradedObtained += effectiveMark;
            anyGraded = true;
        } else {
            isComplete = false;
        }

        return {
            name: comp.name,
            maxMarks: comp.maxMarks,
            obtainedMarks: comp.obtainedMarks,
            assumedMarks: hasAssumed ? assumed : null,
        };
    });

    const percentage = isComplete && totalMax > 0 ? (totalObtained / totalMax) * 100 : null;
    const percentageSoFar = anyGraded && gradedMax > 0 ? (gradedObtained / gradedMax) * 100 : null;
    const gradePoint = isComplete && percentage !== null ? mapPercentageToGradePoint(percentage) : null;

    return {
        _id: subject._id,
        name: subject.name,
        code: subject.code || '',
        type: subject.type,
        credits: subject.credits,
        complete: isComplete,
        percentage: percentage !== null ? Number(percentage.toFixed(2)) : null,
        percentageSoFar: percentageSoFar !== null ? Number(percentageSoFar.toFixed(2)) : null,
        gradePoint,
        components,
        markingScheme: components,
    };
}

export function calculateSGPA(subjectStatsList) {
    const completeSubjects = subjectStatsList.filter(
        (s) => s.complete && typeof s.gradePoint === 'number' && s.credits > 0
    );

    if (completeSubjects.length === 0) return null;

    const totalCredits = completeSubjects.reduce((acc, s) => acc + s.credits, 0);
    if (totalCredits === 0) return null;

    const weightedSum = completeSubjects.reduce((acc, s) => acc + s.credits * s.gradePoint, 0);
    return Number((weightedSum / totalCredits).toFixed(2));
}

export function validateAssumedMarks(subjects, assumedMarksMap) {
    if (!assumedMarksMap || typeof assumedMarksMap !== 'object') {
        throw new Error('assumedMarks must be an object mapping subjectId to component scores');
    }

    const subjectMap = new Map(subjects.map((s) => [s._id.toString(), s]));

    for (const [subjectId, compScores] of Object.entries(assumedMarksMap)) {
        const subject = subjectMap.get(subjectId);
        if (!subject) {
            throw new Error(`Subject with ID "${subjectId}" not found`);
        }
        if (!compScores || typeof compScores !== 'object') {
            throw new Error(`assumed marks for "${subject.name}" must be an object`);
        }

        const validComponents = new Map((subject.markingScheme || []).map((c) => [c.name, c.maxMarks]));

        for (const [compName, score] of Object.entries(compScores)) {
            if (!validComponents.has(compName)) {
                throw new Error(`Unknown component "${compName}" for subject "${subject.name}"`);
            }
            const maxMarks = validComponents.get(compName);
            if (typeof score !== 'number' || isNaN(score) || score < 0 || score > maxMarks) {
                throw new Error(
                    `Assumed mark for "${compName}" in "${subject.name}" must be between 0 and ${maxMarks}`
                );
            }
        }
    }
}
