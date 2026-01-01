import { Activity, CheckCircle, AlertTriangle, X } from 'lucide-react'
import { isInRange } from '../lib/utils'
import './HealthScore.css'

const PARAMETER_ICONS = {
    temperature: '🌡️',
    ph: '⚗️',
    dissolved_oxygen: '💨',
    ammonia: '🧪'
}

const PARAMETER_LABELS = {
    temperature: 'Temp',
    ph: 'pH',
    dissolved_oxygen: 'DO',
    ammonia: 'NH₃'
}

export default function HealthScore({ readings, alerts }) {
    // Calculate weighted health score with parameter breakdown
    const calculateHealthScore = () => {
        if (!readings || readings.length === 0) {
            return {
                totalScore: 0,
                parameters: {},
                issues: []
            }
        }

        const latestReading = readings[0]
        const parameters = ['temperature', 'ph', 'dissolved_oxygen', 'ammonia']

        // Weight for each parameter (critical = high weight)
        const weights = {
            temperature: 25,    // Critical for fish metabolism
            dissolved_oxygen: 25, // Critical for survival
            ammonia: 20,        // Very important (toxic)
            ammonia: 20,        // Very important (toxic)
            ph: 15             // Important
        }

        let totalScore = 0
        let parametersStatus = {}
        let issues = []

        parameters.forEach(param => {
            const value = latestReading[param]
            const weight = weights[param]

            // Check if in range using existing utility
            const inRange = isInRange(value, param, latestReading.test_mode)

            if (inRange) {
                // Full points for this parameter
                totalScore += weight
                parametersStatus[param] = {
                    status: 'ok',
                    weight: weight,
                    score: weight
                }
            } else {
                // Reduced points based on severity
                const alerts = getAlertsForParameter(param)
                const severity = alerts[0]?.severity || 'medium'

                let scoreFactor = 0
                if (severity === 'low') scoreFactor = 0.8
                else if (severity === 'medium' || severity === 'warning') scoreFactor = 0.5
                else if (severity === 'high') scoreFactor = 0

                const earnedScore = Math.round(weight * scoreFactor)
                totalScore += earnedScore

                parametersStatus[param] = {
                    status: 'issue',
                    severity: severity,
                    weight: weight,
                    score: earnedScore
                }

                issues.push({
                    parameter: param,
                    severity: severity,
                    label: PARAMETER_LABELS[param]
                })
            }
        })

        // Additional penalty for pending alerts
        const alertPenalty = Math.min(alerts.length * 2, 10)
        totalScore = Math.max(0, totalScore - alertPenalty)

        return {
            totalScore: Math.round(totalScore),
            parameters: parametersStatus,
            issues: issues
        }
    }

    const getAlertsForParameter = (parameter) => {
        return alerts.filter(alert => alert.parameter === parameter)
    }

    const healthData = calculateHealthScore()
    const score = healthData.totalScore

    const getScoreColor = () => {
        if (score >= 80) return 'excellent'
        if (score >= 60) return 'good'
        if (score >= 40) return 'fair'
        return 'poor'
    }

    const getScoreLabel = () => {
        if (score >= 80) return 'Excellent'
        if (score >= 60) return 'Good'
        if (score >= 40) return 'Degraded'
        return 'Critical'
    }

    const getScoreIcon = () => {
        if (score >= 80) return '✅'
        if (score >= 60) return '⚠️'
        return '🔴'
    }

    const scoreColor = getScoreColor()
    const scoreLabel = getScoreLabel()
    const scoreIcon = getScoreIcon()

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
                    <span className={`status-label ${scoreColor}`}>
                        <span className="status-icon">{scoreIcon}</span>
                        {scoreLabel}
                    </span>

                    {/* Parameter Breakdown */}
                    <div className="parameters-breakdown">
                        <div className="breakdown-title">Parameters</div>
                        <div className="breakdown-grid">
                            {Object.entries(healthData.parameters).map(([param, data]) => (
                                <div key={param} className={`param-item ${data.status}`}>
                                    <span className="param-icon-small">{PARAMETER_ICONS[param]}</span>
                                    <span className="param-label">{PARAMETER_LABELS[param]}</span>
                                    {data.status === 'ok' ? (
                                        <CheckCircle size={16} className="status-check" />
                                    ) : (
                                        <X size={16} className="status-cross" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Issues List */}
                    {healthData.issues.length > 0 && (
                        <div className="health-issues">
                            <div className="issues-title">
                                <AlertTriangle size={14} />
                                Issues ({healthData.issues.length})
                            </div>
                            <div className="issues-list text-center">
                                <span className="text-sm font-semibold text-red-400">
                                    Attention: {healthData.issues.map(i => i.label).join(', ')}
                                </span>
                            </div>
                            {alerts.length > 0 && (
                                <div className="pending-alerts">
                                    • {alerts.length} alert{alerts.length > 1 ? 's' : ''} pending
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
