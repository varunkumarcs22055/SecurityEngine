function RiskBadge({ decision, size = 'md' }) {
    const config = {
        ALLOW: {
            label: 'ALLOWED',
            className: 'badge-allow',
            icon: '✓'
        },
        FLAG: {
            label: 'FLAGGED',
            className: 'badge-flag',
            icon: '⚠'
        },
        BLOCK: {
            label: 'BLOCKED',
            className: 'badge-block',
            icon: '✕'
        }
    };

    const c = config[decision] || config.ALLOW;

    return (
        <span className={`risk-badge ${c.className} badge-${size}`}>
            <span className="badge-icon">{c.icon}</span>
            <span className="badge-label">{c.label}</span>
        </span>
    );
}

export default RiskBadge;
