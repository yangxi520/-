/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
// eslint-disable-next-line no-unused-vars
import { useSpring, animated } from '@react-spring/three';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowLeft } from 'lucide-react';
import { getHexagram } from '../utils/hexagramLogic';

// --- Assets ---
import coinYangTexture from '../assets/coin_yang_perfect.png';
import coinYinTexture from '../assets/coin_yin_circular.png';
import bgImage from '../assets/song_mist.png'; // Minimalist Mist Background

// --- Constants ---
const COIN_RADIUS = 1.8;
const COIN_THICKNESS = 0.3;

// --- Helper: Ink Brush Stroke CSS ---
const InkStroke = ({ type, width = '100%' }) => {
    // type: 'yang' (solid) or 'yin' (broken)
    const containerStyle = {
        height: '16px',
        width: width,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0,
        animation: 'strokeDraw 0.8s ease-out forwards'
    };

    const inkBarStyle = {
        height: '100%',
        backgroundColor: '#1a1a1a',
        borderRadius: '2px',
        background: 'linear-gradient(90deg, rgba(40,40,40,0.9) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 80%, rgba(40,40,40,0.9) 100%)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        filter: 'blur(0.3px)'
    };

    if (type === 'yang') {
        return (
            <div style={containerStyle}>
                <div style={{ ...inkBarStyle, width: '100%' }}></div>
            </div>
        );
    } else {
        return (
            <div style={{ ...containerStyle, justifyContent: 'space-between' }}>
                <div style={{ ...inkBarStyle, width: '42%' }}></div>
                <div style={{ ...inkBarStyle, width: '42%' }}></div>
            </div>
        );
    }
};

// --- Component: Animated Coin ---
function AnimatedCoin({ index, isThrown, onResult, delay = 0, audioContext }) {
    const [started, setStarted] = useState(false);
    const [finalRotation, setFinalRotation] = useState(0);
    const [hasReported, setHasReported] = useState(false);
    const [yangMap, yinMap] = useTexture([coinYangTexture, coinYinTexture]);

    useEffect(() => {
        if (isThrown) {
            setHasReported(false);
            const timer = setTimeout(() => {
                const isHeads = Math.random() > 0.5;
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
        // Fix: Raise the resting position (Y) so coins don't clip into the "floor" or look cut off.
        // Was 0.2, now 0 (aligned with camera center roughly)
        // Dropping from 6 to 0
        position: started ? [index * 4.0 - 4.0, 0, 0] : [index * 4.0 - 4.0, 6, 0],
        rotation: started ? [finalRotation, randomRotations.x, randomRotations.y] : [0, 0, 0],
        config: { mass: 2.5, tension: 120, friction: 14 },
        onRest: () => {
            if (started && !hasReported) {
                setHasReported(true);
                playLandSound(audioContext, index * 60);
                const normalizedRotation = finalRotation % (Math.PI * 2);
                const isHeads = normalizedRotation < Math.PI / 2 || normalizedRotation > Math.PI * 1.5;
                onResult(index, isHeads ? 'heads' : 'tails');
            }
        }
    });

    return (
        <animated.group position={position} rotation={rotation}>
            {/* Bronze Edge */}
            <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[COIN_RADIUS, COIN_RADIUS, COIN_THICKNESS, 64]} />
                <meshStandardMaterial
                    color="#B8860B" // Dark Goldenrod
                    metalness={0.8}
                    roughness={0.4}
                    envMapIntensity={0.8}
                />
            </mesh>
            {/* Faces */}
            <mesh position={[0, 0, COIN_THICKNESS / 2 + 0.002]} castShadow>
                <circleGeometry args={[COIN_RADIUS, 64]} />
                <meshStandardMaterial map={yinMap} transparent={true} alphaTest={0.5} metalness={0.5} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0, -COIN_THICKNESS / 2 - 0.002]} rotation={[0, Math.PI, 0]} castShadow>
                <circleGeometry args={[COIN_RADIUS, 64]} />
                <meshStandardMaterial map={yangMap} transparent={true} alphaTest={0.5} metalness={0.5} roughness={0.5} />
            </mesh>
        </animated.group>
    );
}

