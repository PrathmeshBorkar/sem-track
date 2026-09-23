import { mapPercentageToGradePoint } from './gpa.js';

const VALID_GRADE_POINTS = [0, 5, 6, 7, 8, 9, 10];

const GRADE_POINT_MIN_PERCENTAGE = {
    10: 90,
    9: 80,
    8: 70,
    7: 60,
    6: 50,
    5: 40,
    0: 0,
};

function snapToValidGradePoint(avgGP) {
    if (avgGP <= 0) return 0;
    for (const gp of VALID_GRADE_POINTS) {
        if (gp >= avgGP - 1e-9) return gp;
    }
    return 10;
}

export function calculateTargetSGPA(subjects = [], targetSGPA) {
    if (typeof targetSGPA !== 'number' || !isFinite(targetSGPA) || targetSGPA < 0 || targetSGPA > 10) {
        throw new Error('targetSGPA must be a number between 0 and 10');
    }

    // 1. Separate gradable from ungradable (empty marking scheme)
    const gradableSubjects = [];
    const ungradableSubjects = [];

    for (const s of subjects) {
        const scheme = s.markingScheme || [];
        if (scheme.length === 0) {
            ungradableSubjects.push({ _id: s._id, name: s.name });
        } else {
            gradableSubjects.push(s);
        }
    }

    if (gradableSubjects.length === 0) {
        return {
            achievable: false,
            message: 'No gradable subjects found (marking schemes are required)',
            ungradableSubjects,
        };
    }

    const totalCredits = gradableSubjects.reduce((acc, s) => acc + s.credits, 0);
    if (totalCredits === 0) {
        return {
            achievable: false,
            message: 'Total gradable credits must be greater than 0',
            ungradableSubjects,
        };
    }

    // 2. Classify into complete and incomplete
    const completedSubjects = [];
    const incompleteSubjects = [];

    for (const s of gradableSubjects) {
        let totalMax = 0;
        let obtainedSoFar = 0;
        let remainingMax = 0;
        let isComplete = true;

        for (const c of s.markingScheme) {
            totalMax += c.maxMarks;
            if (c.obtainedMarks !== null && c.obtainedMarks !== undefined) {
                obtainedSoFar += c.obtainedMarks;
            } else {
                remainingMax += c.maxMarks;
                isComplete = false;
            }
        }

        const percentage = isComplete && totalMax > 0 ? (obtainedSoFar / totalMax) * 100 : null;
        const gradePoint = isComplete && percentage !== null ? mapPercentageToGradePoint(percentage) : null;
        const maxPossiblePct = totalMax > 0 ? ((obtainedSoFar + remainingMax) / totalMax) * 100 : 0;
        const maxGradePoint = mapPercentageToGradePoint(maxPossiblePct);

        const info = {
            _id: s._id,
            name: s.name,
            credits: s.credits,
            totalMax,
            obtainedSoFar,
            remainingMax,
            isComplete,
            percentage,
            gradePoint,
            maxPossiblePct,
            maxGradePoint,
        };

        if (isComplete) {
            completedSubjects.push(info);
        } else {
            incompleteSubjects.push(info);
        }
    }

    const completedWeightedSum = completedSubjects.reduce((acc, s) => acc + s.credits * s.gradePoint, 0);
    const remainingCredits = incompleteSubjects.reduce((acc, s) => acc + s.credits, 0);

    // 3. If all subjects are already complete
    if (incompleteSubjects.length === 0) {
        const currentSGPA = Number((completedWeightedSum / totalCredits).toFixed(2));
        const achievable = currentSGPA >= targetSGPA - 1e-9;
        return {
            achievable,
            targetAlreadyMet: achievable,
            currentSGPA,
            maxPossibleSGPA: currentSGPA,
            requiredBreakdown: [],
            ungradableSubjects,
        };
    }

    // 4. Maximum achievable SGPA check
    const maxPossibleWeightedSum =
        completedWeightedSum + incompleteSubjects.reduce((acc, s) => acc + s.credits * s.maxGradePoint, 0);
    const maxPossibleSGPA = Number((maxPossibleWeightedSum / totalCredits).toFixed(2));

    if (targetSGPA > maxPossibleSGPA + 1e-9) {
        return {
            achievable: false,
            targetAlreadyMet: false,
            maxPossibleSGPA,
            message: `Target SGPA ${targetSGPA} exceeds maximum achievable SGPA of ${maxPossibleSGPA}`,
            ungradableSubjects,
        };
    }

    // 5. Target already secured check
    const neededAverageGP = (targetSGPA * totalCredits - completedWeightedSum) / remainingCredits;
    if (neededAverageGP <= 0) {
        return {
            achievable: true,
            targetAlreadyMet: true,
            maxPossibleSGPA,
            requiredBreakdown: incompleteSubjects.map((s) => ({
                subjectId: s._id,
                subjectName: s.name,
                credits: s.credits,
                targetGradePoint: 0,
                minPercentageNeeded: 0,
                obtainedSoFar: s.obtainedSoFar,
                remainingMax: s.remainingMax,
                requiredMarks: 0,
                alreadySecured: true,
            })),
            ungradableSubjects,
        };
    }

    // 6. Snap needed average GP up to valid grade point
    const targetGradePoint = snapToValidGradePoint(neededAverageGP);
    const minPct = GRADE_POINT_MIN_PERCENTAGE[targetGradePoint] ?? 0;

    const requiredBreakdown = incompleteSubjects.map((s) => {
        const canReachTarget = s.maxPossiblePct >= minPct - 1e-9;
        const assignedGP = canReachTarget ? targetGradePoint : s.maxGradePoint;
        const assignedMinPct = GRADE_POINT_MIN_PERCENTAGE[assignedGP] ?? 0;

        const rawRequired = Math.ceil((assignedMinPct / 100) * s.totalMax - s.obtainedSoFar);
        const requiredMarks = Math.max(0, rawRequired);
        const alreadySecured = requiredMarks === 0;

        return {
            subjectId: s._id,
            subjectName: s.name,
            credits: s.credits,
            targetGradePoint: assignedGP,
            minPercentageNeeded: assignedMinPct,
            obtainedSoFar: s.obtainedSoFar,
            remainingMax: s.remainingMax,
            requiredMarks,
            alreadySecured,
        };
    });

    return {
        achievable: true,
        targetAlreadyMet: false,
        maxPossibleSGPA,
        targetGradePoint,
        requiredBreakdown,
        ungradableSubjects,
    };
}
