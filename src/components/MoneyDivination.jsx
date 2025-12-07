import React, { useState, useEffect } from 'react';
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

// --- Component: Animated Coin ---
function AnimatedCoin({ index, isThrown, onResult, delay = 0 }) {
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
                // Determine final side based on rotation
                const normalizedRotation = finalRotation % (Math.PI * 2);
                const isHeads = normalizedRotation < Math.PI / 2 || normalizedRotation > Math.PI * 1.5;
                onResult(index, isHeads ? 'heads' : 'tails');
            }
        }
    });

    return (
        <animated.group position={position} rotation={rotation}>
            {/* Main Cylinder Body */}
            <mesh castShadow receiveShadow>
                <cylinderGeometry args={[COIN_RADIUS, COIN_RADIUS, COIN_THICKNESS, 32]} />
                <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Top Face (Yin - Characters) - Local Y+ */}
            <mesh position={[0, COIN_THICKNESS / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[COIN_RADIUS * 1.8, COIN_RADIUS * 1.8]} />
                <meshStandardMaterial map={yinMap} transparent alphaTest={0.5} />
            </mesh>

            {/* Bottom Face (Yang - Flower) - Local Y- */}
            <mesh position={[0, -COIN_THICKNESS / 2 - 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[COIN_RADIUS * 1.8, COIN_RADIUS * 1.8]} />
                <meshStandardMaterial map={yangMap} transparent alphaTest={0.5} />
            </mesh>
        </animated.group>
    );
}

// --- Main Component ---
export default function MoneyDivination({ onBack }) {
    const [isThrown, setIsThrown] = useState(false);
    const [results, setResults] = useState({}); // Store results by index
    const [guaResult, setGuaResult] = useState(null);

    const handleThrow = () => {
        setIsThrown(false);
        setResults({});
        setGuaResult(null);
        // Short delay to reset animation state
        setTimeout(() => setIsThrown(true), 100);
    };

    const handleResult = (index, result) => {
        setResults(prev => {
            const newResults = { ...prev, [index]: result };

            // Check if we have all 3 results
            if (Object.keys(newResults).length === 3) {
                calculateGua(newResults);
            }
            return newResults;
        });
    };

    const calculateGua = (finalResults) => {
        const headsCount = Object.values(finalResults).filter(r => r === 'heads').length;
        let gua = '';
        // Traditional Money Divination:
        // 3 Heads (Yang) -> Old Yang (Moving) -> Value 9
        // 2 Heads (Yang) + 1 Tail (Yin) -> Young Yin -> Value 8
        // 1 Head (Yang) + 2 Tails (Yin) -> Young Yang -> Value 7
        // 0 Heads (Yang) -> Old Yin (Moving) -> Value 6

        if (headsCount === 3) gua = '老阳 ䷀ (三个正面)';
        else if (headsCount === 2) gua = '少阴 ䷁ (两个正面)';
        else if (headsCount === 1) gua = '少阳 ䷂ (一个正面)';
        else gua = '老阴 ䷃ (零个正面)';

        setGuaResult(gua);
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

            {/* Result Display */}
            {guaResult && (
                <div style={{
                    position: 'fixed',
                    top: 100,
                    width: '100%',
                    textAlign: 'center',
                    color: '#ffd700',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    zIndex: 999,
                    textShadow: '0 0 15px rgba(255,215,0,0.6)',
                    animation: 'fadeIn 0.5s ease-out'
                }}>
                    {guaResult}
                </div>
            )}

            {/* Shake Button */}
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
                {isThrown && Object.keys(results).length < 3 ? '演算中...' : '摇 卦'}
            </button>

            {/* 3D Scene */}
            <Canvas
                camera={{ position: [0, 8, 10], fov: 45 }}
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
