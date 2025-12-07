import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowLeft } from 'lucide-react';

// --- Assets ---
import coinYangTexture from '../assets/coin_yang.png';
import coinYinTexture from '../assets/coin_yin.png';

// --- Constants ---
const COIN_RADIUS = 1.5;
const COIN_THICKNESS = 0.2;

// --- Sound Effects ---
const createAudioContext = () => {
    if (typeof window === 'undefined') return null;
    return new (window.AudioContext || window.webkitAudioContext)();
};

const playThrowSound = (audioContext) => {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Throw sound - quick whoosh
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
};

const playLandSound = (audioContext, delay = 0) => {
    if (!audioContext) return;
    
    setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Landing sound - metallic clink
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.2);
        oscillator.type = 'triangle';
        
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(300, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }, delay);
};

// --- Component: Animated Coin ---
function AnimatedCoin({ index, isThrown, onResult, delay = 0, audioContext }) {
    const [started, setStarted] = useState(false);
    const [finalRotation, setFinalRotation] = useState(0);
    const [yangMap, yinMap] = useTexture([coinYangTexture, coinYinTexture]);

    useEffect(() => {
        if (isThrown) {
            const timer = setTimeout(() => {
                const isHeads = Math.random() > 0.5;
                // Heads (Yang/Flower) = 0, Tails (Yin/Characters) = PI
                const baseRotation = isHeads ? 0 : Math.PI;
                // Add 8 full spins (16 * PI)
                setFinalRotation(baseRotation + Math.PI * 16);
                setStarted(true);
            }, delay);
            return () => clearTimeout(timer);
        } else {
            setStarted(false);
        }
    }, [isThrown, delay]);

    const { position, rotation } = useSpring({
        position: started
            ? [index * 3.5 - 3.5, 0.2, 0] // Land on floor, spread out
            : [index * 3.5 - 3.5, 5, 0],  // Start high
        rotation: started
            ? [finalRotation, Math.PI * 3 + (Math.random() * 0.5), (Math.random() - 0.5) * 0.5]
            : [0, 0, 0],
        config: { mass: 2, tension: 120, friction: 14 },
        onRest: () => {
            if (started) {
                // Play landing sound
                playLandSound(audioContext, index * 50);
                
                // Determine final side based on rotation
                const normalizedRotation = finalRotation % (Math.PI * 2);
                const isHeads = normalizedRotation < Math.PI / 2 || normalizedRotation > Math.PI * 1.5;
                onResult(index, isHeads ? 'heads' : 'tails');
            }
        }
    });

    return (
        <animated.group position={position} rotation={rotation}>
            {/* Main Ring Body (with center hole) */}
            <mesh castShadow receiveShadow>
                <ringGeometry args={[COIN_RADIUS * 0.25, COIN_RADIUS, 32]} />
                <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Coin Edge (Ring Thickness) */}
            <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[COIN_RADIUS * 0.98, COIN_RADIUS, 32]} />
                <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Top Face (Yin - Characters) - Local Y+ */}
            <mesh position={[0, COIN_THICKNESS / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[COIN_RADIUS * 0.25, COIN_RADIUS * 0.9, 32]} />
                <meshStandardMaterial map={yinMap} transparent alphaTest={0.5} />
            </mesh>

            {/* Bottom Face (Yang - Flower) - Local Y- */}
            <mesh position={[0, -COIN_THICKNESS / 2 - 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[COIN_RADIUS * 0.25, COIN_RADIUS * 0.9, 32]} />
                <meshStandardMaterial map={yangMap} transparent alphaTest={0.5} />
            </mesh>
        </animated.group>
    );
}

