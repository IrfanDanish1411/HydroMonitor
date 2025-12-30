// Water quality thresholds for Asian Seabass (from research paper)
export const THRESHOLDS = {
    temperature: { min: 26, max: 32, unit: '°C', optimal: '28-30°C', name: 'Temperature' },
    ph: { min: 7.0, max: 8.5, unit: '', optimal: '7.5-8.0', name: 'pH Level' },
    dissolved_oxygen: { min: 4.0, max: 8.0, unit: 'mg/L', optimal: '5-7 mg/L', name: 'Dissolved Oxygen' },
    ammonia: { min: 0, max: 0.02, unit: 'ppm', optimal: '<0.01 ppm', name: 'Ammonia' },
    salinity: { min: 28, max: 32, unit: 'ppt', optimal: '30 ppt', name: 'Salinity' }
}

// Test mode thresholds (wider ranges for sensor calibration/testing)
export const TEST_THRESHOLDS = {
    temperature: { min: 0, max: 100, unit: '°C', optimal: '20-30°C', name: 'Temperature' },
    ph: { min: 0, max: 14, unit: '', optimal: '6-8', name: 'pH Level' },
    dissolved_oxygen: { min: 0, max: 20, unit: 'mg/L', optimal: '5-10 mg/L', name: 'Dissolved Oxygen' },
    ammonia: { min: 0, max: 50, unit: 'ppm', optimal: '<5 ppm', name: 'Ammonia' },
    salinity: { min: 0, max: 50, unit: 'ppt', optimal: '0-35 ppt', name: 'Salinity' }
}

// Check if value is within safe range
export function isInRange(parameter, value, testMode = false) {
    const thresholds = testMode ? TEST_THRESHOLDS : THRESHOLDS
    const threshold = thresholds[parameter]
    if (!threshold) return true
    return value >= threshold.min && value <= threshold.max
}

// Get status color based on value
export function getStatusColor(parameter, value, testMode = false) {
    if (isInRange(parameter, value, testMode)) return 'success'
    return 'danger'
}

// Get threshold for parameter
export function getThreshold(parameter, testMode = false) {
    const thresholds = testMode ? TEST_THRESHOLDS : THRESHOLDS
    return thresholds[parameter]
}

// Format timestamp
export function formatTimestamp(timestamp) {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Format relative time (e.g., "2 minutes ago")
export function formatRelativeTime(timestamp) {
    const now = new Date()
    const past = new Date(timestamp)
    const diffMs = now - past
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}
