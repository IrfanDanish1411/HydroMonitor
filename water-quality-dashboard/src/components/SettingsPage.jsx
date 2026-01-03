import { useState } from 'react'
import { Settings, Mail, Bell, Palette, Sliders, Shield, Info } from 'lucide-react'
import EmailSettings from './EmailSettings'
import ThresholdManager from './ThresholdManager'
import './SettingsPage.css'

export default function SettingsPage({ readings, darkMode, setDarkMode, autoRefresh, setAutoRefresh }) {
    const [activeSection, setActiveSection] = useState('notifications')

    const sections = [
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'thresholds', label: 'Thresholds', icon: Sliders },
        { id: 'display', label: 'Display', icon: Palette },
        { id: 'about', label: 'About', icon: Info }
    ]

    return (
        <div className="settings-page">
            {/* Settings Navigation */}
            <div className="settings-nav">
                <h2><Settings size={24} /> Settings</h2>
                <nav className="settings-menu">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            className={`settings-menu-item ${activeSection === section.id ? 'active' : ''}`}
                            onClick={() => setActiveSection(section.id)}
                        >
                            <section.icon size={18} />
                            {section.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Settings Content */}
            <div className="settings-content">
                {/* Notifications Section */}
                {activeSection === 'notifications' && (
                    <div className="settings-section">
                        <h3><Bell size={20} /> Notification Settings</h3>
                        <p className="section-description">
                            Configure how and when you receive alerts about water quality.
                        </p>
                        <EmailSettings />
                    </div>
                )}

                {/* Thresholds Section */}
                {activeSection === 'thresholds' && (
                    <div className="settings-section">
                        <h3><Sliders size={20} /> Threshold Configuration</h3>
                        <p className="section-description">
                            Set safe ranges for water quality parameters.
                        </p>
                        <ThresholdManager readings={readings} />
                    </div>
                )}

                {/* Display Section */}
                {activeSection === 'display' && (
                    <div className="settings-section">
                        <h3><Palette size={20} /> Display Settings</h3>
                        <p className="section-description">
                            Customize the dashboard appearance and behavior.
                        </p>

                        <div className="settings-card">
                            <div className="setting-item">
                                <div className="setting-info">
                                    <span className="setting-name">Dark Mode</span>
                                    <span className="setting-desc">Use dark theme for the dashboard</span>
                                </div>
                                <button
                                    className={`toggle-switch ${darkMode ? 'active' : ''}`}
                                    onClick={() => setDarkMode(!darkMode)}
                                >
                                    <span className="toggle-slider"></span>
                                </button>
                            </div>

                            <div className="setting-item">
                                <div className="setting-info">
                                    <span className="setting-name">Auto Refresh</span>
                                    <span className="setting-desc">Data refresh interval</span>
                                </div>
                                <select
                                    className="settings-select"
                                    value={autoRefresh}
                                    onChange={(e) => setAutoRefresh(Number(e.target.value))}
                                >
                                    <option value={10}>10 seconds</option>
                                    <option value={30}>30 seconds</option>
                                    <option value={60}>1 minute</option>
                                    <option value={300}>5 minutes</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* About Section */}
                {activeSection === 'about' && (
                    <div className="settings-section">
                        <h3><Info size={20} /> About HydroMonitor</h3>
                        <p className="section-description">
                            System information and version details.
                        </p>

                        <div className="settings-card about-card">
                            <div className="about-logo">
                                <div className="logo-icon">🐟</div>
                                <div>
                                    <h4>HydroMonitor</h4>
                                    <p>Water Quality Monitoring System</p>
                                </div>
                            </div>

                            <div className="about-info">
                                <div className="info-row">
                                    <span>Version</span>
                                    <span>1.0.0</span>
                                </div>
                                <div className="info-row">
                                    <span>Project</span>
                                    <span>CPC357 IoT</span>
                                </div>
                                <div className="info-row">
                                    <span>Backend</span>
                                    <span>Supabase + MQTT</span>
                                </div>
                                <div className="info-row">
                                    <span>Email Service</span>
                                    <span>Resend API</span>
                                </div>
                            </div>

                            <p className="about-footer">
                                Built for aquaculture monitoring with real-time alerts and analytics.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
