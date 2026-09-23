import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (!user) return null;

    const initial = (user.name || user.email || '?')[0].toUpperCase();

    return (
        <header className="top-header">
            {/* Brand Logo & Version Pill */}
            <div className="brand-group">
                <NavLink to="/" className="brand-title">
                    <span className="material-symbols-outlined" style={{ fontSize: '26px', color: 'var(--primary)' }}>
                        deployed_code
                    </span>
                    <span>Sem</span>Track
                </NavLink>
                <div className="os-pill">
                    <span className="os-pill-pulse"></span>
                    OS v2.4
                </div>
            </div>

            {/* Centered Navigation Pills (Desktop) */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'rgba(6, 14, 32, 0.8)', padding: '4px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--surface-highest)' }}>
                <NavLink
                    to="/"
                    end
                    style={({ isActive }) => ({
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-lg)',
                        color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                        backgroundColor: isActive ? 'var(--surface-high)' : 'transparent',
                        fontWeight: isActive ? 600 : 400,
                        fontSize: '13px',
                        textDecoration: 'none',
                        transition: 'all 0.15s',
                    })}
                >
                    Dashboard
                </NavLink>
                <NavLink
                    to="/subjects"
                    style={({ isActive }) => ({
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-lg)',
                        color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                        backgroundColor: isActive ? 'var(--surface-high)' : 'transparent',
                        fontWeight: isActive ? 600 : 400,
                        fontSize: '13px',
                        textDecoration: 'none',
                        transition: 'all 0.15s',
                    })}
                >
                    Subjects
                </NavLink>
                <NavLink
                    to="/deadlines"
                    style={({ isActive }) => ({
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-lg)',
                        color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                        backgroundColor: isActive ? 'var(--surface-high)' : 'transparent',
                        fontWeight: isActive ? 600 : 400,
                        fontSize: '13px',
                        textDecoration: 'none',
                        transition: 'all 0.15s',
                    })}
                >
                    Deadlines
                </NavLink>
                <NavLink
                    to="/smart-add"
                    style={({ isActive }) => ({
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-lg)',
                        color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                        backgroundColor: isActive ? 'var(--surface-high)' : 'transparent',
                        fontWeight: isActive ? 600 : 400,
                        fontSize: '13px',
                        textDecoration: 'none',
                        transition: 'all 0.15s',
                    })}
                >
                    Smart Add
                </NavLink>
            </nav>

            {/* Quick Actions & Profile Chip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <NavLink to="/smart-add" className="btn-stitch-primary" style={{ padding: '5px 12px', fontSize: '12px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                    <span>Quick Add</span>
                    <kbd style={{ marginLeft: '4px', padding: '1px 5px', borderRadius: '3px', backgroundColor: 'rgba(6, 14, 32, 0.5)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>⌘K</kbd>
                </NavLink>

                {/* Profile Pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '4px 10px 4px 5px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--surface-container)', border: '1px solid var(--surface-highest)' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                        {initial}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 500 }}>{user.name}</span>
                        <span style={{ fontSize: '10px', color: 'var(--secondary)', fontFamily: 'var(--font-mono)' }}>Sem 5 • Student</span>
                    </div>
                </div>

                <button onClick={handleLogout} className="btn-stitch-secondary" style={{ padding: '5px 10px', fontSize: '12px' }}>
                    Logout
                </button>
            </div>
        </header>
    );
}
