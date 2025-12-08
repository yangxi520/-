/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
// eslint-disable-next-line no-unused-vars
import { useSpring, animated } from '@react-spring/three';
import { useTexture, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { getHexagram } from '../utils/hexagramLogic'; // Import First Principles Logic

// --- Assets ---
import coinYangTexture from '../assets/coin_yang_final.png';
import coinYinTexture from '../assets/coin_yin_final.png';

// --- Constants ---
const COIN_RADIUS = 1.5;
const COIN_THICKNESS = 0.15; // Slightly thinner for realism
const HOLE_SIZE = 0.45; // Size of the square hole

// --- Component: Animated Coin ---
function AnimatedCoin({ index, isThrown, onResult, delay = 0, audioContext }) {
    const [started, setStarted] = useState(false);
    const [finalRotation, setFinalRotation] = useState(0);
    const [hasReported, setHasReported] = useState(false);
    const [yangMap, yinMap] = useTexture([coinYangTexture, coinYinTexture]);

    // Create Coin Geometry with Hole
    const coinGeometry = React.useMemo(() => {
        const shape = new THREE.Shape();
        shape.absarc(0, 0, COIN_RADIUS, 0, Math.PI * 2, false);

        const hole = new THREE.Path();
        const h = HOLE_SIZE;
        hole.moveTo(-h, -h);
        hole.lineTo(h, -h);
        hole.lineTo(h, h);
        hole.lineTo(-h, h);
        hole.lineTo(-h, -h);
        shape.holes.push(hole);

        const extrudeSettings = {
            depth: COIN_THICKNESS,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelSegments: 5
        };

        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }, []);

    useEffect(() => {
        if (isThrown) {
            setHasReported(false);
            const timer = setTimeout(() => {
                const isHeads = Math.random() > 0.5;
                // Heads (Yang) = 0, Tails (Yin) = PI
                const baseRotation = isHeads ? 0 : Math.PI;
                setFinalRotation(baseRotation + Math.PI * 16);
                setStarted(true);
            }, delay);
            return () => clearTimeout(timer);
        } else {
            setStarted(false);
            setHasReported(false);
        }
    }, [isThrown, delay]);

    const [randomRotations, setRandomRotations] = useState({ x: 0, y: 0 });

    useEffect(() => {
        setRandomRotations({
            x: Math.PI * 3 + (Math.random() * 0.5),
            y: (Math.random() - 0.5) * 0.5
        });
    }, []);

    const { position, rotation } = useSpring({
        position: started
            ? [index * 3.5 - 3.5, 0.2, 0]
            : [index * 3.5 - 3.5, 5, 0],
        rotation: started
            ? [finalRotation, randomRotations.x, randomRotations.y]
            : [0, 0, 0],
        config: { mass: 2, tension: 120, friction: 14 },
        onRest: () => {
            if (started && !hasReported) {
                setHasReported(true);
                playLandSound(audioContext, index * 50);

                const normalizedRotation = finalRotation % (Math.PI * 2);
                const isHeads = normalizedRotation < Math.PI / 2 || normalizedRotation > Math.PI * 1.5;
                onResult(index, isHeads ? 'heads' : 'tails');
            }
        }
    });

    return (
        <animated.group position={position} rotation={rotation}>
            {/* Coin Body (Gold Metal) */}
            <mesh geometry={coinGeometry} castShadow receiveShadow>
                <meshStandardMaterial color="#e6c200" metalness={1} roughness={0.3} />
            </mesh>

            {/* Top Face (Yin - Manchu) - Local Z+ (Extrude goes Z+) */}
            {/* Position: thickness + bevel + tiny offset */}
            <mesh position={[0, 0, COIN_THICKNESS + 0.051]} rotation={[0, 0, 0]}>
                <planeGeometry args={[COIN_RADIUS * 2.05, COIN_RADIUS * 2.05]} />
                <meshStandardMaterial
                    map={yinMap}
                    transparent
                    alphaTest={0.1}
                    roughness={0.8}
                    polygonOffset
                    polygonOffsetFactor={-1}
                />
            </mesh>

            {/* Bottom Face (Yang - Qianlong) - Local Z- (Back side) */}
            {/* Position: -bevel - tiny offset */}
            <mesh position={[0, 0, -0.051]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[COIN_RADIUS * 2.05, COIN_RADIUS * 2.05]} />
                <meshStandardMaterial
                    map={yangMap}
                    transparent
                    alphaTest={0.1}
                    roughness={0.8}
                    polygonOffset
                    polygonOffsetFactor={-1}
                />
            </mesh>
        </animated.group>
    );
}



const playLandSound = (audioContext, delay = 0) => {
    if (!audioContext) return;

    setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.2);
        oscillator.type = 'triangle';

        filter.type = 'highpass';
        filter.frequency.setValueAtTime(300, audioContext.currentTime);

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);

        oscillator.stop(audioContext.currentTime + 0.3);
    }, delay);
};

