import { useState } from 'react'
import { BookOpen, Settings, Activity, Bell, X } from 'lucide-react'
import './Documentation.css'

export default function Documentation({ onClose }) {
    const [activeTab, setActiveTab] = useState('guide')

    return (
        <div className="documentation-overlay" onClick={onClose}>
            <div className="documentation-modal" onClick={(e) => e.stopPropagation()}>
                <div className="doc-header">
                    <div className="doc-title">
                        <BookOpen size={28} />
                        <h1>HydroMonitor Documentation</h1>
                    </div>
                    <button className="doc-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="doc-tabs">
                    <button
                        className={`doc-tab ${activeTab === 'guide' ? 'active' : ''}`}
                        onClick={() => setActiveTab('guide')}
                    >
                        <BookOpen size={18} />
                        Getting Started
                    </button>
                    <button
                        className={`doc-tab ${activeTab === 'features' ? 'active' : ''}`}
                        onClick={() => setActiveTab('features')}
                    >
                        <Activity size={18} />
                        Features
                    </button>
                    <button
                        className={`doc-tab ${activeTab === 'config' ? 'active' : ''}`}
                        onClick={() => setActiveTab('config')}
                    >
                        <Settings size={18} />
                        Configuration
                    </button>
                    <button
                        className={`doc-tab ${activeTab === 'alerts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('alerts')}
                    >
                        <Bell size={18} />
                        Alerts
                    </button>
                </div>

                <div className="doc-content">
                    {activeTab === 'guide' && (
                        <div className="guide-section">
                            <h2>Welcome to HydroMonitor</h2>
                            <p>
                                HydroMonitor is a comprehensive aquaculture water quality monitoring system
                                designed for real-time parameter tracking and intelligent alerting.
                            </p>

                            <div className="info-card info">
                                <strong>🎯 Quick Navigation</strong>
                                <p>Use the navigation pills at the top to switch between:</p>
                                <ul>
                                    <li><strong>Dashboard:</strong> Real-time metrics and charts</li>
                                    <li><strong>Thresholds:</strong> Configure alert parameters</li>
                                    <li><strong>Operations:</strong> Daily tasks and maintenance</li>
                                </ul>
                            </div>

                            <h3>Dashboard Overview</h3>
                            <p>The main dashboard displays:</p>
                            <ul>
                                <li><strong>Health Score:</strong> Weighted system health based on all parameters</li>
                                <li><strong>Weather Widget:</strong> Local weather conditions</li>
                                <li><strong>Sunrise/Sunset:</strong> Daily light cycle information</li>
                                <li><strong>Location Map:</strong> Farm location with coordinates</li>
                                <li><strong>Metric Cards:</strong> Current values for all 4 parameters</li>
                                <li><strong>Charts:</strong> Historical trends and patterns</li>
                            </ul>

                            <div className="info-card success">
                                <strong>✅ Test vs Production Mode</strong>
                                <p>
                                    Toggle between Test Mode (wider thresholds for calibration) and
                                    Production Mode (strict thresholds for operations) using the toggle in the header.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'features' && (
                        <div className="guide-section">
                            <h2>Key Features</h2>

                            <div className="feature-grid-doc">
                                <div className="feature-item-doc">
                                    <strong>🌡️ Temperature</strong>
                                    <p>Real-time water temperature monitoring with trend analysis</p>
                                </div>
                                <div className="feature-item-doc">
                                    <strong>⚗️ pH Level</strong>
                                    <p>Continuous pH tracking to maintain optimal water chemistry</p>
                                </div>
                                <div className="feature-item-doc">
                                    <strong>💨 Dissolved Oxygen</strong>
                                    <p>Critical oxygen level monitoring for fish health</p>
                                </div>
                                <div className="feature-item-doc">
                                    <strong>🧪 Ammonia</strong>
                                    <p>Toxic ammonia detection with instant alerts</p>
                                </div>
                            </div>

                            <h3>Advanced Features</h3>
                            <ul>
                                <li><strong>Grouped Alerts:</strong> Alerts organized by parameter with severity indicators</li>
                                <li><strong>Weighted Health Score:</strong> Composite score with parameter breakdown</li>
                                <li><strong>Species Presets:</strong> Pre-configured thresholds for different fish species</li>
                                <li><strong>Custom Presets:</strong> Save and manage your own threshold configurations</li>
                                <li><strong>Data Export:</strong> Export readings as CSV or JSON</li>
                                <li><strong>Auto-refresh:</strong> Configurable refresh intervals (10s - 5m)</li>
                                <li><strong>Real-time Updates:</strong> Live data streaming via Supabase</li>
                            </ul>

                            <div className="info-card warning">
                                <strong>⚠️ Important</strong>
                                <p>
                                    Dashboard thresholds are separate from backend alert thresholds.
                                    Changes here only affect this dashboard's visual indicators.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'config' && (
                        <div className="guide-section">
                            <h2>Configuration Guide</h2>

                            <h3>Threshold Manager</h3>
                            <p>Access the Threshold Manager via the "Thresholds" tab to:</p>
                            <ul>
                                <li>Select from built-in species presets (Asian Seabass, Tilapia, Shrimp, Salmon)</li>
                                <li>Create custom presets for your specific setup</li>
                                <li>Lock/unlock presets to prevent accidental changes</li>
                                <li>Export/import threshold configurations</li>
                            </ul>

                            <div className="setup-step">
                                <h3>Creating a Custom Preset</h3>
                                <ol>
                                    <li>Click "Thresholds" tab in the navigation</li>
                                    <li>Click "+ New Custom" button</li>
                                    <li>Enter a name for your preset (e.g., "My Farm Setup")</li>
                                    <li>Adjust sliders for each parameter's min/max values</li>
                                    <li>Click "Save Configuration"</li>
                                </ol>
                            </div>

                            <h3>Parameter Ranges</h3>
                            <table className="config-table">
                                <thead>
                                    <tr>
                                        <th>Parameter</th>
                                        <th>Absolute Range</th>
                                        <th>Step</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Temperature</td>
                                        <td>0 - 50°C</td>
                                        <td>0.5°C</td>
                                    </tr>
                                    <tr>
                                        <td>pH Level</td>
                                        <td>0 - 14</td>
                                        <td>0.1</td>
                                    </tr>
                                    <tr>
                                        <td>Dissolved Oxygen</td>
                                        <td>0 - 20 mg/L</td>
                                        <td>0.1 mg/L</td>
                                    </tr>
                                    <tr>
                                        <td>Ammonia</td>
                                        <td>0 - 1 ppm</td>
                                        <td>0.001 ppm</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="info-card info">
                                <strong>💡 Tip</strong>
                                <p>
                                    Lock your production presets to prevent accidental modifications.
                                    Use the lock icon next to custom presets.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'alerts' && (
                        <div className="guide-section">
                            <h2>Alert System</h2>

                            <p>
                                The alert system monitors all parameters and triggers notifications when
                                values fall outside configured thresholds.
                            </p>

                            <h3>Alert Severity</h3>
                            <ul>
                                <li><strong>🔴 High:</strong> Critical deviation requiring immediate action</li>
                                <li><strong>🟡 Medium:</strong> Warning level, monitor closely</li>
                                <li><strong>🟢 Low:</strong> Minor deviation, informational</li>
                            </ul>

                            <h3>Alert Panel Features</h3>
                            <ul>
                                <li><strong>Grouped by Parameter:</strong> Alerts organized for easy scanning</li>
                                <li><strong>Collapse/Expand:</strong> Click headers to show/hide details</li>
                                <li><strong>Recommendations:</strong> Actionable advice for each parameter</li>
                                <li><strong>Bulk Actions:</strong> Acknowledge all alerts at once or by group</li>
                            </ul>

                            <div className="setup-step">
                                <h3>Managing Alerts</h3>
                                <ol>
                                    <li>Click the bell icon (🔔) in the header to open the alert panel</li>
                                    <li>Review grouped alerts by parameter</li>
                                    <li>Click parameter headers to expand and see details</li>
                                    <li>Read recommendations for corrective actions</li>
                                    <li>Click "Acknowledge All" to clear alerts after addressing</li>
                                </ol>
                            </div>

                            <div className="info-card warning">
                                <strong>⚠️ Alert Recommendations</strong>
                                <p>Common actions by parameter:</p>
                                <ul>
                                    <li><strong>Temperature High:</strong> Enable cooling or add ice packs</li>
                                    <li><strong>Ammonia High:</strong> 30-50% water change, reduce feeding</li>
                                    <li><strong>DO Low:</strong> Increase aeration immediately</li>
                                    <li><strong>pH Imbalance:</strong> Use pH adjusters or check water source</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