// --- Audio Functions ---
const playLandSound = (audioContext, delay = 0) => {
    if (!audioContext) return;
    setTimeout(() => {
        const bufferSize = audioContext.sampleRate * 0.03;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15)) * 0.3;
        const noise = audioContext.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = audioContext.createGain();
        noise.connect(noiseGain);
        noiseGain.connect(audioContext.destination);
        noiseGain.gain.setValueAtTime(0.08, audioContext.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.03);
        noise.start(audioContext.currentTime);

        const osc1 = audioContext.createOscillator();
        const gain1 = audioContext.createGain();
        osc1.connect(gain1);
        gain1.connect(audioContext.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1400, audioContext.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.12);
        gain1.gain.setValueAtTime(0.12, audioContext.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
        osc1.start(audioContext.currentTime);
        osc1.stop(audioContext.currentTime + 0.15);
    }, delay);
};

const playThrowSound = (audioContext) => {
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.06);
    gain.gain.setValueAtTime(0.08, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.06);
    osc.start();
    osc.stop(audioContext.currentTime + 0.06);
};

// --- Main Component ---
export default function MoneyDivination({ onBack }) {
    const [currentThrow, setCurrentThrow] = useState(1);
    const [yaos, setYaos] = useState([]);
    const [finalHexagram, setFinalHexagram] = useState(null);
    const [isThrown, setIsThrown] = useState(false);
    const [coinResults, setCoinResults] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);
    const isProcessingRef = useRef(false);
    const audioContextRef = useRef(null);
    const [audioContext, setAudioContext] = useState(null);

    useEffect(() => {
        console.log('MoneyDivination Masterpiece Style v3 - Floating Fix');
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = ctx;
        setAudioContext(ctx);
        return () => {
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    const handleThrow = () => {
        if (yaos.length >= 6 || finalHexagram || isProcessingRef.current) return;
        if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
        playThrowSound(audioContextRef.current);
        setCoinResults({});
        isProcessingRef.current = false;
        setIsProcessing(false);
        setIsThrown(false);
        setTimeout(() => setIsThrown(true), 100);
    };

    const handleCoinResult = (index, result) => {
        if (isProcessingRef.current || yaos.length >= 6 || finalHexagram) return;
        setCoinResults(prev => {
            const newResults = { ...prev, [index]: result };
            if (Object.keys(prev).length < 3 && Object.keys(newResults).length === 3) {
                if (!isProcessingRef.current && yaos.length < 6) {
                    isProcessingRef.current = true;
                    setIsProcessing(true);
                    setTimeout(() => generateYao(newResults), 500);
                }
            }
            return newResults;
        });
    };

    const generateYao = (results) => {
        if (yaos.length >= 6) return;
        const headsCount = Object.values(results).filter(r => r === 'heads').length;
        let yaoType, isMoving, binaryVal;

        if (headsCount === 3) { yaoType = '老阳'; isMoving = true; binaryVal = 1; }
        else if (headsCount === 2) { yaoType = '少阴'; isMoving = false; binaryVal = 0; }
        else if (headsCount === 1) { yaoType = '少阳'; isMoving = false; binaryVal = 1; }
        else { yaoType = '老阴'; isMoving = true; binaryVal = 0; }

        const newYao = { number: yaos.length + 1, type: yaoType, isMoving, binaryVal, headsCount };
        setYaos(prev => {
            if (prev.length >= 6) return prev;
            const updated = [...prev, newYao];
            if (updated.length === 6) {
                setTimeout(() => generateFinalHexagram(updated), 500);
            } else {
                setCurrentThrow(updated.length + 1);
                isProcessingRef.current = false;
                setIsProcessing(false);
                setIsThrown(false);
                setCoinResults({});
            }
            return updated;
        });
    };

    const generateFinalHexagram = (allYaos) => {
        const hexagramInfo = getHexagram(allYaos.map(yao => yao.binaryVal));
        const movingYaos = allYaos.filter(yao => yao.isMoving);
        setFinalHexagram({
            name: hexagramInfo.name,
            desc: hexagramInfo.desc,
            hasMovingYaos: movingYaos.length > 0,
            movingCount: movingYaos.length
        });
    };

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
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: '"Noto Serif SC", "Songti SC", "KaiTi", "STKaiti", serif',
            color: '#2b2b2b',
        }}>
            {/* Soft Ambient Overlay */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(240, 230, 220, 0.2)',
                pointerEvents: 'none'
            }} />

            {/* Header */}
            <div style={{
                position: 'absolute',
                top: 50,
                left: 60,
                writingMode: 'vertical-rl',
                textOrientation: 'upright',
                zIndex: 50,
                display: 'flex',
                gap: '20px',
                height: 'auto'
            }}>
                {/* Title Seal */}
                <div style={{
                    width: '36px',
                    height: '36px',
                    border: '2px solid #a83232',
                    color: '#a83232',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    writingMode: 'horizontal-tb'
                }}>
                    吉
                </div>

                <div style={{
                    fontSize: '42px',
                    fontWeight: 900,
                    color: '#1a1a1a',
                    letterSpacing: '8px',
                    fontFamily: '"STKaiti", "KaiTi", serif',
                    opacity: 0.9
                }}>
                    金钱卦
                </div>

                <div style={{
                    fontSize: '16px',
                    color: '#666',
                    fontStyle: 'normal',
                    marginTop: '20px',
                    letterSpacing: '4px',
                    borderRight: '1px solid #999',
                    paddingRight: '15px'
                }}>
                    问道于心・诚则灵
                </div>
            </div>

            {/* Back Button */}
            <button
                onClick={onBack}
                style={{
                    position: 'absolute',
                    top: 30,
                    right: 40,
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '1px solid #888',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#555',
                    background: 'transparent',
                    cursor: 'pointer',
                    zIndex: 100,
                    transition: 'all 0.3s'
                }}
                onMouseOver={e => { e.target.style.borderColor = '#1a1a1a'; e.target.style.color = '#000'; }}
                onMouseOut={e => { e.target.style.borderColor = '#888'; e.target.style.color = '#555'; }}
            >
                <ArrowLeft size={16} />
            </button>

            {/* RIGHT PANEL - FLOATING INK */}
            <div style={{
                position: 'absolute',
                top: '50%',
                right: '8%',
                transform: 'translateY(-50%)',
                width: '300px',
                minHeight: '400px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 50,
            }}>
                {!finalHexagram && (
                    <div style={{
                        marginBottom: '30px',
                        fontSize: '14px',
                        color: '#8b4513',
                        letterSpacing: '2px',
                        borderBottom: '1px solid rgba(139, 69, 19, 0.3)',
                        paddingBottom: '5px'
                    }}>
                        演算第 {currentThrow} 爻
                    </div>
                )}

                {/* Yao List - RESTORED TEXT LABELS */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column-reverse', gap: '18px', flex: 1, justifyContent: 'center' }}>
                    {yaos.length === 0 && Array(6).fill(0).map((_, i) => (
                        <div key={i} style={{
                            height: '1px',
                            width: '100%',
                            margin: '12px 0'
                        }}></div>
                    ))}

                    {yaos.map((yao, index) => (
                        <div key={index} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {/* Ink Stroke */}
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <InkStroke type={yao.binaryVal === 1 ? 'yang' : 'yin'} width="100%" />
                            </div>

                            {/* Text Info (Right Side) */}
                            <div style={{ width: '60px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '14px', color: '#1a1a1a', fontWeight: 'bold' }}>{yao.type}</span>
                                {yao.isMoving && (
                                    <span style={{ fontSize: '10px', color: '#c0392b', fontWeight: 'bold' }}>动爻</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Final Result */}
                {finalHexagram && (
                    <div style={{
                        marginTop: '30px',
                        textAlign: 'center',
                        width: '100%',
                        animation: 'fadeIn 1s ease',
                        position: 'relative'
                    }}>
                        <div style={{ width: '40px', height: '2px', background: '#333', margin: '0 auto 20px auto' }} />

                        <div style={{
                            fontSize: '48px',
                            fontWeight: 'normal',
                            marginBottom: '15px',
                            color: '#1a1a1a',
                            fontFamily: '"STKaiti", "KaiTi", serif',
                            textShadow: '0 2px 10px rgba(255,255,255,0.8)'
                        }}>
                            {finalHexagram.name}
                        </div>

                        <div style={{
                            fontSize: '15px',
                            color: '#444',
                            lineHeight: '1.8',
                            textAlign: 'justify',
                            fontFamily: '"Noto Serif SC", serif'
                        }}>
                            {finalHexagram.desc}
                        </div>

                        <button
                            onClick={resetDivination}
                            style={{
                                marginTop: '40px',
                                padding: '10px 30px',
                                background: 'transparent',
                                border: '1px solid #5d4037',
                                color: '#5d4037',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                letterSpacing: '2px'
                            }}
                            onMouseOver={(e) => { e.target.style.background = '#5d4037'; e.target.style.color = '#fff'; }}
                            onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#5d4037'; }}
                        >
                            再卜一卦
                        </button>
                    </div>
                )}
            </div>

            {/* Shake Button */}
            {!finalHexagram && yaos.length < 6 && (
                <button
                    onClick={handleThrow}
                    disabled={isProcessing || (isThrown && Object.keys(coinResults).length < 3)}
                    style={{
                        position: 'fixed',
                        bottom: '10%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '90px',
                        height: '90px',
                        borderRadius: '12px',
                        background: '#b71c1c',
                        color: 'rgba(255,255,255,0.9)',
                        border: 'none',
                        boxShadow: '0 8px 25px rgba(183, 28, 28, 0.4)',
                        fontSize: '32px',
                        fontFamily: '"STKaiti", "KaiTi", serif',
                        cursor: (isProcessing || (isThrown && Object.keys(coinResults).length < 3)) ? 'not-allowed' : 'pointer',
                        zIndex: 999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s',
                        filter: isProcessing ? 'grayscale(0.5)' : 'none'
                    }}
                >
                    <div style={{
                        border: '2px solid rgba(255,255,255,0.3)',
                        width: '85%',
                        height: '85%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px'
                    }}>
                        {isProcessing ? '...' : <span style={{ writingMode: 'vertical-rl', textOrientation: 'upright', fontSize: '24px' }}>启动</span>}
                    </div>
                </button>
            )}

            {/* 3D Scene - REMOVED FLOOR PLANE */}
            <Canvas
                shadows
                camera={{ position: [0, 8, 12], fov: 45 }}
                gl={{ alpha: true, antialias: true }}
                onCreated={({ gl }) => {
                    gl.toneMapping = THREE.ACESFilmicToneMapping;
                    gl.outputColorSpace = THREE.SRGBColorSpace;
                }}
            >
                <ambientLight intensity={1.5} color="#fffcf5" />
                <directionalLight
                    position={[5, 10, 5]}
                    intensity={2.0}
                    color="#fff8e1"
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                />
                <spotLight
                    position={[0, 10, 0]}
                    angle={0.5}
                    penumbra={1}
                    intensity={1}
                    color="#ffd700"
                    castShadow
                />

                <React.Suspense fallback={null}>
                    {/* FLOOR PLANE REMOVED to prevent clipping */}
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
                @keyframes strokeDraw {
                    from { width: 0; opacity: 0; }
                    to { width: 100%; opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            <div className="absolute bottom-2 right-2 text-gray-500/30 text-[10px] pointer-events-none z-50">
                Song Dynasty Remastered v3
            </div>
        </div>
    );
}
