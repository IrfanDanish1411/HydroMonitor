import { Sunrise, Sunset, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'
import './SunriseSunset.css'

export default function SunriseSunset() {
    const [sunData, setSunData] = useState(null)
    const [loading, setLoading] = useState(true)

    // USM Gelugor, Penang, Malaysia
    const latitude = 5.3558
    const longitude = 100.2977

    useEffect(() => {
        const fetchSunriseSunset = async () => {
            try {
                const response = await fetch(
                    `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`
                )
                const data = await response.json()

                if (data.status === 'OK') {
                    setSunData({
                        sunrise: new Date(data.results.sunrise),
                        sunset: new Date(data.results.sunset),
                        dayLength: data.results.day_length,
                        solarNoon: new Date(data.results.solar_noon)
                    })
                }
                setLoading(false)
            } catch (error) {
                console.error('Sunrise-Sunset fetch error:', error)
                setLoading(false)
            }
        }

        fetchSunriseSunset()
        // Refresh daily at midnight
        const now = new Date()
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        const timeUntilMidnight = tomorrow - now

        const timeout = setTimeout(() => {
            fetchSunriseSunset()
            // Then refresh every 24 hours
            setInterval(fetchSunriseSunset, 24 * 60 * 60 * 1000)
        }, timeUntilMidnight)

        return () => clearTimeout(timeout)
    }, [])

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
    }

    const formatDayLength = (seconds) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        return `${hours}h ${minutes}m`
    }

    const isDaytime = () => {
        if (!sunData) return true
        const now = new Date()
        return now >= sunData.sunrise && now <= sunData.sunset
    }

    const getOptimalFeedingTime = () => {
        if (!sunData) return 'Loading...'
        // Best feeding times: 1-2 hours after sunrise and before sunset
        const morningFeed = new Date(sunData.sunrise.getTime() + 90 * 60000) // 1.5h after sunrise
        const eveningFeed = new Date(sunData.sunset.getTime() - 90 * 60000) // 1.5h before sunset

        return `${formatTime(morningFeed)} & ${formatTime(eveningFeed)}`
    }

    if (loading) {
        return (
            <div className="sunrise-sunset card">
                <div className="sun-loading">Loading daylight data...</div>
            </div>
        )
    }

    if (!sunData) return null

    return (
        <div className="sunrise-sunset card">
            <div className="sun-header">
                {isDaytime() ? <Sun size={20} /> : <Moon size={20} />}
                <h3>Daylight Schedule</h3>
            </div>

            <div className="sun-times">
                <div className="sun-time">
                    <Sunrise size={24} className="sunrise-icon" />
                    <div className="sun-time-info">
                        <label>Sunrise</label>
                        <span>{formatTime(sunData.sunrise)}</span>
                    </div>
                </div>

                <div className="sun-divider"></div>

                <div className="sun-time">
                    <Sunset size={24} className="sunset-icon" />
                    <div className="sun-time-info">
                        <label>Sunset</label>
                        <span>{formatTime(sunData.sunset)}</span>
                    </div>
                </div>
            </div>

            <div className="sun-stats">
                <div className="sun-stat">
                    <label>Day Length</label>
                    <span>{formatDayLength(sunData.dayLength)}</span>
                </div>
                <div className="sun-stat">
                    <label>Solar Noon</label>
                    <span>{formatTime(sunData.solarNoon)}</span>
                </div>
            </div>

            <div className="feeding-recommendation">
                <span className="feeding-label">🐟 Optimal Feeding Times:</span>
                <div className="feeding-time">{getOptimalFeedingTime()}</div>
            </div>
        </div>
    )
}
