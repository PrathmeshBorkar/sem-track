import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';

export default function GpaSimulatorModal({ isOpen, onClose, subjects = [], onProjectedUpdate }) {
    const [activeTab, setActiveTab] = useState('simulator'); // 'simulator' | 'target'

    // Simulator State
    const [assumedMarks, setAssumedMarks] = useState({});
    const [projectedData, setProjectedData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [inlineError, setInlineError] = useState('');
    const requestCounterRef = useRef(0);

    // Target Calculator State
    const [targetSGPA, setTargetSGPA] = useState('9.0');
    const [targetResult, setTargetResult] = useState(null);
    const [targetLoading, setTargetLoading] = useState(false);
    const [targetError, setTargetError] = useState('');

    const incompleteSubjects = subjects.filter((s) => !s.complete);
    const hasAssumptions = Object.keys(assumedMarks).length > 0;

    const handleMarkChange = (subjectId, compName, val) => {
        setAssumedMarks((prev) => {
            const next = { ...prev };
            if (!next[subjectId]) next[subjectId] = {};
            if (val === '') {
                delete next[subjectId][compName];
                if (Object.keys(next[subjectId]).length === 0) delete next[subjectId];
            } else {
                next[subjectId][compName] = Number(val);
            }
            return next;
        });
    };

    // Debounced call to /api/gpa/project
    useEffect(() => {
        if (!isOpen || activeTab !== 'simulator') return;

        if (Object.keys(assumedMarks).length === 0) {
            setProjectedData(null);
            setInlineError('');
            return;
        }

        const currentRequestId = ++requestCounterRef.current;
        setLoading(true);
        setInlineError('');

        const timer = setTimeout(async () => {
            try {
                const data = await api.post('/api/gpa/project', { assumedMarks });
                if (currentRequestId === requestCounterRef.current) {
                    setProjectedData(data);
                    if (onProjectedUpdate) onProjectedUpdate(data.projectedSGPA);
                }
            } catch (err) {
                if (currentRequestId === requestCounterRef.current) {
                    setInlineError(err.message);
                }
            } finally {
                if (currentRequestId === requestCounterRef.current) {
                    setLoading(false);
                }
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [assumedMarks, isOpen, activeTab]);

    const handleCalculateTarget = async (e) => {
        if (e) e.preventDefault();
        setTargetError('');
        setTargetLoading(true);

        try {
            const num = Number(targetSGPA);
            if (isNaN(num) || num < 0 || num > 10) {
                setTargetError('Please enter a valid target SGPA between 0 and 10');
                return;
            }
            const res = await api.post('/api/gpa/target', { targetSGPA: num });
            setTargetResult(res);
        } catch (err) {
            setTargetError(err.message || 'Calculation failed');
        } finally {
            setTargetLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 660, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Modal Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: 38,
                            height: 38,
                            borderRadius: '10px',
                            background: 'rgba(128, 131, 255, 0.12)',
                            border: '1px solid rgba(128, 131, 255, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary)'
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>monitoring</span>
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                                GPA Intelligence Engine
                            </h3>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Grade forecasting and target SGPA solver
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn btn-secondary btn-sm"
                        style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface-lowest)', padding: '4px', borderRadius: '8px' }}>
                    <button
                        className={`btn btn-sm ${activeTab === 'simulator' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('simulator')}
                        style={{
                            flex: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            borderRadius: '6px',
                            border: activeTab === 'simulator' ? 'none' : 'transparent',
                            background: activeTab === 'simulator' ? undefined : 'transparent'
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>query_stats</span>
                        <span>What-If Simulator</span>
                    </button>
                    <button
                        className={`btn btn-sm ${activeTab === 'target' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('target')}
                        style={{
                            flex: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            borderRadius: '6px',
                            border: activeTab === 'target' ? 'none' : 'transparent',
                            background: activeTab === 'target' ? undefined : 'transparent'
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calculate</span>
                        <span>Target SGPA Solver</span>
                    </button>
                </div>

                {/* TAB 1: What-If Simulator */}
                {activeTab === 'simulator' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {inlineError && (
                            <div className="alert alert-danger" style={{ margin: 0 }}>
                                ⚠️ {inlineError}
                            </div>
                        )}

                        {incompleteSubjects.length === 0 ? (
                            /* All Courses Completed Celebration Banner */
                            <div style={{
                                padding: '2rem 1.5rem',
                                textAlign: 'center',
                                background: 'rgba(16, 185, 129, 0.08)',
                                border: '1px solid rgba(16, 185, 129, 0.25)',
                                borderRadius: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: '50%',
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--emerald)'
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>task_alt</span>
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                        All Enrolled Courses Completed
                                    </h4>
                                    <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '420px', lineHeight: 1.5 }}>
                                        All continuous assessments and final examinations have recorded marks. Your semester SGPA is finalized.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Trajectory Metric Card */}
                                <div style={{
                                    padding: '1.25rem',
                                    borderRadius: '12px',
                                    background: 'var(--surface-lowest)',
                                    border: '1px solid var(--border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '1rem'
                                }}>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                                            Simulated SGPA Trajectory
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.25rem' }}>
                                            <span style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: hasAssumptions ? 'var(--primary)' : 'var(--text-dim)' }}>
                                                {projectedData?.projectedSGPA !== null && projectedData?.projectedSGPA !== undefined
                                                    ? projectedData.projectedSGPA.toFixed(2)
                                                    : '–'}
                                            </span>
                                            {loading && <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>Computing...</span>}
                                            {!hasAssumptions && !loading && (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                                    Enter expected marks below to simulate
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {projectedData && (
                                        <div style={{ textAlign: 'right' }}>
                                            <span className="stitch-pill stitch-pill-emerald font-mono">
                                                {projectedData.projectedCompletedCredits} / {projectedData.totalCredits} Credits Simulated
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', margin: 0 }}>
                                    Simulations calculate locally in real time and are never saved to the database.
                                </p>

                                {/* Course Assessment Cards */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '320px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                                    {incompleteSubjects.map((s) => {
                                        const compList = s.markingScheme || s.components || [];
                                        const pendingComponents = compList.filter(
                                            (c) => c.obtainedMarks === null || c.obtainedMarks === undefined
                                        );

                                        return (
                                            <div
                                                key={s._id}
                                                style={{
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '10px',
                                                    padding: '1rem',
                                                    background: 'var(--surface-container-low)',
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        {s.code && <span className="stitch-pill stitch-pill-primary font-mono">{s.code}</span>}
                                                        <strong style={{ fontSize: '0.9rem' }}>{s.name}</strong>
                                                    </div>
                                                    <span className="stitch-pill stitch-pill-neutral font-mono">{s.credits} Credits</span>
                                                </div>

                                                {pendingComponents.length > 0 ? (
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                                                        {pendingComponents.map((c) => (
                                                            <div key={c.name} style={{ background: 'var(--surface-container)', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                                                                    {c.name} <span className="font-mono">({c.maxMarks} max)</span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max={c.maxMarks}
                                                                    step="0.5"
                                                                    className="form-input"
                                                                    style={{
                                                                        height: '36px',
                                                                        textAlign: 'center',
                                                                        fontFamily: 'var(--font-mono)',
                                                                        fontWeight: 700,
                                                                        color: 'var(--primary)',
                                                                    }}
                                                                    placeholder="–"
                                                                    value={assumedMarks[s._id]?.[c.name] ?? ''}
                                                                    onChange={(e) => handleMarkChange(s._id, c.name, e.target.value)}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : compList.length === 0 ? (
                                                    <div style={{
                                                        padding: '0.75rem 1rem',
                                                        borderRadius: '8px',
                                                        background: 'var(--surface-container)',
                                                        border: '1px dashed var(--border)',
                                                        color: 'var(--text-muted)',
                                                        fontSize: '0.82rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        gap: '0.75rem'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--amber)' }}>warning</span>
                                                            <span>No evaluation components configured yet.</span>
                                                        </div>
                                                        <Link
                                                            to={`/subjects/${s._id}`}
                                                            onClick={onClose}
                                                            style={{
                                                                color: 'var(--primary)',
                                                                textDecoration: 'none',
                                                                fontSize: '0.8rem',
                                                                fontWeight: 600,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.25rem',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            Configure Scheme →
                                                        </Link>
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        padding: '0.65rem 0.85rem',
                                                        borderRadius: '8px',
                                                        background: 'rgba(16, 185, 129, 0.08)',
                                                        border: '1px solid rgba(16, 185, 129, 0.2)',
                                                        color: 'var(--emerald)',
                                                        fontSize: '0.82rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem'
                                                    }}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                                                        <span>All assessment components graded for this course.</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* TAB 2: Target SGPA Calculator */}
                {activeTab === 'target' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                            Enter your target SGPA. SemTrack calculates the minimum marks needed in remaining exams to reach it.
                        </p>

                        {/* Quick Presets & Input Form */}
                        <form onSubmit={handleCalculateTarget} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Quick Targets:</span>
                                {['8.0', '8.5', '9.0', '9.5'].map((val) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setTargetSGPA(val)}
                                        className="btn btn-secondary btn-sm"
                                        style={{
                                            fontFamily: 'var(--font-mono)',
                                            padding: '0.2rem 0.5rem',
                                            height: '26px',
                                            borderColor: targetSGPA === val ? 'var(--primary)' : undefined,
                                            color: targetSGPA === val ? 'var(--primary)' : undefined
                                        }}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    required
                                    className="form-input"
                                    placeholder="Target SGPA (e.g. 9.0)"
                                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}
                                    value={targetSGPA}
                                    onChange={(e) => setTargetSGPA(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={targetLoading || !targetSGPA}
                                    className="btn btn-primary"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>bolt</span>
                                    <span>{targetLoading ? 'Solving...' : 'Solve Requirements'}</span>
                                </button>
                            </div>
                        </form>

                        {targetError && <div className="alert alert-danger">{targetError}</div>}

                        {targetResult && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {targetResult.achievable ? (
                                    targetResult.targetAlreadyMet ? (
                                        <div style={{ padding: '1.25rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.25)', color: 'var(--emerald)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                                                <span className="material-symbols-outlined">verified</span>
                                                <span>Target SGPA Already Secured!</span>
                                            </div>
                                            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                                                Your current continuous assessment marks have mathematically guaranteed an SGPA of at least {targetSGPA}.
                                            </p>
                                        </div>
                                    ) : (
                                        <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', background: 'var(--surface-container-lowest)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                <div>
                                                    <span className="stitch-pill stitch-pill-emerald font-mono">
                                                        Feasible Target
                                                    </span>
                                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '0.3rem' }}>
                                                        Target Tier: <strong>Grade Point {targetResult.targetGradePoint}</strong>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Max Achievable</span>
                                                    <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--tertiary)' }}>
                                                        {targetResult.maxPossibleSGPA}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                                                Required Marks Breakdown:
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
                                                {targetResult.requiredBreakdown.map((b) => (
                                                    <div
                                                        key={b.subjectId}
                                                        style={{
                                                            padding: '0.75rem 1rem',
                                                            backgroundColor: 'var(--surface-container)',
                                                            borderRadius: '8px',
                                                            border: '1px solid var(--border)',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                        }}
                                                    >
                                                        <div>
                                                            <strong style={{ fontSize: '0.9rem' }}>{b.subjectName}</strong>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                                                Target: {b.minPercentageNeeded}% (GP {b.targetGradePoint}) • {b.obtainedSoFar} secured
                                                            </div>
                                                        </div>

                                                        <div style={{ textAlign: 'right' }}>
                                                            {b.alreadySecured ? (
                                                                <span className="stitch-pill stitch-pill-emerald font-mono">Secured</span>
                                                            ) : (
                                                                <div style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
                                                                    {b.requiredMarks}{' '}
                                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 400 }}>
                                                                        / {b.remainingMax} marks
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <div style={{ padding: '1rem', background: 'rgba(244, 63, 94, 0.08)', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.25)', color: 'var(--rose)' }}>
                                        <strong>Benchmark Unattainable.</strong> {targetResult.message || `Your maximum achievable SGPA is ${targetResult.maxPossibleSGPA}.`}
                                    </div>
                                )}

                                {targetResult.ungradableSubjects?.length > 0 && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--amber)' }}>
                                        Notice: Excluded {targetResult.ungradableSubjects.map((s) => s.name).join(', ')} (no assessment scheme configured).
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Controls */}
                <div style={{ marginTop: '0.5rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    {activeTab === 'simulator' && incompleteSubjects.length > 0 && (
                        <button
                            onClick={() => setAssumedMarks({})}
                            className="btn btn-secondary btn-sm"
                            disabled={!hasAssumptions}
                        >
                            Reset Simulation
                        </button>
                    )}
                    <button onClick={onClose} className="btn btn-primary btn-sm">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
