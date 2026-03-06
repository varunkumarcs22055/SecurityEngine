import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ isAuth, email, role, onLogout }) {
    const location = useLocation();
    const path = location.pathname;
    const isAdmin = role === 'admin';

    return (
        <nav className={`navbar ${isAdmin ? 'navbar-admin' : ''}`}>
            <div className="nav-inner">
                <Link to="/" className="nav-brand">
                    <div className={`brand-icon ${isAdmin ? 'brand-admin' : ''}`}>
                        {isAdmin ? '⚡' : 'QS'}
                    </div>
                    <span className="brand-text">
                        {isAdmin ? 'QuantumShield Admin' : 'QuantumShield'}
                    </span>
                </Link>

                <div className="nav-links">
                    {isAuth ? (
                        <>
                            {isAdmin ? (
                                <Link to="/admin/dashboard" className={`nav-link${path === '/admin/dashboard' ? ' active' : ''}`}>
                                    🛡️ Admin Panel
                                </Link>
                            ) : (
                                <>
                                    <Link to="/dashboard" className={`nav-link${path === '/dashboard' ? ' active' : ''}`}>
                                        Dashboard
                                    </Link>
                                    <Link to="/detect" className={`nav-link${path === '/detect' ? ' active' : ''}`}>
                                        🔍 Detect
                                    </Link>
                                </>
                            )}
                            <span className="nav-link nav-email" style={{ color: '#9ca3af', cursor: 'default' }}>
                                {isAdmin && '👑 '}{email}
                            </span>
                            <button className="nav-btn-logout" onClick={onLogout}>Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className={`nav-link${path === '/login' ? ' active' : ''}`}>
                                Login
                            </Link>
                            <Link to="/register" className={`nav-link${path === '/register' ? ' active' : ''}`}>
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
