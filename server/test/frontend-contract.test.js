import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

import authRoutes from '../routes/auth.js';
import subjectRoutes from '../routes/subjects.js';
import deadlineRoutes from '../routes/deadlines.js';
import gpaRoutes from '../routes/gpa.js';

import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Deadline from '../models/Deadline.js';

describe('Frontend-Backend Data Contract Tests', () => {
    let server;
    let baseUrl;
    let token;
    let userId;

    before(async () => {
        process.env.JWT_SECRET = 'db599ce53cf57140ebf662be4acc3bae3e3dbf54a5c5d8f699f89fdbe75977dcff6933bb2719ffbef6ea1c4effc4845d';
        await mongoose.connect('mongodb://127.0.0.1:27017/sem-track');
        mongoose.set('sanitizeFilter', true);

        await User.deleteMany({});
        await Subject.deleteMany({});
        await Deadline.deleteMany({});

        const app = express();
        app.use(cookieParser());
        app.use(express.json());

        app.use('/api/auth', authRoutes);
        app.use('/api/subjects', subjectRoutes);
        app.use('/api/deadlines', deadlineRoutes);
        app.use('/api/gpa', gpaRoutes);

        await new Promise((resolve) => {
            server = app.listen(0, () => {
                baseUrl = `http://localhost:${server.address().port}`;
                resolve();
            });
        });

        // Register user
        const regRes = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Charlie', email: 'charlie@example.com', password: 'Password123!' }),
        });
        const data = await regRes.json();
        token = data.token;
        userId = data.user.id;
    });

    after(async () => {
        if (server) await new Promise((resolve) => server.close(resolve));
        await mongoose.disconnect();
    });

    test('Data contract: Saving with Endsem blank preserves null and keeps subject incomplete', async () => {
        // Create subject
        const createRes = await fetch(`${baseUrl}/api/subjects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                name: 'DBMS',
                type: 'theory',
                credits: 4,
                markingScheme: [
                    { name: 'CCA1', maxMarks: 15, obtainedMarks: null },
                    { name: 'Midsem', maxMarks: 30, obtainedMarks: null },
                    { name: 'CCA2', maxMarks: 15, obtainedMarks: null },
                    { name: 'Endsem', maxMarks: 40, obtainedMarks: null },
                ],
            }),
        });
        const created = await createRes.json();
        const subjectId = created._id;

        // User enters marks in frontend table:
        // CCA1 = "14", Midsem = "27", CCA2 = "13", Endsem = "" (blank input)
        // Frontend logic: val === '' ? null : Number(val)
        const inputs = {
            CCA1: '14',
            Midsem: '27',
            CCA2: '13',
            Endsem: '', // blank
        };

        const updatedScheme = created.markingScheme.map((c) => ({
            name: c.name,
            maxMarks: c.maxMarks,
            obtainedMarks: inputs[c.name] === '' ? null : Number(inputs[c.name]),
        }));

        const putRes = await fetch(`${baseUrl}/api/subjects/${subjectId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ markingScheme: updatedScheme }),
        });
        assert.equal(putRes.status, 200);

        // Fetch subject back (simulating page reload)
        const getRes = await fetch(`${baseUrl}/api/subjects/${subjectId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        assert.equal(getRes.status, 200);
        const reloaded = await getRes.json();

        // Check marking scheme components
        const endsem = reloaded.markingScheme.find((c) => c.name === 'Endsem');
        assert.equal(endsem.obtainedMarks, null, 'Endsem obtainedMarks must be null, not 0');

        // Check subject status
        assert.equal(reloaded.stats.complete, false, 'Subject must remain incomplete');
        assert.equal(reloaded.stats.percentage, null, 'Percentage must be null');
        assert.equal(reloaded.stats.gradePoint, null, 'Grade point must be null');
        assert.equal(reloaded.stats.percentageSoFar, 90, 'Percentage so far must be 54/60 = 90%');
    });

    test('Data contract: Recovering subject with empty marking scheme', async () => {
        // Create subject without marking scheme (e.g. from Smart Add without Marking: line)
        const createRes = await fetch(`${baseUrl}/api/subjects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                name: 'Algorithms',
                type: 'theory',
                credits: 4,
                markingScheme: [],
            }),
        });
        const created = await createRes.json();
        assert.equal(created.markingScheme.length, 0);

        // Frontend clicks "Use default theory scheme" and saves
        const defaultTheoryScheme = [
            { name: 'CCA1', maxMarks: 15, obtainedMarks: null },
            { name: 'Midsem', maxMarks: 30, obtainedMarks: null },
            { name: 'CCA2', maxMarks: 15, obtainedMarks: null },
            { name: 'Endsem', maxMarks: 40, obtainedMarks: null },
        ];

        const putRes = await fetch(`${baseUrl}/api/subjects/${created._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ markingScheme: defaultTheoryScheme }),
        });
        assert.equal(putRes.status, 200);
        const updated = await putRes.json();
        assert.equal(updated.markingScheme.length, 4);
    });

    test('Data contract: EOD date serialization matches local calendar day', async () => {
        // Date input "2026-10-28" sent as "2026-10-28T23:59:59"
        const localEOD = new Date('2026-10-28T23:59:59');

        const subj = await Subject.findOne({ userId });
        const createRes = await fetch(`${baseUrl}/api/deadlines`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                title: 'Project Submission',
                subjectId: subj._id,
                dueDate: localEOD,
            }),
        });
        assert.equal(createRes.status, 201);
        const deadline = await createRes.json();
        const storedDate = new Date(deadline.dueDate);

        // Verify stored date matches local year, month, date, and hour
        assert.equal(storedDate.getFullYear(), 2026);
        assert.equal(storedDate.getMonth(), 9); // October is 9 (0-indexed)
        assert.equal(storedDate.getDate(), 28);
        assert.equal(storedDate.getHours(), 23);
        assert.equal(storedDate.getMinutes(), 59);
        assert.equal(storedDate.getSeconds(), 59);
    });
});
