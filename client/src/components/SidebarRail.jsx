import { NavLink } from 'react-router-dom';

export default function SidebarRail({ stats }) {
    const completedCredits = stats?.completedCredits || 0;
    const totalCredits = stats?.totalCredits || 0;
    const currentSGPA = stats?.currentSGPA;

    return (
        <aside className="side-rail">
            <div>
                <span className="rail-section-title">Academic Space</span>
                <nav className="rail-nav">
                    <NavLink to="/" end className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>grid_view</span>
                        <span>Overview</span>
                    </NavLink>
                    <NavLink to="/subjects" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>auto_stories</span>
                        <span>Course Matrix</span>
                    </NavLink>
                    <NavLink to="/deadlines" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>timer</span>
                        <span>Deadlines & Exams</span>
                    </NavLink>
                    <NavLink to="/smart-add" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>neurology</span>
                        <span>Syllabus Parser</span>
                    </NavLink>
                </nav>

                {/* Telemetry Box */}
                <div style={{ marginTop: '2rem' }}>
                    <span className="rail-section-title">Telemetry</span>
                    <div style={{ backgroundColor: 'var(--surface-container)', border: '1px solid var(--surface-highest)', borderRadius: 'var(--radius-lg)', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Current SGPA</span>
                            <span style={{ fontSize: '11px', color: 'var(--tertiary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                                {currentSGPA !== null && currentSGPA !== undefined ? `${currentSGPA} / 10.0` : '– / 10.0'}
                            </span>
                        </div>
                        <div style={{ width: '100%', height: '5px', borderRadius: '3px', backgroundColor: 'var(--surface-high)', overflow: 'hidden' }}>
                            <div
                                style={{
                                    height: '100%',
                                    borderRadius: '3px',
                                    background: 'linear-gradient(to right, var(--primary), var(--tertiary))',
                                    width: currentSGPA ? `${(currentSGPA / 10) * 100}%` : '0%',
                                    transition: 'width 0.3s',
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--outline)', fontFamily: 'var(--font-mono)' }}>
                            <span>Credits</span>
                            <span style={{ color: 'var(--text-main)' }}>{completedCredits} / {totalCredits}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sync Engine Pill */}
            <div style={{ padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'rgba(23, 31, 51, 0.6)', border: '1px solid var(--surface-highest)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--tertiary)', animation: 'pulse 2s infinite' }}></span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Sync Engine</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>Online</span>
            </div>
        </aside>
    );
}