const playThrowSound = (audioContext) => {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
};



// --- Main Component ---
export default function MoneyDivination({ onBack }) {
    // 🎯 简化的状态管理
    const [currentThrow, setCurrentThrow] = useState(1); // 当前第几次摇卦 (1-6)
    const [yaos, setYaos] = useState([]); // 已完成的爻列表
    const [finalHexagram, setFinalHexagram] = useState(null); // 最终卦象

    // 3D动画状态
    const [isThrown, setIsThrown] = useState(false);
    const [coinResults, setCoinResults] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);

    // 🔒 使用 Ref 来解决闭包和竞态问题 (关键修复)
    const isProcessingRef = useRef(false);
    const audioContextRef = useRef(null);
    const [audioContext, setAudioContext] = useState(null);

    // --- Effects ---
    useEffect(() => {
        console.log('MoneyDivination Component Mounted - Version: 2025-12-08 v3 (Final Visuals)');
        // 初始化音频上下文
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = ctx;
        setAudioContext(ctx);
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    // 🎲 开始摇卦 - 严格边界检查
    const handleThrow = () => {
        // 🚨 严格边界检查
        if (currentThrow > 6 || yaos.length >= 6 || finalHexagram || isProcessingRef.current) {
            return;
        }

        // 初始化音频
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }
        playThrowSound(audioContextRef.current);

        // 🔧 完全重置当前摇卦状态
        setCoinResults({});
        isProcessingRef.current = false;
        setIsProcessing(false);
        setIsThrown(false);

        // 启动动画
        setTimeout(() => {
            setIsThrown(true);
        }, 100);
    };

    // 🪙 铜钱落地结果收集 - 关键修复：防止重复生成爻
    const handleCoinResult = (index, result) => {
        // 如果被锁定，直接忽略
        if (isProcessingRef.current || currentThrow > 6 || finalHexagram) {
            return;
        }

        setCoinResults(prev => {
            const newResults = { ...prev, [index]: result };
            const prevCount = Object.keys(prev).length;
            const newCount = Object.keys(newResults).length;

            // 🎯 关键修复：
            // 1. 只有当数量从 <3 变为 3 时才触发 (防止重复触发)
            // 2. 再次检查 Ref 锁
            if (prevCount < 3 && newCount === 3) {
                if (!isProcessingRef.current) {
                    console.log('🎯 收集齐3个铜钱结果，锁定并处理...');
                    isProcessingRef.current = true; // 立即锁定
                    setIsProcessing(true); // 更新UI状态

                    setTimeout(() => {
                        generateYao(newResults);
                    }, 500);
                }
            }

            return newResults;
        });
    };

    // 🎯 生成单个爻（核心逻辑）
    const generateYao = (results) => {
        // 再次检查边界
        if (yaos.length >= 6) {
            isProcessingRef.current = false;
            setIsProcessing(false);
            return;
        }

        const headsCount = Object.values(results).filter(r => r === 'heads').length;

        let yaoType = '';
        let yaoSymbol = '';
        let isMoving = false;
        let binaryVal = 0;

        // 🎲 正确的金钱卦规则
        if (headsCount === 3) {
            yaoType = '老阳';
            yaoSymbol = '━━━';
            isMoving = true;
            binaryVal = 1;
        } else if (headsCount === 2) {
            yaoType = '少阴';
            yaoSymbol = '━ ━';
            isMoving = false;
            binaryVal = 0;
        } else if (headsCount === 1) {
            yaoType = '少阳';
            yaoSymbol = '━━━';
            isMoving = false;
            binaryVal = 1;
        } else { // 0个正面
            yaoType = '老阴';
            yaoSymbol = '━ ━';
            isMoving = true;
            binaryVal = 0;
        }

        // 🎯 创建新爻
        const newYao = {
            number: currentThrow,
            type: yaoType,
            symbol: yaoSymbol,
            isMoving,
            binaryVal,
            headsCount
        };

        // 🔧 更新状态
        setYaos(prev => {
            if (prev.length >= 6) return prev;

            const updated = [...prev, newYao];

            // 检查是否完成6爻
            if (updated.length === 6) {
                setTimeout(() => {
                    generateFinalHexagram(updated);
                }, 500);
            } else {
                // 准备下一次摇卦
                setCurrentThrow(prev => prev + 1);

                // 解锁，允许下一次点击
                isProcessingRef.current = false;
                setIsProcessing(false);
                setIsThrown(false); // 🔧 关键修复：重置投掷状态，使硬币回到上方，按钮恢复可用
                setCoinResults({});
            }

            return updated;
        });
    };

    // 🔮 生成最终卦象
    const generateFinalHexagram = (allYaos) => {
        // Use First Principles Logic
        const hexagramInfo = getHexagram(allYaos.map(yao => yao.binaryVal));

        const movingYaos = allYaos.filter(yao => yao.isMoving);

        setFinalHexagram({
            name: hexagramInfo.name,
            desc: hexagramInfo.desc,
            hasMovingYaos: movingYaos.length > 0,
            movingCount: movingYaos.length,
            // Store binary key for debugging if needed
            binaryKey: allYaos.map(yao => yao.binaryVal).reverse().join('')
        });
    };

    // 🔄 重新占卜 - 完全清空所有状态
    const resetDivination = () => {
        setCurrentThrow(1);
        setYaos([]);
        setFinalHexagram(null);
        setCoinResults({});
        setIsThrown(false);
        isProcessingRef.current = false;
        setIsProcessing(false);
    };

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            background: 'linear-gradient(to bottom, #1a1a2e, #16213e)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Header */}
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

            {/* Progress and Results */}
            <div style={{
                position: 'fixed',
                top: 80,
                width: '100%',
                textAlign: 'center',
                zIndex: 999
            }}>
                {/* Progress */}
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

                {/* Completed Yaos */}
                {yaos.length > 0 && (
                    <div style={{
                        background: 'rgba(0,0,0,0.7)',
                        borderRadius: '10px',
                        padding: '15px',
                        margin: '10px auto',
                        maxWidth: '300px',
                        color: '#fff'
                    }}>
                        <div style={{ fontSize: '16px', marginBottom: '10px', color: '#ffd700' }}>
                            已完成的爻 ({yaos.length}/6):
                        </div>
                        {yaos.slice().reverse().map((yao, index) => (
                            <div key={index} style={{
                                fontSize: '20px',
                                fontFamily: 'monospace',
                                margin: '5px 0',
                                color: yao.isMoving ? '#ff6b6b' : '#69db7c'
                            }}>
                                {yao.symbol} ({yao.type})
                            </div>
                        ))}
                    </div>
                )}

                {/* Final Result */}
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
                        <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', color: '#fff' }}>
                            {finalHexagram.name}
                        </div>
                        <div style={{ fontSize: '16px', marginBottom: '15px', fontStyle: 'italic', color: '#ddd' }}>
                            {finalHexagram.desc}
                        </div>
                        <div style={{ fontSize: '14px', marginBottom: '10px' }}>
                            {finalHexagram.hasMovingYaos ?
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

            {/* Throw Button */}
            {!finalHexagram && yaos.length < 6 && currentThrow <= 6 && (
                <button
                    onClick={handleThrow}
                    disabled={isProcessing || (isThrown && Object.keys(coinResults).length < 3)}
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
                        cursor: (isProcessing || (isThrown && Object.keys(coinResults).length < 3)) ? 'not-allowed' : 'pointer',
                        zIndex: 999,
                        boxShadow: '0 4px 20px rgba(212, 175, 55, 0.4)',
                        transition: 'all 0.2s',
                        opacity: (isProcessing || (isThrown && Object.keys(coinResults).length < 3)) ? 0.7 : 1
                    }}
                >
                    {isProcessing ?
                        `处理中...` :
                        (isThrown && Object.keys(coinResults).length < 3) ?
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
                            delay={i * 150}
                            onResult={handleCoinResult}
                            audioContext={audioContext}
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
            {/* 强制刷新按钮 (用于解决缓存问题) */}
            <div className="absolute top-4 right-4 z-50">
                <button
                    onClick={async () => {
                        if (window.confirm('确定要强制清除缓存并刷新吗？这将解决看不到最新更新的问题。')) {
                            try {
                                // 1. 注销所有 Service Workers
                                if ('serviceWorker' in navigator) {
                                    const registrations = await navigator.serviceWorker.getRegistrations();
                                    for (const registration of registrations) {
                                        await registration.unregister();
                                    }
                                }
                                // 2. 清除所有缓存
                                if ('caches' in window) {
                                    const keys = await caches.keys();
                                    for (const key of keys) {
                                        await caches.delete(key);
                                    }
                                }
                                // 3. 强制刷新
                                window.location.reload(true);
                            } catch (error) {
                                console.error('清除缓存失败:', error);
                                window.location.reload();
                            }
                        }
                    }}
                    className="bg-red-500/20 hover:bg-red-500/40 text-red-200 text-xs px-2 py-1 rounded border border-red-500/30 backdrop-blur-sm transition-colors"
                >
                    修复显示问题 (强制刷新)
                </button>
            </div>
            {/* 版本号显示 */}
            <div className="absolute bottom-2 right-2 text-white/20 text-xs pointer-events-none z-50">
                v2025.12.08.4
            </div>
        </div>
    );
}// Hexagram display fix applied Mon Dec  8 15:16:16 CST 2025
