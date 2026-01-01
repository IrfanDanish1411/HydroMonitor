import { useState } from 'react'
import { AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronUp, Info, CheckCheck } from 'lucide-react'
import { formatRelativeTime } from '../lib/utils'
import './AlertPanel.css'

// Get actionable recommendation based on parameter
function getRecommendation(parameter, severity) {
    const recommendations = {
        temperature: {
            high: 'Enable cooling system or add ice packs',
            low: 'Enable heating system or reduce aeration',
            medium: 'Monitor closely, check aerator function'
        },
        ammonia: {
            high: 'Immediate water change (30-50%), reduce feeding',
            medium: 'Partial water change (20%), check filter',
            low: 'System normal, maintain current practices'
        },
        ph: {
            high: 'Add pH down solution or peat moss',
            low: 'Add pH up solution or baking soda',
            medium: 'Monitor and test water source'
        },
        dissolved_oxygen: {
            high: 'Reduce aeration, check for algae bloom',
            low: 'Increase aeration immediately',
            medium: 'Increase water circulation'
        }
    }

    return recommendations[parameter]?.[severity] || 'Check system parameters'
}

function getParameterIcon(parameter) {
    const icons = {
        temperature: '🌡️',
        ph: '⚗️',
        dissolved_oxygen: '💨',
        ammonia: '🧪'
    }
    return icons[parameter] || '📊'
}

export default function AlertPanel({ alerts, onDismissAlert, onDismissAll }) {
    const [expandedGroups, setExpandedGroups] = useState({})

    if (!alerts || alerts.length === 0) {
        return (
            <div className="alert-panel card">
                <div className="alert-header">
                    <CheckCircle size={20} />
                    <h3>System Status</h3>
                </div>
                <div className="no-alerts">
                    <CheckCircle size={48} className="success-icon" />
                    <p>All parameters within normal range</p>
                    <span className="status-badge safe">System Healthy</span>
                </div>
            </div>
        )
    }

    // Group alerts by parameter
    const groupedAlerts = alerts.reduce((groups, alert, index) => {
        const param = alert.parameter || 'unknown'
        if (!groups[param]) {
            groups[param] = []
        }
        groups[param].push({ ...alert, originalIndex: index })
        return groups
    }, {})

    const toggleGroup = (parameter) => {
        setExpandedGroups(prev => ({
            ...prev,
            [parameter]: !prev[parameter]
        }))
    }

    const acknowledgeGroup = (parameter) => {
        if (!onDismissAll) return

        const indices = groupedAlerts[parameter]
            .map(a => a.originalIndex)
            .sort((a, b) => b - a) // Sort descending to remove from end first

        indices.forEach(index => {
            onDismissAlert?.(index)
        })
    }

    return (
        <div className="alert-panel card">
            <div className="alert-header">
                <div className="alert-header-left">
                    <AlertTriangle size={20} />
                    <h3>Active Alerts</h3>
                    <span className="alert-total-badge">{alerts.length}</span>
                </div>
                {onDismissAll && alerts.length > 0 && (
                    <button
                        className="acknowledge-all-btn"
                        onClick={onDismissAll}
                        title="Acknowledge all alerts"
                    >
                        <CheckCheck size={16} />
                        Clear All
                    </button>
                )}
            </div>

            <div className="alerts-grouped-list">
                {Object.entries(groupedAlerts).map(([parameter, paramAlerts]) => {
                    const isExpanded = expandedGroups[parameter]
                    const highCount = paramAlerts.filter(a => a.severity === 'high').length
                    const mediumCount = paramAlerts.filter(a => a.severity === 'medium' || a.severity === 'warning').length
                    const lowCount = paramAlerts.filter(a => a.severity === 'low').length

                    // Get most recent alert for summary
                    const latestAlert = paramAlerts[0]
                    const recommendation = getRecommendation(parameter, latestAlert.severity)

                    return (
                        <div key={parameter} className="alert-group">
                            <div
                                className="alert-group-header"
                                onClick={() => toggleGroup(parameter)}
                            >
                                <div className="alert-group-title">
                                    <span className="param-icon">{getParameterIcon(parameter)}</span>
                                    <div className="param-info">
                                        <h4>{parameter.toUpperCase().replace('_', ' ')}</h4>
                                        <span className="alert-count">
                                            {paramAlerts.length} alert{paramAlerts.length > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>

                                <div className="alert-group-summary">
                                    <div className="severity-counts">
                                        {highCount > 0 && (
                                            <span className="severity-pill high">
                                                🔴 {highCount}
                                            </span>
                                        )}
                                        {mediumCount > 0 && (
                                            <span className="severity-pill medium">
                                                🟡 {mediumCount}
                                            </span>
                                        )}
                                        {lowCount > 0 && (
                                            <span className="severity-pill low">
                                                🟢 {lowCount}
                                            </span>
                                        )}
                                    </div>
                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="alert-group-details">
                                    <div className="alert-summary-card">
                                        <div className="summary-row">
                                            <span className="summary-label">Latest Value:</span>
                                            <span className="summary-value">{latestAlert.message}</span>
                                        </div>
                                        <div className="summary-row recommendation">
                                            <Info size={14} />
                                            <span>{recommendation}</span>
                                        </div>
                                    </div>

                                    <div className="alert-items-list">
                                        {paramAlerts.map((alert) => (
                                            <div key={alert.originalIndex} className={`alert-detail-item ${alert.severity}`}>
                                                <div className="alert-detail-left">
                                                    <span className={`severity-dot ${alert.severity}`}></span>
                                                    <div className="alert-detail-info">
                                                        <span className="alert-detail-message">{alert.message}</span>
                                                        {alert.created_at && (
                                                            <span className="alert-detail-time">
                                                                <Clock size={12} />
                                                                {formatRelativeTime(alert.created_at)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        className="acknowledge-group-btn"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            acknowledgeGroup(parameter)
                                        }}
                                    >
                                        <CheckCheck size={14} />
                                        Acknowledge All {parameter.toUpperCase().replace('_', ' ')} Alerts
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
