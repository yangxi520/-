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
import bgImage from '../assets/song_mist.png';

// --- Constants ---
const COIN_RADIUS = 1.8;
const COIN_THICKNESS = 0.3;

// --- Helper: Ink Brush Stroke CSS ---
// Converted inline styles to Tailwind classes where possible, kept dynamic styles inline
const InkStroke = ({ type, width = '100%' }) => {
    // type: 'yang' (solid) or 'yin' (broken)
    const containerClass = "h-4 relative flex items-center justify-center opacity-0 animate-[strokeDraw_0.8s_ease-out_forwards]";

    // Ink texture gradient
    const inkStyle = {
        background: 'linear-gradient(90deg, rgba(40,40,40,0.9) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 80%, rgba(40,40,40,0.9) 100%)',
        filter: 'blur(0.3px)'
    };

    if (type === 'yang') {
        return (
            <div className={containerClass} style={{ width }}>
                <div className="h-full w-full bg-[#1a1a1a] rounded-sm shadow-sm" style={inkStyle}></div>
            </div>
        );
    } else {
        return (
            <div className={`${containerClass} justify-between`} style={{ width }}>
                <div className="h-full w-[42%] bg-[#1a1a1a] rounded-sm shadow-sm" style={inkStyle}></div>
                <div className="h-full w-[42%] bg-[#1a1a1a] rounded-sm shadow-sm" style={inkStyle}></div>
            </div>
        );
    }
};

// --- Component: Animated Coin (Unchanged Logic, just ensuring props are passed) ---
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
            <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[COIN_RADIUS, COIN_RADIUS, COIN_THICKNESS, 64]} />
                <meshStandardMaterial color="#B8860B" metalness={0.8} roughness={0.4} envMapIntensity={0.8} />
            </mesh>

            <mesh position={[0, 0, COIN_THICKNESS / 2 + 0.002]} castShadow>
                <circleGeometry args={[COIN_RADIUS, 64]} />
                <meshStandardMaterial map={yinMap} transparent={true} alphaTest={0.5} metalness={0.5} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0, -COIN_THICKNESS / 2 - 0.002]} rotation={[0, Math.PI, 0]} castShadow>
                <circleGeometry args={[COIN_RADIUS, 64]} />
                <meshStandardMaterial map={yangMap} transparent={true} alphaTest={0.5} metalness={0.5} roughness={0.5} />
            </mesh>

            {/* Square hole overlays with background color - positioned AFTER textures to render on top */}
            <mesh position={[0, 0, COIN_THICKNESS / 2 + 0.003]}>
                <planeGeometry args={[COIN_RADIUS * 0.28, COIN_RADIUS * 0.28]} />
                <meshBasicMaterial color="#e8dcc8" />
            </mesh>
            <mesh position={[0, 0, -COIN_THICKNESS / 2 - 0.003]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[COIN_RADIUS * 0.28, COIN_RADIUS * 0.28]} />
                <meshBasicMaterial color="#e8dcc8" />
            </mesh>
        </animated.group>
    );
}

