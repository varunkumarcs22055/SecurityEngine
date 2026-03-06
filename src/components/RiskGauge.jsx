import { useEffect, useRef } from 'react';

function RiskGauge({ score, maxScore = 100, size = 180 }) {
    const canvasRef = useRef(null);

    const getColor = (s) => {
        if (s <= 30) return '#10b981';     // green - ALLOW
        if (s <= 70) return '#f59e0b';     // amber - FLAG
        return '#ef4444';                   // red - BLOCK
    };

    const getLabel = (s) => {
        if (s <= 30) return 'LOW RISK';
        if (s <= 70) return 'MEDIUM RISK';
        return 'HIGH RISK';
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);

        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2 - 16;
        const lineWidth = 12;
        const startAngle = 0.75 * Math.PI;
        const endAngle = 2.25 * Math.PI;
        const totalAngle = endAngle - startAngle;

        // Animate the gauge
        let animatedScore = 0;
        const targetScore = Math.min(score, maxScore);
        const animationDuration = 1200;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / animationDuration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            animatedScore = targetScore * eased;

            // Clear
            ctx.clearRect(0, 0, size, size);

            // Background arc
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Value arc
            const valueAngle = startAngle + (animatedScore / maxScore) * totalAngle;
            const color = getColor(animatedScore);

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, valueAngle);
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.shadowColor = color;
            ctx.shadowBlur = 12;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Score text
            ctx.fillStyle = '#f1f5f9';
            ctx.font = `700 ${size * 0.22}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(Math.round(animatedScore), centerX, centerY - 6);

            // Label
            ctx.fillStyle = color;
            ctx.font = `600 ${size * 0.072}px Inter, sans-serif`;
            ctx.letterSpacing = '1px';
            ctx.fillText(getLabel(animatedScore), centerX, centerY + size * 0.16);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }, [score, maxScore, size]);

    return (
        <div className="risk-gauge">
            <canvas
                ref={canvasRef}
                style={{ width: size, height: size }}
            />
        </div>
    );
}

export default RiskGauge;
