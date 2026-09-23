import { useState, useEffect } from 'react';
import api from '../api.js';

function getDateStatus(dueDateStr, status) {
    if (status === 'done') return null; // Never tag done items as overdue
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const due = new Date(dueDateStr);
    const dueStr = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`;

    if (dueStr < todayStr) return { label: 'Overdue', pillClass: 'stitch-pill-rose', icon: 'alarm' };
    if (dueStr === todayStr) return { label: 'Due Today', pillClass: 'stitch-pill-amber', icon: 'schedule' };

    // Calculate days remaining
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
        label: diffDays <= 1 ? 'Due Tomorrow' : `In ${diffDays} Days`,
        pillClass: 'stitch-pill-neutral',
        icon: 'calendar_today',
    };
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

export default function DeadlinesPage() {
    const [deadlines, setDeadlines] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // New Deadline Modal State
    const [showModal, setShowModal] = useState(false);
    const [newDeadline, setNewDeadline] = useState({
        title: '',
        subjectId: '',
        dueDate: '',
        type: 'assignment',
        notes: '',
        link: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [modalError, setModalError] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            const [deadlinesRes, subjectsRes] = await Promise.all([
                api.get('/api/deadlines'),
                api.get('/api/subjects'),
            ]);
            setDeadlines(deadlinesRes);
            setSubjects(subjectsRes);
            if (subjectsRes.length > 0 && !newDeadline.subjectId) {
                setNewDeadline((prev) => ({ ...prev, subjectId: subjectsRes[0]._id }));
            }
        } catch (err) {
            setError(err.message || 'Failed to load deadlines');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreateDeadline = async (e) => {
        e.preventDefault();
        setModalError('');

        if (!newDeadline.title.trim()) {
            setModalError('Title is required');
            return;
        }
        if (!newDeadline.subjectId) {
            setModalError('Please select a course');
            return;
        }
        if (!newDeadline.dueDate) {
            setModalError('Due date is required');
            return;
        }
        if (newDeadline.link && !isSafeUrl(newDeadline.link)) {
            setModalError('Link must start with http:// or https://');
            return;
        }

        setSubmitting(true);

        try {
            // EOD serialization: send as end-of-day local time to match Smart Add
            const eodDate = new Date(`${newDeadline.dueDate}T23:59:59`);

            const created = await api.post('/api/deadlines', {
                title: newDeadline.title.trim(),
                subjectId: newDeadline.subjectId,
                dueDate: eodDate,
                type: newDeadline.type,
                notes: newDeadline.notes.trim(),
                link: newDeadline.link.trim(),
            });

            setDeadlines((prev) => [...prev, created]);
            setShowModal(false);
            setNewDeadline({
                title: '',
                subjectId: subjects[0]?._id || '',
                dueDate: '',
                type: 'assignment',
                notes: '',
                link: '',
            });
        } catch (err) {
            setModalError(err.message || 'Failed to create deadline');
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const updated = await api.put(`/api/deadlines/${id}`, { status: newStatus });
            setDeadlines((prev) => prev.map((d) => (d._id === id ? updated : d)));
        } catch (err) {
            alert(err.message || 'Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this deliverable?')) return;
        try {
            await api.delete(`/api/deadlines/${id}`);
            setDeadlines((prev) => prev.filter((d) => d._id !== id));
        } catch (err) {
            alert(err.message || 'Failed to delete deliverable');
        }
    };

    const filtered = deadlines.filter((d) => {
        if (statusFilter === 'all') return true;
        return d.status === statusFilter;
    });

    const pendingCount = deadlines.filter((d) => d.status === 'pending').length;
    const inProgressCount = deadlines.filter((d) => d.status === 'in_progress').length;
    const doneCount = deadlines.filter((d) => d.status === 'done').length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                        Deliverables Timeline & Milestones
                    </div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                        Deadlines & Deliverables
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                        Track course assignments, lab reports, project submissions, and upcoming examination dates
                    </p>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary"
                    disabled={subjects.length === 0}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                    <span>Schedule Deliverable</span>
                </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {subjects.length === 0 && !loading && (
                <div className="alert alert-warning" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--amber)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                    You need to enroll at least one course before creating deliverables. Go to <a href="/subjects" style={{ color: 'var(--amber)', fontWeight: 600 }}>Courses</a> or use <a href="/smart-add" style={{ color: 'var(--amber)', fontWeight: 600 }}>Smart Add</a>.
                </div>
            )}

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', background: 'var(--surface-container-low)', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
                {[
                    { id: 'all', label: 'All Tasks', count: deadlines.length },
                    { id: 'pending', label: 'Pending', count: pendingCount },
                    { id: 'in_progress', label: 'In Progress', count: inProgressCount },
                    { id: 'done', label: 'Completed', count: doneCount },
                ].map((tab) => {
                    const active = statusFilter === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`btn btn-sm ${active ? 'btn-primary' : 'btn-secondary'}`}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                borderRadius: '7px',
                                height: '32px',
                                padding: '0 0.75rem',
                                border: active ? 'none' : 'transparent',
                                background: active ? undefined : 'transparent'
                            }}
                        >
                            <span>{tab.label}</span>
                            <span style={{
                                padding: '0.1rem 0.4rem',
                                borderRadius: '999px',
                                fontSize: '0.7rem',
                                background: active ? 'rgba(255, 255, 255, 0.2)' : 'var(--surface-container-highest)',
                                fontFamily: 'var(--font-mono)'
                            }}>
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>progress_activity</span>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Loading deliverables...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>event_available</span>
                    <p>No deadlines found in this category.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filtered.map((d) => {
                        const dateInfo = getDateStatus(d.dueDate, d.status);
                        const safeLink = isSafeUrl(d.link);
                        const isDone = d.status === 'done';

                        return (
                            <div
                                key={d._id}
                                className="card"
                                style={{
                                    padding: '1rem 1.25rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '1rem',
                                    background: isDone ? 'var(--surface-container-lowest)' : 'var(--surface-container-low)',
                                    opacity: isDone ? 0.65 : 1,
                                    borderLeft: `3px solid ${
                                        isDone
                                            ? 'var(--emerald)'
                                            : d.type === 'exam'
                                            ? 'var(--rose)'
                                            : 'var(--primary)'
                                    }`,
                                    transition: 'opacity 0.2s, background 0.2s',
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <strong style={{
                                            fontSize: '1rem',
                                            textDecoration: isDone ? 'line-through' : 'none',
                                            color: isDone ? 'var(--text-muted)' : 'var(--text-main)',
                                        }}>
                                            {d.title}
                                        </strong>

                                        <span className="stitch-pill stitch-pill-neutral font-mono" style={{ textTransform: 'capitalize' }}>
                                            {d.type}
                                        </span>

                                        {dateInfo && (
                                            <span className={`stitch-pill ${dateInfo.pillClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>{dateInfo.icon}</span>
                                                <span>{dateInfo.label}</span>
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                                            {d.subjectId?.name || 'Course'}
                                        </span>
                                        <span>•</span>
                                        <span>Due: <strong style={{ color: 'var(--text-main)' }}>{new Date(d.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
                                        {d.notes && (
                                            <>
                                                <span>•</span>
                                                <span>{d.notes}</span>
                                            </>
                                        )}
                                    </div>

                                    {d.link && (
                                        <div style={{ fontSize: '0.8rem', marginTop: '0.15rem' }}>
                                            {safeLink ? (
                                                <a href={d.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>link</span>
                                                    <span>Submission Link</span>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>open_in_new</span>
                                                </a>
                                            ) : (
                                                <span style={{ color: 'var(--rose)' }}>[Unsafe link]</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <select
                                        className="form-select"
                                        style={{ width: 130, height: '34px', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                                        value={d.status}
                                        onChange={(e) => handleStatusChange(d._id, e.target.value)}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="done">Completed</option>
                                    </select>

                                    <button
                                        onClick={() => handleDelete(d._id)}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
                                        title="Delete deadline"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Schedule Deliverable Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, position: 'relative', overflow: 'hidden' }}>
                        {/* Top decorative accent bar */}
                        <div style={{ position: 'absolute', top: 0, left: 32, right: 32, height: '2px', background: 'linear-gradient(to right, transparent, var(--primary), transparent)' }}></div>

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
                                    color: 'var(--primary)'
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>event</span>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                                        Schedule Deliverable
                                    </h3>
                                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Set milestones, assignments, and exam deadlines.
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm" style={{ width: 30, height: 30, padding: 0 }}>
                                ✕
                            </button>
                        </div>

                        {modalError && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{modalError}</div>}

                        <form onSubmit={handleCreateDeadline} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Deliverable Title *</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    placeholder="e.g. Mini-Project Implementation & Report"
                                    value={newDeadline.title}
                                    onChange={(e) => setNewDeadline({ ...newDeadline, title: e.target.value })}
                                />
                            </div>

                            <div className="grid-2" style={{ gap: '0.75rem' }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Target Course *</label>
                                    <select
                                        className="form-select"
                                        required
                                        value={newDeadline.subjectId}
                                        onChange={(e) => setNewDeadline({ ...newDeadline, subjectId: e.target.value })}
                                    >
                                        {subjects.map((s) => (
                                            <option key={s._id} value={s._id}>
                                                {s.code ? `[${s.code}] ` : ''}{s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Deliverable Type</label>
                                    <select
                                        className="form-select"
                                        value={newDeadline.type}
                                        onChange={(e) => setNewDeadline({ ...newDeadline, type: e.target.value })}
                                    >
                                        <option value="assignment">Assignment</option>
                                        <option value="project">Project</option>
                                        <option value="exam">Exam</option>
                                        <option value="quiz">Quiz</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Due Date *</label>
                                <input
                                    type="date"
                                    required
                                    className="form-input"
                                    value={newDeadline.dueDate}
                                    onChange={(e) => setNewDeadline({ ...newDeadline, dueDate: e.target.value })}
                                />
                            </div>

                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Submission Link (optional)</label>
                                <input
                                    type="url"
                                    className="form-input"
                                    placeholder="https://lms.university.edu/..."
                                    value={newDeadline.link}
                                    onChange={(e) => setNewDeadline({ ...newDeadline, link: e.target.value })}
                                />
                            </div>

                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Notes & Instructions (optional)</label>
                                <textarea
                                    className="form-textarea"
                                    rows={2}
                                    placeholder="Optional instructions, rubrics, or teammate notes..."
                                    value={newDeadline.notes}
                                    onChange={(e) => setNewDeadline({ ...newDeadline, notes: e.target.value })}
                                    style={{ minHeight: '70px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting || !newDeadline.title.trim() || !newDeadline.dueDate} className="btn btn-primary">
                                    {submitting ? 'Scheduling...' : 'Schedule Deliverable'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
