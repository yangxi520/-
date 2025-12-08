import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowLeft } from 'lucide-react';

// --- Assets ---
import coinYangTexture from '../assets/coin_yang_processed.png';
import coinYinTexture from '../assets/coin_yin_processed.png';

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

    const { position, rotation } = useSpring({
        position: started
            ? [index * 3.5 - 3.5, 0.2, 0]
            : [index * 3.5 - 3.5, 5, 0],
        rotation: started
            ? [finalRotation, Math.PI * 3 + (Math.random() * 0.5), (Math.random() - 0.5) * 0.5]
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

            {/* Top Face (Yin - Characters) - Local Z+ (Extrude goes Z+) */}
            {/* Note: ExtrudeGeometry starts at Z=0 and goes to Z=depth. We need to position faces accordingly. */}

            {/* Face 1: Front (Z = depth + bevel) */}
            <mesh position={[0, 0, COIN_THICKNESS + 0.06]} rotation={[0, 0, 0]}>
                <planeGeometry args={[COIN_RADIUS * 2.2, COIN_RADIUS * 2.2]} />
                <meshStandardMaterial map={yinMap} transparent alphaTest={0.5} roughness={0.8} />
            </mesh>

            {/* Face 2: Back (Z = -bevel) */}
            <mesh position={[0, 0, -0.06]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[COIN_RADIUS * 2.2, COIN_RADIUS * 2.2]} />
                <meshStandardMaterial map={yangMap} transparent alphaTest={0.5} roughness={0.8} />
            </mesh>
        </animated.group>
    );
}
const HEXAGRAMS = {
    '111111': { name: '乾为天', desc: '元亨利贞。大吉大利，万事如意。' },
    '000000': { name: '坤为地', desc: '元亨，利牝马之贞。柔顺包容，厚德载物。' },
    '100010': { name: '水雷屯', desc: '元亨利贞。万事起头难，宜守不宜进。' },
    '010001': { name: '山水蒙', desc: '亨。匪我求童蒙，童蒙求我。启蒙教育，循序渐进。' },
    '111010': { name: '水天需', desc: '有孚，光亨，贞吉。等待时机，耐心守候。' },
    '010111': { name: '天水讼', desc: '有孚，窒。惕中吉。终凶。争执诉讼，慎之又慎。' },
    '010000': { name: '地水师', desc: '贞，丈人，吉无咎。兴师动众，统领有方。' },
    '000010': { name: '水地比', desc: '吉。原筮元永贞，无咎。亲密比辅，和睦相处。' },
    '111011': { name: '风天小畜', desc: '亨。密云不雨，自我西郊。积蓄力量，时机未到。' },
    '110111': { name: '天泽履', desc: '履虎尾，不咥人，亨。如履薄冰，小心谨慎。' },
    '111000': { name: '地天泰', desc: '小往大来，吉亨。天地交泰，万物通畅。' },
    '000111': { name: '天地否', desc: '否之匪人，不利君子贞。天地不交，闭塞不通。' },
    '101111': { name: '天火同人', desc: '同人于野，亨。利涉大川。志同道合，通力合作。' },
    '111101': { name: '火天大有', desc: '元亨。盛大丰有，如日中天。' },
    '001000': { name: '地山谦', desc: '亨，君子有终。谦虚受益，满招损。' },
    '000100': { name: '雷地豫', desc: '利建侯行师。喜悦安乐，顺势而为。' },
    '100110': { name: '泽雷随', desc: '元亨利贞，无咎。随顺时势，灵活变通。' },
    '011001': { name: '山风蛊', desc: '元亨，利涉大川。整顿积弊，革故鼎新。' },
    '110000': { name: '地泽临', desc: '元亨利贞。至于八月有凶。亲临视察，教导有方。' },
    '000011': { name: '风地观', desc: '盥而不荐，有孚颙若。观察瞻仰，为人表率。' },
    '100101': { name: '火雷噬嗑', desc: '亨。利用狱。咬合刑罚，惩恶扬善。' },
    '101001': { name: '山火贲', desc: '亨。小利有攸往。文饰美化，礼仪文明。' },
    '000001': { name: '山地剥', desc: '不利有攸往。剥落侵蚀，顺势而止。' },
    '100000': { name: '地雷复', desc: '亨。出入无疾，朋来无咎。一阳来复，万物更生。' },
    '100111': { name: '天雷无妄', desc: '元亨利贞。其匪正有眚。真实无妄，顺其自然。' },
    '111001': { name: '山天大畜', desc: '利贞。不家食吉。积蓄德行，大有作为。' },
    '100001': { name: '山雷颐', desc: '贞吉。观颐，自求口实。颐养身心，言语谨慎。' },
    '011110': { name: '泽风大过', desc: '栋桡，利有攸往，亨。非常时期，非常之举。' },
    '010010': { name: '坎为水', desc: '习坎，有孚，维心亨。重重险阻，守信可通。' },
    '101101': { name: '离为火', desc: '利贞，亨。畜牝牛，吉。附丽光明，柔顺中正。' },
    '001110': { name: '泽山咸', desc: '亨，利贞。取女吉。感应沟通，心灵契合。' },
    '011100': { name: '雷风恒', desc: '亨，无咎，利贞。恒久坚持，持之以恒。' },
    '001111': { name: '天山遁', desc: '亨，小利贞。退避隐居，明哲保身。' },
    '111100': { name: '雷天大壮', desc: '利贞。壮大强盛，正大光明。' },
    '000101': { name: '火地晋', desc: '康侯用锡马蕃庶，昼日三接。晋升进取，旭日东升。' },
    '101000': { name: '地火明夷', desc: '利艰贞。光明受损，韬光养晦。' },
    '101011': { name: '风火家人', desc: '利女贞。家庭和睦，各尽其职。' },
    '110101': { name: '火泽睽', desc: '小事吉。背离乖异，求同存异。' },
    '001010': { name: '水山蹇', desc: '利西南，不利东北。艰难险阻，止步修德。' },
    '010100': { name: '雷水解', desc: '利西南。无所往，其来复吉。解除困难，赦免罪过。' },
    '110001': { name: '山泽损', desc: '有孚，元吉，无咎，可贞。损下益上，惩忿窒欲。' },
    '100011': { name: '风雷益', desc: '利有攸往，利涉大川。损上益下，助人为乐。' },
    '111110': { name: '泽天夬', desc: '扬于王庭，孚号，有厉。决断清除，果断行事。' },
    '011111': { name: '天风姤', desc: '女壮，勿用取女。相遇邂逅，阴长阳消。' },
    '000110': { name: '泽地萃', desc: '亨。王假有庙，利见大人。聚集会合，精英荟萃。' },
    '011000': { name: '地风升', desc: '元亨，用见大人，勿恤。上升进取，积小成大。' },
    '010110': { name: '泽水困', desc: '亨，贞，大人吉，无咎。困境磨练，守正待时。' },
    '011010': { name: '水风井', desc: '改邑不改井，无丧无得。井养万物，取之不尽。' },
    '101110': { name: '泽火革', desc: '己日乃孚，元亨利贞。变革更新，顺天应人。' },
    '011101': { name: '火风鼎', desc: '元吉，亨。稳重图变，去旧取新。' },
    '100100': { name: '震为雷', desc: '亨。震来虩虩，笑言哑哑。震惊百里，修省进德。' },
    '001001': { name: '艮为山', desc: '艮其背，不获其身。动静适时，止其所止。' },
    '001011': { name: '风山渐', desc: '女归吉，利贞。循序渐进，稳步发展。' },
    '110100': { name: '雷泽归妹', desc: '征凶，无攸利。少女急嫁，违背常理。' },
    '101100': { name: '雷火丰', desc: '亨，王假之。勿忧，宜日中。丰大盛满，如日中天。' },
    '001101': { name: '火山旅', desc: '小亨，旅贞吉。旅行羁旅，安定为上。' },
    '011011': { name: '巽为风', desc: '小亨，利有攸往。柔顺服从，谦逊受益。' },
    '110110': { name: '兑为泽', desc: '亨，利贞。喜悦沟通，和睦相处。' },
    '010011': { name: '风水涣', desc: '亨。王假有庙，利涉大川。离散化解，拯救危机。' },
    '110010': { name: '水泽节', desc: '亨。苦节不可贞。节制约束，适可而止。' },
    '110011': { name: '风泽中孚', desc: '豚鱼吉，利涉大川。诚信感通，心诚则灵。' },
    '001100': { name: '雷山小过', desc: '亨，利贞。可小事，不可大事。小有过越，矫枉过正。' },
    '101010': { name: '水火既济', desc: '亨，小利贞。初吉终乱。事情完成，盛极必衰。' },
    '010101': { name: '火水未济', desc: '亨。小狐汔济，濡其尾。事情未成，重新开始。' }
};

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

    const { position, rotation } = useSpring({
        position: started
            ? [index * 3.5 - 3.5, 0.2, 0]
            : [index * 3.5 - 3.5, 5, 0],
        rotation: started
            ? [finalRotation, Math.PI * 3 + (Math.random() * 0.5), (Math.random() - 0.5) * 0.5]
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
            <mesh castShadow receiveShadow>
                <cylinderGeometry args={[COIN_RADIUS, COIN_RADIUS, COIN_THICKNESS, 32]} />
                <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.3} />
            </mesh>

            <mesh position={[0, COIN_THICKNESS / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[COIN_RADIUS * 1.8, COIN_RADIUS * 1.8]} />
                <meshStandardMaterial map={yinMap} transparent alphaTest={0.3} />
            </mesh>

            <mesh position={[0, -COIN_THICKNESS / 2 - 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[COIN_RADIUS * 1.8, COIN_RADIUS * 1.8]} />
                <meshStandardMaterial map={yangMap} transparent alphaTest={0.3} />
            </mesh>
        </animated.group>
    );
}

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

    // 🎲 开始摇卦 - 严格边界检查
    const handleThrow = () => {
        // 🚨 严格边界检查
        if (currentThrow > 6 || yaos.length >= 6 || finalHexagram || isProcessingRef.current) {
            return;
        }

        // 初始化音频
        if (!audioContextRef.current) {
            audioContextRef.current = createAudioContext();
        }
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
            yaoType = '少阳';
            yaoSymbol = '━━━';
            isMoving = false;
            binaryVal = 1;
        } else if (headsCount === 1) {
            yaoType = '少阴';
            yaoSymbol = '━ ━';
            isMoving = false;
            binaryVal = 0;
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
        // 从下往上构建二进制码 (上爻到初爻)
        const binaryKey = allYaos.map(yao => yao.binaryVal).reverse().join('');
        const hexagramInfo = HEXAGRAMS[binaryKey] || { name: '未知卦', desc: '暂无解释' };

        const movingYaos = allYaos.filter(yao => yao.isMoving);

        setFinalHexagram({
            name: hexagramInfo.name,
            desc: hexagramInfo.desc,
            hasMovingYaos: movingYaos.length > 0,
            movingCount: movingYaos.length,
            binaryKey
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