// --- Main Component ---
export default function MoneyDivination({ onBack }) {
    const [isThrown, setIsThrown] = useState(false);
    const [results, setResults] = useState({}); // Store results by index
    const [currentThrow, setCurrentThrow] = useState(1); // Track which throw (1-6)
    const [hexagramLines, setHexagramLines] = useState([]); // Store 6 lines
    const [finalHexagram, setFinalHexagram] = useState(null);
    const audioContextRef = useRef(null);

    const handleThrow = () => {
        // Initialize audio context on first interaction (required for browsers)
        if (!audioContextRef.current) {
            audioContextRef.current = createAudioContext();
        }
        
        // Play throw sound
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }
        playThrowSound(audioContextRef.current);
        
        setIsThrown(false);
        setResults({});
        // Short delay to reset animation state
        setTimeout(() => setIsThrown(true), 100);
    };

    const handleResult = (index, result) => {
        setResults(prev => {
            const newResults = { ...prev, [index]: result };

            // Check if we have all 3 results
            if (Object.keys(newResults).length === 3) {
                calculateYao(newResults);
            }
            return newResults;
        });
    };

    const calculateYao = (finalResults) => {
        const headsCount = Object.values(finalResults).filter(r => r === 'heads').length;
        let yaoType = '';
        let yaoSymbol = '';
        let isMoving = false;
        
        // Traditional Money Divination:
        // 3 Heads (Yang) -> Old Yang (Moving) -> Value 9
        // 2 Heads (Yang) + 1 Tail (Yin) -> Young Yin -> Value 8
        // 1 Head (Yang) + 2 Tails (Yin) -> Young Yang -> Value 7
        // 0 Heads (Yang) -> Old Yin (Moving) -> Value 6

        if (headsCount === 3) {
            yaoType = '老阳';
            yaoSymbol = '━━━';
            isMoving = true;
        } else if (headsCount === 2) {
            yaoType = '少阴';
            yaoSymbol = '━ ━';
            isMoving = false;
        } else if (headsCount === 1) {
            yaoType = '少阳';
            yaoSymbol = '━━━';
            isMoving = false;
        } else {
            yaoType = '老阴';
            yaoSymbol = '━ ━';
            isMoving = true;
        }

        // Add this line to hexagram (from bottom up - 初爻 to 上爻)
        const newLine = { type: yaoType, symbol: yaoSymbol, isMoving, headsCount };
        setHexagramLines(prev => [...prev, newLine]);

        // If this is the 6th throw, calculate final hexagram
        if (currentThrow === 6) {
            const allLines = [...hexagramLines, newLine];
            calculateFinalHexagram(allLines);
            setCurrentThrow(1); // Reset for next divination
        } else {
            setCurrentThrow(prev => prev + 1);
        }
    };

    const calculateFinalHexagram = (lines) => {
        const lineNames = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
        const hexagramDisplay = lines.map((line, index) => 
            `${lineNames[index]}: ${line.symbol} (${line.type})`
        ).join('\n');
        
        const movingLines = lines.filter(line => line.isMoving);
        const hasMovingLines = movingLines.length > 0;
        
        setFinalHexagram({
            lines: hexagramDisplay,
            hasMovingLines,
            movingCount: movingLines.length
        });
    };

    const resetDivination = () => {
        setCurrentThrow(1);
        setHexagramLines([]);
        setFinalHexagram(null);
        setResults({});
        setIsThrown(false);
    };

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            background: 'linear-gradient(to bottom, #1a1a2e, #16213e)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Header / Title */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 999
            }}>
                <button
                    onClick={onBack}
                    style={{
                        position: 'absolute',
                        left: 20,
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    <ArrowLeft size={24} />
                </button>
                <div style={{
                    color: '#fff',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}>
                    金钱卦 🪙
                </div>
            </div>

            {/* Progress and Result Display */}
            <div style={{
                position: 'fixed',
                top: 80,
                width: '100%',
                textAlign: 'center',
                zIndex: 999
            }}>
                {/* Current Throw Progress */}
                {!finalHexagram && (
                    <div style={{
                        color: '#fff',
                        fontSize: '18px',
                        marginBottom: '10px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                        第 {currentThrow} 爻 / 共 6 爻
                    </div>
                )}

                {/* Hexagram Display */}
                {hexagramLines.length > 0 && (
                    <div style={{
                        background: 'rgba(0,0,0,0.7)',
                        borderRadius: '10px',
                        padding: '15px',
                        margin: '10px auto',
                        maxWidth: '300px',
                        color: '#fff'
                    }}>
                        <div style={{ fontSize: '16px', marginBottom: '10px', color: '#ffd700' }}>
                            已完成的爻:
                        </div>
                        {hexagramLines.slice().reverse().map((line, index) => (
                            <div key={index} style={{
                                fontSize: '20px',
                                fontFamily: 'monospace',
                                margin: '5px 0',
                                color: line.isMoving ? '#ff6b6b' : '#69db7c'
                            }}>
                                {line.symbol} ({line.type})
                            </div>
                        ))}
                    </div>
                )}

                {/* Final Hexagram Result */}
                {finalHexagram && (
                    <div style={{
                        background: 'rgba(255,215,0,0.1)',
                        border: '2px solid #ffd700',
                        borderRadius: '15px',
                        padding: '20px',
                        margin: '10px auto',
                        maxWidth: '350px',
                        color: '#ffd700',
                        textShadow: '0 0 15px rgba(255,215,0,0.6)',
                        animation: 'fadeIn 0.5s ease-out'
                    }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
                            🎯 六爻成卦完成！
                        </div>
                        <div style={{ fontSize: '14px', marginBottom: '10px' }}>
                            {finalHexagram.hasMovingLines ? 
                                `包含 ${finalHexagram.movingCount} 个动爻` : 
                                '静卦（无动爻）'
                            }
                        </div>
                        <button 
                            onClick={resetDivination}
                            style={{
                                padding: '8px 16px',
                                background: '#ffd700',
                                color: '#1a1a1a',
                                border: 'none',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                marginTop: '10px'
                            }}
                        >
                            重新占卜
                        </button>
                    </div>
                )}
            </div>

            {/* Shake Button */}
            {!finalHexagram && (
                <button
                    onClick={handleThrow}
                    disabled={isThrown && Object.keys(results).length < 3}
                    style={{
                        position: 'fixed',
                        bottom: 80,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '18px 60px',
                        fontSize: '22px',
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #d4af37 0%, #f59e0b 100%)',
                        color: '#1a1a1a',
                        border: 'none',
                        borderRadius: '50px',
                        cursor: isThrown && Object.keys(results).length < 3 ? 'not-allowed' : 'pointer',
                        zIndex: 999,
                        boxShadow: '0 4px 20px rgba(212, 175, 55, 0.4)',
                        transition: 'all 0.2s',
                        opacity: isThrown && Object.keys(results).length < 3 ? 0.7 : 1
                    }}
                >
                    {isThrown && Object.keys(results).length < 3 ? 
                        `演算第${currentThrow}爻...` : 
                        `摇第${currentThrow}爻`
                    }
                </button>
            )}

            {/* 3D Scene */}
            <Canvas
                camera={{ position: [0, 8, 12], fov: 60 }}
                gl={{ alpha: true, antialias: true }}
                onCreated={({ gl }) => {
                    gl.toneMapping = THREE.ACESFilmicToneMapping;
                    gl.outputColorSpace = THREE.SRGBColorSpace;
                }}
            >
                <ambientLight intensity={1.5} />
                <directionalLight position={[5, 10, 5]} intensity={2} castShadow />
                <pointLight position={[0, 5, 0]} intensity={1} color="#ffd700" />

                <React.Suspense fallback={null}>
                    {[0, 1, 2].map(i => (
                        <AnimatedCoin
                            key={i}
                            index={i}
                            isThrown={isThrown}
                            delay={i * 150} // Stagger start
                            onResult={handleResult}
                            audioContext={audioContextRef.current}
                        />
                    ))}
                </React.Suspense>
            </Canvas>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
