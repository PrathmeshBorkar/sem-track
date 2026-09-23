import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

import authRoutes from '../routes/auth.js';
import subjectRoutes from '../routes/subjects.js';
import deadlineRoutes from '../routes/deadlines.js';
import gpaRoutes from '../routes/gpa.js';
import smartAddRoutes from '../routes/smartAdd.js';

import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Deadline from '../models/Deadline.js';

describe('SemTrack Integration & Security Tests', () => {
    let server;
    let baseUrl;
    let userAToken;
    let userBToken;
    let userAId;
    let userBId;
    let userASubjectId;

    before(async () => {
        process.env.JWT_SECRET = 'db599ce53cf57140ebf662be4acc3bae3e3dbf54a5c5d8f699f89fdbe75977dcff6933bb2719ffbef6ea1c4effc4845d';
        await mongoose.connect('mongodb://127.0.0.1:27017/sem-track');
        mongoose.set('sanitizeFilter', true);

        // Clean collections
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
        app.use('/api/smart-add', smartAddRoutes);

        app.use((err, _req, res, _next) => {
            if (err.name === 'ValidationError') return res.status(400).json({ error: err.message });
            res.status(500).json({ error: err.message || 'Server error' });
        });

        await new Promise((resolve) => {
            server = app.listen(0, () => {
                const port = server.address().port;
                baseUrl = `http://localhost:${port}`;
                resolve();
            });
        });
    });

    after(async () => {
        if (server) await new Promise((resolve) => server.close(resolve));
        await mongoose.disconnect();
    });

    test('Auth: Register User A and User B with password length checks', async () => {
        // Password too short (< 8)
        const shortRes = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Short', email: 'short@example.com', password: 'short' }),
        });
        assert.equal(shortRes.status, 400);

        // Register User A
        const regARes = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Alice', email: 'alice@example.com', password: 'Password123!' }),
        });
        assert.equal(regARes.status, 201);
        const dataA = await regARes.json();
        userAToken = dataA.token;
        userAId = dataA.user.id;
        assert.ok(userAToken);

        // Register User B
        const regBRes = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Bob', email: 'bob@example.com', password: 'Password123!' }),
        });
        assert.equal(regBRes.status, 201);
        const dataB = await regBRes.json();
        userBToken = dataB.token;
        userBId = dataB.user.id;
        assert.ok(userBToken);
    });

    test('Auth: Reject NoSQL operator injection in login', async () => {
        const injectRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: { $ne: null }, password: 'Password123!' }),
        });
        assert.equal(injectRes.status, 400);
        const data = await injectRes.json();
        assert.equal(data.error, 'Invalid input format');
    });

    test('Auth: Generic error message on invalid credentials', async () => {
        // Non-existent email
        const noUserRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'ghost@example.com', password: 'Password123!' }),
        });
        assert.equal(noUserRes.status, 401);
        assert.equal((await noUserRes.json()).error, 'Invalid email or password');

        // Wrong password
        const wrongPwRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'alice@example.com', password: 'WrongPassword999' }),
        });
        assert.equal(wrongPwRes.status, 401);
        assert.equal((await wrongPwRes.json()).error, 'Invalid email or password');
    });

    test('Auth: /api/auth/me returns current user profile with token', async () => {
        const meRes = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { Authorization: `Bearer ${userAToken}` },
        });
        assert.equal(meRes.status, 200);
        const data = await meRes.json();
        assert.equal(data.user.email, 'alice@example.com');
    });

    test('Subjects: User A creates a subject with marking scheme', async () => {
        const res = await fetch(`${baseUrl}/api/subjects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userAToken}`,
            },
            body: JSON.stringify({
                name: 'DBMS',
                code: 'CS301',
                type: 'theory',
                credits: 4,
                markingScheme: [
                    { name: 'CCA1', maxMarks: 15, obtainedMarks: 14 },
                    { name: 'Midsem', maxMarks: 30, obtainedMarks: 27 },
                    { name: 'CCA2', maxMarks: 15, obtainedMarks: 13 },
                    { name: 'Endsem', maxMarks: 40, obtainedMarks: null },
                ],
            }),
        });
        assert.equal(res.status, 201);
        const data = await res.json();
        userASubjectId = data._id;
        assert.ok(userASubjectId);
        assert.equal(data.stats.complete, false);
        assert.equal(data.stats.percentageSoFar, 90); // (14+27+13)/(15+30+15) = 54/60 = 90%
    });

    test('Security: Unauthenticated request gets 401', async () => {
        const res = await fetch(`${baseUrl}/api/subjects`);
        assert.equal(res.status, 401);
    });

    test('Security: Cross-user isolation (User B gets 404 on User A subject)', async () => {
        // GET
        const getRes = await fetch(`${baseUrl}/api/subjects/${userASubjectId}`, {
            headers: { Authorization: `Bearer ${userBToken}` },
        });
        assert.equal(getRes.status, 404);

        // PUT
        const putRes = await fetch(`${baseUrl}/api/subjects/${userASubjectId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userBToken}`,
            },
            body: JSON.stringify({ name: 'Hacked By Bob' }),
        });
        assert.equal(putRes.status, 404);

        // DELETE
        const delRes = await fetch(`${baseUrl}/api/subjects/${userASubjectId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${userBToken}` },
        });
        assert.equal(delRes.status, 404);
    });

    test('Security: Field whitelisting prevents reassigning userId in PUT', async () => {
        const res = await fetch(`${baseUrl}/api/subjects/${userASubjectId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userAToken}`,
            },
            body: JSON.stringify({
                userId: userBId, // Attempt to reassign owner
                name: 'DBMS Renamed',
            }),
        });
        assert.equal(res.status, 200);

        // Verify doc still belongs to User A in database
        const doc = await Subject.findById(userASubjectId);
        assert.equal(doc.userId.toString(), userAId);
        assert.equal(doc.name, 'DBMS Renamed');
    });

    test('Security: Invalid ObjectId returns 400 instead of 500', async () => {
        const res = await fetch(`${baseUrl}/api/subjects/invalid-id-123`, {
            headers: { Authorization: `Bearer ${userAToken}` },
        });
        assert.equal(res.status, 400);
        const data = await res.json();
        assert.equal(data.error, 'Invalid id format');
    });

    test('Security: URL validation rejects javascript: links in resources and deadlines', async () => {
        // In subject resources
        const xssSubjectRes = await fetch(`${baseUrl}/api/subjects/${userASubjectId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userAToken}`,
            },
            body: JSON.stringify({
                resources: [{ title: 'XSS', type: 'link', url: 'javascript:alert(1)' }],
            }),
        });
        assert.equal(xssSubjectRes.status, 400);

        // In deadline link
        const xssDeadlineRes = await fetch(`${baseUrl}/api/deadlines`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userAToken}`,
            },
            body: JSON.stringify({
                title: 'Project XSS',
                subjectId: userASubjectId,
                dueDate: new Date(),
                link: 'javascript:alert(1)',
            }),
        });
        assert.equal(xssDeadlineRes.status, 400);
    });

    test('Deadlines: User B cannot create deadline for User A subject (404)', async () => {
        const res = await fetch(`${baseUrl}/api/deadlines`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userBToken}`,
            },
            body: JSON.stringify({
                title: 'Malicious Deadline',
                subjectId: userASubjectId,
                dueDate: new Date(),
            }),
        });
        assert.equal(res.status, 404);
        assert.equal((await res.json()).error, 'Subject not found');
    });

    test('Deadlines & Cascading Deletes: Deleting subject deletes its deadlines', async () => {
        // User A creates deadline for DBMS
        const createRes = await fetch(`${baseUrl}/api/deadlines`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userAToken}`,
            },
            body: JSON.stringify({
                title: 'DBMS Submission 1',
                subjectId: userASubjectId,
                dueDate: new Date(),
                type: 'assignment',
            }),
        });
        assert.equal(createRes.status, 201);
        const deadline = await createRes.json();

        // Verify deadline exists
        const countBefore = await Deadline.countDocuments({ subjectId: userASubjectId });
        assert.equal(countBefore, 1);

        // Delete subject
        const delRes = await fetch(`${baseUrl}/api/subjects/${userASubjectId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${userAToken}` },
        });
        assert.equal(delRes.status, 200);

        // Verify deadline is cascade deleted
        const countAfter = await Deadline.countDocuments({ subjectId: userASubjectId });
        assert.equal(countAfter, 0);
    });

    test('Smart Add: Scoped to logged in user & duplicates are gracefully skipped', async () => {
        const parseRes = await fetch(`${baseUrl}/api/smart-add/parse`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userAToken}`,
            },
            body: JSON.stringify({
                text: 'Add Operating Systems (CS302) theory, 3 credits\nMarking: CCA1/15, Midsem/30, CCA2/15, Endsem/40\nDeadline: OS Lab 1 for Operating Systems on 28 Oct',
            }),
        });
        assert.equal(parseRes.status, 200);
        const parsed = await parseRes.json();

        // Apply first time
        const apply1Res = await fetch(`${baseUrl}/api/smart-add/apply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userAToken}`,
            },
            body: JSON.stringify(parsed),
        });
        assert.equal(apply1Res.status, 201);
        const applied1 = await apply1Res.json();
        assert.equal(applied1.createdSubjects, 1);
        assert.equal(applied1.createdDeadlines, 1);

        // Verify subject and deadline belong to User A
        const createdSubj = await Subject.findOne({ name: 'Operating Systems', userId: userAId });
        assert.ok(createdSubj);
        const createdDead = await Deadline.findOne({ title: 'OS Lab 1', userId: userAId });
        assert.ok(createdDead);

        // Apply second time (re-running exact same command) -> no crash, duplicate handled
        const apply2Res = await fetch(`${baseUrl}/api/smart-add/apply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userAToken}`,
            },
            body: JSON.stringify(parsed),
        });
        assert.equal(apply2Res.status, 201);
        const applied2 = await apply2Res.json();
        // Since existing subject was found, it updated without duplicating
        const count = await Subject.countDocuments({ name: 'Operating Systems', userId: userAId });
        assert.equal(count, 1);
    });

    test('GPA: End-to-end current and projected calculation via HTTP API', async () => {
        // Complete the marks for Operating Systems: 15, 30, 15, 40 -> 100% -> GP 10 (3 credits)
        const subj = await Subject.findOne({ name: 'Operating Systems', userId: userAId });
        await fetch(`${baseUrl}/api/subjects/${subj._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userAToken}`,
            },
            body: JSON.stringify({
                markingScheme: [
                    { name: 'CCA1', maxMarks: 15, obtainedMarks: 15 },
                    { name: 'Midsem', maxMarks: 30, obtainedMarks: 30 },
                    { name: 'CCA2', maxMarks: 15, obtainedMarks: 15 },
                    { name: 'Endsem', maxMarks: 40, obtainedMarks: 40 },
                ],
            }),
        });

        // Add a second subject with incomplete marks (WT Lab: LCA1 20/25, LCA2 20/25, LCA3 ?/50) (2 credits)
        const labRes = await fetch(`${baseUrl}/api/subjects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userAToken}`,
            },
            body: JSON.stringify({
                name: 'WT Lab',
                type: 'lab',
                credits: 2,
                markingScheme: [
                    { name: 'LCA1', maxMarks: 25, obtainedMarks: 20 },
                    { name: 'LCA2', maxMarks: 25, obtainedMarks: 20 },
                    { name: 'LCA3', maxMarks: 50, obtainedMarks: null }, // incomplete
                ],
            }),
        });
        const labData = await labRes.json();

        // GET /api/gpa -> Current SGPA should only count completed Operating Systems (GP 10 -> SGPA 10)
        const gpaRes = await fetch(`${baseUrl}/api/gpa`, {
            headers: { Authorization: `Bearer ${userAToken}` },
        });
        assert.equal(gpaRes.status, 200);
        const gpaData = await gpaRes.json();
        assert.equal(gpaData.currentSGPA, 10);
        assert.equal(gpaData.completedCredits, 3);
        assert.equal(gpaData.totalCredits, 5);

        // POST /api/gpa/project with assumed LCA3 mark of 40 (total 80/100 -> 80% -> GP 9)
        // Projected SGPA = (3*10 + 2*9) / 5 = 48 / 5 = 9.6
        const projRes = await fetch(`${baseUrl}/api/gpa/project`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userAToken}`,
            },
            body: JSON.stringify({
                assumedMarks: {
                    [labData._id]: { LCA3: 40 },
                },
            }),
        });
        assert.equal(projRes.status, 200);
        const projData = await projRes.json();
        assert.equal(projData.currentSGPA, 10);
        assert.equal(projData.projectedSGPA, 9.6);
        assert.equal(projData.projectedCompletedCredits, 5);
    });
});
