import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatTimestamp } from '../lib/utils'
import './Chart.css'

export default function Chart({ data, parameters }) {
    // Transform data for recharts
    const chartData = data.map(reading => ({
        timestamp: new Date(reading.timestamp).getTime(),
        temperature: reading.temperature,
        ph: reading.ph,
        dissolved_oxygen: reading.dissolved_oxygen,
        ammonia: reading.ammonia
    })).reverse() // Oldest to newest for chart

    const colors = {
        temperature: '#f59e0b',
        ph: '#3b82f6',
        dissolved_oxygen: '#10b981',
        ammonia: '#ef4444'
    }

    return (
        <div className="chart-container card">
            <h3 className="chart-title">Historical Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
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
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-primary)'
                        }}
                        labelFormatter={(ts) => formatTimestamp(ts)}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: '0.875rem' }}
                    />
                    {parameters.map(param => (
                        <Line
                            key={param}
                            type="monotone"
                            dataKey={param}
                            stroke={colors[param]}
                            strokeWidth={2}
                            dot={false}
                            name={param.replace('_', ' ').toUpperCase()}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
