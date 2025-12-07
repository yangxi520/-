import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Physics, useCylinder, usePlane } from '@react-three/cannon';
import { TextureLoader } from 'three';
import { ArrowLeft } from 'lucide-react';
import * as THREE from 'three';

// --- Assets ---
import coinYangTexture from '../assets/coin_yang.png';
import coinYinTexture from '../assets/coin_yin.png';

// --- Constants ---
const COIN_RADIUS = 1.5;
const COIN_THICKNESS = 0.2;
const THROW_HEIGHT = 8;

// --- Helper: Hexagram Logic ---
const HEXAGRAM_LOOKUP = {
    '7': { name: '少阳', symbol: '—', value: 7, type: 'yang' },
    '8': { name: '少阴', symbol: '- -', value: 8, type: 'yin' },
    '9': { name: '老阳', symbol: '— O', value: 9, type: 'yang_moving' },
    '6': { name: '老阴', symbol: '- - X', value: 6, type: 'yin_moving' }
};

// --- Component: Coin ---
const Coin = ({ position, onSettle, isThrowing, index }) => {
    // Physics Body
    const [ref, api] = useCylinder(() => ({
        mass: 1,
        args: [COIN_RADIUS, COIN_RADIUS, COIN_THICKNESS, 32],
        position,
        material: { friction: 0.3, restitution: 0.5 }, // Bouncy but not too slippery
        allowSleep: true,
        sleepSpeedLimit: 0.5, // Sleep when slow
        sleepTimeLimit: 0.5,
        onCollide: (e) => {
            // Optional: Add sound effect here
        }
    }));

    // Textures
    const [yangMap, yinMap] = useLoader(TextureLoader, [coinYangTexture, coinYinTexture]);

    // State to track if this coin has settled
    const isSleeping = useRef(false);

    // Subscribe to sleep events
    useEffect(() => {
        const unsubscribeSleep = api.sleep.subscribe(() => {
            isSleeping.current = true;
            // Get current rotation to determine face
            const quaternion = new THREE.Quaternion();
            // We need to read the current quaternion from the body. 
            // Cannon-es worker doesn't sync instantly, but on sleep it should be stable.
            // However, the best way is to subscribe to rotation changes or just read it now.
            // Let's use a ref to store latest rotation from useFrame if needed, 
            // but api.rotation.subscribe is better.
        });

        const unsubscribeWake = api.wake.subscribe(() => {
            isSleeping.current = false;
        });

        return () => {
            unsubscribeSleep();
            unsubscribeWake();
        };
    }, [api]);

    // Check orientation when settled
    useFrame(() => {
        if (isThrowing) return; // Don't check while throwing

        // If sleeping, report result
        if (isSleeping.current) {
            // We need the actual rotation. 
            // Since we can't easily get it synchronously from the worker in the loop without subscription,
            // let's rely on the parent checking all coins or passing a callback.
            // Actually, let's just update a ref that the parent can read?
            // No, let's use the onSettle callback pattern.

            // Let's try a different approach: Parent manages "Settling" state.
            // Parent checks velocities.
        }
    });

    // Expose API to parent via a ref-like object or context? 
    // Easier: Parent passes a "checkTrigger" prop. 
    // But for now, let's just let the parent handle the logic via a manager or just use a simpler approach.

    // Actually, simpler: The parent will query the cannon world or we just report back when we sleep.
    // Let's use a ref passed from parent to store the API.
    useEffect(() => {
        if (onSettle) {
            onSettle(index, api, ref);
        }
    }, [index, onSettle, api, ref]);

    return (
        <group ref={ref}>
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
        </group>
    );
};

// --- Component: Floor ---
const Floor = () => {
    const [ref] = usePlane(() => ({
        rotation: [-Math.PI / 2, 0, 0],
        position: [0, 0, 0],
        material: { friction: 0.3, restitution: 0.5 }
    }));
    return (
        <mesh ref={ref} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial color="#1a1a1a" />
            <gridHelper args={[100, 100, 0x444444, 0x222222]} rotation={[-Math.PI / 2, 0, 0]} />
        </mesh>
    );
};

