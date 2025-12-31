import { useState, useEffect } from 'react'
import { Wrench, CheckCircle, AlertCircle, Calendar, RotateCcw } from 'lucide-react'
import './MaintenanceSchedule.css'

export default function MaintenanceSchedule() {
    const [tasks, setTasks] = useState([])

    const defaultTasks = [
        { id: 1, name: 'Clean sensors', intervalDays: 7, description: 'Clean all water quality sensors', category: 'Sensors', icon: '🔧' },
        { id: 2, name: 'Calibrate pH probe', intervalDays: 30, description: 'Calibrate pH sensor with buffer solutions', category: 'Sensors', icon: '⚗️' },
        { id: 3, name: 'Check aerator motors', intervalDays: 7, description: 'Inspect all aerator motors and check for unusual sounds', category: 'Equipment', icon: '💨' },
        { id: 4, name: 'Sample water quality manually', intervalDays: 7, description: 'Take manual water samples for lab testing', category: 'Testing', icon: '🧪' },
        { id: 5, name: 'Inspect nets/screens', intervalDays: 14, description: 'Check pond nets and screens for damage or debris', category: 'Infrastructure', icon: '🎣' },
        { id: 6, name: 'Replace aerator filters', intervalDays: 30, description: 'Clean or replace aerator air filters', category: 'Equipment', icon: '🌀' },
        { id: 7, name: 'Test backup power', intervalDays: 30, description: 'Test generator/backup power systems', category: 'Safety', icon: '⚡' }
    ]

    useEffect(() => {
        const savedTasks = localStorage.getItem('maintenanceTasks')
        if (savedTasks) {
            setTasks(JSON.parse(savedTasks))
        } else {
            // Initialize with default tasks
            const initialized = defaultTasks.map(task => ({
                ...task,
                lastCompleted: null,
                nextDue: new Date().toISOString().split('T')[0]
            }))
            setTasks(initialized)
            localStorage.setItem('maintenanceTasks', JSON.stringify(initialized))
        }
    }, [])

    const saveTasks = (updatedTasks) => {
        setTasks(updatedTasks)
        localStorage.setItem('maintenanceTasks', JSON.stringify(updatedTasks))
    }

    const markComplete = (taskId) => {
        const today = new Date().toISOString().split('T')[0]
        const updatedTasks = tasks.map(task => {
            if (task.id === taskId) {
                const nextDue = new Date()
                nextDue.setDate(nextDue.getDate() + task.intervalDays)
                return {
                    ...task,
                    lastCompleted: today,
                    nextDue: nextDue.toISOString().split('T')[0]
                }
            }
            return task
        })
        saveTasks(updatedTasks)
    }

    const resetTask = (taskId) => {
        const today = new Date().toISOString().split('T')[0]
        const updatedTasks = tasks.map(task => {
            if (task.id === taskId) {
                return {
                    ...task,
                    lastCompleted: null,
                    nextDue: today
                }
            }
            return task
        })
        saveTasks(updatedTasks)
    }

    const getDaysUntilDue = (nextDue) => {
        if (!nextDue) return 0
        const today = new Date()
        const dueDate = new Date(nextDue)
        const diffTime = dueDate - today
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    const getTaskStatus = (task) => {
        const daysUntil = getDaysUntilDue(task.nextDue)
        if (daysUntil < 0) return 'overdue'
        if (daysUntil === 0) return 'due-today'
        if (daysUntil <= 2) return 'due-soon'
        return 'scheduled'
    }

    const sortedTasks = [...tasks].sort((a, b) => {
        const statusOrder = { 'overdue': 0, 'due-today': 1, 'due-soon': 2, 'scheduled': 3 }
        return statusOrder[getTaskStatus(a)] - statusOrder[getTaskStatus(b)]
    })

    const overdueCount = tasks.filter(t => getTaskStatus(t) === 'overdue').length
    const dueTodayCount = tasks.filter(t => getTaskStatus(t) === 'due-today').length

    return (
        <div className="maintenance-container">
            <div className="maintenance-header">
                <div className="maintenance-title">
                    <Wrench size={28} />
                    <h2>Maintenance Schedule</h2>
                </div>
                <div className="maintenance-summary">
                    {overdueCount > 0 && (
                        <div className="summary-badge overdue">
                            <AlertCircle size={16} />
                            {overdueCount} Overdue
                        </div>
                    )}
                    {dueTodayCount > 0 && (
                        <div className="summary-badge due-today">
                            <Calendar size={16} />
                            {dueTodayCount} Due Today
                        </div>
                    )}
                    {overdueCount === 0 && dueTodayCount === 0 && (
                        <div className="summary-badge all-clear">
                            <CheckCircle size={16} />
                            All Up to Date
                        </div>
                    )}
                </div>
            </div>

            <div className="maintenance-grid">
                {sortedTasks.map(task => {
                    const status = getTaskStatus(task)
                    const daysUntil = getDaysUntilDue(task.nextDue)

                    return (
                        <div key={task.id} className={`maintenance-card ${status}`}>
                            <div className="task-icon">{task.icon}</div>

                            <div className="task-content">
                                <div className="task-header">
                                    <h3>{task.name}</h3>
                                    <span className="task-category">{task.category}</span>
                                </div>

                                <p className="task-description">{task.description}</p>

                                <div className="task-schedule">
                                    <div className="schedule-info">
                                        <span className="schedule-label">Interval:</span>
                                        <span className="schedule-value">Every {task.intervalDays} days</span>
                                    </div>

                                    <div className="schedule-info">
                                        <span className="schedule-label">Next Due:</span>
                                        <span className={`schedule-value ${status}`}>
                                            {task.nextDue}
                                            {status === 'overdue' && ` (${Math.abs(daysUntil)} days overdue)`}
                                            {status === 'due-today' && ' (Today)'}
                                            {status === 'due-soon' && ` (${daysUntil} days)`}
                                        </span>
                                    </div>

                                    {task.lastCompleted && (
                                        <div className="schedule-info">
                                            <span className="schedule-label">Last Done:</span>
                                            <span className="schedule-value">{task.lastCompleted}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="task-actions">
                                <button
                                    className="btn-complete"
                                    onClick={() => markComplete(task.id)}
                                >
                                    <CheckCircle size={18} />
                                    Mark Complete
                                </button>
                                <button
                                    className="btn-reset"
                                    onClick={() => resetTask(task.id)}
                                    title="Reset to today"
                                >
                                    <RotateCcw size={16} />
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
