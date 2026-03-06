import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { registerUser } from '../services/api';

export default function RegisterPage({ onLogin }) {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Webcam
    const webcamRef = useRef(null);
    const [faceImage, setFaceImage] = useState('');
    const [webcamReady, setWebcamReady] = useState(false);

    // Typing speed
    const [keyTimestamps, setKeyTimestamps] = useState([]);
    const [typingSpeed, setTypingSpeed] = useState(0);

    const handleKeyDown = () => {
        const now = Date.now();
        setKeyTimestamps(prev => {
            const updated = [...prev, now].slice(-20);
            if (updated.length >= 3) {
                const intervals = [];
                for (let i = 1; i < updated.length; i++) {
                    intervals.push(updated[i] - updated[i - 1]);
                }
                const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                setTypingSpeed(Math.round(60000 / (avg * 5)));
            }
            return updated;
        });
    };

    const capturePhoto = useCallback(() => {
        if (webcamRef.current) {
            const shot = webcamRef.current.getScreenshot();
            setFaceImage(shot || '');
        }
    }, []);

    const getDeviceInfo = () => ({
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenResolution: `${screen.width}x${screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Email and password are required.');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        // Auto-capture
        let currentFaceImage = faceImage;
        if (!currentFaceImage && webcamRef.current) {
            const shot = webcamRef.current.getScreenshot();
            if (shot) {
                setFaceImage(shot);
                currentFaceImage = shot;
            }
        }

        setLoading(true);
        try {
            const res = await registerUser({
                email,
                password,
                faceImage: currentFaceImage || '',
                deviceInfo: getDeviceInfo(),
                typingSpeed,
            });

            const { token, email: userEmail, role } = res.data;
            onLogin(token, userEmail, role || 'user');
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Create Account</h1>
                    <p>Register your identity baseline for AI-powered security</p>
                </div>

                {error && <div className="error-alert">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Min 6 characters"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Re-enter your password"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        {typingSpeed > 0 && (
                            <div className="typing-speed-display">Typing speed: ~{typingSpeed} WPM</div>
                        )}
                    </div>

                    <div className="webcam-section">
                        <label>🔒 Face Registration <span className="label-hint">(Your face baseline for future verification)</span></label>
                        {faceImage ? (
                            <>
                                <div className="webcam-wrap">
                                    <img src={faceImage} alt="Captured" className="webcam-captured" />
                                    <div className="webcam-captured-badge">✅ Face Captured</div>
                                </div>
                                <div className="webcam-controls">
                                    <button type="button" className="btn btn-outline" onClick={() => setFaceImage('')}>
                                        Retake
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="webcam-wrap">
                                    <Webcam
                                        ref={webcamRef}
                                        audio={false}
                                        screenshotFormat="image/jpeg"
                                        width="100%"
                                        videoConstraints={{ facingMode: 'user', width: 480, height: 360 }}
                                        onUserMedia={() => setWebcamReady(true)}
                                        onUserMediaError={() => setWebcamReady(false)}
                                    />
                                </div>
                                <div className="webcam-controls">
                                    <button type="button" className="btn btn-outline" onClick={capturePhoto} disabled={!webcamReady}>
                                        📸 Capture Face
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <><span className="spinner-sm" /> Creating Account...</> : '🚀 Register'}
                    </button>
                </form>

                <div className="form-footer">
                    Already have an account? <Link to="/login">Sign In</Link>
                </div>
            </div>
        </div>
    );
}
