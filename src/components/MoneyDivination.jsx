import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import { useTexture } from '@react-three/drei';
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

// --- Component: Phase 2 Textured Coin ---
function TexturedCoin({ drop, targetRotationX }) {
    const [yangMap, yinMap] = useTexture([coinYangTexture, coinYinTexture]);

    const { position, rotation } = useSpring({
        position: drop ? [0, 0.2, 0] : [0, 5, 0],
        rotation: drop
            ? [targetRotationX, Math.PI * 3, 0]
            : [0, 0, 0],
        config: { mass: 2, tension: 120, friction: 14 }
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

export default function MoneyDivination({ onBack }) {
    const [drop, setDrop] = useState(false);
    const [targetRotationX, setTargetRotationX] = useState(0);

    const handleDrop = () => {
        if (!drop) {
            // About to drop: Calculate random result
            const isHeads = Math.random() > 0.5;
            // Heads (Yang/Flower) = 0, Tails (Yin/Characters) = PI
            const baseRotation = isHeads ? 0 : Math.PI;
            // Add 8 full spins (16 * PI)
            setTargetRotationX(baseRotation + Math.PI * 16);
        }
        setDrop(!drop);
    };

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
            {/* Back Button */}
            <button
                onClick={onBack}
                style={{
                    position: 'fixed',
                    top: 20,
                    right: 20,
                    padding: '10px 20px',
                    background: 'white',
                    color: 'black',
                    zIndex: 10000
                }}
            >
                Back
            </button>

            {/* Test 1: HTML Display */}
            <div style={{
                position: 'fixed',
                top: 20,
                left: 20,
                background: 'red',
                color: 'white',
                padding: 20,
                zIndex: 9999,
                fontSize: 24,
                fontWeight: 'bold'
            }}>
                🔴 HTML 正常 | Phase 2.5: Randomization
            </div>

            {/* Test Control */}
            <button
                onClick={handleDrop}
                style={{
                    position: 'fixed',
                    bottom: 50,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '15px 30px',
                    fontSize: '20px',
                    zIndex: 9999,
                    background: 'white',
                    color: 'black'
                }}
            >
                {drop ? '重置 (Reset)' : '测试随机 (Drop)'}
            </button>

            {/* Test 2: Canvas */}
            <Canvas
                style={{ background: 'blue' }}
                onCreated={() => console.log('✅ Canvas Created')}
            >
                <ambientLight intensity={1.5} />
                <directionalLight position={[5, 5, 5]} intensity={2} />

                <React.Suspense fallback={null}>
                    <TexturedCoin drop={drop} targetRotationX={targetRotationX} />
                </React.Suspense>
            </Canvas>
        </div>
    );
}
