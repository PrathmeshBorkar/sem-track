import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

function getGradeBadge(gradePoint) {
    if (gradePoint === 10) return { label: '10.0 (O)', pillClass: 'stitch-pill-emerald' };
    if (gradePoint >= 9) return { label: '9.0 (A+)', pillClass: 'stitch-pill-emerald' };
    if (gradePoint >= 8) return { label: '8.0 (A)', pillClass: 'stitch-pill-primary' };
    if (gradePoint >= 7) return { label: '7.0 (B+)', pillClass: 'stitch-pill-primary' };
    if (gradePoint >= 6) return { label: '6.0 (B)', pillClass: 'stitch-pill-amber' };
    if (gradePoint >= 5) return { label: '5.0 (C)', pillClass: 'stitch-pill-amber' };
    if (gradePoint === 0) return { label: '0.0 (F)', pillClass: 'stitch-pill-rose' };
    return { label: 'In Progress', pillClass: 'stitch-pill-neutral' };
}

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    // Add Subject Modal State
    const [showModal, setShowModal] = useState(false);
    const [newSubject, setNewSubject] = useState({
        name: '',
        code: '',
        type: 'theory',
        credits: 4,
        useDefaultScheme: true,
    });
    const [submitting, setSubmitting] = useState(false);
    const [modalError, setModalError] = useState('');

    const loadSubjects = async () => {
        try {
            setLoading(true);
            const data = await api.get('/api/subjects');
            setSubjects(data);
        } catch (err) {
            setError(err.message || 'Failed to load subjects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubjects();
    }, []);

    const handleCreateSubject = async (e) => {
        e.preventDefault();
        setModalError('');
        setSubmitting(true);

        try {
            const markingScheme = newSubject.useDefaultScheme
                ? newSubject.type === 'theory'
                    ? DEFAULT_THEORY_SCHEME
                    : DEFAULT_LAB_SCHEME
                : [];

            await api.post('/api/subjects', {
                name: newSubject.name.trim(),
                code: newSubject.code.trim(),
                type: newSubject.type,
                credits: Number(newSubject.credits),
                markingScheme,
            });

            setShowModal(false);
            setNewSubject({ name: '', code: '', type: 'theory', credits: 4, useDefaultScheme: true });
            loadSubjects();
        } catch (err) {
            setModalError(err.message || 'Failed to create subject');
        } finally {
            setSubmitting(false);
        }
    };

    const theoryCount = subjects.filter((s) => s.type === 'theory').length;
    const labCount = subjects.filter((s) => s.type === 'lab').length;
    const totalCredits = subjects.reduce((sum, s) => sum + (s.credits || 0), 0);

    const filtered = subjects.filter((s) => {
        const matchesSearch =
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            (s.code && s.code.toLowerCase().includes(search.toLowerCase()));
        const matchesType = typeFilter === 'all' || s.type === typeFilter;
        return matchesSearch && matchesType;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                        Curriculum Architecture • Course Matrix
                    </div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                        Course Catalog & Curriculum Matrix
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                        Manage course assessment schemes, credit allocations, and predictive grade outcomes
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '8px',
                        background: 'var(--surface-container)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.8rem',
                        fontFamily: 'var(--font-mono)'
                    }}>
                        <span style={{ color: 'var(--text-dim)' }}>Allocated:</span>
                        <strong style={{ color: 'var(--tertiary)' }}>{totalCredits} Credits</strong>
                        <span style={{ color: 'var(--text-dim)' }}>•</span>
                        <strong style={{ color: 'var(--text-main)' }}>{subjects.length} Courses</strong>
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="btn btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
                        <span>+ Enroll Course</span>
                    </button>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {/* Filter Bar */}
            <div style={{
                padding: '0.75rem',
                borderRadius: '12px',
                background: 'var(--surface-container)',
                border: '1px solid var(--border)',
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontSize: '18px' }}>
                        search
                    </span>
                    <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '2.4rem', height: '38px' }}
                        placeholder="Filter by course name or catalog code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--surface-lowest)', padding: '3px', borderRadius: '8px' }}>
                    <button
                        onClick={() => setTypeFilter('all')}
                        className={`btn btn-sm ${typeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                            height: '32px',
                            padding: '0 0.75rem',
                            borderRadius: '6px',
                            border: typeFilter === 'all' ? 'none' : 'transparent',
                            background: typeFilter === 'all' ? undefined : 'transparent'
                        }}
                    >
                        All ({subjects.length})
                    </button>
                    <button
                        onClick={() => setTypeFilter('theory')}
                        className={`btn btn-sm ${typeFilter === 'theory' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                            height: '32px',
                            padding: '0 0.75rem',
                            borderRadius: '6px',
                            border: typeFilter === 'theory' ? 'none' : 'transparent',
                            background: typeFilter === 'theory' ? undefined : 'transparent'
                        }}
                    >
                        Theory ({theoryCount})
                    </button>
                    <button
                        onClick={() => setTypeFilter('lab')}
                        className={`btn btn-sm ${typeFilter === 'lab' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                            height: '32px',
                            padding: '0 0.75rem',
                            borderRadius: '6px',
                            border: typeFilter === 'lab' ? 'none' : 'transparent',
                            background: typeFilter === 'lab' ? undefined : 'transparent'
                        }}
                    >
                        Lab ({labCount})
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>progress_activity</span>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Loading course matrix...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>menu_book</span>
                    <p>No courses found matching your criteria.</p>
                    <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>
                        Enroll First Course
                    </button>
                </div>
            ) : (
                <div className="grid-3" style={{ gap: '1rem' }}>
                    {filtered.map((s) => {
                        const gradeInfo = s.stats?.complete
                            ? getGradeBadge(s.stats?.gradePoint)
                            : { label: 'In Progress', pillClass: 'stitch-pill-neutral' };

                        const scoreVal = s.stats?.complete
                            ? s.stats?.percentage
                            : s.stats?.percentageSoFar !== null
                            ? s.stats?.percentageSoFar
                            : null;

                        const gradedComponents = (s.markingScheme || []).filter((c) => c.obtainedMarks !== null && c.obtainedMarks !== undefined).length;
                        const totalComponents = (s.markingScheme || []).length;
                        const gradedPct = totalComponents > 0 ? Math.round((gradedComponents / totalComponents) * 100) : 0;

                        return (
                            <Link
                                key={s._id}
                                to={`/subjects/${s._id}`}
                                className="card"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    padding: '1.25rem',
                                    background: 'var(--surface-container-low)',
                                    textDecoration: 'none',
                                    gap: '1rem',
                                    transition: 'transform 0.15s, border-color 0.15s',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            {s.code ? (
                                                <span className="stitch-pill stitch-pill-primary font-mono">{s.code}</span>
                                            ) : (
                                                <span className="stitch-pill stitch-pill-neutral font-mono">{s.type}</span>
                                            )}
                                            <span className="stitch-pill stitch-pill-neutral font-mono" style={{ textTransform: 'capitalize' }}>{s.type}</span>
                                        </div>
                                        <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--tertiary)', fontWeight: 600 }}>
                                            {s.credits} Credits
                                        </span>
                                    </div>

                                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 0.35rem 0', letterSpacing: '-0.01em' }}>
                                        {s.name}
                                    </h3>

                                    {/* Progress Bar */}
                                    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            <span>{totalComponents} Components</span>
                                            <span style={{ color: 'var(--tertiary)', fontFamily: 'var(--font-mono)' }}>{gradedPct}% Graded</span>
                                        </div>
                                        <div style={{ width: '100%', height: '4px', borderRadius: '999px', background: 'var(--surface-highest)', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${gradedPct}%`,
                                                height: '100%',
                                                background: gradedPct === 100 ? 'var(--emerald)' : 'linear-gradient(to right, var(--tertiary), var(--primary))',
                                                borderRadius: '999px',
                                                transition: 'width 0.3s'
                                            }}></div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Est GP:</span>
                                        <span className={`stitch-pill ${gradeInfo.pillClass} font-mono`} style={{ fontSize: '0.75rem' }}>
                                            {gradeInfo.label}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <strong style={{
                                            fontSize: '1rem',
                                            fontFamily: 'var(--font-mono)',
                                            color: s.stats?.complete ? 'var(--emerald)' : 'var(--tertiary)'
                                        }}>
                                            {scoreVal !== null ? `${scoreVal}%` : '–'}
                                        </strong>
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-dim)' }}>arrow_forward</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Enroll New Course Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540, position: 'relative', overflow: 'hidden' }}>
                        {/* Top decorative accent bar */}
                        <div style={{ position: 'absolute', top: 0, left: 32, right: 32, height: '2px', background: 'linear-gradient(to right, transparent, var(--primary), transparent)' }}></div>

                        {/* Modal Header */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '10px',
                                    background: 'rgba(128, 131, 255, 0.15)',
                                    border: '1px solid rgba(128, 131, 255, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--tertiary)'
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>library_add</span>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                                        Enroll New Course
                                    </h3>
                                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Add a course to your curriculum and configure assessment weighting.
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm" style={{ width: 30, height: 30, padding: 0 }}>
                                ✕
                            </button>
                        </div>

                        {modalError && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{modalError}</div>}

                        <form onSubmit={handleCreateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Course Title & Catalog Code */}
                            <div className="grid-3" style={{ gap: '0.75rem' }}>
                                <div className="form-group" style={{ gridColumn: 'span 2', margin: 0 }}>
                                    <label className="form-label">Course Title *</label>
                                    <input
                                        type="text"
                                        required
                                        className="form-input"
                                        placeholder="e.g. Computer Networks"
                                        value={newSubject.name}
                                        onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                                    />
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Catalog Code</label>
                                    <input
                                        type="text"
                                        className="form-input font-mono"
                                        placeholder="e.g. CS302"
                                        value={newSubject.code}
                                        onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value.toUpperCase() })}
                                    />
                                </div>
                            </div>

                            {/* Credit Allocation Selector */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                    <label className="form-label" style={{ margin: 0 }}>Credit Allocation</label>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Weight toward SGPA</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
                                    {[1, 2, 3, 4, 5, 6].map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setNewSubject({ ...newSubject, credits: c })}
                                            className={`btn btn-sm ${newSubject.credits === c ? 'btn-primary' : 'btn-secondary'}`}
                                            style={{
                                                height: '34px',
                                                fontFamily: 'var(--font-mono)',
                                                fontWeight: newSubject.credits === c ? 700 : 400,
                                            }}
                                        >
                                            {c} {newSubject.credits === c ? 'Credits' : ''}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Course Classification Segmented Buttons */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Course Classification</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'var(--surface-lowest)', padding: '4px', borderRadius: '8px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setNewSubject({ ...newSubject, type: 'theory' })}
                                        className={`btn btn-sm ${newSubject.type === 'theory' ? 'btn-primary' : 'btn-secondary'}`}
                                        style={{
                                            height: '34px',
                                            borderRadius: '6px',
                                            border: newSubject.type === 'theory' ? 'none' : 'transparent',
                                            background: newSubject.type === 'theory' ? undefined : 'transparent'
                                        }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>menu_book</span>
                                        <span>Theory Course</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewSubject({ ...newSubject, type: 'lab' })}
                                        className={`btn btn-sm ${newSubject.type === 'lab' ? 'btn-primary' : 'btn-secondary'}`}
                                        style={{
                                            height: '34px',
                                            borderRadius: '6px',
                                            border: newSubject.type === 'lab' ? 'none' : 'transparent',
                                            background: newSubject.type === 'lab' ? undefined : 'transparent'
                                        }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>science</span>
                                        <span>Laboratory / Studio</span>
                                    </button>
                                </div>
                            </div>

                            {/* Assessment Weighting Scheme Card */}
                            <div style={{
                                padding: '0.85rem 1rem',
                                borderRadius: '10px',
                                background: 'var(--surface-lowest)',
                                border: '1px solid var(--border)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.6rem'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>
                                        <input
                                            type="checkbox"
                                            checked={newSubject.useDefaultScheme}
                                            onChange={(e) => setNewSubject({ ...newSubject, useDefaultScheme: e.target.checked })}
                                            style={{ accentColor: 'var(--primary)' }}
                                        />
                                        <span>Use Standard Evaluation Scheme</span>
                                    </label>
                                    <span className="stitch-pill stitch-pill-emerald font-mono">
                                        Balanced 100%
                                    </span>
                                </div>

                                {newSubject.useDefaultScheme && (
                                    <div style={{ display: 'grid', gridTemplateColumns: newSubject.type === 'theory' ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: '0.4rem', paddingTop: '0.35rem' }}>
                                        {newSubject.type === 'theory' ? (
                                            <>
                                                <div style={{ background: 'var(--surface-container)', padding: '0.4rem 0.5rem', borderRadius: '6px', textAlign: 'center' }}>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CCA 1</span>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--tertiary)', fontFamily: 'var(--font-mono)' }}>15%</div>
                                                </div>
                                                <div style={{ background: 'var(--surface-container)', padding: '0.4rem 0.5rem', borderRadius: '6px', textAlign: 'center' }}>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Midsem</span>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>30%</div>
                                                </div>
                                                <div style={{ background: 'var(--surface-container)', padding: '0.4rem 0.5rem', borderRadius: '6px', textAlign: 'center' }}>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CCA 2</span>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--tertiary)', fontFamily: 'var(--font-mono)' }}>15%</div>
                                                </div>
                                                <div style={{ background: 'var(--surface-container)', padding: '0.4rem 0.5rem', borderRadius: '6px', textAlign: 'center' }}>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Endsem</span>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>40%</div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ background: 'var(--surface-container)', padding: '0.4rem 0.5rem', borderRadius: '6px', textAlign: 'center' }}>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LCA 1</span>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--tertiary)', fontFamily: 'var(--font-mono)' }}>25%</div>
                                                </div>
                                                <div style={{ background: 'var(--surface-container)', padding: '0.4rem 0.5rem', borderRadius: '6px', textAlign: 'center' }}>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LCA 2</span>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>25%</div>
                                                </div>
                                                <div style={{ background: 'var(--surface-container)', padding: '0.4rem 0.5rem', borderRadius: '6px', textAlign: 'center' }}>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LCA 3</span>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--tertiary)', fontFamily: 'var(--font-mono)' }}>50%</div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Modal Actions */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting || !newSubject.name.trim()} className="btn btn-primary">
                                    {submitting ? 'Enrolling...' : 'Enroll Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
