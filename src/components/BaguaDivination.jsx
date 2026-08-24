import React, { useState, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import FullBaguaExperience from './BaguaBackground/FullBaguaExperience.jsx';
import { getHexagram } from '../utils/hexagramLogic';
import { fetchQuantumUtils } from '../utils/quantumRandom';

const InkStroke = ({ type, width = '100%' }) => {
    return (
        <svg
            width={width}
            viewBox="0 0 100 12"
            preserveAspectRatio="none"
            className="w-full h-2 md:h-3"
            style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
                opacity: 0.9,
            }}
        >
            <defs>
                <filter id="roughpaper">
                    <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
                </filter>
            </defs>
            <g filter="url(#roughpaper)">
                {type === 'yang' ? (
                    <path
                        d="M 2 6 Q 25 3, 50 6 T 98 6"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="8"
                        strokeLinecap="round"
                    />
                ) : (
                    <>
                        <path
                            d="M 2 6 Q 15 4, 45 6"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="8"
                            strokeLinecap="round"
                        />
                        <path
                            d="M 55 6 Q 85 8, 98 6"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="8"
                            strokeLinecap="round"
                        />
                    </>
                )}
            </g>
        </svg>
    );
};

export default function BaguaDivination({ onBack }) {
    const [yaos, setYaos] = useState([]);
    const [finalHexagram, setFinalHexagram] = useState(null);
    
    // We lock generation so we don't spam requests on multiple fist frames
    const isGeneratingRef = useRef(false);

    const handleFist = async () => {
        if (yaos.length >= 6 || finalHexagram || isGeneratingRef.current) return;
        
        isGeneratingRef.current = true;

        try {
            // Fetch 3 quantum coins for one Yao (returns boolean array)
            const results = await fetchQuantumUtils(3);
            const headsCount = results.filter(Boolean).length;
            
            let yaoType, isMoving, binaryVal;
            if (headsCount === 3) { yaoType = '老阳'; isMoving = true; binaryVal = 1; }
            else if (headsCount === 2) { yaoType = '少阴'; isMoving = false; binaryVal = 0; }
            else if (headsCount === 1) { yaoType = '少阳'; isMoving = false; binaryVal = 1; }
            else { yaoType = '老阴'; isMoving = true; binaryVal = 0; }

            const newYao = { number: yaos.length + 1, type: yaoType, isMoving, binaryVal, headsCount };
            
            setYaos(prev => {
                const updated = [...prev, newYao];
                if (updated.length === 6) {
                    setTimeout(() => generateFinalHexagram(updated), 500);
                } else {
                    // Small cooldown before next fist is accepted
                    setTimeout(() => {
                        isGeneratingRef.current = false;
                    }, 500);
                }
                return updated;
            });
        } catch (error) {
            console.error("Quantum random failed, fallback to Math.random", error);
            // Fallback
            const results = [Math.random() > 0.5, Math.random() > 0.5, Math.random() > 0.5];
            const headsCount = results.filter(Boolean).length;
            
            let yaoType, isMoving, binaryVal;
            if (headsCount === 3) { yaoType = '老阳'; isMoving = true; binaryVal = 1; }
            else if (headsCount === 2) { yaoType = '少阴'; isMoving = false; binaryVal = 0; }
            else if (headsCount === 1) { yaoType = '少阳'; isMoving = false; binaryVal = 1; }
            else { yaoType = '老阴'; isMoving = true; binaryVal = 0; }

            const newYao = { number: yaos.length + 1, type: yaoType, isMoving, binaryVal, headsCount };
            
            setYaos(prev => {
                const updated = [...prev, newYao];
                if (updated.length === 6) {
                    setTimeout(() => generateFinalHexagram(updated), 500);
                } else {
                    setTimeout(() => {
                        isGeneratingRef.current = false;
                    }, 500);
                }
                return updated;
            });
        }
    };

    const generateFinalHexagram = (finalYaos) => {
        const hexagramBinary = finalYaos.map(y => y.binaryVal).join('');
        const movingLines = finalYaos.map((y, index) => y.isMoving ? index + 1 : null).filter(Boolean);
        const result = getHexagram(hexagramBinary, movingLines);
        setFinalHexagram(result);
        isGeneratingRef.current = false;
    };

    const resetDivination = () => {
        setYaos([]);
        setFinalHexagram(null);
        isGeneratingRef.current = false;
    };

    return (
        <div className="relative w-full h-[100dvh] min-h-[100dvh] overflow-hidden bg-[#030806] font-['Noto_Serif_SC','Songti_SC','KaiTi','STKaiti',serif]">
            
            {/* Background 3D Engine */}
            <div className="absolute inset-0 z-0">
                <FullBaguaExperience onFist={handleFist} onClose={onBack} />
            </div>

            {/* Title overlay */}
            <div className="absolute top-6 left-6 z-50 text-white/80 pointer-events-none drop-shadow-md">
                <div className="text-xl tracking-widest font-bold">手势起卦</div>
                <div className="text-xs tracking-widest opacity-60 mt-1">隔空握拳 六次成卦 ({yaos.length}/6)</div>
            </div>

            {/* Back Button */}
            <button
                type="button"
                onClick={onBack}
                className="absolute z-[100] top-6 right-6 size-11 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center text-white/80 shadow-sm transition-colors hover:bg-black/60 focus-visible:outline-none"
                aria-label="返回首页"
            >
                <ArrowLeft size={19} aria-hidden="true" />
            </button>

            {/* Centered Yao List Overlay */}
            <div className="absolute inset-0 z-40 pointer-events-none flex flex-col items-center justify-center">
                {/* Visual wrapper that animates into view */}
                <div className={`transition-all duration-700 ease-out flex flex-col items-center justify-center
                    ${yaos.length > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
                    ${finalHexagram ? 'translate-y-[-12%]' : ''}
                `}>
                    <div className="w-[180px] md:w-[240px] flex flex-col-reverse gap-3 md:gap-4 drop-shadow-2xl">
                        {/* Render generated Yaos */}
                        {yaos.map((yao, index) => (
                            <div key={index} className="flex items-center gap-4 w-full animate-in fade-in zoom-in duration-500 fill-mode-both">
                                <div className="w-[40px] flex flex-col items-end text-right">
                                    <span className="font-bold text-white text-sm md:text-base drop-shadow-md">
                                        {yao.type}
                                    </span>
                                    {yao.isMoving && (
                                        <span className="text-[10px] md:text-xs font-bold text-red-400">动爻</span>
                                    )}
                                </div>
                                <div className="flex-1 flex items-center justify-start" aria-hidden="true">
                                    <InkStroke type={yao.binaryVal === 1 ? 'yang' : 'yin'} width="100%" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Final Hexagram Result */}
                {finalHexagram && (
                    <div className="absolute bottom-12 md:bottom-20 w-full max-w-sm px-6 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700 pointer-events-auto z-50">
                        <div className="w-12 h-0.5 bg-white/30 mb-3 rounded-full"></div>
                        <div className="text-[11px] tracking-[0.35em] text-white/50 mb-1">卦象结果</div>
                        <h2 className="text-3xl md:text-4xl font-normal mb-2 text-white font-['STKaiti'] tracking-widest drop-shadow-lg">{finalHexagram.name}</h2>
                        <div className="text-xs md:text-sm text-white/80 leading-6 text-left mb-4 p-4 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 max-h-[160px] overflow-y-auto">
                            {finalHexagram.desc}
                        </div>
                        <button
                            type="button"
                            onClick={resetDivination}
                            className="min-h-11 px-8 rounded-xl bg-white/10 border border-white/30 text-white text-sm font-bold tracking-widest cursor-pointer transition-colors hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                            再卜一卦
                        </button>
                    </div>
                )}
            </div>

            {/* Manual Trigger Button (Fallback for users without camera or slow gesture recognition) */}
            {!finalHexagram && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex flex-col items-center">
                    <button
                        type="button"
                        onClick={handleFist}
                        className="px-6 py-2.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-white/95 text-xs md:text-sm font-medium backdrop-blur-md transition-all active:scale-95 shadow-xl flex items-center gap-2 cursor-pointer"
                    >
                        <span>✊ 模拟握拳生爻 ({yaos.length}/6)</span>
                    </button>
                    <span className="text-[10px] text-white/40 mt-1.5 tracking-wider">对着摄像头握拳 或 点击按钮手动起卦</span>
                </div>
            )}

        </div>
    );
}
