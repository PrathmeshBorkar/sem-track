import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email.trim(), password);
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '75vh', padding: '1.5rem 1rem' }}>
            <div className="card" style={{ maxWidth: 420, width: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                {/* Top decorative glow bar */}
                <div style={{ position: 'absolute', top: 0, left: 32, right: 32, height: '2px', background: 'linear-gradient(to right, transparent, var(--primary), transparent)' }}></div>

                {/* Brand Header Ribbon */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>school</span>
                        <strong style={{ color: 'var(--text-main)' }}>SemTrack</strong>
                        <span className="stitch-pill stitch-pill-neutral font-mono" style={{ fontSize: '0.65rem' }}>v2.4</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--tertiary)', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--tertiary)' }}></span>
                        <span>VAULT ACTIVE</span>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div style={{ display: 'flex', background: 'var(--surface-lowest)', padding: '3px', borderRadius: '8px' }}>
                    <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        style={{ flex: 1, height: '32px', borderRadius: '6px' }}
                    >
                        Sign In
                    </button>
                    <Link
                        to="/register"
                        className="btn btn-sm btn-secondary"
                        style={{ flex: 1, height: '32px', borderRadius: '6px', border: 'transparent', background: 'transparent', color: 'var(--text-muted)' }}
                    >
                        Create Account
                    </Link>
                </div>

                {/* Brand Identity Header */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.4rem' }}>
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: '12px',
                        background: 'rgba(128, 131, 255, 0.12)',
                        border: '1px solid rgba(128, 131, 255, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)',
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>lock_open</span>
                    </div>

                    <h1 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0.15rem 0 0 0', letterSpacing: '-0.02em' }}>
                        Sign in to <span style={{ color: 'var(--primary)' }}>SemTrack</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                        Enter your academic credentials to access your dashboard
                    </p>
                </div>

                {error && <div className="alert alert-danger" style={{ margin: 0 }}>{error}</div>}

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Email Address</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, color: 'var(--text-dim)', fontSize: '18px', pointerEvents: 'none' }}>
                                mail
                            </span>
                            <input
                                type="email"
                                required
                                className="form-input"
                                style={{ paddingLeft: '2.5rem' }}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="student@university.edu"
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ margin: 0 }}>Password</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, color: 'var(--text-dim)', fontSize: '18px', pointerEvents: 'none' }}>
                                lock
                            </span>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                className="form-input"
                                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••••••"
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: 8,
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-dim)',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                title={showPassword ? 'Hide password' : 'Show password'}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                    {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !email.trim() || !password}
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            height: '42px',
                            marginTop: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            fontSize: '0.9rem',
                        }}
                    >
                        <span>{loading ? 'Authenticating...' : 'Access Academic OS'}</span>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                    </button>
                </form>

                {/* Footer Switcher */}
                <div style={{ textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                        Create one now
                    </Link>
                </div>
            </div>
        </div>
    );
}
