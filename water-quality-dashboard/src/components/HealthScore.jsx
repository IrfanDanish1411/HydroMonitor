import { Activity, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'
import './HealthScore.css'

export default function HealthScore({ readings, alerts }) {
    // Calculate health score based on multiple factors
    const calculateHealthScore = () => {
        if (!readings || readings.length === 0) return 0

        let score = 100
        const latestReading = readings[0]

        // Deduct points for out-of-range parameters (Test Mode thresholds)
        const thresholds = {
            temperature: { min: 0, max: 100 },
            ph: { min: 0, max: 14 },
            dissolved_oxygen: { min: 0, max: 20 },
            ammonia: { min: 0, max: 50 },
            salinity: { min: 0, max: 50 }
        }

        Object.keys(thresholds).forEach(param => {
            const value = latestReading[param]
            const { min, max } = thresholds[param]

            if (value < min || value > max) {
                score -= 15
            }
        })

        // Deduct points for active alerts
        const alertPenalty = {
            high: 10,
            medium: 5,
            warning: 2
        }

        alerts.forEach(alert => {
            score -= alertPenalty[alert.severity] || 2
        })

        return Math.max(0, Math.min(100, score))
    }

    const score = calculateHealthScore()

    const getScoreColor = () => {
        if (score >= 80) return 'excellent'
        if (score >= 60) return 'good'
        if (score >= 40) return 'fair'
        return 'poor'
    }

    const getScoreLabel = () => {
        if (score >= 80) return 'Excellent'
        if (score >= 60) return 'Good'
        if (score >= 40) return 'Fair'
        return 'Poor'
    }

    const scoreColor = getScoreColor()
    const scoreLabel = getScoreLabel()

    return (
        <div className={`health-score card ${scoreColor}`}>
            <div className="health-header">
                <Activity size={20} />
                <h3>System Health</h3>
            </div>
            <div className="health-content">
                <div className="score-circle">
                    <svg viewBox="0 0 150 150" className="score-ring">
                        <circle
                            cx="75"
                            cy="75"
                            r="66"
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="10"
                        />
                        <circle
                            cx="75"
                            cy="75"
                            r="66"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="10"
                            strokeDasharray={`${(score / 100) * 414.69} 414.69`}
                            strokeLinecap="round"
                            transform="rotate(-90 75 75)"
                            className="score-progress"
                        />
                    </svg>
                    <div className="score-value">
                        <span className="score-number">{score}</span>
                        <span className="score-max">/100</span>
                    </div>
                </div>
                <div className="health-status">
                    <span className={`status-label ${scoreColor}`}>{scoreLabel}</span>
                    <div className="health-stats">
                        <div className="stat">
                            <CheckCircle size={14} />
                            <span>{5 - alerts.length} OK</span>
                        </div>
                        <div className="stat">
                            <AlertTriangle size={14} />
                            <span>{alerts.length} Issues</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
