import { useState, useEffect } from 'react'
import { Save, Upload, RotateCcw, Fish, Plus, Trash2, Edit2, Lock, Unlock } from 'lucide-react'
import { THRESHOLDS } from '../lib/utils'
import { supabase } from '../lib/supabase'
import './ThresholdManager.css'

// Preset profiles for different species
const SPECIES_PRESETS = {
    asian_seabass: {
        name: 'Siakap (Asian Seabass)',
        temperature: { min: 26, max: 32 },
        ph: { min: 7.0, max: 8.5 },
        dissolved_oxygen: { min: 4.0, max: 8.0 },
        ammonia: { min: 0, max: 0.02 }
    },
    grouper: {
        name: 'Kerapu (Hybrid Grouper)',
        temperature: { min: 26, max: 30 },
        ph: { min: 7.5, max: 8.3 },
        dissolved_oxygen: { min: 5.0, max: 8.0 },
        ammonia: { min: 0, max: 0.02 }
    },
    tilapia: {
        name: 'Tilapia (Red/Black)',
        temperature: { min: 25, max: 32 },
        ph: { min: 6.5, max: 9.0 },
        dissolved_oxygen: { min: 3.0, max: 8.0 },
        ammonia: { min: 0, max: 0.05 }
    },
    shrimp: {
        name: 'Udang Vannamei (White Shrimp)',
        temperature: { min: 28, max: 32 },
        ph: { min: 7.5, max: 8.5 },
        dissolved_oxygen: { min: 5.0, max: 8.0 },
        ammonia: { min: 0, max: 0.01 }
    },
    custom: {
        name: 'Custom',
        temperature: { min: 20, max: 30 },
        ph: { min: 6.5, max: 8.5 },
        dissolved_oxygen: { min: 4.0, max: 8.0 },
        ammonia: { min: 0, max: 0.05 }
    }
}

const PARAMETER_CONFIGS = {
    temperature: { label: 'Temperature', unit: '°C', absoluteMin: 0, absoluteMax: 50, step: 0.5 },
    ph: { label: 'pH Level', unit: '', absoluteMin: 0, absoluteMax: 14, step: 0.1 },
    dissolved_oxygen: { label: 'Dissolved Oxygen', unit: 'mg/L', absoluteMin: 0, absoluteMax: 20, step: 0.1 },
    ammonia: { label: 'Ammonia', unit: 'ppm', absoluteMin: 0, absoluteMax: 1, step: 0.001 }
}

