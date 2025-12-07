import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useSpring, animated, config } from '@react-spring/three';
import { useTexture, OrbitControls } from '@react-three/drei';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';
import * as THREE from 'three';

// --- Assets ---
import coinYangTexture from '../assets/coin_yang.png';
import coinYinTexture from '../assets/coin_yin.png';
import bgTexture from '../assets/divination_bg.png';

// --- Constants ---
const COIN_RADIUS = 1.5;
const COIN_THICKNESS = 0.2;

// --- Helper: Hexagram Logic ---
const HEXAGRAM_LOOKUP = {
    '7': { name: '少阳', symbol: '—', value: 7, type: 'yang' },
    '8': { name: '少阴', symbol: '- -', value: 8, type: 'yin' },
    '9': { name: '老阳', symbol: '— O', value: 9, type: 'yang_moving' },
    '6': { name: '老阴', symbol: '- - X', value: 6, type: 'yin_moving' }
};

// --- Component: Animated Coin ---
const AnimatedCoin = ({ index, isThrown, onResult, delay = 0 }) => {
    const [started, setStarted] = useState(false);

    // Load textures
    const [yangMap, yinMap] = useTexture([coinYangTexture, coinYinTexture]);

    // Determine final result for this throw
    // We need to generate this when isThrown becomes true
    const [finalResult, setFinalResult] = useState('heads');

    useEffect(() => {
        if (isThrown) {
            // Reset start state
            setStarted(false);

            // Generate new result
            const result = Math.random() > 0.5 ? 'heads' : 'tails';
            setFinalResult(result);

            // Start animation after delay
            const timer = setTimeout(() => {
                setStarted(true);
            }, delay);

            return () => clearTimeout(timer);
        }
    }, [isThrown, delay]);

    // Target rotation based on result
    // Heads (Yang/Flower) = 0 (or 2PI)
    // Tails (Yin/Characters) = PI
    // We add extra rotations for the spin effect
    const targetRotationX = finalResult === 'heads' ? Math.PI * 8 : Math.PI * 9;

    const { position, rotation } = useSpring({
        from: {
            position: [index * 3.5 - 3.5, 5, 0], // Start high
            rotation: [0, 0, 0]
        },
        to: started ? {
            position: [index * 3.5 - 3.5, 0.1, 0], // Land on floor
            rotation: [
                targetRotationX,
                Math.PI * 4 + (Math.random() * 0.5), // Add some random yaw
                (Math.random() - 0.5) * 0.5 // Slight tilt
            ]
        } : {
            // Reset position when not started (or before throw)
            position: [index * 3.5 - 3.5, 5, 0],
            rotation: [0, 0, 0]
        },
        config: {
            mass: 2,
            tension: 120,
            friction: 14
        },
        onRest: () => {
            if (started) {
                onResult(index, finalResult);
            }
        }
    });

    return (
        <animated.group position={position} rotation={rotation}>
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
};

// --- Component: Hexagram Line (Visual) ---
const HexagramLine = ({ line, index }) => {
    if (!line) return (
        <div className="w-full h-8 border border-white/10 rounded bg-black/20 flex items-center justify-center">
            <span className="text-white/20 text-xs font-mono">{index + 1}爻</span>
        </div>
    );

    const isYang = line.value % 2 !== 0; // 7, 9 are Yang
    const isMoving = line.value === 6 || line.value === 9;

    return (
        <div className="w-full h-8 flex items-center justify-center relative group">
            {/* Background Glow */}
            <div className={`absolute inset-0 opacity-20 blur-md ${isYang ? 'bg-red-500' : 'bg-blue-500'}`}></div>

            {/* The Line Bar */}
            <div className="w-full flex justify-between items-center px-1">
                {isYang ? (
                    // Yang Line (Solid)
                    <div className="w-full h-4 bg-gradient-to-r from-red-600 to-red-400 rounded shadow-[0_0_10px_rgba(220,38,38,0.5)] relative">
                        {isMoving && <div className="absolute inset-0 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_5px_#fff]"></div></div>}
                    </div>
                ) : (
                    // Yin Line (Broken)
                    <div className="w-full flex justify-between gap-4">
                        <div className="flex-1 h-4 bg-gradient-to-r from-blue-600 to-blue-400 rounded shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
                        <div className="flex-1 h-4 bg-gradient-to-l from-blue-600 to-blue-400 rounded shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
                        {isMoving && <div className="absolute inset-0 flex items-center justify-center"><div className="w-2 h-2 rotate-45 bg-white animate-pulse shadow-[0_0_5px_#fff]">✕</div></div>}
                    </div>
                )}
            </div>

            {/* Tooltip/Label */}
            <div className="absolute -left-16 text-xs font-bold text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                {line.name}
            </div>
        </div>
    );
};

// --- Main Component ---
export default function MoneyDivination({ onBack }) {
    const [lines, setLines] = useState([]); // Array of 6 lines
    const [isThrowing, setIsThrowing] = useState(false);
    const [currentThrowResults, setCurrentThrowResults] = useState({});

    const throwCoins = () => {
        if (lines.length >= 6) {
            setLines([]);
            return;
        }

        // Reset current results
        setCurrentThrowResults({});

        // Trigger animation
        setIsThrowing(false);
        // Small delay to allow reset
        setTimeout(() => setIsThrowing(true), 50);
    };

    const handleCoinResult = (index, result) => {
        setCurrentThrowResults(prev => {
            const newResults = { ...prev, [index]: result };

            // Check if we have all 3 results
            if (Object.keys(newResults).length === 3) {
                calculateGua(newResults);
            }
            return newResults;
        });
    };

    const calculateGua = (results) => {
        // Count heads (Yang/Flower) and tails (Yin/Characters)
        // In this implementation:
        // 'heads' = Flower (Yang)
        // 'tails' = Characters (Yin)

        // Traditional Money Divination Logic:
        // 1 Back (Heads/Flower) + 2 Fronts (Tails/Characters) -> Shaoyang (Young Yang) - Value 7
        // 2 Backs (Heads/Flower) + 1 Front (Tails/Characters) -> Shaoyin (Young Yin) - Value 8
        // 3 Backs (Heads/Flower) -> Laoyang (Old Yang) - Value 9 (Moving)
        // 3 Fronts (Tails/Characters) -> Laoyin (Old Yin) - Value 6 (Moving)

        // Wait, let's verify the mapping:
        // Usually:
        // 1 Head (Yang) + 2 Tails (Yin) = Shao Yang (7) -- Solid line
        // 2 Heads (Yang) + 1 Tail (Yin) = Shao Yin (8) -- Broken line
        // 3 Heads (Yang) = Lao Yang (9) -- Solid Moving
        // 3 Tails (Yin) = Lao Yin (6) -- Broken Moving

        let headsCount = 0;
        Object.values(results).forEach(r => {
            if (r === 'heads') headsCount++;
        });

        let resultValue = 0;
        if (headsCount === 1) resultValue = 7; // 少阳
        else if (headsCount === 2) resultValue = 8; // 少阴
        else if (headsCount === 3) resultValue = 9; // 老阳
        else if (headsCount === 0) resultValue = 6; // 老阴

        const result = HEXAGRAM_LOOKUP[resultValue];

        // Add to lines after a short delay for visual pacing
        setTimeout(() => {
            setLines(prev => [...prev, result]);
            setIsThrowing(false);
        }, 500);
    };

    // Mobile detection
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

    return (
        <div className="w-full h-full relative bg-black overflow-hidden">
            {/* Debug Green Box */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                background: 'lime',
                color: 'black',
                padding: '10px',
                zIndex: 99999,
                fontSize: '16px',
                fontWeight: 'bold',
                pointerEvents: 'none',
                opacity: 0.5
            }}>
                ✅ React Running | 🌸 SPRING ANIMATION
            </div>

            {/* Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center opacity-60"
                style={{ backgroundImage: `url(${bgTexture})` }}
            ></div>

            {/* 3D Scene */}
            <div className="absolute inset-0 z-10">
                <ErrorBoundary fallback={<div className="absolute inset-0 flex items-center justify-center bg-red-900/80 text-white text-lg z-50">Error loading 3D scene. Please refresh.</div>}>
                    <Canvas
                        shadows
                        camera={{ position: [0, 12, 8], fov: 45 }}
                        gl={{
                            alpha: true,
                            powerPreference: "high-performance",
                            antialias: !isMobile
                        }}
                        onCreated={({ gl }) => {
                            gl.domElement.addEventListener('webglcontextlost', (e) => {
                                console.error('WebGL context lost!', e);
                                e.preventDefault();
                            });
                        }}
                    >
                        <ambientLight intensity={1.5} />
                        <directionalLight position={[5, 5, 5]} intensity={2} />
                        <pointLight position={[0, 5, 0]} intensity={1} />

                        <Suspense fallback={null}>
                            {[0, 1, 2].map(i => (
                                <AnimatedCoin
                                    key={i}
                                    index={i}
                                    isThrown={isThrowing}
                                    delay={i * 150} // Stagger start
                                    onResult={handleCoinResult}
                                />
                            ))}
                        </Suspense>

                        <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={0} maxPolarAngle={Math.PI / 2.5} />
                    </Canvas>
                </ErrorBoundary>
            </div>

            {/* Loading Indicator */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                <div className="w-12 h-12 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mb-4"></div>
                <div className="text-yellow-500 font-mono animate-pulse">正在加载 3D 引擎...</div>
            </div>

            {/* UI Overlay */}
            <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-4 md:p-6">
                {/* Header */}
                <div className="flex items-center justify-between pointer-events-auto">
                    <button onClick={onBack} className="p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 font-orbitron drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            金钱卦
                        </h2>
                        <p className="text-xs text-yellow-500/60 tracking-widest">DIVINATION</p>
                    </div>
                    <div className="w-12"></div>
                </div>

                {/* Hexagram Display */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col-reverse gap-3 p-4 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="w-24 md:w-32">
                            <HexagramLine line={lines[i]} index={i} />
                        </div>
                    ))}
                </div>

                {/* Controls */}
                <div className="flex flex-col items-center gap-6 pointer-events-auto pb-8">
                    <div className="text-yellow-400 font-mono text-shadow-sm">
                        {isThrowing ? '天机演算中...' : lines.length === 6 ? '卦象已成' : `第 ${lines.length + 1} 爻`}
                    </div>

                    <button
                        onClick={throwCoins}
                        disabled={isThrowing}
                        className={`relative group px-12 py-4 rounded-full font-bold text-xl shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all transform active:scale-95 overflow-hidden ${isThrowing
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            : lines.length >= 6
                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                                : 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]'
                            }`}
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <span className="relative flex items-center gap-2">
                            {lines.length >= 6 ? <RotateCcw className="w-5 h-5" /> : null}
                            {lines.length >= 6 ? '重新起卦' : isThrowing ? '...' : '摇 卦'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
