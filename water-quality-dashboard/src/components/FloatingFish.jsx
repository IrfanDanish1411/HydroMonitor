import { useState, useEffect } from 'react'
import './FloatingFish.css'

const FISH_IMAGE_URL = "https://images.template.net/466665/Fish-Icon-Clipart-edit-online.png"

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
    // Initialize with a random fact to prevent empty bubble
    const [currentFact, setCurrentFact] = useState(FISH_FACTS[0])

    const pickRandomFact = () => {
        const randomIndex = Math.floor(Math.random() * FISH_FACTS.length)
        setCurrentFact(FISH_FACTS[randomIndex])
    }

    return (
        <div className="floating-fish-container">
            <div
                className="fish-wrapper"
                onMouseEnter={pickRandomFact}
            >
                <div className="fact-bubble">
                    <div className="fact-title">Did you know?</div>
                    {currentFact}
                </div>

                <div className="fish-inner">
                    <img src={FISH_IMAGE_URL} alt="Swimming Fish" className="fish-image" />
                </div>

                {/* Decorative bubbles */}
                <div className="bubble" style={{ left: '10px', width: '8px', height: '8px', animationDelay: '0s' }}></div>
                <div className="bubble" style={{ left: '30px', width: '5px', height: '5px', animationDelay: '0.5s' }}></div>
            </div>
        </div>
    )
}

export default FloatingFish
