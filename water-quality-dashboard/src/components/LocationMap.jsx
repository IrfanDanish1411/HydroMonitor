import { MapPin, Navigation } from 'lucide-react'
import { useState } from 'react'
import './LocationMap.css'

export default function LocationMap() {
    // USM Gelugor, Penang, Malaysia
    const [location] = useState({
        name: 'Fish Farm - USM Penang',
        latitude: 5.3558,
        longitude: 100.2977,
        address: 'Universiti Sains Malaysia, Gelugor, Penang, Malaysia'
    })

    // Google Maps Static API URL (no API key required for basic static maps)
    // For production, you should get a Google Maps API key
    const getMapUrl = () => {
        const { latitude, longitude } = location
        const zoom = 15
        const size = '400x200'

        // Using OpenStreetMap static map as free alternative
        // Google Maps requires API key
        return `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`
    }

    const openInGoogleMaps = () => {
        const { latitude, longitude } = location
        window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank')
    }

    return (
        <div className="location-map card">
            <div className="map-header">
                <MapPin size={20} />
                <h3>Tank Location</h3>
                <button className="navigate-btn" onClick={openInGoogleMaps} title="Open in Google Maps">
                    <Navigation size={16} />
                    Navigate
                </button>
            </div>

            <div className="map-container">
                <iframe
                    title="Tank Location Map"
                    src={getMapUrl()}
                    className="map-iframe"
                    frameBorder="0"
                    scrolling="no"
                />
            </div>

            <div className="location-info">
                <div className="location-name">{location.name}</div>
                <div className="location-address">{location.address}</div>
                <div className="location-coords">
                    📍 {location.latitude.toFixed(4)}°N, {location.longitude.toFixed(4)}°E
                </div>
            </div>
        </div>
    )
}
