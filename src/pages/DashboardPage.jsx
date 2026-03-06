import { useState, useEffect } from 'react';
import { getUserLogs } from '../services/api';

export default function DashboardPage({ token }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const logsRes = await getUserLogs({ limit: 20 });
            setLogs(logsRes.data.logs || []);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-center">
                <div className="loading-spinner" />
            </div>
        );
    }

    // Calculate user-specific stats from their own logs
    const total = logs.length;
    const allowed = logs.filter(l => l.decision === 'ALLOW').length;
    const flagged = logs.filter(l => l.decision === 'FLAG').length;
    const blocked = logs.filter(l => l.decision === 'BLOCK').length;

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>My Security Dashboard</h1>
                <p>Your personal authentication history and security insights</p>
            </div>

            {/* Stat Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">My Logins</div>
                    <div className="stat-value">{total}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Allowed</div>
                    <div className="stat-value success">{allowed}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Flagged</div>
                    <div className="stat-value warning">{flagged}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Blocked</div>
                    <div className="stat-value danger">{blocked}</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <a href="/detect" className="action-card">
                    <div className="action-icon">🔍</div>
                    <div className="action-title">Deepfake Detector</div>
                    <div className="action-desc">Upload an image to check if it's AI-generated or real</div>
                </a>
            </div>

            {/* Login History */}
            <div className="dashboard-card full-width">
                <div className="card-header">My Login History</div>
                <div className="card-body" style={{ padding: 0 }}>
                    {logs.length > 0 ? (
                        <table className="logs-table">
                            <thead>
                                <tr>
                                    <th>IP Address</th>
                                    <th>Location</th>
                                    <th>Device</th>
                                    <th>Behavior</th>
                                    <th>Face AI</th>
                                    <th>Total</th>
                                    <th>Decision</th>
                                    <th>Face Verdict</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, i) => (
                                    <tr key={i}>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.ip_address}</td>
                                        <td>{log.city}, {log.country}</td>
                                        <td>{log.device_risk}</td>
                                        <td>{log.behavior_risk}</td>
                                        <td>{log.face_risk}</td>
                                        <td style={{ fontWeight: 700 }}>{log.total_risk}</td>
                                        <td>
                                            <span className={`decision-badge ${log.decision.toLowerCase()}`}>
                                                {log.decision}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`face-verdict ${(log.face_verdict || '').toLowerCase()}`}>
                                                {log.face_verdict || '—'}
                                            </span>
                                        </td>
                                        <td>{formatTime(log.timestamp)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">📋</div>
                            <p>No login history yet. This is your first session!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function formatTime(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
        ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
