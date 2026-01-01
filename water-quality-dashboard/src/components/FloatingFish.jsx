import { useState, useEffect, useRef, useCallback } from 'react'
import './FloatingFish.css'

// Using Twemoji fish (Twitter emoji CDN - publicly accessible)
const FISH_IMAGE_URL = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f41f.svg"

const FISH_FACTS = [
    "Tilapia are mouthbrooders, meaning they carry their fertilized eggs in their mouths for protection!",
    "Catfish have over 27,000 taste buds, while humans only have about 9,000.",
    "Carp can recognize their owners and can be trained to eat from a hand.",
    "Some species of fish can change their gender during their lives.",
    "Fish have lateral lines that detect vibrations in the water.",
    "The Siamese fighting fish (Betta) builds bubble nests for its babies.",
    "Goldfish can distinguish between different faces and shapes.",
    "Walking catfish can travel across land using their pectoral fins!",
    "Fish were the first vertebrates with bony skeletons to appear on Earth.",
    "Most lipstick contains fish scales (guanine) to give it a shimmer!"
]

const FloatingFish = () => {
    const [currentFact, setCurrentFact] = useState(FISH_FACTS[0])
    const [position, setPosition] = useState({ x: 100, y: 200 })
    const [direction, setDirection] = useState({ x: 1, y: 0.5 }) // Direction vector
    const [isMoving, setIsMoving] = useState(true)
    const [facingRight, setFacingRight] = useState(true)
    const [isHovered, setIsHovered] = useState(false)
    const animationRef = useRef(null)
    const lastTimeRef = useRef(0)

    const pickRandomFact = () => {
        const randomIndex = Math.floor(Math.random() * FISH_FACTS.length)
        setCurrentFact(FISH_FACTS[randomIndex])
    }

    // Random direction change
    const changeDirection = useCallback(() => {
        const angle = Math.random() * Math.PI * 2 // Random angle in radians
        const speed = 0.5 + Math.random() * 1.5 // Random speed between 0.5 and 2
        const newDirX = Math.cos(angle) * speed
        const newDirY = Math.sin(angle) * speed
        setDirection({ x: newDirX, y: newDirY })
        setFacingRight(newDirX > 0)
    }, [])

    // Random pause
    const randomPause = useCallback(() => {
        if (Math.random() < 0.15) { // 15% chance to pause each second
            setIsMoving(false)
            const pauseDuration = 500 + Math.random() * 2000 // 0.5 to 2.5 seconds
            setTimeout(() => {
                setIsMoving(true)
                changeDirection() // Change direction after pause
            }, pauseDuration)
        }
    }, [changeDirection])

    // Animation loop
    useEffect(() => {
        if (isHovered) return // Stop movement when hovered

        const animate = (currentTime) => {
            if (lastTimeRef.current === 0) {
                lastTimeRef.current = currentTime
            }
            const deltaTime = (currentTime - lastTimeRef.current) / 16 // Normalize to ~60fps
            lastTimeRef.current = currentTime

            if (isMoving) {
                setPosition(prev => {
                    let newX = prev.x + direction.x * deltaTime
                    let newY = prev.y + direction.y * deltaTime

                    // Boundary checks - bounce off walls
                    const maxX = window.innerWidth - 100
                    const maxY = window.innerHeight - 150
                    const minX = 0
                    const minY = 80

                    if (newX < minX || newX > maxX) {
                        setDirection(d => {
                            setFacingRight(d.x < 0) // Flip direction
                            return { ...d, x: -d.x }
                        })
                        newX = Math.max(minX, Math.min(maxX, newX))
                    }
                    if (newY < minY || newY > maxY) {
                        setDirection(d => ({ ...d, y: -d.y }))
                        newY = Math.max(minY, Math.min(maxY, newY))
                    }

                    return { x: newX, y: newY }
                })
            }

            animationRef.current = requestAnimationFrame(animate)
        }

        animationRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [direction, isMoving, isHovered])

    // Random behavior changes
    useEffect(() => {
        if (isHovered) return

        const behaviorInterval = setInterval(() => {
            randomPause()
            // Random direction change every few seconds
            if (Math.random() < 0.3) {
                changeDirection()
            }
        }, 1500)

        return () => clearInterval(behaviorInterval)
    }, [changeDirection, randomPause, isHovered])

    // Pick a random fact on initial load
    useEffect(() => {
        pickRandomFact()
    }, [])

    const handleMouseEnter = () => {
        setIsHovered(true)
        pickRandomFact()
    }

    const handleMouseLeave = () => {
        setIsHovered(false)
        changeDirection()
    }

    return (
        <div className="floating-fish-container">
            <div
                className={`fish-wrapper ${isHovered ? 'paused' : ''} ${isMoving ? '' : 'resting'}`}
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    transform: `scaleX(${facingRight ? 1 : -1})`,
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div className="fact-bubble">
                    <div className="fact-title">🐟 Did you know?</div>
                    <p className="fact-text">{currentFact}</p>
                </div>

                <div className="fish-inner">
                    <img src={FISH_IMAGE_URL} alt="Swimming Fish" className="fish-image" />
                </div>

                {/* Decorative bubbles */}
                <div className="bubble" style={{ left: facingRight ? '-10px' : '60px' }}></div>
                <div className="bubble bubble-sm" style={{ left: facingRight ? '-20px' : '80px' }}></div>
            </div>
        </div>
    )
}

export default FloatingFish
