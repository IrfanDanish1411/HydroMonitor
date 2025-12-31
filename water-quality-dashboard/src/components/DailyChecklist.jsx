import { useState, useEffect } from 'react'
import { ClipboardCheck, Clock, CheckCircle, Circle, RotateCcw, Calendar } from 'lucide-react'
import './DailyChecklist.css'

export default function DailyChecklist() {
    const [checklist, setChecklist] = useState([])
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0])

    const defaultTasks = [
        { id: 1, name: 'Morning feeding', time: '07:00', category: 'Feeding', icon: '🍽️', requiresAmount: true },
        { id: 2, name: 'Check aerators', time: '08:00', category: 'Equipment', icon: '💨', requiresAmount: false },
        { id: 3, name: 'Visual fish health check', time: '09:00', category: 'Observation', icon: '👁️', requiresAmount: false },
        { id: 4, name: 'Water quality readings', time: '10:00', category: 'Monitoring', icon: '📊', requiresAmount: false },
        { id: 5, name: 'Mortality count', time: '10:30', category: 'Health', icon: '📝', requiresAmount: true },
        { id: 6, name: 'Afternoon feeding', time: '15:00', category: 'Feeding', icon: '🍽️', requiresAmount: true },
        { id: 7, name: 'Evening feeding', time: '18:00', category: 'Feeding', icon: '🍽️', requiresAmount: true },
        { id: 8, name: 'Night-time DO check', time: '21:00', category: 'Monitoring', icon: '🌙', requiresAmount: false }
    ]

    useEffect(() => {
        loadChecklist(currentDate)
    }, [currentDate])

    const loadChecklist = (date) => {
        const savedData = localStorage.getItem('dailyChecklists')
        const allChecklists = savedData ? JSON.parse(savedData) : {}

        if (allChecklists[date]) {
            setChecklist(allChecklists[date])
        } else {
            // Initialize new day
            const initialChecklist = defaultTasks.map(task => ({
                ...task,
                completed: false,
                completedAt: null,
                amount: '',
                notes: ''
            }))
            setChecklist(initialChecklist)
            allChecklists[date] = initialChecklist
            localStorage.setItem('dailyChecklists', JSON.stringify(allChecklists))
        }
    }

    const saveChecklist = (updatedChecklist) => {
        setChecklist(updatedChecklist)
        const savedData = localStorage.getItem('dailyChecklists')
        const allChecklists = savedData ? JSON.parse(savedData) : {}
        allChecklists[currentDate] = updatedChecklist
        localStorage.setItem('dailyChecklists', JSON.stringify(allChecklists))
    }

    const toggleTask = (taskId) => {
        const updatedChecklist = checklist.map(task => {
            if (task.id === taskId) {
                const now = new Date()
                return {
                    ...task,
                    completed: !task.completed,
                    completedAt: !task.completed ? now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null
                }
            }
            return task
        })
        saveChecklist(updatedChecklist)
    }

    const updateTaskData = (taskId, field, value) => {
        const updatedChecklist = checklist.map(task => {
            if (task.id === taskId) {
                return { ...task, [field]: value }
            }
            return task
        })
        saveChecklist(updatedChecklist)
    }

    const resetDay = () => {
        const initialChecklist = defaultTasks.map(task => ({
            ...task,
            completed: false,
            completedAt: null,
            amount: '',
            notes: ''
        }))
        saveChecklist(initialChecklist)
    }

    const changeDate = (days) => {
        const newDate = new Date(currentDate)
        newDate.setDate(newDate.getDate() + days)
        setCurrentDate(newDate.toISOString().split('T')[0])
    }

    const completedCount = checklist.filter(t => t.completed).length
    const totalCount = checklist.length
    const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    const isToday = currentDate === new Date().toISOString().split('T')[0]

    return (
        <div className="daily-checklist-container">
            <div className="checklist-header">
                <div className="checklist-title">
                    <ClipboardCheck size={28} />
                    <h2>Daily Operations Checklist</h2>
                </div>

                <div className="date-selector">
                    <button onClick={() => changeDate(-1)} className="date-nav">←</button>
                    <div className="current-date">
                        <Calendar size={18} />
                        {currentDate}
                        {isToday && <span className="today-badge">Today</span>}
                    </div>
                    <button onClick={() => changeDate(1)} className="date-nav" disabled={isToday}>→</button>
                </div>
            </div>

            <div className="progress-section">
                <div className="progress-stats">
                    <div className="stat-item">
                        <span className="stat-value">{completedCount}/{totalCount}</span>
                        <span className="stat-label">Tasks Completed</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{completionPercentage}%</span>
                        <span className="stat-label">Progress</span>
                    </div>
                </div>

                <div className="progress-bar-container">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${completionPercentage}%` }}
                    />
                </div>

                {isToday && (
                    <button className="btn-reset-day" onClick={resetDay}>
                        <RotateCcw size={16} />
                        Reset Today
                    </button>
                )}
            </div>

            <div className="checklist-grid">
                {checklist.map(task => (
                    <div key={task.id} className={`checklist-card ${task.completed ? 'completed' : ''}`}>
                        <div className="task-check" onClick={() => toggleTask(task.id)}>
                            {task.completed ? (
                                <CheckCircle size={24} className="check-icon completed" />
                            ) : (
                                <Circle size={24} className="check-icon" />
                            )}
                        </div>

                        <div className="task-icon-daily">{task.icon}</div>

                        <div className="task-info">
                            <div className="task-header-daily">
                                <h3>{task.name}</h3>
                                <div className="task-meta">
                                    <span className="task-time">
                                        <Clock size={14} />
                                        {task.time}
                                    </span>
                                    <span className="task-category-daily">{task.category}</span>
                                </div>
                            </div>

                            {task.requiresAmount && (
                                <div className="task-input-group">
                                    <label>Amount/Count:</label>
                                    <input
                                        type="text"
                                        value={task.amount}
                                        onChange={(e) => updateTaskData(task.id, 'amount', e.target.value)}
                                        placeholder={task.name.includes('feeding') ? 'e.g., 50kg' : 'e.g., 5 fish'}
                                        disabled={!isToday}
                                    />
                                </div>
                            )}

                            <div className="task-input-group">
                                <label>Notes:</label>
                                <input
                                    type="text"
                                    value={task.notes}
                                    onChange={(e) => updateTaskData(task.id, 'notes', e.target.value)}
                                    placeholder="Observations, issues, etc."
                                    disabled={!isToday}
                                />
                            </div>

                            {task.completed && task.completedAt && (
                                <div className="completion-time">
                                    ✓ Completed at {task.completedAt}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