// --- Audio Functions (Unchanged) ---
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

    // Responsive State
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        console.log('MoneyDivination Responsive - Initialized');
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = ctx;
        setAudioContext(ctx);
        return () => {
            if (audioContextRef.current) audioContextRef.current.close();
            window.removeEventListener('resize', checkMobile);
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
        <div className="relative w-full h-screen overflow-hidden text-[#2b2b2b]"
            style={{
                backgroundImage: `url(${bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                fontFamily: '"Noto Serif SC", "Songti SC", "KaiTi", "STKaiti", serif',
            }}>
            {/* Soft Ambient Overlay */}
            <div className="absolute inset-0 bg-[#f0e6dc] opacity-20 pointer-events-none" />

            {/* --- HEADER --- */}
            {/* Mobile: Top Left, smaller, horizontal-ish or stacked? Vertical implies tradition. */}
            {/* Desktop: Left, big, vertical */}
            <div className={`absolute z-50 flex gap-4 md:gap-5 
                           ${isMobile ? 'top-4 left-4 scale-75 origin-top-left flex-row' : 'top-12 left-12 flex-col'}`}>

                {/* Seal */}
                <div className={`size-9 border-2 border-[#a83232] text-[#a83232] flex items-center justify-center font-bold rounded-sm ${isMobile ? 'text-sm' : 'text-lg'}`}>
                    吉
                </div>

                {/* Title & Subtitle Wrapper */}
                <div className={`flex ${isMobile ? 'flex-row items-center gap-2' : 'flex-row gap-5'}`} style={{ writingMode: isMobile ? 'horizontal-tb' : 'vertical-rl' }}>

                    {/* Main Title */}
                    <div className="text-[#1a1a1a] font-black opacity-90 font-['STKaiti'] tracking-widest"
                        style={{ fontSize: isMobile ? '24px' : '42px' }}>
                        金钱卦
                    </div>

                    {/* Subtitle */}
                    <div className="text-[#666] tracking-[4px] border-[#999] opacity-80"
                        style={{
                            fontSize: isMobile ? '12px' : '16px',
                            borderRight: isMobile ? 'none' : '1px solid #999',
                            borderLeft: isMobile ? '1px solid #999' : 'none', // Flip border for horizontal
                            paddingRight: isMobile ? '0' : '15px',
                            paddingLeft: isMobile ? '10px' : '0'
                        }}>
                        问道于心・诚则灵
                    </div>
                </div>
            </div>

            {/* --- BACK BUTTON --- */}
            <button
                onClick={onBack}
                className="absolute top-6 right-6 z-[100] size-8 rounded-full border border-gray-400 flex items-center justify-center text-gray-600 transition-colors hover:border-black hover:text-black"
            >
                <ArrowLeft size={16} />
            </button>

            {/* --- MAIN CONTENT AREA (Yao List & Result) --- */}
            {/* Mobile: Top Right (for Yao list), avoid center overlap */}
            {/* Desktop: Right Center */}
            <div className={`absolute z-50 flex flex-col items-center
                ${isMobile
                    ? 'top-16 right-4 w-48' // Mobile: Compact, top-right
                    : 'top-1/2 right-[8%] -translate-y-1/2 w-[300px] min-h-[400px]' // Desktop: Standard
                }`}>

                {/* Visual Status (Only if no result yet) */}
                {!finalHexagram && (
                    <div className="mb-4 text-sm text-[#8b4513] tracking-widest border-b border-[#8b4513]/30 pb-1">
                        演算第 {currentThrow} 爻
                    </div>
                )}

                {/* --- Yao List --- */}
                {/* Mobile: scale down slightly to fit */}
                <div className={`flex flex-col-reverse justify-center w-full transition-all duration-500
                                ${isMobile ? 'gap-2' : 'gap-[18px] flex-1'}`}>
                    {/* Ghost Placeholders */}
                    {yaos.length === 0 && Array(6).fill(0).map((_, i) => (
                        <div key={i} className={`w-full ${isMobile ? 'h-3' : 'h-px my-3'}`}></div>
                    ))}

                    {yaos.map((yao, index) => (
                        <div key={index} className="flex items-center gap-3 w-full">
                            {/* Ink Stroke */}
                            <div className="flex-1 flex items-center justify-end">
                                <InkStroke type={yao.binaryVal === 1 ? 'yang' : 'yin'} width="100%" />
                            </div>

                            {/* Text Info */}
                            <div className="w-[50px] flex flex-col items-start">
                                <span className={`font-bold text-[#1a1a1a] ${isMobile ? 'text-[10px]' : 'text-sm'}`}>
                                    {yao.type}
                                </span>
                                {yao.isMoving && (
                                    <span className="text-[10px] font-bold text-[#c0392b]">动爻</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- FINAL RESULT OVERLAY (Mobile & Desktop) --- */}
            {finalHexagram && (
                <div className={`absolute z-50 flex flex-col items-center justify-center text-center animate-[fadeIn_1s_ease]
                    ${isMobile
                        ? 'bottom-0 left-0 right-0 p-6 pb-20 bg-gradient-to-t from-[#f5ecdfe0] to-transparent' // Mobile: Bottom sheet style with fade
                        : 'top-1/2 right-[8%] -translate-y-1/2 w-[300px] translate-y-[200px]' // Desktop: Keep inside right panel area (offset down)
                    }
                    ${!isMobile && 'pointer-events-none'} 
                    /* Hack: on Desktop, this div is logically separate if we want to position it relative to the list, 
                       but simpler to just put it at bottom of the list container? 
                       Actually, let's keep it separate for Mobile optimization. 
                    */
                `}>
                    {/* On Desktop, this might conflict with the list if we're not careful. 
                        Let's render it INSIDE the previous container for Desktop, but OUTSIDE for Mobile?
                        react-three-fiber makes conditional rendering tricky? No, standard React.
                        
                        REFACTORING:
                        Let's move this Result Block *back* into the main container for Desktop, 
                        but keep it here for Mobile?
                        
                        Actually, let's stick to the previous Desktop layout (Top-Right List + Bottom Result)
                        and Mobile Layout (Top-Right List + Bottom Screen Result).
                     */}
                </div>
            )}

            {/* --- RE-IMPLEMENTING RESULT LOGIC FOR POSITIONING --- */}
            {/* Desktop Result: Rendered inside the Right Panel container above (conditional).
                Mobile Result: Rendered at bottom of screen. */}

            {finalHexagram && isMobile && (
                <div className="absolute bottom-0 left-0 w-full p-6 pb-12 z-[60] flex flex-col items-center bg-white/60 backdrop-blur-sm rounded-t-2xl shadow-lg border-t border-[#8b4513]/20 animate-[fadeIn_0.5s_ease-out]">
                    <div className="w-10 h-1 bg-[#8b4513]/30 rounded-full mb-4"></div>
                    <div className="text-4xl font-normal mb-2 text-[#1a1a1a] font-['STKaiti']">{finalHexagram.name}</div>
                    <div className="text-sm text-[#444] leading-relaxed text-justify mb-6 px-4">{finalHexagram.desc}</div>
                    <button
                        onClick={resetDivination}
                        className="px-8 py-2 bg-transparent border border-[#5d4037] text-[#5d4037] text-sm cursor-pointer transition-colors hover:bg-[#5d4037] hover:text-white"
                    >
                        再卜一卦
                    </button>
                </div>
            )}

            {/* Desktop Result (Inside Panel) - We need to render this conditionally in the Desktop Panel div above
                Wait, I removed it from there. Let's put it back for desktop only. */}

            {finalHexagram && !isMobile && (
                <div className="absolute top-[65%] right-[8%] w-[300px] flex flex-col items-center text-center z-50 animate-[fadeIn_1s_ease]">
                    <div className="w-10 h-0.5 bg-[#333] mb-5"></div>
                    <div className="text-5xl font-normal mb-4 text-[#1a1a1a] font-['STKaiti'] drop-shadow-sm">{finalHexagram.name}</div>
                    <div className="text-[15px] text-[#444] leading-relaxed text-justify font-serif">{finalHexagram.desc}</div>
                    <button
                        onClick={resetDivination}
                        className="mt-8 px-8 py-2 border border-[#5d4037] text-[#5d4037] hover:bg-[#5d4037] hover:text-white transition-all tracking-widest text-sm"
                    >
                        再卜一卦
                    </button>
                </div>
            )}


            {/* --- SHAKE BUTTON --- */}
            {!finalHexagram && yaos.length < 6 && (
                <button
                    onClick={handleThrow}
                    disabled={isProcessing || (isThrown && Object.keys(coinResults).length < 3)}
                    className={`fixed left-1/2 -translate-x-1/2 size-[90px] rounded-xl bg-[#b71c1c] text-white/90 shadow-lg shadow-red-900/40 flex items-center justify-center transition-all z-[999]
                                ${isProcessing ? 'grayscale-[0.5] cursor-not-allowed' : 'cursor-pointer'}
                                ${isMobile ? 'bottom-16 scale-90' : 'bottom-10'}
                    `}
                >
                    <div className="border-[2px] border-white/30 w-[85%] h-[85%] flex items-center justify-center rounded-lg">
                        {isProcessing ? '...' : <span className="text-2xl" style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>启动</span>}
                    </div>
                </button>
            )}

            {/* --- 3D SCENE --- */}
            <Canvas
                shadows
                // Mobile: Move camera further back (z: 16 instead of 12) to fit everything
                // Or Field of View (fov) adjustment.
                camera={{ position: [0, 8, isMobile ? 18 : 12], fov: 45 }}
                gl={{ alpha: true, antialias: true }}
                onCreated={({ gl }) => {
                    gl.toneMapping = THREE.ACESFilmicToneMapping;
                    gl.outputColorSpace = THREE.SRGBColorSpace;
                }}
            >
                <ambientLight intensity={1.5} color="#fffcf5" />
                <directionalLight position={[5, 10, 5]} intensity={2.0} color="#fff8e1" castShadow shadow-mapSize={[1024, 1024]} />
                <spotLight position={[0, 10, 0]} angle={0.5} penumbra={1} intensity={1} color="#ffd700" castShadow />

                <React.Suspense fallback={null}>
                    {[0, 1, 2].map(i => (
                        <AnimatedCoin
                            key={i}
                            index={i} // Logic handles position X spread
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
                Song Dynasty Remastered vMobile
            </div>
        </div>
    );
}
