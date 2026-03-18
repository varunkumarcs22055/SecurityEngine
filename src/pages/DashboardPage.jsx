import { useState, useEffect } from 'react';
import { getUserProfile, getUserLogs } from '../services/api';

export default function DashboardPage({ token }) {
    const [profile, setProfile] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [profileRes, logsRes] = await Promise.all([
                getUserProfile(),
                getUserLogs({ limit: 20 }),
            ]);
            setProfile(profileRes.data);
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

    const total = logs.length;
    const allowed = logs.filter(l => l.decision === 'ALLOW').length;
    const flagged = logs.filter(l => l.decision === 'FLAG').length;
    const blocked = logs.filter(l => l.decision === 'BLOCK').length;
    const avgRisk = total > 0
        ? Math.round(logs.reduce((s, l) => s + l.total_risk, 0) / total)
        : 0;

    const securityStatus = profile?.security_status || 'safe';
    const statusConfig = {
        safe:       { label: 'Secure', color: 'success', icon: '🛡️' },
        suspicious: { label: 'Suspicious Activity', color: 'warning', icon: '⚠️' },
        blocked:    { label: 'Account Blocked', color: 'danger', icon: '🚫' },
    };
    const statusInfo = statusConfig[securityStatus] || statusConfig.safe;

    const displayName = profile?.name
        || localStorage.getItem('name')
        || profile?.email?.split('@')[0]
        || 'User';
    const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Security Dashboard</h1>
                <p>Your personal authentication history and AI security insights</p>
            </div>

            {/* ── Profile Hero Card ── */}
            <div className="profile-hero">
                <div className="profile-avatar">{initials}</div>
                <div className="profile-info">
                    <div className="profile-name">{displayName}</div>
                    <div className="profile-email">{profile?.email}</div>
                    <div className="profile-meta">
                        <span>📍 {profile?.home_city || 'Unknown'}, {profile?.home_country || 'Unknown'}</span>
                        <span>  •  </span>
                        <span>🔑 {profile?.login_count || 0} logins</span>
                        <span>  •  </span>
                        <span>{profile?.is_face_verified ? '✅ Face Verified' : '⚠️ Face Unverified'}</span>
                    </div>
                </div>
                <div className={`security-status-badge ${statusInfo.color}`}>
                    <span>{statusInfo.icon}</span>
                    <span>{statusInfo.label}</span>
                </div>
            </div>

            {/* Last Login Banner */}
            {profile?.last_login && (
                <div className="last-login-banner">
                    <span className="last-login-icon">🕐</span>
                    <span>
                        Last login: <strong>{formatTime(profile.last_login.timestamp)}</strong>
                        {' '}from <strong>{profile.last_login.city}, {profile.last_login.country}</strong>
                        {' '}— <span className={`decision-badge ${profile.last_login.decision.toLowerCase()}`}>
                            {profile.last_login.decision}
                        </span>
                    </span>
                </div>
            )}

            {/* ── Stats Row ── */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">🔓</div>
                    <div className="stat-label">Total Logins</div>
                    <div className="stat-value">{total}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-label">Allowed</div>
                    <div className="stat-value success">{allowed}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-label">Flagged</div>
                    <div className="stat-value warning">{flagged}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🚫</div>
                    <div className="stat-label">Blocked</div>
                    <div className="stat-value danger">{blocked}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-label">Avg. Risk</div>
                    <div className={`stat-value ${avgRisk > 60 ? 'danger' : avgRisk > 30 ? 'warning' : 'success'}`}>
                        {avgRisk}
                    </div>
                </div>
            </div>

            {/* ── Tab Navigation ── */}
            <div className="admin-tabs">
                {['overview', 'history'].map(tab => (
                    <button
                        key={tab}
                        className={`admin-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'overview' ? '📊 Overview' : '📋 Login History'}
                    </button>
                ))}
            </div>

            {/* ── Overview Tab ── */}
            {activeTab === 'overview' && (
                <div className="dashboard-grid">
                    {/* Security Score Ring */}
                    <div className="dashboard-card">
                        <div className="card-header">Security Score</div>
                        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                            <div className="score-ring-wrap">
                                <svg width="140" height="140" viewBox="0 0 140 140">
                                    <circle cx="70" cy="70" r="56" fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="14"/>
                                    <circle
                                        cx="70" cy="70" r="56" fill="none"
                                        stroke={avgRisk > 60 ? '#ef4444' : avgRisk > 30 ? '#f59e0b' : '#10b981'}
                                        strokeWidth="14"
                                        strokeDasharray={`${((100 - avgRisk) / 100) * 351.9} 351.9`}
                                        strokeLinecap="round"
                                        transform="rotate(-90 70 70)"
                                    />
                                    <text x="70" y="65" textAnchor="middle" fill="white" fontSize="26" fontWeight="700">
                                        {100 - avgRisk}
                                    </text>
                                    <text x="70" y="84" textAnchor="middle" fill="#94a3b8" fontSize="11">
                                        out of 100
                                    </text>
                                </svg>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div className={`security-status-badge ${statusInfo.color}`} style={{ display: 'inline-flex', margin: '0 auto' }}>
                                    {statusInfo.icon} {statusInfo.label}
                                </div>
                                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 10 }}>
                                    Based on your last {total} login{total !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Risk Breakdown */}
                    <div className="dashboard-card">
                        <div className="card-header">Risk Breakdown</div>
                        <div className="card-body">
                            {total > 0 ? (
                                <>
                                    {[
                                        { label: 'Device Risk', value: Math.round(logs.reduce((s,l) => s+l.device_risk,0)/total), max: 20, cls: 'device' },
                                        { label: 'Location Risk', value: Math.round(logs.reduce((s,l) => s+l.location_risk,0)/total), max: 25, cls: 'location' },
                                        { label: 'Behavior Risk', value: Math.round(logs.reduce((s,l) => s+l.behavior_risk,0)/total), max: 30, cls: 'behavior' },
                                        { label: 'Face AI Risk', value: Math.round(logs.reduce((s,l) => s+l.face_risk,0)/total), max: 30, cls: 'face' },
                                    ].map(({ label, value, max, cls }) => (
                                        <div className="risk-chart-bar" key={label}>
                                            <div className="risk-chart-label">{label}</div>
                                            <div className="risk-chart-track">
                                                <div className={`risk-chart-fill ${cls}`} style={{ width: `${(value/max)*100}%` }} />
                                            </div>
                                            <div className="risk-chart-value">{value}/{max}</div>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-state-icon">📊</div>
                                    <p>No login data yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
                        <div className="card-header">Quick Actions</div>
                        <div className="card-body">
                            <div className="quick-actions">
                                <a href="/detect" className="action-card">
                                    <div className="action-icon">🔍</div>
                                    <div className="action-title">Deepfake Detector</div>
                                    <div className="action-desc">Upload or scan an image for AI/deepfake detection</div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Login History Tab ── */}
            {activeTab === 'history' && (
                <div className="dashboard-card full-width">
                    <div className="card-header">Login History</div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {logs.length > 0 ? (
                            <table className="logs-table">
                                <thead>
                                    <tr>
                                        <th>Location</th>
                                        <th>IP</th>
                                        <th>Device</th>
                                        <th>Behavior</th>
                                        <th>Face AI</th>
                                        <th>Total</th>
                                        <th>Decision</th>
                                        <th>Face</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log, i) => (
                                        <tr key={i} className={log.is_suspicious ? 'row-suspicious' : ''}>
                                            <td>{log.city}, {log.country}</td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.ip_address}</td>
                                            <td>{log.device_risk}</td>
                                            <td>{log.behavior_risk}</td>
                                            <td>{log.face_risk}</td>
                                            <td style={{ fontWeight: 700 }}>{log.total_risk}</td>
                                            <td><span className={`decision-badge ${log.decision.toLowerCase()}`}>{log.decision}</span></td>
                                            <td><span className={`face-verdict ${(log.face_verdict || '').toLowerCase()}`}>{log.face_verdict || '—'}</span></td>
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
            )}
        </div>
    );
}

function formatTime(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
        ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
