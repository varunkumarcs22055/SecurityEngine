import { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';

const videoConstraints = {
    width: 320,
    height: 240,
    facingMode: "user"
};

function WebcamCapture({ onCapture, captured }) {
    const webcamRef = useRef(null);
    const [isActive, setIsActive] = useState(false);
    const [error, setError] = useState('');

    const handleCapture = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                onCapture(imageSrc);
            } else {
                setError('Failed to capture image. Please try again.');
            }
        }
    }, [onCapture]);

    const handleUserMedia = () => {
        setIsActive(true);
        setError('');
    };

    const handleUserMediaError = (err) => {
        setError('Camera access denied or unavailable. Face verification will use default scoring.');
        console.warn('Webcam error:', err);
    };

    return (
        <div className="webcam-container">
            <div className="webcam-header">
                <div className="webcam-dot"></div>
                <span>Face Verification</span>
            </div>

            <div className="webcam-viewport">
                {!captured ? (
                    <>
                        <Webcam
                            ref={webcamRef}
                            audio={false}
                            width={320}
                            height={240}
                            screenshotFormat="image/jpeg"
                            videoConstraints={videoConstraints}
                            onUserMedia={handleUserMedia}
                            onUserMediaError={handleUserMediaError}
                            className="webcam-video"
                        />
                        {isActive && (
                            <div className="webcam-overlay">
                                <div className="face-guide"></div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="webcam-captured">
                        <img src={captured} alt="Captured face" className="captured-image" />
                        <div className="captured-badge">✓ Captured</div>
                    </div>
                )}
            </div>

            {error && <p className="webcam-error">{error}</p>}

            {!captured ? (
                <button
                    type="button"
                    onClick={handleCapture}
                    className="btn-capture"
                    disabled={!isActive}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="4" />
                    </svg>
                    Capture Face
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => onCapture('')}
                    className="btn-retake"
                >
                    Retake Photo
                </button>
            )}
        </div>
    );
}

export default WebcamCapture;
