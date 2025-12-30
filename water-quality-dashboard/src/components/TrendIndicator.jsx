import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import './TrendIndicator.css'

export default function TrendIndicator({ current, previous, unit = '' }) {
    if (!previous || !current) return null

    const change = current - previous
    const percentChange = ((change / previous) * 100).toFixed(1)

    let trend = 'stable'
    let Icon = Minus

    if (Math.abs(percentChange) > 2) {
        if (change > 0) {
            trend = 'up'
            Icon = TrendingUp
        } else {
            trend = 'down'
            Icon = TrendingDown
        }
    }

    return (
        <div className={`trend-indicator ${trend}`}>
            <Icon size={14} />
            <span className="trend-value">
                {change > 0 ? '+' : ''}{change.toFixed(2)} {unit}
            </span>
            <span className="trend-percent">
                ({percentChange > 0 ? '+' : ''}{percentChange}%)
            </span>
        </div>
    )
}
