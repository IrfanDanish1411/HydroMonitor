import { useState, useEffect } from 'react'
import { Mail, MailX, Save, AlertTriangle, Clock, Check, Lock, Unlock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './EmailSettings.css'

// Admin PIN for protecting email settings (change this!)
const ADMIN_PIN = '472513'

export default function EmailSettings() {
    const [emailEnabled, setEmailEnabled] = useState(false)
    const [emailAddress, setEmailAddress] = useState('')
    const [cooldownMinutes, setCooldownMinutes] = useState(5)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saveMessage, setSaveMessage] = useState(null)

    // PIN lock state
    const [isLocked, setIsLocked] = useState(true)
    const [pinInput, setPinInput] = useState('')
    const [pinError, setPinError] = useState(false)

    // Load settings on mount
    useEffect(() => {
        loadSettings()
    }, [])

    async function loadSettings() {
        // Always try localStorage first (reliable fallback)
        const saved = localStorage.getItem('emailSettings')
        if (saved) {
            try {
                const settings = JSON.parse(saved)
                setEmailEnabled(settings.enabled ?? false)
                setEmailAddress(settings.email ?? '')
                setCooldownMinutes(settings.cooldownMinutes ?? 5)
                console.log('Loaded email settings from localStorage:', settings)
            } catch (e) {
                console.error('Error parsing localStorage settings:', e)
            }
        }

        // Then try Supabase (optional sync)
        try {
            const { data, error } = await supabase
                .from('email_settings')
                .select('*')
                .limit(1)
                .single()

            if (data && !error) {
                setEmailEnabled(data.enabled ?? false)
                setEmailAddress(data.recipient_email ?? '')
                setCooldownMinutes(Math.round((data.cooldown_seconds ?? 300) / 60))
                console.log('Loaded email settings from Supabase:', data)
            }
        } catch (error) {
            console.log('Supabase email_settings table not available, using localStorage only')
        } finally {
            setLoading(false)
        }
    }

    function handleUnlock() {
        if (pinInput === ADMIN_PIN) {
            setIsLocked(false)
            setPinError(false)
            setPinInput('')
        } else {
            setPinError(true)
            setTimeout(() => setPinError(false), 2000)
        }
    }

    async function saveSettings() {
        if (isLocked) {
            setSaveMessage({ type: 'error', text: 'Unlock with PIN first!' })
            setTimeout(() => setSaveMessage(null), 2000)
            return
        }

        setSaving(true)
        setSaveMessage(null)

        // Always save to localStorage first (guaranteed to work)
        const localSettings = {
            enabled: emailEnabled,
            email: emailAddress,
            cooldownMinutes
        }
        localStorage.setItem('emailSettings', JSON.stringify(localSettings))
        console.log('Saved to localStorage:', localSettings)

        // Also try Supabase (optional sync)
        try {
            const { error } = await supabase
                .from('email_settings')
                .upsert({
                    id: 1,
                    enabled: emailEnabled,
                    recipient_email: emailAddress,
                    cooldown_seconds: cooldownMinutes * 60,
                    updated_at: new Date().toISOString()
                })

            if (error) throw error
            setSaveMessage({ type: 'success', text: 'Settings saved!' })
        } catch (error) {
            console.log('Supabase save failed (table may not exist):', error.message)
            setSaveMessage({ type: 'success', text: 'Settings saved locally!' })
        }

        setSaving(false)
        setIsLocked(true) // Re-lock after saving
        setTimeout(() => setSaveMessage(null), 3000)
    }

    const handleToggle = () => {
        if (isLocked) return // Prevent changes when locked
        setEmailEnabled(!emailEnabled)
    }

    if (loading) {
        return (
            <div className="email-settings loading">
                <div className="loading-spinner"></div>
            </div>
        )
    }

    return (
        <div className="email-settings">
            <div className="email-settings-header">
                <div className="header-icon">
                    {emailEnabled ? <Mail size={24} /> : <MailX size={24} />}
                </div>
                <div className="header-text">
                    <h3>Email Notifications</h3>
                    <p>Receive alerts when water quality parameters exceed thresholds</p>
                </div>
            </div>

            <div className="email-settings-content">
                {/* Admin Lock Section */}
                <div className={`setting-row lock-row ${isLocked ? 'locked' : 'unlocked'}`}>
                    <div className="setting-label">
                        {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
                        <span className="label-text">
                            {isLocked ? 'Settings Locked' : 'Settings Unlocked'}
                        </span>
                    </div>
                    {isLocked ? (
                        <div className="pin-input-group">
                            <input
                                type="password"
                                className={`pin-input ${pinError ? 'error' : ''}`}
                                placeholder="Enter PIN"
                                value={pinInput}
                                onChange={(e) => setPinInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                                maxLength={6}
                            />
                            <button className="unlock-btn" onClick={handleUnlock}>
                                Unlock
                            </button>
                        </div>
                    ) : (
                        <span className="unlock-status">Ready to edit</span>
                    )}
                </div>

                {/* Main Toggle */}
                <div className="setting-row toggle-row">
                    <div className="setting-label">
                        <span className="label-text">Enable Email Alerts</span>
                        <span className="label-hint">Send email when thresholds are exceeded</span>
                    </div>
                    <button
                        className={`toggle-switch ${emailEnabled ? 'active' : ''}`}
                        onClick={handleToggle}
                        aria-label="Toggle email notifications"
                    >
                        <span className="toggle-slider"></span>
                    </button>
                </div>

                {/* Email Address Input */}
                <div className={`setting-row ${(!emailEnabled || isLocked) ? 'disabled' : ''}`}>
                    <div className="setting-label">
                        <span className="label-text">Recipient Email</span>
                        <span className="label-hint">Where to send alert notifications</span>
                    </div>
                    <input
                        type="email"
                        className="email-input"
                        placeholder="your-email@example.com"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        disabled={!emailEnabled || isLocked}
                    />
                </div>

                {/* Cooldown Setting */}
                <div className={`setting-row ${(!emailEnabled || isLocked) ? 'disabled' : ''}`}>
                    <div className="setting-label">
                        <Clock size={16} className="setting-icon" />
                        <span className="label-text">Alert Cooldown</span>
                        <span className="label-hint">Minimum time between alerts for same parameter</span>
                    </div>
                    <select
                        className="cooldown-select"
                        value={cooldownMinutes}
                        onChange={(e) => setCooldownMinutes(Number(e.target.value))}
                        disabled={!emailEnabled || isLocked}
                    >
                        <option value={1}>1 minute</option>
                        <option value={5}>5 minutes</option>
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                    </select>
                </div>

                {/* Warning Note */}
                <div className="setting-note">
                    <AlertTriangle size={16} />
                    <span>
                        Email notifications require a configured Resend API key on the server.
                        Contact your administrator if emails are not being sent.
                    </span>
                </div>

                {/* Save Button */}
                <div className="settings-actions">
                    <button
                        className="save-button"
                        onClick={saveSettings}
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <div className="button-spinner"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Save Settings
                            </>
                        )}
                    </button>

                    {saveMessage && (
                        <div className={`save-message ${saveMessage.type}`}>
                            <Check size={16} />
                            {saveMessage.text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
