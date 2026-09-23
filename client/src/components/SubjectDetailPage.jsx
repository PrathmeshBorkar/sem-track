import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api.js';

const DEFAULT_THEORY_SCHEME = [
    { name: 'CCA1', maxMarks: 15, obtainedMarks: null },
    { name: 'Midsem', maxMarks: 30, obtainedMarks: null },
    { name: 'CCA2', maxMarks: 15, obtainedMarks: null },
    { name: 'Endsem', maxMarks: 40, obtainedMarks: null },
];

const DEFAULT_LAB_SCHEME = [
    { name: 'LCA1', maxMarks: 25, obtainedMarks: null },
    { name: 'LCA2', maxMarks: 25, obtainedMarks: null },
    { name: 'LCA3', maxMarks: 50, obtainedMarks: null },
];

// Must match server/utils/gpa.js
function mapPercentageToGradePoint(percentage) {
    if (typeof percentage !== 'number' || isNaN(percentage)) return null;
    if (percentage >= 90) return 10;
    if (percentage >= 80) return 9;
    if (percentage >= 70) return 8;
    if (percentage >= 60) return 7;
    if (percentage >= 50) return 6;
    if (percentage >= 40) return 5;
    return 0;
}

function getGradeLabel(gradePoint) {
    if (gradePoint === 10) return '10.0 (O - Outstanding)';
    if (gradePoint === 9) return '9.0 (A+ - Excellent)';
    if (gradePoint === 8) return '8.0 (A - Very Good)';
    if (gradePoint === 7) return '7.0 (B+ - Good)';
    if (gradePoint === 6) return '6.0 (B - Above Avg)';
    if (gradePoint === 5) return '5.0 (C - Average)';
    if (gradePoint === 0) return '0.0 (F - Fail)';
    return '–';
}

