import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DetectPage from './pages/DetectPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import './App.css';

function App() {
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [email, setEmail] = useState(localStorage.getItem('email') || '');
    const [role, setRole] = useState(localStorage.getItem('role') || '');

    const handleLogin = (newToken, newEmail, newRole = 'user') => {
        setToken(newToken);
        setEmail(newEmail);
        setRole(newRole);
        localStorage.setItem('token', newToken);
        localStorage.setItem('email', newEmail);
        localStorage.setItem('role', newRole);
    };

    const handleLogout = () => {
        setToken('');
        setEmail('');
        setRole('');
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        localStorage.removeItem('role');
    };

    const isAuth = !!token;
    const isAdmin = role === 'admin';

    return (
        <Router>
            <Navbar isAuth={isAuth} email={email} role={role} onLogout={handleLogout} />
            <Routes>
                {/* User Auth */}
                <Route
                    path="/login"
                    element={isAuth ? <Navigate to={isAdmin ? '/admin/dashboard' : '/dashboard'} /> : <LoginPage onLogin={handleLogin} />}
                />
                <Route
                    path="/register"
                    element={isAuth ? <Navigate to="/dashboard" /> : <RegisterPage onLogin={handleLogin} />}
                />

                {/* User Pages */}
                <Route
                    path="/dashboard"
                    element={isAuth && !isAdmin ? <DashboardPage token={token} /> : <Navigate to="/login" />}
                />
                <Route
                    path="/detect"
                    element={isAuth ? <DetectPage token={token} /> : <Navigate to="/login" />}
                />

                {/* Admin Secret Login */}
                <Route
                    path="/quantum-admin"
                    element={isAdmin ? <Navigate to="/admin/dashboard" /> : <AdminLoginPage onLogin={handleLogin} />}
                />

                {/* Admin Dashboard */}
                <Route
                    path="/admin/dashboard"
                    element={isAuth && isAdmin ? <AdminDashboardPage token={token} /> : <Navigate to="/quantum-admin" />}
                />

                {/* Default redirect */}
                <Route path="*" element={
                    <Navigate to={isAuth ? (isAdmin ? '/admin/dashboard' : '/dashboard') : '/login'} />
                } />
            </Routes>
        </Router>
    );
}

export default App;
