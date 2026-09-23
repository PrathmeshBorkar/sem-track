import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';

const PLACEHOLDER = `Add DBMS (CS301) theory, 4 credits
Marking: CCA1/15, Midsem/30, CCA2/15, Endsem/40
Deadline: DBMS mini-project for DBMS on 28 Oct`;

export default function SmartAddBox() {
    const [text, setText] = useState('');
    const [preview, setPreview] = useState(null); // parse result
    const [result, setResult] = useState(null);   // apply result
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const run = async (fn) => {
        setLoading(true);
        setError('');
        try {
            await fn();
        } catch (e) {
            setError(e.message || 'Action failed');
        } finally {
            setLoading(false);
        }
    };

    const handleParse = () => {
        if (!text.trim()) return;
        run(async () => {
            setResult(null);
            const data = await api.post('/api/smart-add/parse', { text });
            setPreview(data);
        });
    };

    const handleConfirm = () =>
        run(async () => {
            const { subjects, deadlines } = preview;
            const res = await api.post('/api/smart-add/apply', { subjects, deadlines });
            setResult(res);
            setPreview(null);
            setText('');
        });

    const nothingParsed = preview && preview.subjects.length === 0 && preview.deadlines.length === 0;
    const linesCount = text.trim().split('\n').filter(Boolean).length;

    return (
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingTop: '1rem' }}>
            {/* Top Navigation & Status Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                    <span>Back to Dashboard</span>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.2rem 0.65rem',
                        borderRadius: '999px',
                        background: 'var(--surface-container-high)',
                        color: 'var(--tertiary)',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)'
                    }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--tertiary)' }}></span>
                        <span>NLP Engine v2.4 Active</span>
                    </div>
                    <span className="stitch-pill stitch-pill-neutral font-mono">Compromise + DayJS</span>
                </div>
            </div>

            {/* Header Title */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                        Smart Add CLI Console
                    </h1>
                    <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                        background: 'rgba(128, 131, 255, 0.15)',
                        color: 'var(--primary)',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)'
                    }}>
                        v2.4 Natural Language Parser
                    </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                    Ingest raw course syllabi, grading schemes, and deadlines through natural language commands with zero manual form entry.
                </p>
            </div>

            {/* macOS-Style Terminal Window */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
                {/* Terminal Header */}
                <div style={{
                    padding: '0.75rem 1.25rem',
                    background: 'var(--surface-container-high)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }}></span>
                            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }}></span>
                            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>terminal</span>
                            <span>semtrack-cli --smart-add (zsh/fish)</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                            onClick={() => {
                                setText(PLACEHOLDER);
                                setPreview(null);
                            }}
                            className="btn btn-secondary btn-sm"
                            type="button"
                            style={{ fontSize: '0.75rem', height: '28px', padding: '0 0.6rem' }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--tertiary)' }}>auto_awesome</span>
                            <span>Load Example</span>
                        </button>
                        {text && (
                            <button
                                onClick={() => {
                                    setText('');
                                    setPreview(null);
                                }}
                                className="btn btn-secondary btn-sm"
                                type="button"
                                style={{ fontSize: '0.75rem', height: '28px', padding: '0 0.5rem', color: 'var(--rose)' }}
                                title="Clear Buffer"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Terminal Body */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--surface-container-lowest)' }}>
                    <div style={{ width: '100%' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            Command Buffer (Natural Language Input)
                        </label>
                        <textarea
                            rows={6}
                            className="form-textarea"
                            placeholder={PLACEHOLDER}
                            value={text}
                            onChange={(e) => {
                                setText(e.target.value);
                                setPreview(null);
                            }}
                            onKeyDown={(e) => {
                                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                    e.preventDefault();
                                    handleParse();
                                }
                            }}
                            style={{
                                width: '100%',
                                minHeight: '150px',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.875rem',
                                background: 'rgba(6, 14, 32, 0.75)',
                                border: '1px solid var(--surface-highest)',
                                borderRadius: '8px',
                                padding: '1rem',
                                color: 'var(--text-main)',
                                lineHeight: '1.6',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    {/* Terminal Footer Execution Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                            <span style={{ color: linesCount > 0 ? 'var(--tertiary)' : 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                                {linesCount} statement(s) ready
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                                Hotkey: <kbd style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'var(--surface-container)', color: 'var(--text-main)' }}>⌘ + Enter</kbd>
                            </span>
                            <button
                                onClick={handleParse}
                                disabled={loading || !text.trim()}
                                className="btn btn-primary"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>play_arrow</span>
                                <span>{loading ? 'Synthesizing...' : 'Parse & Compile Commands'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div style={{ padding: '1rem 1.25rem', background: 'rgba(244, 63, 94, 0.1)', borderTop: '1px solid rgba(244, 63, 94, 0.25)', color: 'var(--rose)', fontSize: '0.85rem' }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Parsed Output Stream: 2-Column Responsive Layout */}
                {preview && (
                    <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', background: 'var(--surface-container)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>account_tree</span>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Extracted Semantic Entities</h3>
                            </div>
                            <span style={{
                                padding: '0.2rem 0.6rem',
                                borderRadius: '999px',
                                background: 'var(--surface-container-high)',
                                color: 'var(--tertiary)',
                                fontSize: '0.75rem',
                                fontFamily: 'var(--font-mono)'
                            }}>
                                {preview.subjects.length} Course(s), {preview.deadlines.length} Deadline(s) Identified
                            </span>
                        </div>

                        {nothingParsed ? (
                            <p style={{ color: 'var(--amber)', fontSize: '0.85rem' }}>
                                No courses or deadlines could be extracted from your input. Try using the example syntax above.
                            </p>
                        ) : (
                            <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                                {/* Left Column: Courses */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                                        Structured Course Entities
                                    </span>
                                    {preview.subjects.map((s, i) => (
                                        <div
                                            key={`s${i}`}
                                            style={{
                                                padding: '1.25rem',
                                                backgroundColor: 'var(--surface-container-low)',
                                                borderRadius: '10px',
                                                border: '1px solid var(--border)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.75rem'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <span className="stitch-pill stitch-pill-primary font-mono" style={{ textTransform: 'uppercase' }}>{s.type}</span>
                                                    <span className="stitch-pill stitch-pill-emerald font-mono">{s.credits} Credits</span>
                                                </div>
                                                <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--tertiary)' }}>{s.code || 'NO CODE'}</span>
                                            </div>

                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{s.name}</h4>
                                            </div>

                                            {s.markingScheme?.length > 0 && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingTop: '0.35rem', borderTop: '1px solid var(--border)' }}>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Evaluation Scheme</span>
                                                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(s.markingScheme.length, 4)}, 1fr)`, gap: '0.4rem' }}>
                                                        {s.markingScheme.map((c, idx) => (
                                                            <div key={idx} style={{ background: 'var(--surface-container)', padding: '0.4rem 0.5rem', borderRadius: '6px', textAlign: 'center' }}>
                                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.name}</div>
                                                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{c.maxMarks}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {preview.subjects.length === 0 && (
                                        <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--surface-container-low)', color: 'var(--text-dim)', fontSize: '0.85rem', textAlign: 'center' }}>
                                            No course definitions found in buffer
                                        </div>
                                    )}
                                </div>

                                {/* Right Column: Deadlines */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                                        Extracted Deliverables & Timelines
                                    </span>
                                    {preview.deadlines.map((d, i) => (
                                        <div
                                            key={`d${i}`}
                                            style={{
                                                padding: '1.25rem',
                                                backgroundColor: 'var(--surface-container-low)',
                                                borderRadius: '10px',
                                                border: '1px solid var(--border)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span className="stitch-pill stitch-pill-neutral font-mono">{d.type}</span>
                                                <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>#{d.subjectName}</span>
                                            </div>

                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{d.title}</h4>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--amber)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>schedule</span>
                                                <span>Due {new Date(d.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {preview.deadlines.length === 0 && (
                                        <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--surface-container-low)', color: 'var(--text-dim)', fontSize: '0.85rem', textAlign: 'center' }}>
                                            No deadlines or deliverables found in buffer
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {preview.warnings?.length > 0 && (
                            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                <strong style={{ fontSize: '0.8rem', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>info</span>
                                    Parsing Notices:
                                </strong>
                                <ul style={{ color: 'var(--text-muted)', fontSize: '0.8rem', paddingLeft: '1.2rem', margin: '0.35rem 0 0 0' }}>
                                    {preview.warnings.map((w, i) => (
                                        <li key={`w${i}`}>{w}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button onClick={() => setPreview(null)} className="btn btn-secondary btn-sm">
                                Discard
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={loading || nothingParsed}
                                className="btn btn-primary"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>database</span>
                                <span>Commit to SemTrack Database</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Apply Result Message */}
                {result && (
                    <div style={{ padding: '1.25rem', background: 'rgba(16, 185, 129, 0.08)', borderTop: '1px solid rgba(16, 185, 129, 0.25)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--emerald)', fontWeight: 600, fontSize: '0.95rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span>
                            <span>Committed {result.createdSubjects} course(s) and {result.createdDeadlines} deadline(s) successfully!</span>
                        </div>
                        {result.skipped?.length > 0 && (
                            <div style={{ fontSize: '0.8rem', marginTop: '0.35rem', color: 'var(--amber)' }}>
                                Note: {result.skipped.join('; ')}
                            </div>
                        )}
                        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem' }}>
                            <Link to="/subjects" className="btn btn-secondary btn-sm">
                                View Subjects Catalog →
                            </Link>
                            <Link to="/deadlines" className="btn btn-secondary btn-sm">
                                View Deadlines Timeline →
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}