function isSafeUrl(url) {
    if (typeof url !== 'string' || !url.trim()) return false;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

function getResourceIcon(type) {
    switch (type) {
        case 'notes': return 'description';
        case 'link': return 'link';
        case 'project': return 'terminal';
        case 'file': return 'folder_open';
        default: return 'attachment';
    }
}

export default function SubjectDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [subject, setSubject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Editable marking scheme local state
    const [markingScheme, setMarkingScheme] = useState([]);

    // Resources local state
    const [resources, setResources] = useState([]);
    const [newRes, setNewRes] = useState({ title: '', url: '', type: 'notes', description: '' });
    const [resError, setResError] = useState('');

    const loadSubject = async () => {
        try {
            setLoading(true);
            const data = await api.get(`/api/subjects/${id}`);
            setSubject(data);
            setMarkingScheme(data.markingScheme ? JSON.parse(JSON.stringify(data.markingScheme)) : []);
            setResources(data.resources ? JSON.parse(JSON.stringify(data.resources)) : []);
        } catch (err) {
            setError(err.message || 'Failed to load subject');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubject();
    }, [id]);

    const handleMarkChange = (index, field, value) => {
        setMarkingScheme((prev) => {
            const next = [...prev];
            if (field === 'obtainedMarks') {
                next[index] = {
                    ...next[index],
                    obtainedMarks: value === '' ? null : Number(value),
                };
            } else if (field === 'maxMarks') {
                next[index] = {
                    ...next[index],
                    maxMarks: value === '' ? 0 : Number(value),
                };
            } else {
                next[index] = {
                    ...next[index],
                    [field]: value,
                };
            }
            return next;
        });
    };

    const handleAddComponent = () => {
        setMarkingScheme((prev) => [
            ...prev,
            { name: `Component ${prev.length + 1}`, maxMarks: 20, obtainedMarks: null },
        ]);
    };

    const handleRemoveComponent = (index) => {
        setMarkingScheme((prev) => prev.filter((_, i) => i !== index));
    };

    const handleUseDefaultScheme = () => {
        const defaultScheme = subject?.type === 'lab' ? DEFAULT_LAB_SCHEME : DEFAULT_THEORY_SCHEME;
        setMarkingScheme(JSON.parse(JSON.stringify(defaultScheme)));
    };

    const handleSaveMarks = async () => {
        setSaving(true);
        setError('');
        setSuccessMessage('');

        for (const c of markingScheme) {
            if (!c.name || !c.name.trim()) {
                setError('All components must have a name');
                setSaving(false);
                return;
            }
            if (c.maxMarks <= 0) {
                setError(`Max marks for "${c.name}" must be greater than 0`);
                setSaving(false);
                return;
            }
            if (c.obtainedMarks !== null && c.obtainedMarks !== undefined) {
                if (c.obtainedMarks < 0 || c.obtainedMarks > c.maxMarks) {
                    setError(`Marks obtained for "${c.name}" must be between 0 and ${c.maxMarks}`);
                    setSaving(false);
                    return;
                }
            }
        }

        try {
            const updated = await api.put(`/api/subjects/${id}`, {
                name: subject.name,
                code: subject.code,
                type: subject.type,
                credits: subject.credits,
                markingScheme,
            });
            setSubject(updated);
            setMarkingScheme(updated.markingScheme ? JSON.parse(JSON.stringify(updated.markingScheme)) : []);
            setSuccessMessage('Assessment matrix saved successfully.');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.message || 'Failed to save marks');
        } finally {
            setSaving(false);
        }
    };

    const handleAddResource = async (e) => {
        e.preventDefault();
        setResError('');

        if (!isSafeUrl(newRes.url)) {
            setResError('Please provide a valid http:// or https:// URL');
            return;
        }

        try {
            const updated = await api.post(`/api/subjects/${id}/resources`, newRes);
            setSubject(updated);
            setResources(updated.resources || []);
            setNewRes({ title: '', url: '', type: 'notes', description: '' });
        } catch (err) {
            setResError(err.message || 'Failed to add resource');
        }
    };

    const handleDeleteResource = async (resourceIndex) => {
        const targetRes = resources[resourceIndex];
        if (!targetRes || !targetRes._id) return;

        try {
            const updated = await api.delete(`/api/subjects/${id}/resources/${targetRes._id}`);
            setSubject(updated);
            setResources(updated.resources || []);
        } catch (err) {
            setError(err.message || 'Failed to delete resource');
        }
    };

    const handleDeleteSubject = async () => {
        if (!window.confirm(`Are you sure you want to delete "${subject.name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await api.delete(`/api/subjects/${id}`);
            navigate('/subjects');
        } catch (err) {
            setError(err.message || 'Failed to delete subject');
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>progress_activity</span>
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Loading course telemetry...</p>
            </div>
        );
    }

    if (!subject) {
        return <div className="alert alert-danger">Subject not found.</div>;
    }

    // Live calculations
    let totalMax = 0;
    let totalObtained = 0;
    let gradedMax = 0;
    let gradedObtained = 0;
    let isComplete = markingScheme.length > 0;

    markingScheme.forEach((c) => {
        totalMax += Number(c.maxMarks) || 0;
        if (c.obtainedMarks !== null && c.obtainedMarks !== undefined) {
            totalObtained += Number(c.obtainedMarks);
            gradedMax += Number(c.maxMarks) || 0;
            gradedObtained += Number(c.obtainedMarks);
        } else {
            isComplete = false;
        }
    });

    const livePercentage = isComplete && totalMax > 0 ? (totalObtained / totalMax) * 100 : null;
    const livePercentageSoFar = gradedMax > 0 ? (gradedObtained / gradedMax) * 100 : null;
    const liveGradePoint = isComplete && livePercentage !== null ? mapPercentageToGradePoint(livePercentage) : null;
    const runRatePct = gradedMax > 0 ? Math.round((gradedObtained / gradedMax) * 100) : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingTop: '0.5rem' }}>
            {/* Top Navigation & Breadcrumbs */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <Link to="/subjects" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                    <span>Back to Courses</span>
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="stitch-pill stitch-pill-neutral font-mono">{subject.code || 'ID: ' + subject._id.slice(-6)}</span>
                    <span className="stitch-pill stitch-pill-emerald font-mono">{subject.credits} Credits</span>
                </div>
            </div>

            {/* Course Detail Hero Header */}
            <div className="grid-2" style={{ gap: '1.25rem', alignItems: 'stretch' }}>
                {/* Left Hero Identity Card */}
                <div className="card" style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1.25rem',
                    background: 'var(--surface-container-low)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                            <span className="stitch-pill stitch-pill-primary font-mono" style={{ textTransform: 'uppercase' }}>
                                {subject.type === 'lab' ? 'Laboratory / Practical' : 'Core Theory'}
                            </span>
                            {subject.code && <span className="stitch-pill stitch-pill-neutral font-mono">{subject.code}</span>}
                            <span className="stitch-pill stitch-pill-neutral font-mono">{subject.credits} Credits</span>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{
                                width: 56,
                                height: 56,
                                borderRadius: '14px',
                                background: 'rgba(128, 131, 255, 0.15)',
                                border: '1px solid rgba(128, 131, 255, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--primary)',
                                flexShrink: 0
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '30px' }}>
                                    {subject.type === 'lab' ? 'terminal' : 'database'}
                                </span>
                            </div>
                            <div>
                                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>{subject.name}</h1>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                                    {markingScheme.length} Assessment Components Configured • {totalMax} Total Marks
                                </p>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span>Status: <strong style={{ color: isComplete ? 'var(--emerald)' : 'var(--tertiary)' }}>{isComplete ? 'All Components Final' : 'In Progress'}</strong></span>
                        <span>Evaluation Cap: <strong style={{ color: 'var(--text-main)' }}>{totalMax} Marks</strong></span>
                    </div>
                </div>

                {/* Right Live Grade Telemetry Card */}
                <div className="card" style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    background: 'var(--surface-container-low)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                            Telemetry Engine
                        </span>
                        <span className="stitch-pill stitch-pill-tertiary font-mono">Live Forecast</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        {/* Circular Run-Rate Ring */}
                        <div style={{ position: 'relative', width: 76, height: 76, flexShrink: 0 }}>
                            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="var(--surface-highest)"
                                    strokeWidth="3.2"
                                />
                                <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="var(--tertiary)"
                                    strokeWidth="3.2"
                                    strokeDasharray={`${runRatePct}, 100`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                color: 'var(--text-main)'
                            }}>
                                {runRatePct}%
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Outcome</span>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '-0.01em' }}>
                                {isComplete ? getGradeLabel(liveGradePoint) : `${livePercentageSoFar !== null ? livePercentageSoFar.toFixed(1) + '%' : '–'} (Run-Rate)`}
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                                {gradedObtained.toFixed(1)} / {gradedMax.toFixed(1)} Marks Graded
                            </span>
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Interactive Evaluation Active</span>
                        <Link to="/" className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', height: '28px' }}>
                            View Simulator ↗
                        </Link>
                    </div>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {successMessage && <div className="alert alert-success">{successMessage}</div>}

            {/* Assessment Matrix & Evaluation Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>
                            Assessment Matrix & Continuous Evaluation
                        </h2>
                        <span className="stitch-pill stitch-pill-neutral font-mono">100% Weight Cap</span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {markingScheme.length === 0 ? (
                            <button onClick={handleUseDefaultScheme} className="btn btn-secondary btn-sm">
                                + Use Default {subject.type === 'lab' ? 'Lab' : 'Theory'} Scheme
                            </button>
                        ) : (
                            <button onClick={handleAddComponent} className="btn btn-secondary btn-sm">
                                + Add Component
                            </button>
                        )}
                    </div>
                </div>

                {markingScheme.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>table_chart</span>
                        <p>No assessment scheme configured for this course yet.</p>
                        <button onClick={handleUseDefaultScheme} className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>
                            Initialize Standard Scheme
                        </button>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface-container)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ background: 'var(--surface-container-high)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <th style={{ padding: '0.85rem 1.25rem' }}>Assessment Component</th>
                                    <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Weight</th>
                                    <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Marks Obtained</th>
                                    <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Max Marks</th>
                                    <th style={{ padding: '0.85rem 1rem' }}>Component Status</th>
                                    <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Scaled Score</th>
                                    <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center', width: 40 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {markingScheme.map((c, index) => {
                                    const weightPct = totalMax > 0 ? ((Number(c.maxMarks) / totalMax) * 100).toFixed(0) : 0;
                                    const isGraded = c.obtainedMarks !== null && c.obtainedMarks !== undefined;
                                    const compPct = isGraded && c.maxMarks > 0 ? ((Number(c.obtainedMarks) / Number(c.maxMarks)) * 100).toFixed(1) : null;

                                    return (
                                        <tr
                                            key={index}
                                            style={{
                                                borderBottom: '1px solid var(--border)',
                                                background: index % 2 === 0 ? 'var(--surface-container)' : 'var(--surface-container-low)',
                                                transition: 'background 0.15s',
                                            }}
                                        >
                                            <td style={{ padding: '0.85rem 1.25rem' }}>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    style={{ width: '100%', maxWidth: 220, padding: '0.35rem 0.6rem', fontSize: '0.875rem', fontWeight: 600, height: '36px' }}
                                                    value={c.name}
                                                    onChange={(e) => handleMarkChange(index, 'name', e.target.value)}
                                                />
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                                                {weightPct}%
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={c.maxMarks}
                                                    step="0.5"
                                                    className="form-input"
                                                    placeholder="–"
                                                    style={{
                                                        width: 85,
                                                        height: '36px',
                                                        textAlign: 'center',
                                                        fontFamily: 'var(--font-mono)',
                                                        fontWeight: 700,
                                                        color: isGraded ? 'var(--primary)' : 'var(--text-dim)',
                                                        padding: '0.35rem 0.5rem',
                                                    }}
                                                    value={c.obtainedMarks !== null && c.obtainedMarks !== undefined ? c.obtainedMarks : ''}
                                                    onChange={(e) => handleMarkChange(index, 'obtainedMarks', e.target.value)}
                                                />
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="form-input"
                                                    style={{
                                                        width: 75,
                                                        height: '36px',
                                                        textAlign: 'center',
                                                        fontFamily: 'var(--font-mono)',
                                                        color: 'var(--text-muted)',
                                                        padding: '0.35rem 0.5rem',
                                                    }}
                                                    value={c.maxMarks}
                                                    onChange={(e) => handleMarkChange(index, 'maxMarks', e.target.value)}
                                                />
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem' }}>
                                                {isGraded ? (
                                                    <span className="stitch-pill stitch-pill-emerald">
                                                        Graded ({compPct}%)
                                                    </span>
                                                ) : (
                                                    <span className="stitch-pill stitch-pill-neutral">
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                                                <span style={{ color: isGraded ? 'var(--text-main)' : 'var(--text-dim)' }}>
                                                    {isGraded ? Number(c.obtainedMarks).toFixed(1) : '–'}
                                                </span>
                                                <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}> / {Number(c.maxMarks).toFixed(1)}</span>
                                            </td>
                                            <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>
                                                <button
                                                    onClick={() => handleRemoveComponent(index)}
                                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
                                                    title="Remove component"
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr style={{ background: 'var(--surface-container-highest)', borderTop: '1px solid var(--border)' }}>
                                    <td colSpan={2} style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>
                                        Course Cumulative Forecast Total
                                    </td>
                                    <td colSpan={2} style={{ padding: '1rem 1rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--tertiary)' }}>
                                        {isComplete ? totalObtained.toFixed(1) : gradedObtained.toFixed(1)} / {totalMax.toFixed(1)}
                                    </td>
                                    <td colSpan={3} style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                                                Estimated Grade Point:
                                            </span>
                                            <span className="stitch-pill stitch-pill-primary font-mono" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', fontWeight: 700 }}>
                                                {isComplete ? getGradeLabel(liveGradePoint) : 'In Progress'}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button
                        onClick={handleSaveMarks}
                        disabled={saving || markingScheme.length === 0}
                        className="btn btn-primary"
                    >
                        {saving ? 'Saving...' : 'Save Assessment Matrix'}
                    </button>
                </div>
            </div>

            {/* Study Vault & Academic Resources Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--primary)' }}>folder_special</span>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>Study Vault & Course Artifacts</h2>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {resources.length} resource{resources.length === 1 ? '' : 's'} linked
                    </span>
                </div>

                {resources.length === 0 ? (
                    <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>inventory_2</span>
                        <p>No study materials or links attached yet. Add slides, notes, or repository links below.</p>
                    </div>
                ) : (
                    <div className="grid-3" style={{ gap: '1rem' }}>
                        {resources.map((r, i) => {
                            const safe = isSafeUrl(r.url);
                            return (
                                <div
                                    key={i}
                                    className="card"
                                    style={{
                                        padding: '1.1rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        gap: '0.75rem',
                                        background: 'var(--surface-container-low)',
                                    }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <span style={{
                                                padding: '0.4rem',
                                                borderRadius: '8px',
                                                background: 'var(--surface-container)',
                                                color: 'var(--primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                                                    {getResourceIcon(r.type)}
                                                </span>
                                            </span>
                                            <span className="stitch-pill stitch-pill-neutral font-mono" style={{ textTransform: 'capitalize' }}>
                                                {r.type}
                                            </span>
                                        </div>

                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 0.35rem 0' }}>
                                            {r.title}
                                        </h3>
                                        {r.description && (
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                                                {r.description}
                                            </p>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                                        <div style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                                            {safe ? (
                                                <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                                    <span>Open Link</span>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span>
                                                </a>
                                            ) : (
                                                <span style={{ color: 'var(--rose)' }}>[Unsafe link]</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteResource(i)}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
                                            title="Delete resource"
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Add Resource Card */}
                <div className="card" style={{ padding: '1.25rem', background: 'var(--surface-container-low)' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>add_link</span>
                        Attach New Resource
                    </h3>

                    {resError && <div className="alert alert-danger" style={{ marginBottom: '0.75rem' }}>{resError}</div>}

                    <form onSubmit={handleAddResource}>
                        <div className="grid-3" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    placeholder="Resource Title *"
                                    value={newRes.title}
                                    onChange={(e) => setNewRes({ ...newRes, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <select
                                    className="form-select"
                                    value={newRes.type}
                                    onChange={(e) => setNewRes({ ...newRes, type: e.target.value })}
                                >
                                    <option value="notes">Notes</option>
                                    <option value="link">Link</option>
                                    <option value="project">Project / Repo</option>
                                    <option value="file">File / PDF</option>
                                </select>
                            </div>
                            <div>
                                <input
                                    type="url"
                                    required
                                    className="form-input"
                                    placeholder="https://..."
                                    value={newRes.url}
                                    onChange={(e) => setNewRes({ ...newRes, url: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Optional description or lecture notes summary..."
                                value={newRes.description}
                                onChange={(e) => setNewRes({ ...newRes, description: e.target.value })}
                            />
                            <button type="submit" className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                                + Add Resource
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="card" style={{ borderColor: 'rgba(244, 63, 94, 0.25)', background: 'rgba(244, 63, 94, 0.03)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h4 style={{ color: 'var(--rose)', margin: '0 0 0.25rem 0', fontSize: '0.95rem' }}>Delete Course</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                            Permanently remove this course, its assessment scheme, and all associated deadlines.
                        </p>
                    </div>
                    <button onClick={handleDeleteSubject} className="btn btn-danger btn-sm">
                        Delete Course
                    </button>
                </div>
            </div>
        </div>
    );
}