// --- Main Component ---
export default function MoneyDivination({ onBack }) {
    const [lines, setLines] = useState([]); // Array of 6 lines
    const [isThrowing, setIsThrowing] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [hexagramName, setHexagramName] = useState('');

    // Refs to access coin physics APIs
    const coinApis = useRef([]);
    const coinRefs = useRef([]);

    const registerCoin = (index, api, ref) => {
        coinApis.current[index] = api;
        coinRefs.current[index] = ref;
    };

    const throwCoins = () => {
        if (lines.length >= 6) {
            // Reset if full
            setLines([]);
            setShowResult(false);
            setHexagramName('');
        }

        setIsThrowing(true);

        // Reset and Throw each coin
        coinApis.current.forEach((api, i) => {
            // 1. Reset Position (Lift them up)
            api.position.set((Math.random() - 0.5) * 2, THROW_HEIGHT + i * 0.5, (Math.random() - 0.5) * 2);
            api.velocity.set(0, 0, 0);
            api.angularVelocity.set(0, 0, 0);
            api.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

            // 2. Wake up
            api.wakeUp();

            // 3. Apply Force & Torque (The Throw)
            // Throw upwards and slightly random direction
            api.applyImpulse(
                [(Math.random() - 0.5) * 5, 5 + Math.random() * 5, (Math.random() - 0.5) * 5],
                [0, 0, 0]
            );
            // Spin them
            api.applyTorque(
                [Math.random() * 10, Math.random() * 10, Math.random() * 10]
            );
        });

        // Wait for settle
        checkSettled();
    };

    const checkSettled = () => {
        // Poll for sleep state
        const interval = setInterval(() => {
            let allSleeping = true;
            // We can't easily check "sleep" state directly from API wrapper synchronously without subscription.
            // Workaround: Check velocity.
            // But simpler: just wait a fixed time for the demo, or use the subscription method in Coin.
            // Let's use a timeout for simplicity and robustness in this MVP.
            // Real physics check is better, but let's assume 3 seconds is enough for them to land.
        }, 100);

        // BETTER APPROACH: 
        // Wait 3-4 seconds, then check orientation.
        setTimeout(() => {
            calculateResult();
        }, 4000);
    };

    const calculateResult = () => {
        // We need to get the final rotation of each coin.
        // Since we are outside the loop, we need to read the current rotation from the mesh ref (which is synced by useCylinder).

        let yangCount = 0;
        let yinCount = 0;

        coinRefs.current.forEach((ref) => {
            if (!ref.current) return;

            // Get World Up Vector (0, 1, 0)
            // Transform it by the coin's quaternion to see where the coin's LOCAL Y axis is pointing.
            // Our Coin: 
            // Top Face (Yin) is Local Y+
            // Bottom Face (Yang) is Local Y-

            const quaternion = ref.current.quaternion;
            const localUp = new THREE.Vector3(0, 1, 0);
            localUp.applyQuaternion(quaternion);

            // If localUp.y > 0, then Local Y+ is pointing UP (World Y+). 
            // So Top Face (Yin) is facing UP. -> Result is YIN.
            // If localUp.y < 0, then Local Y+ is pointing DOWN. 
            // So Bottom Face (Yang) is facing UP. -> Result is YANG.

            if (localUp.y > 0) {
                // Yin Face Up
                yinCount++;
            } else {
                // Yang Face Up
                yangCount++;
            }
        });

        // Determine Line
        // 1 Yang + 2 Yin = Young Yang (—) -> 7
        // 2 Yang + 1 Yin = Young Yin (- -) -> 8
        // 3 Yang + 0 Yin = Old Yang (— O) -> 9
        // 0 Yang + 3 Yin = Old Yin (- - X) -> 6

        let resultValue = 0;
        if (yangCount === 1 && yinCount === 2) resultValue = 7; // 少阳
        else if (yangCount === 2 && yinCount === 1) resultValue = 8; // 少阴
        else if (yangCount === 3 && yinCount === 0) resultValue = 9; // 老阳
        else if (yangCount === 0 && yinCount === 3) resultValue = 6; // 老阴

        const result = HEXAGRAM_LOOKUP[resultValue];

        setLines(prev => [...prev, result]);
        setIsThrowing(false);
    };

    return (
        <div className="w-full h-full relative bg-black">
            {/* 3D Scene */}
            <Canvas shadows camera={{ position: [0, 15, 10], fov: 45 }}>
                <color attach="background" args={['#111']} />
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 20, 10]} angle={0.3} penumbra={1} intensity={1} castShadow />
                <pointLight position={[-10, 10, -10]} intensity={0.5} />

                <Physics gravity={[0, -9.8, 0]} allowSleep>
                    <Floor />
                    <Suspense fallback={null}>
                        <Coin index={0} position={[-2, 5, 0]} onSettle={registerCoin} isThrowing={isThrowing} />
                        <Coin index={1} position={[0, 5, 0]} onSettle={registerCoin} isThrowing={isThrowing} />
                        <Coin index={2} position={[2, 5, 0]} onSettle={registerCoin} isThrowing={isThrowing} />
                    </Suspense>
                </Physics>
            </Canvas>

            {/* UI Overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
                {/* Header */}
                <div className="flex items-center justify-between pointer-events-auto">
                    <button onClick={onBack} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h2 className="text-2xl font-bold text-yellow-500 font-orbitron">金钱卦 · 六爻预测</h2>
                    <div className="w-10"></div>
                </div>

                {/* Hexagram Display (Right Side) */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col-reverse gap-2">
                    {/* Placeholder for 6 lines */}
                    {Array.from({ length: 6 }).map((_, i) => {
                        const line = lines[i];
                        return (
                            <div key={i} className={`w-32 h-8 flex items-center justify-center border border-white/10 rounded transition-all ${line ? 'bg-black/50' : 'bg-transparent'}`}>
                                {line ? (
                                    <div className={`flex items-center gap-2 ${line.value % 2 !== 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                        <span className="font-bold text-lg">{line.symbol}</span>
                                        <span className="text-xs opacity-70">{line.name}</span>
                                    </div>
                                ) : (
                                    <span className="text-white/10 text-xs">{6 - i}爻</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Controls (Bottom) */}
                <div className="flex flex-col items-center gap-4 pointer-events-auto pb-8">
                    <div className="text-yellow-500/80 text-sm font-mono">
                        {isThrowing ? '摇卦中...' : lines.length === 6 ? '卦象已成' : `第 ${lines.length + 1} 爻`}
                    </div>

                    <button
                        onClick={throwCoins}
                        disabled={isThrowing || lines.length >= 6}
                        className={`px-12 py-4 rounded-full font-bold text-xl shadow-lg transition-all transform active:scale-95 ${isThrowing
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                : lines.length >= 6
                                    ? 'bg-green-600 text-white hover:bg-green-500'
                                    : 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white hover:from-yellow-500 hover:to-amber-500 shadow-yellow-500/20'
                            }`}
                    >
                        {lines.length >= 6 ? '重新起卦' : isThrowing ? '计算中...' : '摇 卦'}
                    </button>
                </div>
            </div>
        </div>
    );
}
