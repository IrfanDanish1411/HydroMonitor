import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { formatTimestamp, getThreshold } from '../lib/utils'
import './SensorChart.css'

export default function SensorChart({ data, parameter, testMode = false }) {
    const threshold = getThreshold(parameter, testMode)

    // Transform data for recharts
    const chartData = data.map(reading => ({
        timestamp: new Date(reading.timestamp).getTime(),
        value: reading[parameter]
    })).reverse() // Oldest to newest for chart

    const colors = {
        temperature: '#f59e0b',
        ph: '#3b82f6',
        dissolved_oxygen: '#10b981',
        ammonia: '#ef4444',
        salinity: '#8b5cf6'
    }

    const color = colors[parameter] || '#0ea5e9'

    return (
        <div className="sensor-chart card">
            <div className="chart-header">
                <h3 className="chart-title">{threshold?.name || parameter}</h3>
                <span className="chart-range">
                    Safe: {threshold?.min}-{threshold?.max} {threshold?.unit}
                </span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="timestamp"
                        tickFormatter={(ts) => formatTimestamp(ts)}
                        stroke="var(--text-muted)"
                        style={{ fontSize: '0.75rem' }}
                    />
                    <YAxis
                        stroke="var(--text-muted)"
                        style={{ fontSize: '0.75rem' }}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-primary)'
                        }}
                        labelFormatter={(ts) => formatTimestamp(ts)}
                        formatter={(value) => [value.toFixed(2) + ' ' + threshold?.unit, threshold?.name]}
                    />

                    {/* Threshold lines */}
                    <ReferenceLine
                        y={threshold?.max}
                        stroke="#ef4444"
                        strokeDasharray="3 3"
                        label={{ value: 'Max', fill: '#ef4444', fontSize: 12 }}
                    />
                    <ReferenceLine
                        y={threshold?.min}
                        stroke="#ef4444"
                        strokeDasharray="3 3"
                        label={{ value: 'Min', fill: '#ef4444', fontSize: 12 }}
                    />

                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
