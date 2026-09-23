import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import GpaSimulatorModal from './GpaSimulatorModal.jsx';

function getGradePill(gradePoint) {
    if (gradePoint === 10) return { label: 'O (10)', cls: 'stitch-pill-emerald' };
    if (gradePoint >= 9) return { label: 'A+ (9)', cls: 'stitch-pill-primary' };
    if (gradePoint >= 8) return { label: 'A (8)', cls: 'stitch-pill-primary' };
    if (gradePoint >= 7) return { label: 'B+ (7)', cls: 'stitch-pill-tertiary' };
    if (gradePoint >= 6) return { label: 'B (6)', cls: 'stitch-pill-tertiary' };
    if (gradePoint >= 5) return { label: 'C (5)', cls: 'stitch-pill-amber' };
    if (gradePoint === 0) return { label: 'F (0)', cls: 'stitch-pill-rose' };
    return { label: 'In Progress', cls: 'stitch-pill-neutral' };
}

function getDateStatus(dueDateStr, status) {
    if (status === 'done') return null;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const due = new Date(dueDateStr);
    const dueStr = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`;

    if (dueStr < todayStr) return { label: 'Overdue', cls: 'stitch-pill-rose' };
    if (dueStr === todayStr) return { label: 'Due Today', cls: 'stitch-pill-amber' };
    return { label: 'Upcoming', cls: 'stitch-pill-neutral' };
}

export default function Dashboard() {
    const [gpaData, setGpaData] = useState(null);
    const [deadlines, setDeadlines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showSimulator, setShowSimulator] = useState(false);
    const [liveProjectedSGPA, setLiveProjectedSGPA] = useState(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const [gpaRes, deadlinesRes] = await Promise.all([
                api.get('/api/gpa'),
                api.get('/api/deadlines'),
            ]);
            setGpaData(gpaRes);
            setDeadlines(deadlinesRes);
        } catch (err) {
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleToggleDone = async (deadline) => {
        const nextStatus = deadline.status === 'done' ? 'pending' : 'done';
        try {
            await api.put(`/api/deadlines/${deadline._id}`, { status: nextStatus });
            setDeadlines((prev) =>
                prev.map((d) => (d._id === deadline._id ? { ...d, status: nextStatus } : d))
            );
        } catch (err) {
            alert(err.message || 'Failed to update deadline');
        }
    };

    const upcomingDeadlines = deadlines
        .filter((d) => d.status !== 'done')
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5);

    if (loading) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined" style={{ animation: 'spin 1s infinite linear', fontSize: '32px', color: 'var(--primary)' }}>
                    progress_activity
                </span>
                <p style={{ marginTop: '0.75rem', fontFamily: 'var(--font-mono)' }}>Loading Academic Workbench...</p>
            </div>
        );
    }

    const currentSGPA = gpaData?.currentSGPA;
    const totalCredits = gpaData?.totalCredits || 0;
    const completedCredits = gpaData?.completedCredits || 0;
    const subjects = gpaData?.subjects || [];

    // Calculate overall percentage of completed
    const displaySGPA = liveProjectedSGPA !== null ? liveProjectedSGPA : currentSGPA;
    const sgpaPercentage = displaySGPA ? Math.min(100, (displaySGPA / 10) * 100) : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Top Overline Context Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span>Sem 5 / Computing Sciences</span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '2px 8px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--surface-high)', color: 'var(--tertiary)' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--tertiary)' }}></span>
                        Model Evaluator Active
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button onClick={() => setShowSimulator(true)} className="btn-stitch-secondary" style={{ fontSize: '12px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>tune</span>
                        <span>Open Simulator</span>
                    </button>
                    <Link to="/smart-add" className="btn-stitch-primary" style={{ fontSize: '12px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>bolt</span>
                        <span>Smart Add</span>
                    </Link>
                </div>
            </div>

            {error && <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(244, 63, 94, 0.15)', color: '#fca5a5', border: '1px solid rgba(244, 63, 94, 0.3)' }}>{error}</div>}

            {/* SECTION 1: Predictive Grade Matrix & Live SGPA Hero Banner */}
            <div className="glass-card" style={{ position: 'relative', overflow: 'hidden', padding: '1.75rem' }}>
                {/* Ambient glow accents */}
                <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(128, 131, 255, 0.12)', filter: 'blur(60px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(76, 215, 246, 0.08)', filter: 'blur(60px)', pointerEvents: 'none' }} />

                <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'center' }}>
                    {/* Left: SGPA Hero Display */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>query_stats</span>
                            </div>
                            <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>Predictive Grade Matrix</span>
                            <span className="stitch-pill stitch-pill-primary">Monte Carlo Engine</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '1.25rem' }}>
                            Live academic telemetry computed from ordinance regulations and continuous assessment clearance.
                        </p>

                        <div style={{ backgroundColor: 'var(--surface-lowest)', border: '1px solid var(--surface-highest)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                                {liveProjectedSGPA !== null ? 'Projected Semester SGPA' : 'Current Semester SGPA'}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.25rem' }}>
                                <span style={{ fontSize: '38px', fontWeight: 700, color: 'var(--primary)', letterSpacing: '-0.02em', fontFamily: 'var(--font-mono)' }}>
                                    {displaySGPA !== null && displaySGPA !== undefined ? displaySGPA : '–'}
                                </span>
                                {liveProjectedSGPA !== null && (
                                    <span style={{ fontSize: '12px', color: 'var(--tertiary)', fontFamily: 'var(--font-mono)' }}>
                                        (projected outcome)
                                    </span>
                                )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                <span className="stitch-pill stitch-pill-primary">
                                    {currentSGPA >= 9.0 ? 'Guaranteed Distinction' : currentSGPA >= 7.5 ? 'First Class' : 'In Progress'}
                                </span>
                                <span className="stitch-pill stitch-pill-tertiary">
                                    {currentSGPA === 10 ? 'O Grade' : currentSGPA >= 9 ? 'A+ Grade' : currentSGPA >= 8 ? 'A Grade' : 'Active'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Radial Meter & Credits Progress */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                            {/* Radial Meter Card */}
                            <div style={{ backgroundColor: 'var(--surface-container)', border: '1px solid var(--surface-highest)', borderRadius: 'var(--radius-lg)', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg viewBox="0 0 36 36" style={{ width: '56px', height: '56px', transform: 'rotate(-90deg)' }}>
                                        <path
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="var(--surface-highest)"
                                            strokeWidth="3.5"
                                        />
                                        <path
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="var(--tertiary)"
                                            strokeDasharray={`${sgpaPercentage}, 100`}
                                            strokeLinecap="round"
                                            strokeWidth="3.5"
                                        />
                                    </svg>
                                    <span style={{ position: 'absolute', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                                        {sgpaPercentage > 0 ? `${sgpaPercentage.toFixed(0)}%` : '0%'}
                                    </span>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: 'var(--outline)', fontFamily: 'var(--font-mono)' }}>Academic Run-Rate</div>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                                        {completedCredits} of {totalCredits} Cr
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--tertiary)', marginTop: '2px' }}>
                                        {completedCredits === totalCredits ? 'All Completed' : `${totalCredits - completedCredits} Cr Pending`}
                                    </div>
                                </div>
                            </div>

                            {/* Pending Deadlines Card */}
                            <div style={{ backgroundColor: 'var(--surface-container)', border: '1px solid var(--surface-highest)', borderRadius: 'var(--radius-lg)', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: 'var(--outline)', fontFamily: 'var(--font-mono)' }}>Pending Submissions</div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: upcomingDeadlines.length > 0 ? 'var(--amber)' : 'var(--emerald)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                                        {upcomingDeadlines.length}
                                    </div>
                                </div>
                                <Link to="/deadlines" style={{ fontSize: '11px', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                    <span>Review all deadlines</span>
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
                                </Link>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowSimulator(true)} className="btn-stitch-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>tune</span>
                                <span>Adjust What-If Endsem Marks / Set Target</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 2: Two-Column Workbench Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
                {/* Left: Active Enrolled Courses Matrix */}
                <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>auto_stories</span>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>Course Matrix</h3>
                        </div>
                        <Link to="/subjects" className="btn-stitch-secondary" style={{ fontSize: '11px', padding: '3px 8px' }}>
                            View Catalog
                        </Link>
                    </div>

                    {subjects.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            <p>No subjects enrolled.</p>
                            <Link to="/smart-add" className="btn-stitch-primary" style={{ marginTop: '0.75rem', fontSize: '12px' }}>
                                Add with Smart Add
                            </Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {subjects.map((s) => {
                                const pill = getGradePill(s.gradePoint);
                                return (
                                    <Link
                                        key={s._id}
                                        to={`/subjects/${s._id}`}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.85rem 1rem',
                                            backgroundColor: 'var(--surface-container)',
                                            border: '1px solid var(--surface-highest)',
                                            borderRadius: 'var(--radius-lg)',
                                            textDecoration: 'none',
                                            transition: 'all 0.15s',
                                        }}
                                        className="hover:border-primary"
                                    >
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <strong style={{ color: 'var(--text-main)', fontSize: '13px' }}>{s.name}</strong>
                                                {s.code && <span style={{ color: 'var(--text-dim)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>({s.code})</span>}
                                                <span className="stitch-pill stitch-pill-neutral" style={{ textTransform: 'capitalize' }}>
                                                    {s.type}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                                                {s.credits} Credits • {s.complete ? 'Complete' : `Score: ${s.percentageSoFar !== null ? `${s.percentageSoFar}% so far` : '–'}`}
                                            </div>
                                        </div>

                                        <span className={`stitch-pill ${pill.cls}`}>
                                            {s.complete ? pill.label : 'In Progress'}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right: Upcoming Deadlines & Evaluations */}
                <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: '20px' }}>timer</span>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>Upcoming Deadlines</h3>
                        </div>
                        <Link to="/deadlines" className="btn-stitch-secondary" style={{ fontSize: '11px', padding: '3px 8px' }}>
                            Manage All
                        </Link>
                    </div>

                    {upcomingDeadlines.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            <p>No upcoming deadlines! You're completely up to date. 🎉</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {upcomingDeadlines.map((d) => {
                                const dateInfo = getDateStatus(d.dueDate, d.status);
                                return (
                                    <div
                                        key={d._id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.85rem 1rem',
                                            backgroundColor: 'var(--surface-container)',
                                            border: '1px solid var(--surface-highest)',
                                            borderRadius: 'var(--radius-lg)',
                                        }}
                                    >
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{d.title}</strong>
                                                <span className="stitch-pill stitch-pill-neutral" style={{ textTransform: 'capitalize' }}>
                                                    {d.type}
                                                </span>
                                                {dateInfo && (
                                                    <span className={`stitch-pill ${dateInfo.cls}`}>
                                                        {dateInfo.label}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                                                {d.subjectId?.name || 'General'} • Due: {new Date(d.dueDate).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleToggleDone(d)}
                                            className="btn-stitch-secondary"
                                            style={{ padding: '4px 8px', fontSize: '11px' }}
                                            title="Mark Done"
                                        >
                                            ✓ Done
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* GPA Simulator Modal */}
            <GpaSimulatorModal
                isOpen={showSimulator}
                onClose={() => setShowSimulator(false)}
                subjects={subjects}
                onProjectedUpdate={(sgpa) => setLiveProjectedSGPA(sgpa)}
            />
        </div>
    );
}
