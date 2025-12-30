import { Download } from 'lucide-react'
import './DataExport.css'

export default function DataExport({ readings }) {
    const exportToCSV = () => {
        if (!readings || readings.length === 0) {
            alert('No data to export')
            return
        }

        // CSV headers
        const headers = ['Timestamp', 'Device ID', 'Temperature (°C)', 'pH', 'Dissolved Oxygen (mg/L)', 'Ammonia (ppm)', 'Salinity (ppt)']

        // CSV rows
        const rows = readings.map(r => [
            new Date(r.timestamp).toLocaleString(),
            r.device_id,
            r.temperature?.toFixed(2) || '',
            r.ph?.toFixed(2) || '',
            r.dissolved_oxygen?.toFixed(2) || '',
            r.ammonia?.toFixed(2) || '',
            r.salinity?.toFixed(2) || ''
        ])

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n')

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)

        link.setAttribute('href', url)
        link.setAttribute('download', `water-quality-data-${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <button className="export-button" onClick={exportToCSV} title="Export data to CSV">
            <Download size={18} />
            Export CSV ({readings?.length || 0} records)
        </button>
    )
}