export default function ThresholdManager({ readings = [] }) {
    const [customPresets, setCustomPresets] = useState(() => {
        const saved = localStorage.getItem('customPresets')
        return saved ? JSON.parse(saved) : {}
    })

    const [selectedPreset, setSelectedPreset] = useState(() => {
        // Load saved preset selection
        const savedPreset = localStorage.getItem('selectedPreset')
        return savedPreset || 'asian_seabass'
    })

    const [showAddPreset, setShowAddPreset] = useState(false)
    const [newPresetName, setNewPresetName] = useState('')
    const [editingPresetKey, setEditingPresetKey] = useState(null)
    const [editingPresetName, setEditingPresetName] = useState('')

    const [thresholds, setThresholds] = useState(() => {
        // Load from localStorage or use default
        const saved = localStorage.getItem('customThresholds')
        const savedPreset = localStorage.getItem('selectedPreset')

        if (saved) {
            try {
                return JSON.parse(saved)
            } catch (e) {
                console.error('Failed to parse saved thresholds:', e)
            }
        }

        // If there's a saved preset, load its thresholds
        if (savedPreset) {
            const customPresetsData = localStorage.getItem('customPresets')
            const customPresets = customPresetsData ? JSON.parse(customPresetsData) : {}

            if (SPECIES_PRESETS[savedPreset]) {
                return SPECIES_PRESETS[savedPreset]
            } else if (customPresets[savedPreset]) {
                return customPresets[savedPreset].thresholds
            }
        }

        return SPECIES_PRESETS.asian_seabass
    })

    // Calculate how many current readings would trigger alerts
    const getAlertCount = (param, min, max) => {
        if (!readings.length) return 0
        const latestReadings = readings.slice(0, 10) // Check last 10 readings
        return latestReadings.filter(r => {
            const value = r[param]
            return value !== null && value !== undefined && (value < min || value > max)
        }).length
    }

    // Handle preset selection
    const handlePresetChange = (presetKey) => {
        setSelectedPreset(presetKey)
        localStorage.setItem('selectedPreset', presetKey) // Save selection

        // Check if it's a built-in preset or custom
        if (SPECIES_PRESETS[presetKey]) {
            setThresholds(SPECIES_PRESETS[presetKey])
        } else if (customPresets[presetKey]) {
            setThresholds(customPresets[presetKey].thresholds)
        }
    }

    // Add new custom preset
    const handleAddPreset = () => {
        if (!newPresetName.trim()) {
            alert('Please enter a preset name')
            return
        }
        const presetKey = `custom_${Date.now()}`
        const newPresets = {
            ...customPresets,
            [presetKey]: {
                name: newPresetName.trim(),
                thresholds: { ...thresholds },
                locked: false // New presets are unlocked by default
            }
        }
        setCustomPresets(newPresets)
        localStorage.setItem('customPresets', JSON.stringify(newPresets))
        setSelectedPreset(presetKey)
        localStorage.setItem('selectedPreset', presetKey) // Save selection
        setNewPresetName('')
        setShowAddPreset(false)
    }

    // Toggle lock state
    const toggleLock = (presetKey) => {
        const newPresets = {
            ...customPresets,
            [presetKey]: {
                ...customPresets[presetKey],
                locked: !customPresets[presetKey].locked
            }
        }
        setCustomPresets(newPresets)
        localStorage.setItem('customPresets', JSON.stringify(newPresets))
    }

    // Delete custom preset
    const handleDeletePreset = (presetKey) => {
        if (customPresets[presetKey].locked) {
            alert('Cannot delete a locked preset. Unlock it first.')
            return
        }
        if (confirm(`Delete custom preset "${customPresets[presetKey].name}"?`)) {
            const newPresets = { ...customPresets }
            delete newPresets[presetKey]
            setCustomPresets(newPresets)
            localStorage.setItem('customPresets', JSON.stringify(newPresets))
            if (selectedPreset === presetKey) {
                setSelectedPreset('asian_seabass')
                setThresholds(SPECIES_PRESETS.asian_seabass)
            }
        }
    }

    // Start renaming preset
    const startRenaming = (presetKey) => {
        if (customPresets[presetKey].locked) {
            alert('Cannot rename a locked preset. Unlock it first.')
            return
        }
        setEditingPresetKey(presetKey)
        setEditingPresetName(customPresets[presetKey].name)
    }

    // Save renamed preset
    const saveRename = () => {
        if (!editingPresetName.trim()) {
            alert('Preset name cannot be empty')
            return
        }
        const newPresets = {
            ...customPresets,
            [editingPresetKey]: {
                ...customPresets[editingPresetKey],
                name: editingPresetName.trim()
            }
        }
        setCustomPresets(newPresets)
        localStorage.setItem('customPresets', JSON.stringify(newPresets))
        setEditingPresetKey(null)
        setEditingPresetName('')
    }

    // Handle threshold changes
    const handleThresholdChange = (parameter, type, value) => {
        setThresholds(prev => ({
            ...prev,
            [parameter]: {
                ...prev[parameter],
                [type]: parseFloat(value)
            }
        }))
    }

    // Save to localStorage AND Supabase (for backend sync)
    const handleSave = async () => {
        // Save to localStorage
        localStorage.setItem('customThresholds', JSON.stringify(thresholds))
        localStorage.setItem('selectedPreset', selectedPreset)

        // Also sync to Supabase for backend to read
        try {
            await supabase.from('threshold_settings').upsert({
                id: 1,
                temperature_min: thresholds.temperature.min,
                temperature_max: thresholds.temperature.max,
                ph_min: thresholds.ph.min,
                ph_max: thresholds.ph.max,
                dissolved_oxygen_min: thresholds.dissolved_oxygen.min,
                dissolved_oxygen_max: thresholds.dissolved_oxygen.max,
                ammonia_min: thresholds.ammonia.min,
                ammonia_max: thresholds.ammonia.max,
                updated_at: new Date().toISOString()
            })
            alert('Thresholds saved and synced to server!')
        } catch (error) {
            console.log('Supabase sync failed:', error)
            alert('Thresholds saved locally (server sync unavailable)')
        }
    }

    // Export configuration
    const handleExport = () => {
        const config = {
            preset: selectedPreset,
            thresholds: thresholds,
            exportedAt: new Date().toISOString()
        }
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `thresholds-${selectedPreset}-${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    // Import configuration
    const handleImport = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const config = JSON.parse(event.target.result)
                if (config.thresholds) {
                    setThresholds(config.thresholds)
                    setSelectedPreset(config.preset || 'custom')
                    alert('✓ Thresholds imported successfully!')
                }
            } catch (error) {
                alert('✗ Failed to import: Invalid file format')
            }
        }
        reader.readAsText(file)
    }

    // Reset to defaults
    const handleReset = () => {
        if (confirm('Reset all thresholds to default Asian Seabass values?')) {
            setSelectedPreset('asian_seabass')
            setThresholds(SPECIES_PRESETS.asian_seabass)
            localStorage.removeItem('customThresholds')
            localStorage.removeItem('selectedPreset')
        }
    }

    return (
        <div className="threshold-manager">
            <div className="threshold-header">
                <div className="threshold-title">
                    <Fish size={24} />
                    <h2>Threshold Configuration</h2>
                </div>
                <p className="threshold-subtitle">
                    Customize alert thresholds for your aquaculture system
                </p>
            </div>

            {/* Preset Selector */}
            <div className="preset-selector">
                <div className="preset-header-row">
                    <label>Species Preset:</label>
                    <button
                        className="btn-add-preset"
                        onClick={() => setShowAddPreset(true)}
                        title="Create custom preset"
                    >
                        <Plus size={16} />
                        New Custom
                    </button>
                </div>

                <div className="preset-buttons">
                    {/* Built-in presets */}
                    {Object.entries(SPECIES_PRESETS).map(([key, preset]) => (
                        <button
                            key={key}
                            className={`preset-btn ${selectedPreset === key ? 'active' : ''}`}
                            onClick={() => handlePresetChange(key)}
                        >
                            {preset.name}
                        </button>
                    ))}

                    {/* Custom presets */}
                    {Object.entries(customPresets).map(([key, preset]) => (
                        <div key={key} className="custom-preset-wrapper">
                            {editingPresetKey === key ? (
                                <div className="preset-edit-input">
                                    <input
                                        type="text"
                                        value={editingPresetName}
                                        onChange={(e) => setEditingPresetName(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && saveRename()}
                                        autoFocus
                                    />
                                    <button onClick={saveRename} className="btn-save-edit">✓</button>
                                    <button onClick={() => setEditingPresetKey(null)} className="btn-cancel-edit">✕</button>
                                </div>
                            ) : (
                                <>
                                    <button
                                        className={`preset-btn custom ${selectedPreset === key ? 'active' : ''} ${preset.locked ? 'locked' : ''}`}
                                        onClick={() => handlePresetChange(key)}
                                    >
                                        {preset.locked && <Lock size={14} className="lock-icon" />}
                                        {preset.name}
                                    </button>
                                    <button
                                        className="btn-lock-preset"
                                        onClick={() => toggleLock(key)}
                                        title={preset.locked ? 'Unlock' : 'Lock'}
                                    >
                                        {preset.locked ? <Lock size={14} /> : <Unlock size={14} />}
                                    </button>
                                    <button
                                        className="btn-rename-preset"
                                        onClick={() => startRenaming(key)}
                                        title="Rename"
                                        disabled={preset.locked}
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        className="btn-delete-preset"
                                        onClick={() => handleDeletePreset(key)}
                                        title="Delete"
                                        disabled={preset.locked}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {/* Add Preset Modal */}
                {showAddPreset && (
                    <div className="add-preset-form">
                        <input
                            type="text"
                            placeholder="Enter preset name (e.g., 'My Farm Setup')"
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddPreset()}
                            autoFocus
                        />
                        <button onClick={handleAddPreset} className="btn-confirm-add">Save as New Preset</button>
                        <button onClick={() => { setShowAddPreset(false); setNewPresetName('') }} className="btn-cancel-add">Cancel</button>
                    </div>
                )}
            </div>

            {/* Threshold Controls */}
            <div className="threshold-controls">
                {Object.entries(PARAMETER_CONFIGS).map(([param, config]) => {
                    const alertCount = getAlertCount(param, thresholds[param].min, thresholds[param].max)

                    // Get icon for parameter
                    const getParamIcon = () => {
                        switch (param) {
                            case 'temperature': return '🌡️'
                            case 'ph': return '⚗️'
                            case 'dissolved_oxygen': return '💨'
                            case 'ammonia': return '🧪'

                            default: return '📊'
                        }
                    }

                    return (
                        <div key={param} className={`threshold-control ${alertCount > 0 ? 'has-alerts' : ''}`}>
                            <div className="control-header">
                                <div className="param-title">
                                    <span className="param-icon">{getParamIcon()}</span>
                                    <h3>{config.label}</h3>
                                </div>
                                {alertCount > 0 && (
                                    <span className="alert-badge">
                                        {alertCount} alert{alertCount > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>

                            <div className="slider-container">
                                {/* Min Slider */}
                                <div className="slider-group">
                                    <label className="slider-label">
                                        Minimum
                                        <span className="slider-value">{thresholds[param].min} {config.unit}</span>
                                    </label>
                                    <input
                                        type="range"
                                        className="threshold-slider min-slider"
                                        value={thresholds[param].min}
                                        min={config.absoluteMin}
                                        max={thresholds[param].max}
                                        step={config.step}
                                        onChange={(e) => handleThresholdChange(param, 'min', e.target.value)}
                                    />
                                </div>

                                {/* Visual Range Bar */}
                                <div className="range-visual">
                                    <div className="range-bar">
                                        <div
                                            className="range-fill"
                                            style={{
                                                left: `${(thresholds[param].min / config.absoluteMax) * 100}%`,
                                                width: `${((thresholds[param].max - thresholds[param].min) / config.absoluteMax) * 100}%`
                                            }}
                                        />
                                        <div
                                            className="range-handle min-handle"
                                            style={{
                                                left: `${(thresholds[param].min / config.absoluteMax) * 100}%`
                                            }}
                                        />
                                        <div
                                            className="range-handle max-handle"
                                            style={{
                                                left: `${(thresholds[param].max / config.absoluteMax) * 100}%`
                                            }}
                                        />
                                    </div>
                                    <div className="range-labels">
                                        <span className="range-label-start">{config.absoluteMin}</span>
                                        <span className="range-label-end">{config.absoluteMax} {config.unit}</span>
                                    </div>
                                </div>

                                {/* Max Slider */}
                                <div className="slider-group">
                                    <label className="slider-label">
                                        Maximum
                                        <span className="slider-value">{thresholds[param].max} {config.unit}</span>
                                    </label>
                                    <input
                                        type="range"
                                        className="threshold-slider max-slider"
                                        value={thresholds[param].max}
                                        min={thresholds[param].min}
                                        max={config.absoluteMax}
                                        step={config.step}
                                        onChange={(e) => handleThresholdChange(param, 'max', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="range-summary">
                                Safe Range: <strong>{thresholds[param].min} - {thresholds[param].max} {config.unit}</strong>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Action Buttons */}
            <div className="threshold-actions">
                <button className="tm-action-btn primary" onClick={handleSave}>
                    <Save size={18} />
                    Save Configuration
                </button>

                <button className="tm-action-btn secondary" onClick={handleExport}>
                    <Upload size={18} />
                    Export
                </button>

                <label className="tm-action-btn secondary" htmlFor="import-file">
                    <Upload size={18} style={{ transform: 'rotate(180deg)' }} />
                    Import
                    <input
                        id="import-file"
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        style={{ display: 'none' }}
                    />
                </label>

                <button className="tm-action-btn danger" onClick={() => {
                    if (confirm('Reset all thresholds to defaults?')) {
                        setThresholds(SPECIES_PRESETS.asian_seabass)
                        setSelectedPreset('asian_seabass')
                    }
                }}>
                    <RotateCcw size={18} />
                    Reset to Defaults
                </button>
            </div>

            <div className="threshold-info">
                <p><strong>Tip:</strong> Click "Save Configuration" to sync thresholds to the server for email alerts.</p>
            </div>
        </div>
    )
}
