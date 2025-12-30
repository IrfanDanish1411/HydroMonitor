import { useState, useEffect } from 'react'
import { Droplet, Thermometer, Activity, Waves, FlaskConical, TestTube, Bell, BellOff, Moon, Sun } from 'lucide-react'
import MetricCard from './components/MetricCard'
import SensorChart from './components/SensorChart'
import AlertPanel from './components/AlertPanel'
import DataExport from './components/DataExport'
import HealthScore from './components/HealthScore'
import WeatherWidget from './components/WeatherWidget'
import SunriseSunset from './components/SunriseSunset'
import LocationMap from './components/LocationMap'
import PWAPrompt from './components/PWAPrompt'
import { getLatestReadings, getActiveAlerts, subscribeToSensorData, subscribeToAlerts } from './lib/supabase'
import { formatRelativeTime } from './lib/utils'
import './App.css'

function App() {
  const [readings, setReadings] = useState([])
  const [latestReading, setLatestReading] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [testMode, setTestMode] = useState(true) // Start in test mode for calibration
  const [autoRefresh, setAutoRefresh] = useState(30) // Auto-refresh interval in seconds
  const [showAlerts, setShowAlerts] = useState(false) // Alert panel minimized by default
  const [darkMode, setDarkMode] = useState(true) // Dark mode toggle


  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        const [readingsData, alertsData] = await Promise.all([
          getLatestReadings(50),
          getActiveAlerts()
        ])

        console.log('Fetched readings:', readingsData?.length || 0)
        console.log('Fetched alerts:', alertsData?.length || 0)

        if (readingsData && readingsData.length > 0) {
          setReadings(readingsData)
          setLatestReading(readingsData[0])
          setLastUpdate(new Date(readingsData[0].timestamp))
        } else {
          console.warn('No sensor readings found in database')
        }

        setAlerts(alertsData || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Subscribe to real-time updates
  useEffect(() => {
    const sensorChannel = subscribeToSensorData((payload) => {
      const newReading = payload.new
      setReadings(prev => [newReading, ...prev].slice(0, 50))
      setLatestReading(newReading)
      setLastUpdate(new Date())
    })

    const alertChannel = subscribeToAlerts((payload) => {
      const newAlert = payload.new
      setAlerts(prev => [newAlert, ...prev])
    })

    return () => {
      sensorChannel.unsubscribe()
      alertChannel.unsubscribe()
    }
  }, [])

  // Auto-refresh data
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(async () => {
      try {
        const [readingsData, alertsData] = await Promise.all([
          getLatestReadings(50),
          getActiveAlerts()
        ])

        if (readingsData && readingsData.length > 0) {
          setReadings(readingsData)
          setLatestReading(readingsData[0])
          setLastUpdate(new Date(readingsData[0].timestamp))
        }
        setAlerts(alertsData || [])
      } catch (error) {
        console.error('Auto-refresh error:', error)
      }
    }, autoRefresh * 1000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  // Dark mode effect
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode)
  }, [darkMode])

  // Handle alert dismissal
  const handleDismissAlert = (alertIndex) => {
    setAlerts(prev => prev.filter((_, index) => index !== alertIndex))
  }

  // Handle dismiss all alerts
  const handleDismissAllAlerts = () => {
    setAlerts([])
  }


  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-title">
            <Droplet size={32} className="header-icon" />
            <div>
              <h1>Water Quality Monitor</h1>
              <p className="header-subtitle">IoT Aquaculture System</p>
            </div>
          </div>
          <div className="header-actions">
            <button
              className={`alert-toggle ${showAlerts ? 'active' : ''}`}
              onClick={() => setShowAlerts(!showAlerts)}
              title={showAlerts ? 'Hide alerts' : 'Show alerts'}
            >
              {showAlerts ? <Bell size={18} /> : <BellOff size={18} />}
              {alerts.length > 0 && (
                <span className="alert-badge">{alerts.length}</span>
              )}
            </button>

            <select
              className="refresh-selector"
              value={autoRefresh}
              onChange={(e) => setAutoRefresh(Number(e.target.value))}
            >
              <option value={0}>Manual Refresh</option>
              <option value={10}>10 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>60 seconds</option>
              <option value={300}>5 minutes</option>
            </select>

            <DataExport readings={readings} />

            <button
              className={`mode-toggle ${testMode ? 'test' : 'production'}`}
              onClick={() => setTestMode(!testMode)}
            >
              <TestTube size={18} />
              {testMode ? 'Test Mode' : 'Production Mode'}
            </button>

            <button
              className="dark-mode-toggle"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="header-status">
              <div className="status-dot pulse"></div>
              <div>
                <div className="status-label">Last Update</div>
                <div className="status-time">
                  {lastUpdate ? formatRelativeTime(lastUpdate) : 'Never'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-layout">
        <main className="container">
          {/* Health Score and Weather Widgets */}
          <div className="widgets-grid">
            <HealthScore readings={readings} alerts={alerts} />
            <WeatherWidget />
            <SunriseSunset />
            <LocationMap />
          </div>

          {/* Metrics Grid */}
          <div className="metrics-grid">
            <MetricCard
              label="Temperature"
              value={latestReading?.temperature}
              previousValue={readings[1]?.temperature}
              parameter="temperature"
              icon={Thermometer}
              testMode={testMode}
            />
            <MetricCard
              label="pH Level"
              value={latestReading?.ph}
              previousValue={readings[1]?.ph}
              parameter="ph"
              icon={Activity}
              testMode={testMode}
            />
            <MetricCard
              label="Dissolved Oxygen"
              value={latestReading?.dissolved_oxygen}
              previousValue={readings[1]?.dissolved_oxygen}
              parameter="dissolved_oxygen"
              icon={Waves}
              testMode={testMode}
            />
            <MetricCard
              label="Ammonia"
              value={latestReading?.ammonia}
              previousValue={readings[1]?.ammonia}
              parameter="ammonia"
              icon={FlaskConical}
              testMode={testMode}
            />
            <MetricCard
              label="Salinity"
              value={latestReading?.salinity}
              previousValue={readings[1]?.salinity}
              parameter="salinity"
              icon={Droplet}
              testMode={testMode}
            />
          </div>

          {/* Individual Sensor Charts */}
          {readings.length > 1 && (
            <div className="charts-grid">
              <SensorChart data={readings} parameter="temperature" testMode={testMode} />
              <SensorChart data={readings} parameter="ph" testMode={testMode} />
              <SensorChart data={readings} parameter="dissolved_oxygen" testMode={testMode} />
              <SensorChart data={readings} parameter="ammonia" testMode={testMode} />
              <SensorChart data={readings} parameter="salinity" testMode={testMode} />
            </div>
          )}
        </main>

        {/* Collapsible Alert Side Panel */}
        {showAlerts && (
          <aside className="alert-sidebar">
            <AlertPanel
              alerts={alerts}
              onDismissAlert={handleDismissAlert}
              onDismissAll={handleDismissAllAlerts}
            />
          </aside>
        )}
      </div>

      <PWAPrompt />

      <footer className="footer">
        <p>CPC357 IoT Project - Water Quality Monitoring System</p>
        <p className="footer-device">Device: {latestReading?.device_id || 'N/A'}</p>
      </footer>
    </div>
  )
}

export default App
