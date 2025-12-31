import { useState, useEffect } from 'react'
import { Droplet, Thermometer, Activity, Waves, FlaskConical, TestTube, Bell, BellOff, Moon, Sun, Settings, LayoutDashboard, ClipboardCheck, RefreshCw, BookOpen } from 'lucide-react'
import MetricCard from './components/MetricCard'
import SensorChart from './components/SensorChart'
import Chart from './components/Chart'
import AlertPanel from './components/AlertPanel'
import DataExport from './components/DataExport'
import HealthScore from './components/HealthScore'
import WeatherWidget from './components/WeatherWidget'
import SunriseSunset from './components/SunriseSunset'
import LocationMap from './components/LocationMap'
import PWAPrompt from './components/PWAPrompt'
import LandingPage from './components/LandingPage'
import Documentation from './components/Documentation'
import ThresholdManager from './components/ThresholdManager'
import DailyChecklist from './components/DailyChecklist'
import MaintenanceSchedule from './components/MaintenanceSchedule'
import { getLatestReadings, getActiveAlerts, subscribeToSensorData, subscribeToAlerts } from './lib/supabase'
import { formatRelativeTime, generateActiveAlerts } from './lib/utils'
import './App.css'


function App() {
  const [readings, setReadings] = useState([])
  const [latestReading, setLatestReading] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [testMode, setTestMode] = useState(false) // Start in production mode
  const [autoRefresh, setAutoRefresh] = useState(30) // Auto-refresh interval in seconds
  const [showAlerts, setShowAlerts] = useState(false) // Alert panel minimized by default
  const [darkMode, setDarkMode] = useState(true) // Dark mode toggle
  const [activeTab, setActiveTab] = useState('overview') // Tab navigation: overview, settings, operations
  const [showLanding, setShowLanding] = useState(true) // Show landing page on first load
  const [showDocs, setShowDocs] = useState(false) // Show documentation modal


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

          // Generate alerts client-side based on latest reading
          const currentAlerts = generateActiveAlerts(readingsData[0], testMode)
          setAlerts(currentAlerts)
        } else {
          console.warn('No sensor readings found in database')
          setAlerts([])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setReadings([])
        setAlerts([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Toggle theme class on body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.remove('light-mode')
    } else {
      document.body.classList.add('light-mode')
    }
  }, [darkMode])

  // Set up real-time subscriptions
  useEffect(() => {
    console.log('Setting up real-time subscriptions...')

    const sensorSubscription = subscribeToSensorData((payload) => {
      console.log('Sensor reading received:', payload.new)
      setReadings(prev => [payload.new, ...prev.slice(0, 49)])
      setLatestReading(payload.new)
      setLastUpdate(new Date(payload.new.timestamp))

      // Update alerts based on new reading
      const newAlerts = generateActiveAlerts(payload.new, testMode)
      setAlerts(newAlerts)
    })

    // Cleanup subscriptions on unmount
    return () => {
      console.log('Cleaning up subscriptions...')
      if (sensorSubscription) {
        sensorSubscription.unsubscribe()
      }
    }
  }, [])

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh === 0) return

    const interval = setInterval(async () => {
      try {
        const [readingsData, alertsData] = await Promise.all([
          getLatestReadings(50),
          getActiveAlerts()
        ])
        if (readingsData && readingsData.length > 0) {
          setReadings(readingsData)
          setLatestReading(readingsData[0])
          setLastUpdate(new Date())

          // Refresh alerts based on latest
          const currentAlerts = generateActiveAlerts(readingsData[0], testMode)
          setAlerts(currentAlerts)
        }
      } catch (error) {
        console.error('Auto-refresh error:', error)
      }
    }, autoRefresh * 1000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  // Alert dismissal handlers
  const handleDismissAlert = (index) => {
    setAlerts(prev => prev.filter((_, i) => i !== index))
  }

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

  // Show landing page first
  if (showLanding) {
    return <LandingPage onEnterDashboard={() => setShowLanding(false)} />
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-title">
            <Droplet size={32} className="header-icon" />
            <div>
              <h1>HydroMonitor</h1>
              <p className="header-subtitle">IoT Aquaculture System</p>
            </div>
          </div>

          {/* Navigation Pills */}
          <nav className="header-nav">
            <button
              className={`nav-pill ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>
            <button
              className={`nav-pill ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={18} />
              Thresholds
            </button>
            <button
              className={`nav-pill ${activeTab === 'operations' ? 'active' : ''}`}
              onClick={() => setActiveTab('operations')}
            >
              <ClipboardCheck size={18} />
              Operations
            </button>
          </nav>

          <div className="header-actions">
            <button
              className={`action-btn ${showAlerts ? 'active' : ''}`}
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
              className="action-btn"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              className="action-btn"
              onClick={() => setShowDocs(true)}
              title="Help & Documentation"
            >
              <BookOpen size={18} />
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
          {/* OVERVIEW TAB - Dashboard */}
          {activeTab === 'overview' && (
            <>
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
            </>
          )}

          {/* SETTINGS TAB - Threshold Configuration */}
          {activeTab === 'settings' && (
            <div className="settings-tab">
              <ThresholdManager readings={readings} />
            </div>
          )}

          {/* OPERATIONS TAB - Daily Operations */}
          {activeTab === 'operations' && (
            <div className="operations-tab">
              <DailyChecklist />
              <MaintenanceSchedule />
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

      {/* Documentation Modal */}
      {showDocs && <Documentation onClose={() => setShowDocs(false)} />}

      <footer className="footer">
        <p>CPC357 IoT Project - Water Quality Monitoring System</p>
        <p className="footer-device">Device: {latestReading?.device_id || 'N/A'}</p>
      </footer>
    </div>
  )
}

export default App
