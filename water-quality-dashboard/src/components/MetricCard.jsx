import { Droplet, Thermometer, Activity, AlertTriangle } from 'lucide-react'
import { getThreshold, isInRange } from '../lib/utils'
import TrendIndicator from './TrendIndicator'
import './MetricCard.css'

export default function MetricCard({ label, value, parameter, icon: Icon, testMode = false, previousValue }) {
    const threshold = getThreshold(parameter, testMode)
    const inRange = isInRange(parameter, value, testMode)
    const status = inRange ? 'safe' : 'danger'

    return (
        <div className={`metric-card ${status}`}>
            <div className="metric-header">
                <div className="metric-icon">
                    <Icon size={24} />
                </div>
                <span className="metric-label">{label}</span>
            </div>

            <div className="metric-value">
                {value !== null && value !== undefined ? value.toFixed(2) : '--'}
                <span className="metric-unit">{threshold?.unit}</span>
            </div>

            <TrendIndicator
                current={value}
                previous={previousValue}
                unit={threshold?.unit}
            />

            <div className="metric-footer">
                <div className={`status-indicator ${status}`}>
                    {inRange ? (
                        <span>✓ Normal</span>
                    ) : (
                        <>
                            <AlertTriangle size={14} />
                            <span>Out of range</span>
                        </>
                    )}
                </div>
                <span className="metric-range">
                    {threshold?.min} - {threshold?.max} {threshold?.unit}
                </span>
            </div>
        </div>
    )
}
