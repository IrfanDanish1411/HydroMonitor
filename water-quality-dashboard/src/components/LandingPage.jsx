import { Droplet, Activity, TrendingUp, Bell, Fish, MapPin, Cloud, Sun } from 'lucide-react'
import './LandingPage.css'

export default function LandingPage({ onEnterDashboard }) {
    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="brand-header">
                        <Droplet size={40} className="brand-icon" />
                        <span className="brand-name">HydroMonitor</span>
                    </div>

                    <h1 className="hero-title">
                        Precision Aquaculture <br />
                        <span className="text-gradient">Intelligence</span>
                    </h1>

                    <p className="hero-description">
                        Empower your farm with real-time data, predictive analytics, and automated safeguards for maximum yield and sustainability.
                    </p>

                    <button className="cta-button" onClick={onEnterDashboard}>
                        Enter Dashboard
                        <Activity size={20} />
                    </button>
                </div>

                <div className="hero-stats">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <Activity />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">5+</span>
                            <span className="stat-label">Active Parameters</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">
                            <TrendingUp />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">Live</span>
                            <span className="stat-label">Real-time Updates</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">
                            <Fish />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">IOT</span>
                            <span className="stat-label">System Online</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="section-header">
                    <h2 className="section-title">Complete Ecosystem Control</h2>
                    <p className="section-subtitle">Everything you need to maintain optimal water quality</p>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon temperature">
                            <Droplet size={28} />
                        </div>
                        <h3>Real-time Analysis</h3>
                        <p>Instant precision tracking of Temperature, pH, DO, and Ammonia ranges.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon alerts">
                            <Bell size={28} />
                        </div>
                        <h3>Intelligent Alerts</h3>
                        <p>Smart notification system with actionable recommendations before critical limits are reached.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon analytics">
                            <TrendingUp size={28} />
                        </div>
                        <h3>Data Analytics</h3>
                        <p>Visual trend tracking and historical data export for data-driven farming decisions.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon species">
                            <Fish size={28} />
                        </div>
                        <h3>Species Profiles</h3>
                        <p>Pre-configured environmental presets tailored for Siakap, Kerapu, Udang, and more.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon location">
                            <MapPin size={28} />
                        </div>
                        <h3>Farm Mapping</h3>
                        <p>Integrated GPS location tracking and site monitoring capabilities.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon weather">
                            <Sun size={28} />
                        </div>
                        <h3>Weather Integration</h3>
                        <p>Live local weather forecasts to anticipate environmental impacts on your water quality.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <Droplet size={20} />
                        <span>HydroMonitor</span>
                    </div>
                    <p className="footer-copyright">
                        © 2025 HydroMonitor IoT Systems. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    )
}
