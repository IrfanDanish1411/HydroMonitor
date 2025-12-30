import { X, Download } from 'lucide-react'
import { useState, useEffect } from 'react'
import './PWAPrompt.css'

export default function PWAPrompt() {
    const [showPrompt, setShowPrompt] = useState(false)
    const [deferredPrompt, setDeferredPrompt] = useState(null)

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault()
            setDeferredPrompt(e)

            // Check if user has dismissed before
            const dismissed = localStorage.getItem('pwa-prompt-dismissed')
            if (!dismissed) {
                setShowPrompt(true)
            }
        }

        window.addEventListener('beforeinstallprompt', handler)
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            console.log('PWA installed')
        }

        setDeferredPrompt(null)
        setShowPrompt(false)
    }

    const handleDismiss = () => {
        setShowPrompt(false)
        localStorage.setItem('pwa-prompt-dismissed', 'true')
    }

    if (!showPrompt) return null

    return (
        <div className="pwa-prompt">
            <button className="pwa-close" onClick={handleDismiss}>
                <X size={16} />
            </button>
            <div className="pwa-icon">
                <Download size={24} />
            </div>
            <div className="pwa-content">
                <h4>Install Dashboard</h4>
                <p>Add to your home screen for quick access and offline support</p>
            </div>
            <button className="pwa-install-btn" onClick={handleInstall}>
                Install
            </button>
        </div>
    )
}
