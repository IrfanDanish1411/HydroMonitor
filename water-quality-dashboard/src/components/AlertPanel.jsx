import { AlertTriangle, CheckCircle, Clock, TrendingUp, Info, X, Trash2 } from 'lucide-react'
import { formatRelativeTime } from '../lib/utils'
import './AlertPanel.css'

// Get actionable recommendation based on parameter
function getRecommendation(parameter, severity) {
    const recommendations = {
        temperature: {
            high: 'Enable cooling system or add ice packs',
            medium: 'Monitor closely, increase aeration'
        },
        ammonia: {
            high: 'Immediate water change (30-50%), reduce feeding',
            medium: 'Partial water change (20%), check filter'
        },
        ph: {
            high: 'Add pH down solution or peat moss',
            medium: 'Monitor and test water source'
        },
        dissolved_oxygen: {
            high: 'Reduce aeration, check for algae bloom',
            medium: 'Increase water circulation'
        },
        salinity: {
            high: 'Dilute with fresh water',
            medium: 'Monitor evaporation rate'
        }
    }

    return recommendations[parameter]?.[severity] || 'Check system parameters'
}

export default function AlertPanel({ alerts, onDismissAlert, onDismissAll }) {
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

    return (
        <div className="alert-panel card">
            <div className="alert-header">
                <AlertTriangle size={20} />
                <h3>Active Alerts ({alerts.length})</h3>
                {onDismissAll && alerts.length > 0 && (
                    <button
                        className="dismiss-all-btn"
                        onClick={onDismissAll}
                        title="Dismiss all alerts"
                    >
                        <Trash2 size={16} />
                        Clear All
                    </button>
                )}
            </div>
            <div className="alerts-list">
                {alerts.map((alert, index) => {
                    const recommendation = getRecommendation(alert.parameter, alert.severity)

                    return (
                        <div key={alert.id || index} className="alert-item">
                            <button
                                className="alert-dismiss"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDismissAlert?.(index)
                                }}
                                title="Acknowledge alert"
                            >
                                <X size={16} />
                            </button>
                            <div className="alert-icon">
                                <AlertTriangle size={18} />
                            </div>
                            <div className="alert-content">
                                <div className="alert-title">{alert.parameter?.toUpperCase()}</div>
                                <div className="alert-value">
                                    <TrendingUp size={14} />
                                    <span>{alert.message}</span>
                                </div>
                                <div className="alert-recommendation">
                                    <Info size={12} />
                                    <span>{recommendation}</span>
                                </div>
                                {alert.created_at && (
                                    <div className="alert-time">
                                        <Clock size={12} />
                                        {formatRelativeTime(alert.created_at)}
                                    </div>
                                )}
                            </div>
                            <span className={`severity-badge ${alert.severity || 'warning'}`}>
                                {(alert.severity || 'warning').toUpperCase()}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
