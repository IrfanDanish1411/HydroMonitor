import { Cloud, CloudRain, Sun, Wind, Droplets, MapPin } from 'lucide-react'
import { useState, useEffect } from 'react'
import './WeatherWidget.css'

export default function WeatherWidget() {
    const [weather, setWeather] = useState(null)
    const [loading, setLoading] = useState(true)

    // USM Gelugor, Penang, Malaysia
    const latitude = 5.3558
    const longitude = 100.2977
    const location = "USM Gelugor, Penang"

    useEffect(() => {
        // Using Open-Meteo API (free alternative to Google Weather API)
        // Google Weather API requires API key and billing setup
        const fetchWeather = async () => {
            try {
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation&timezone=Asia/Manila`
                )
                const data = await response.json()

                setWeather({
                    temperature: data.current.temperature_2m,
                    humidity: data.current.relative_humidity_2m,
                    windSpeed: data.current.wind_speed_10m,
                    precipitation: data.current.precipitation,
                    weatherCode: data.current.weather_code,
                    location: location
                })
                setLoading(false)
            } catch (error) {
                console.error('Weather fetch error:', error)
                setLoading(false)
            }
        }

        fetchWeather()
        // Refresh every 30 minutes
        const interval = setInterval(fetchWeather, 30 * 60 * 1000)
        return () => clearInterval(interval)
    }, [])

    const getWeatherIcon = (code) => {
        // WMO Weather codes
        if (code === 0) return <Sun size={24} />
        if (code >= 51 && code <= 67) return <CloudRain size={24} />
        if (code >= 80 && code <= 99) return <CloudRain size={24} />
        return <Cloud size={24} />
    }

    const getWeatherDescription = (code) => {
        if (code === 0) return 'Clear Sky'
        if (code >= 1 && code <= 3) return 'Partly Cloudy'
        if (code >= 51 && code <= 67) return 'Rainy'
        if (code >= 80 && code <= 99) return 'Heavy Rain'
        return 'Cloudy'
    }

    const getWaterQualityImpact = () => {
        if (!weather) return 'Loading...'

        const impacts = []

        if (weather.temperature > 32) {
            impacts.push('⚠️ High temp may increase water temperature')
        } else if (weather.temperature < 24) {
            impacts.push('❄️ Cool weather may lower water temp')
        }

        if (weather.precipitation > 0) {
            impacts.push('🌧️ Rain may dilute salinity and affect pH')
        }

        if (weather.windSpeed > 20) {
            impacts.push('💨 Strong winds increase water oxygenation')
        }

        return impacts.length > 0 ? impacts.join(' • ') : '✅ Normal conditions'
    }

    if (loading) {
        return (
            <div className="weather-widget card">
                <div className="weather-loading">Loading weather...</div>
            </div>
        )
    }

    if (!weather) return null

    return (
        <div className="weather-widget card">
            <div className="weather-header">
                {getWeatherIcon(weather.weatherCode)}
                <div>
                    <h3>Weather Conditions</h3>
                    <div className="weather-location">
                        <MapPin size={12} />
                        <span>{weather.location}</span>
                    </div>
                </div>
            </div>

            <div className="weather-main">
                <div className="weather-temp">{weather.temperature}°C</div>
                <div className="weather-desc">{getWeatherDescription(weather.weatherCode)}</div>
            </div>

            <div className="weather-stats">
                <div className="weather-stat">
                    <Droplets size={16} />
                    <span>{weather.humidity}%</span>
                    <label>Humidity</label>
                </div>
                <div className="weather-stat">
                    <Wind size={16} />
                    <span>{weather.windSpeed} km/h</span>
                    <label>Wind</label>
                </div>
                {weather.precipitation > 0 && (
                    <div className="weather-stat">
                        <CloudRain size={16} />
                        <span>{weather.precipitation} mm</span>
                        <label>Rain</label>
                    </div>
                )}
            </div>

            <div className="weather-impact">
                <span className="impact-label">Water Quality Impact:</span>
                <div className="impact-text">{getWaterQualityImpact()}</div>
            </div>
        </div>
    )
}
