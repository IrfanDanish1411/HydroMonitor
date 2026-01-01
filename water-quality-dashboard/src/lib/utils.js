// Test mode vs Production thresholds
export const THRESHOLDS = {
    temperature: { min: 26, max: 32 },
    ph: { min: 7.0, max: 8.5 },
    dissolved_oxygen: { min: 4, max: 8 },
    ammonia: { min: 0, max: 0.5 }
}

export const TEST_THRESHOLDS = {
    temperature: { min: 0, max: 100 },
    ph: { min: 0, max: 14 },
    dissolved_oxygen: { min: 0, max: 20 },
    ammonia: { min: 0, max: 50 }
}

// Check if value is within range
export function isInRange(value, parameter, testMode = false) {
    if (value === null || value === undefined) return true

    // Try to get custom thresholds from localStorage
    const customThresholds = localStorage.getItem('customThresholds')
    let thresholds = testMode ? TEST_THRESHOLDS : THRESHOLDS

    if (customThresholds) {
        try {
            const parsed = JSON.parse(customThresholds)
            if (parsed[parameter]) {
                thresholds = parsed
            }
        } catch (e) {
            console.error('Failed to parse custom thresholds:', e)
        }
    }

    const range = thresholds[parameter]
    if (!range) return true

    return value >= range.min && value <= range.max
}

// Get threshold for parameter
export function getThreshold(parameter, testMode = false) {
    // Try to get custom thresholds from localStorage
    const customThresholds = localStorage.getItem('customThresholds')
    let thresholds = testMode ? TEST_THRESHOLDS : THRESHOLDS

    if (customThresholds) {
        try {
            const parsed = JSON.parse(customThresholds)
            if (parsed[parameter]) {
                return parsed[parameter]
            }
        } catch (e) {
            console.error('Failed to parse custom thresholds:', e)
        }
    }

    return thresholds[parameter] || { min: 0, max: 100 }
}

// Format relative time (e.g., "2 minutes ago")
export function formatRelativeTime(date) {
    if (!date) return 'Never'

    const now = new Date()
    const then = new Date(date)
    const diffMs = now - then
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) return `${diffSecs}s ago`
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
}

// Format timestamp to readable string
export function formatTimestamp(timestamp) {
    if (!timestamp) return '--'
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Calculate trend from readings
export function calculateTrend(readings, parameter) {
    if (!readings || readings.length < 2) return 'stable'

    const recent = readings.slice(0, 5)
    const values = recent.map(r => r[parameter]).filter(v => v !== null && v !== undefined)

    if (values.length < 2) return 'stable'

    const first = values[values.length - 1]
    const last = values[0]
    const change = ((last - first) / first) * 100

    if (Math.abs(change) < 2) return 'stable'
    return change > 0 ? 'up' : 'down'
}

// Get status color based on value and thresholds
export function getStatusColor(value, parameter, testMode = false) {
    if (value === null || value === undefined) return 'gray'

    const threshold = getThreshold(parameter, testMode)
    const inRange = value >= threshold.min && value <= threshold.max

    if (!inRange) return 'red'

    // Warning zone (10% margin from limits)
    const range = threshold.max - threshold.min
    const margin = range * 0.1
    const warnLow = threshold.min + margin
    const warnHigh = threshold.max - margin

    if (value < warnLow || value > warnHigh) return 'yellow'

    return 'green'
}

// Parameter display configurations
export const PARAMETER_CONFIG = {
    temperature: {
        label: 'Temperature',
        unit: '°C',
        icon: '🌡️',
        decimals: 1
    },
    ph: {
        label: 'pH Level',
        unit: '',
        icon: '⚗️',
        decimals: 2
    },
    dissolved_oxygen: {
        label: 'Dissolved Oxygen',
        unit: 'mg/L',
        icon: '💨',
        decimals: 2
    },
    ammonia: {
        label: 'Ammonia',
        unit: 'ppm',
        icon: '🧪',
        decimals: 3
    }
}

// Format parameter value with appropriate decimals
export function formatValue(value, parameter) {
    if (value === null || value === undefined) return '--'

    const config = PARAMETER_CONFIG[parameter]
    if (!config) return value.toFixed(2)

    return value.toFixed(config.decimals)
}
// Generate active alerts based on current reading
export function generateActiveAlerts(reading, testMode = false) {
    if (!reading) return []

    const alerts = []
    const parameters = ['temperature', 'ph', 'dissolved_oxygen', 'ammonia']
    const timestamp = new Date().toISOString()

    parameters.forEach(param => {
        const value = reading[param]
        if (value === null || value === undefined) return

        const status = getStatusColor(value, param, testMode)
        if (status === 'green') return

        const threshold = getThreshold(param, testMode)
        let severity = 'medium'
        let message = ''

        if (status === 'red') {
            severity = 'high'
            if (value < threshold.min) message = `${PARAMETER_CONFIG[param].label} is too low (${formatValue(value, param)} ${PARAMETER_CONFIG[param].unit})`
            else message = `${PARAMETER_CONFIG[param].label} is too high (${formatValue(value, param)} ${PARAMETER_CONFIG[param].unit})`
        } else if (status === 'yellow') {
            severity = 'medium'
            if (value < threshold.min) message = `${PARAMETER_CONFIG[param].label} is approaching low limit (${formatValue(value, param)} ${PARAMETER_CONFIG[param].unit})`
            else message = `${PARAMETER_CONFIG[param].label} is approaching high limit (${formatValue(value, param)} ${PARAMETER_CONFIG[param].unit})`
        }

        alerts.push({
            id: `${param}-${timestamp}`, // Temporary client-side ID
            parameter: param,
            severity,
            message,
            created_at: timestamp,
            status: 'active'
        })
    })

    return alerts
}
