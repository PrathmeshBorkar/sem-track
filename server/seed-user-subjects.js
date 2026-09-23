import mongoose from 'mongoose';
import Subject from './models/Subject.js';
import User from './models/User.js';

const SUBJECTS_DATA = [
    {
        name: 'ICS',
        type: 'theory',
        credits: 4,
        markingScheme: [
            { name: 'CCA1', maxMarks: 15, obtainedMarks: null },
            { name: 'Midsem', maxMarks: 30, obtainedMarks: null },
            { name: 'CCA2', maxMarks: 15, obtainedMarks: null },
            { name: 'Endsem', maxMarks: 40, obtainedMarks: null },
        ],
    },
    {
        name: 'IAM',
        type: 'theory',
        credits: 2,
        markingScheme: [
            { name: 'CCA1', maxMarks: 15, obtainedMarks: null },
            { name: 'Midsem', maxMarks: 30, obtainedMarks: null },
            { name: 'CCA2', maxMarks: 15, obtainedMarks: null },
            { name: 'Endsem', maxMarks: 40, obtainedMarks: null },
        ],
    },
    {
        name: 'SEPM',
        type: 'theory',
        credits: 2,
        markingScheme: [
            { name: 'CCA1', maxMarks: 15, obtainedMarks: null },
            { name: 'Midsem', maxMarks: 30, obtainedMarks: null },
            { name: 'CCA2', maxMarks: 15, obtainedMarks: null },
            { name: 'Endsem', maxMarks: 40, obtainedMarks: null },
        ],
    },
    {
        name: 'FSDL',
        type: 'lab',
        credits: 2,
        markingScheme: [
            { name: 'LCA1', maxMarks: 33, obtainedMarks: null },
            { name: 'LCA2', maxMarks: 33, obtainedMarks: null },
            { name: 'LCA3', maxMarks: 34, obtainedMarks: null },
        ],
    },
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sem-track');

        // Find the latest active user or fall back to any user
        const user = await User.findOne().sort({ createdAt: -1 });
        if (!user) {
            console.error('No user found in database. Please register an account first at http://localhost:5173/register');
            process.exit(1);
        }

        console.log(`Adding subjects for user: ${user.name} (${user.email})...`);

        for (const sub of SUBJECTS_DATA) {
            await Subject.findOneAndUpdate(
                { userId: user._id, name: sub.name },
                { ...sub, userId: user._id },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            console.log(`✓ Enrolled: ${sub.name} (${sub.type}, ${sub.credits} credits)`);
        }

        console.log('\nAll 4 subjects successfully enrolled in MongoDB!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding subjects:', err);
        process.exit(1);
    }
}

seed();
