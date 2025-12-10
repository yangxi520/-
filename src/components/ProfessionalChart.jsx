
import React, { useMemo } from 'react';
import { astro } from 'iztro';
import {
    AI_PROMPT_TEMPLATE,
    FEMALE_PROMPT_TEMPLATE,
    WEALTH_PROMPT_TEMPLATE,
    MARRIAGE_PROMPT_TEMPLATE,
    generateScumbagPrompt,
    generateFortunePromptText,
    generateBabyPrompt
} from '../utils/aiPrompts';
import { findBestConceptionDates } from '../utils/babySelector';
import { Sparkles, HelpCircle, Coffee, Save, Archive } from "lucide-react";
import wechatPayImg from '../assets/wechat_pay.jpg';
import alipayImg from '../assets/alipay.jpg';

// Helper to get palace position in 4x4 grid (0-11 index to grid coordinates)
// Standard Ziwei grid:
// 巳(5) 午(6) 未(7) 申(8)
// 辰(4)             酉(9)
// 卯(3)             戌(10)
// 寅(2) 丑(1) 子(0) 亥(11)
// Note: iztro index 0 is usually the first palace (Ming), but we need to map it to Earthly Branches.
// Actually iztro palaces have .earthlyBranch property.
// We need to map Earthly Branch to grid position.
// 子(Zi) -> Bottom-Right (approx)
// Let's define a fixed map based on standard layout.
// Top Row: Si, Wu, Wei, Shen (Snake, Horse, Goat, Monkey) -> Indices 5, 6, 7, 8
// Right Col: Shen, You, Xu, Hai (Monkey, Rooster, Dog, Pig) -> Indices 8, 9, 10, 11
// Bottom Row: Hai, Zi, Chou, Yin (Pig, Rat, Ox, Tiger) -> Indices 11, 0, 1, 2
// Left Col: Yin, Mao, Chen, Si (Tiger, Rabbit, Dragon, Snake) -> Indices 2, 3, 4, 5

const BRANCH_ORDER = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// Grid positions (row, col) 1-based or 0-based. 4x4 grid.
// Row 0: 巳(5), 午(6), 未(7), 申(8)
// Row 1: 辰(4), [CENTER], [CENTER], 酉(9)
// Row 2: 卯(3), [CENTER], [CENTER], 戌(10)
// Row 3: 寅(2), 丑(1), 子(0), 亥(11)

const GRID_MAP = {
    '巳': { row: 1, col: 1 }, '午': { row: 1, col: 2 }, '未': { row: 1, col: 3 }, '申': { row: 1, col: 4 },
    '辰': { row: 2, col: 1 }, '酉': { row: 2, col: 4 },
    '卯': { row: 3, col: 1 }, '戌': { row: 3, col: 4 },
    '寅': { row: 4, col: 1 }, '丑': { row: 4, col: 2 }, '子': { row: 4, col: 3 }, '亥': { row: 4, col: 4 },
};

// Si Hua Map (Stem -> { lu, quan, ke, ji })
const SI_HUA_MAP = {
    '甲': { lu: '廉贞', quan: '破军', ke: '武曲', ji: '太阳' },
    '乙': { lu: '天机', quan: '天梁', ke: '紫微', ji: '太阴' },
    '丙': { lu: '天同', quan: '天机', ke: '文昌', ji: '廉贞' },
    '丁': { lu: '太阴', quan: '天同', ke: '天机', ji: '巨门' },
    '戊': { lu: '贪狼', quan: '太阴', ke: '右弼', ji: '天机' },
    '己': { lu: '武曲', quan: '贪狼', ke: '天梁', ji: '文曲' },
    '庚': { lu: '太阳', quan: '武曲', ke: '太阴', ji: '天同' },
    '辛': { lu: '巨门', quan: '太阳', ke: '文曲', ji: '文昌' },
    '壬': { lu: '天梁', quan: '紫微', ke: '左辅', ji: '武曲' },
    '癸': { lu: '破军', quan: '巨门', ke: '太阴', ji: '贪狼' },
};

const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const TIME_RANGES = [
    "23:00-01:00", // Zi
    "01:00-03:00", // Chou
    "03:00-05:00", // Yin
    "05:00-07:00", // Mao
    "07:00-09:00", // Chen
    "09:00-11:00", // Si
    "11:00-13:00", // Wu
    "13:00-15:00", // Wei
    "15:00-17:00", // Shen
    "17:00-19:00", // You
    "19:00-21:00", // Xu
    "21:00-23:00"  // Hai
];

// Helper: Get Year Stem (0-9 index)
const getYearStemIndex = (year) => (year - 4) % 10;

function ProfessionalChartInner({ horoscope, basicInfo, onSave, onOpenArchive }) {
    const palaces = useMemo(() => {
        if (!horoscope) return [];
        return horoscope.palaces;
    }, [horoscope]);

    // State for cascading selection
    const [selection, setSelection] = React.useState({
        daxianIndex: null, // Palace index
        year: null,        // Full Year (e.g., 2025)
        month: null,       // Month Index (1-12)
        day: null,         // Day Index (1-30)
        hour: null         // Hour Index (0-11)
    });

    // State for focused palace (for San Fang Si Zheng lines)
    // This can be independent of timeline selection, or synced.
    // Let's make it independent but initialized by Da Xian selection.
    const [focusedIndex, setFocusedIndex] = React.useState(null);

    // Active Layer Visibility State (Toggle)
    const [activeLayers, setActiveLayers] = React.useState({
        origin: true,
        decadal: true,
        yearly: true,
        monthly: true,
        daily: true,
        hourly: true
    });

    // State for AI Menu
    const [showAiMenu, setShowAiMenu] = React.useState(false);
    const [menuView, setMenuView] = React.useState('main'); // 'main', 'fortune', 'baby'
    // Lunar Tip State
    const [showLunarTip, setShowLunarTip] = React.useState(false);

    // State for Partner Modal (Conception Planner)
    const [showPartnerModal, setShowPartnerModal] = React.useState(false);
    const [selectedBabyType, setSelectedBabyType] = React.useState(null);
    const [partnerInfo, setPartnerInfo] = React.useState({
        gender: 'female',
        birthday: '',
        birthTime: '子'
    });
    const [isCalculating, setIsCalculating] = React.useState(false);

    // State for Donation Modal
    const [showDonationModal, setShowDonationModal] = React.useState(false);

    // Helper to calculate stems (extracted for reuse)
    const calculateActiveStems = (sel, horo, info) => {
        if (!horo) return {};
        const stems = {};

        // 1. Origin (Ben)
        if (horo.chineseDate) {
            if (typeof horo.chineseDate === 'string') {
                stems.origin = horo.chineseDate.split(' ')[0][0];
            } else if (horo.chineseDate.yearly) {
                stems.origin = horo.chineseDate.yearly[0];
            }
        }

        // 2. Decadal (Xian)
        if (sel.daxianIndex !== null && horo.palaces[sel.daxianIndex]) {
            stems.decadal = horo.palaces[sel.daxianIndex].heavenlyStem;
        }

        // 3. Yearly (Nian)
        let yearStemIndex = null;
        if (sel.year) {
            yearStemIndex = getYearStemIndex(sel.year);
            stems.yearly = HEAVENLY_STEMS[yearStemIndex];
        }

        // 4. Monthly (Yue)
        if (yearStemIndex !== null && sel.month) {
            const startStem = (yearStemIndex % 5) * 2 + 2;
            const monthStemIndex = (startStem + (sel.month - 1)) % 10;
            stems.monthly = HEAVENLY_STEMS[monthStemIndex];
        }

        // 5. Daily & 6. Hourly
        if (sel.year && sel.month && sel.day) {
            try {
                const tempHoroscope = astro.byLunar(
                    `${sel.year}-${sel.month}-${sel.day}`,
                    0,
                    info.gender === 'male' ? '男' : '女',
                    false,
                    true
                );

                if (tempHoroscope && tempHoroscope.chineseDate) {
                    let dayStemIndex = null;
                    if (typeof tempHoroscope.chineseDate === 'string') {
                        const parts = tempHoroscope.chineseDate.trim().split(/\s+/);
                        if (parts.length >= 3) {
                            const dayStemChar = parts[2][0];
                            stems.daily = dayStemChar;
                            dayStemIndex = HEAVENLY_STEMS.indexOf(dayStemChar);
                        }
                    } else if (tempHoroscope.chineseDate.daily) {
                        const dayStemChar = tempHoroscope.chineseDate.daily[0];
                        stems.daily = dayStemChar;
                        dayStemIndex = HEAVENLY_STEMS.indexOf(dayStemChar);
                    }

                    if (dayStemIndex !== -1 && dayStemIndex !== null && sel.hour !== null) {
                        const startStem = (dayStemIndex % 5) * 2;
                        const hourStemIndex = (startStem + sel.hour) % 10;
                        stems.hourly = HEAVENLY_STEMS[hourStemIndex];
                    }
                }
            } catch (e) {
                console.error("Error calculating daily/hourly stems:", e);
            }
        }
        return stems;
    };

    // Memoize active stems for UI rendering
    const activeStems = useMemo(() => {
        return calculateActiveStems(selection, horoscope, basicInfo);
    }, [horoscope, selection, basicInfo]);

    // Helper to get Si Hua for a star from active stems
    const getActiveSiHua = (starName) => {
        const result = [];

        // Check each layer
        const layers = [
            { key: 'origin', color: 'bg-red-500', label: '本' },
            { key: 'decadal', color: 'bg-green-500', label: '限' },
            { key: 'yearly', color: 'bg-blue-500', label: '年' },
            { key: 'monthly', color: 'bg-yellow-500', label: '月' },
            { key: 'daily', color: 'bg-purple-500', label: '日' },
            { key: 'hourly', color: 'bg-cyan-500', label: '时' }
        ];

        layers.forEach(layer => {
            if (!activeLayers[layer.key]) return; // Skip if layer disabled
            const stem = activeStems[layer.key];
            if (!stem) return;

            const map = SI_HUA_MAP[stem];
            if (!map) return;

            if (map.lu === starName) result.push({ type: '禄', ...layer });
            if (map.quan === starName) result.push({ type: '权', ...layer });
            if (map.ke === starName) result.push({ type: '科', ...layer });
            if (map.ji === starName) result.push({ type: '忌', ...layer });
        });

        return result;
    };

    const handleSelection = (type, value) => {
        setSelection(prev => {
            const next = { ...prev };
            if (type === 'daxian') {
                next.daxianIndex = value;
                // Reset children
                next.year = null; next.month = null; next.day = null; next.hour = null;
                // Auto-select first year of Da Xian? Or wait for user?
                // Let's wait.
                // Also set focusedIndex to highlight the palace
                setFocusedIndex(value);
            } else if (type === 'year') {
                next.year = value;
                next.month = null; next.day = null; next.hour = null;
            } else if (type === 'month') {
                next.month = value;
                next.day = null; next.hour = null;
            } else if (type === 'day') {
                next.day = value;
                next.hour = null;
            } else if (type === 'hour') {
                next.hour = value;
            }
            return next;
        });
    };

    // Helper to render a palace cell
    const renderPalace = (branch) => {
        const palace = palaces.find(p => p.earthlyBranch === branch);
        if (!palace) return <div className="w-full h-full bg-stone-50" />;

        const isFocused = focusedIndex !== null && palaces[focusedIndex]?.earthlyBranch === branch;

        // Determine if this palace is Ming or Shen
        const isMing = palace.name === '命宫';
        const isShen = palace.isBodyPalace;

        // Filter Stars by Type for styling
        const softStars = palace.minorStars.filter(s => s.type === 'soft');
        const toughStars = palace.minorStars.filter(s => s.type === 'tough');
        const adjectiveStars = palace.adjectiveStars || [];

        return (
            <div
                className={`w-full h-full relative p-0.5 md:p-1 flex flex-col justify-between transition-all duration-200 cursor-pointer overflow-hidden
                ${isFocused ? 'bg-amber-50 ring-2 ring-amber-400 z-10 shadow-lg' : 'bg-stone-50 hover:bg-stone-100'}
                ${isMing ? 'bg-red-50/30' : ''}
            `}
                onClick={() => setFocusedIndex(palaces.findIndex(p => p.earthlyBranch === branch))}
            >
                {/* --- TOP AREA: Stars --- */}
                <div className="flex flex-row gap-1 h-full">

                    {/* Left Column: Major & Minor (Tough/Soft) */}
                    <div className="flex flex-col items-start gap-0.5 min-w-[40%] md:min-w-[45%]">

                        {/* Major Stars (Red) */}
                        {palace.majorStars.map((star, idx) => {
                            const activeSiHua = getActiveSiHua(star.name);
                            return (
                                <div key={`major-${idx}`} className="flex items-center gap-0.5 font-serif font-bold text-sm md:text-base text-red-600 leading-none">
                                    <span>{star.name}</span>
                                    <span className="text-[9px] font-normal text-gray-400 scale-75 origin-left hidden md:inline">{star.brightness}</span>
                                    {activeSiHua.map((badge, bIdx) => (
                                        <span key={bIdx} className={`text-[8px] px-0.5 rounded-sm text-white scale-90 origin-left shadow-sm ${badge.color}`}>
                                            {badge.type}
                                        </span>
                                    ))}
                                </div>
                            );
                        })}

                        {/* Soft Stars (Purple) */}
                        {softStars.map((star, idx) => (
                            <div key={`soft-${idx}`} className="flex items-center gap-0.5 text-xs md:text-sm font-bold text-purple-600 leading-none">
                                <span>{star.name}</span>
                                <span className="text-[8px] font-normal text-gray-400 scale-75 origin-left hidden md:inline">{star.brightness}</span>
                            </div>
                        ))}

                        {/* Tough Stars (Black) */}
                        {toughStars.map((star, idx) => (
                            <div key={`tough-${idx}`} className="flex items-center gap-0.5 text-xs md:text-sm font-bold text-gray-900 leading-none">
                                <span>{star.name}</span>
                                <span className="text-[8px] font-normal text-gray-400 scale-75 origin-left hidden md:inline">{star.brightness}</span>
                            </div>
                        ))}
                    </div>

                    {/* Right Area: Adjective Stars (Blue) - Flow Layout */}
                    <div className="flex flex-wrap content-start items-start gap-x-1 gap-y-0.5 text-[10px] md:text-xs">
                        {adjectiveStars.map((star, idx) => (
                            <span key={`adj-${idx}`} className="text-blue-500 font-medium leading-tight">
                                {star.name}
                            </span>
                        ))}
                    </div>
                </div>

                {/* --- BOTTOM AREA: Meta Info --- */}
                <div className="mt-auto flex flex-col w-full border-t border-gray-100/50 pt-0.5">

                    {/* Row 1: Ages (Small Limit) - Right Aligned or scattered? Let's put top right actually? 
                    Actually user said "bottom/perimeter". Let's put Ages along the top right of the bottom area or strictly bottom.
                    Let's display the list of ages compactly. 
                */}
                    <div className="flex flex-wrap justify-end gap-1 text-[9px] text-gray-400 leading-none mb-0.5 px-0.5">
                        {palace.ages && palace.ages.slice(0, 6).map((age, i) => <span key={i}>{age}</span>)}
                        {palace.ages && palace.ages.length > 6 && <span>...</span>}
                    </div>

                    {/* Row 2: Gods & Life Stage & Palace Name */}
                    <div className="flex justify-between items-end">

                        {/* Left Bottom: 12 Gods & Life Stage (Black) */}
                        <div className="flex flex-col items-start text-[9px] md:text-[10px] text-gray-800 leading-tight font-medium">
                            <div className="flex gap-1">
                                <span>{palace.boshi12}</span>
                                <span>{palace.jiangqian12}</span>
                                <span>{palace.suiqian12}</span>
                            </div>
                            <div className="font-bold mt-0.5">
                                {palace.changsheng12}
                            </div>
                        </div>

                        {/* Right Bottom: Palace Name, Stem/Branch, Decade */}
                        <div className="text-right">
                            {/* Da Xian Range */}
                            <div className="text-blue-500 font-bold text-xs transform translate-y-0.5">
                                {palace.decadal.range[0]}-{palace.decadal.range[1]}
                            </div>

                            {/* Palace Name */}
                            <div className={`font-serif font-bold text-sm md:text-base ${isMing ? 'text-red-700' : isShen ? 'text-amber-700' : 'text-slate-700'}`}>
                                {palace.name}
                            </div>

                            {/* Stem Branch */}
                            <div className="text-stone-400 text-[10px] font-mono -mt-1">
                                {palace.heavenlyStem}{palace.earthlyBranch}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Calculate connection lines for San Fang Si Zheng
    const renderConnections = () => {
        if (focusedIndex === null) return null;

        const focusedPalace = palaces[focusedIndex];
        if (!focusedPalace) return null;

        const branchIndex = BRANCH_ORDER.indexOf(focusedPalace.earthlyBranch);
        if (branchIndex === -1) return null;

        // Calculate related branches indices
        const sanHe1Index = (branchIndex + 4) % 12;
        const sanHe2Index = (branchIndex + 8) % 12;
        const duiGongIndex = (branchIndex + 6) % 12;

        const branches = [
            BRANCH_ORDER[branchIndex], // Self
            BRANCH_ORDER[sanHe1Index], // San He 1
            BRANCH_ORDER[sanHe2Index], // San He 2
            BRANCH_ORDER[duiGongIndex] // Dui Gong
        ];

        // Helper to get center coordinates of a grid cell
        const getCenter = (branch) => {
            const pos = GRID_MAP[branch];
            if (!pos) return { x: 0, y: 0 };
            // Grid is 4x4.
            // Col 1 center is 12.5%, Col 2 is 37.5%, etc.
            // Row 1 center is 12.5%, Row 2 is 37.5%, etc.
            const x = (pos.col - 1) * 25 + 12.5;
            const y = (pos.row - 1) * 25 + 12.5;
            return { x, y };
        };

        const pSelf = getCenter(branches[0]);
        const pSanHe1 = getCenter(branches[1]);
        const pSanHe2 = getCenter(branches[2]);
        const pDuiGong = getCenter(branches[3]);

        return (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
                <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* San He Triangle */}
                <path
                    d={`M${pSelf.x}% ${pSelf.y}% L${pSanHe1.x}% ${pSanHe1.y}% L${pSanHe2.x}% ${pSanHe2.y}% Z`}
                    fill="rgba(236, 72, 153, 0.1)"
                    stroke="rgba(236, 72, 153, 0.6)"
                    strokeWidth="1.5"
                    strokeDasharray="5,5"
                    filter="url(#glow)"
                />

                {/* Dui Gong Line */}
                <line
                    x1={`${pSelf.x}% `} y1={`${pSelf.y}% `}
                    x2={`${pDuiGong.x}% `} y2={`${pDuiGong.y}% `}
                    stroke="rgba(34, 211, 238, 0.8)"
                    strokeWidth="2"
                    strokeDasharray="4,2"
                    filter="url(#glow)"
                />

                {/* Dots at intersections */}
                <circle cx={`${pSelf.x}% `} cy={`${pSelf.y}% `} r="3" fill="#ec4899" />
                <circle cx={`${pSanHe1.x}% `} cy={`${pSanHe1.y}% `} r="3" fill="#ec4899" />
                <circle cx={`${pSanHe2.x}% `} cy={`${pSanHe2.y}% `} r="3" fill="#ec4899" />
                <circle cx={`${pDuiGong.x}% `} cy={`${pDuiGong.y}% `} r="3" fill="#22d3ee" />
            </svg>
        );
    };

    // Generate Prompt for AI Analysis
    const handleGeneratePrompt = (type) => {
        let prompt = '';
        const scumbagData = generateScumbagPrompt(horoscope);
        const basicInfoData = `
    ** --- 命主基本信息(用于推算大限流年)-- -**
- ** 姓名 **：${basicInfo.name || '未填写'}
- ** 性别 **：${basicInfo.gender === 'male' ? '男' : '女'}
- ** 生辰 **：${basicInfo.birthday}
- ** 出生时辰 **：${basicInfo.birthTime}
`;

        if (type === 'scumbag') {
            const template = basicInfo.gender === 'female' ? FEMALE_PROMPT_TEMPLATE : AI_PROMPT_TEMPLATE;
            prompt = `${template} \n${basicInfoData} \n${scumbagData} `;
        } else if (type === 'marriage') {
            prompt = `${MARRIAGE_PROMPT_TEMPLATE} \n${basicInfoData} \n${scumbagData} `;
        } else if (type === 'wealth') {
            prompt = `${WEALTH_PROMPT_TEMPLATE} \n${basicInfoData} \n${scumbagData} `;
        } else if (['yearly', 'monthly', 'daily', 'hourly'].includes(type)) {

            let currentSelection = { ...selection };
            let currentStems = activeStems;

            // Auto-fill for Daily/Hourly if missing
            if ((type === 'daily' && !currentSelection.day) || (type === 'hourly' && !currentSelection.hour) || (type === 'monthly' && !currentSelection.month) || (type === 'yearly' && !currentSelection.year)) {
                // Get current Lunar Date
                const now = new Date();
                const currentHoroscope = astro.bySolar(now.toISOString(), 0, 'male', true, 'zh-CN');

                if (currentHoroscope && currentHoroscope.lunarDate) {
                    // Update selection with current time
                    if (!currentSelection.year) currentSelection.year = currentHoroscope.lunarDate.year;
                    if (!currentSelection.month) currentSelection.month = currentHoroscope.lunarDate.month;
                    if (!currentSelection.day) currentSelection.day = currentHoroscope.lunarDate.day;

                    const hourIndex = Math.floor((now.getHours() + 1) / 2) % 12;
                    if (currentSelection.hour === null) currentSelection.hour = hourIndex;

                    // Update UI selection
                    setSelection(currentSelection);

                    // Recalculate stems for this new selection
                    currentStems = calculateActiveStems(currentSelection, horoscope, basicInfo);

                    // Also enable relevant layers
                    setActiveLayers(prev => ({
                        ...prev,
                        yearly: true,
                        monthly: ['monthly', 'daily', 'hourly'].includes(type) ? true : prev.monthly,
                        daily: ['daily', 'hourly'].includes(type) ? true : prev.daily,
                        hourly: type === 'hourly' ? true : prev.hourly
                    }));
                }
            }

            prompt = generateFortunePromptText(type, currentSelection, currentStems, basicInfo, horoscope, palaces, SI_HUA_MAP);

            if (!prompt) {
                alert(`请先选择${type === 'yearly' ? '流年' : type === 'monthly' ? '流月' : type === 'daily' ? '流日' : '流时'}！`);
                return;
            }
        } else if (type.startsWith('baby_')) {
            const babyType = type.replace('baby_', '');
            setSelectedBabyType(babyType);
            setShowPartnerModal(true);
            setShowAiMenu(false); // Close menu
            return; // Stop here, wait for modal
        }

        navigator.clipboard.writeText(prompt).then(() => {
            alert(`已复制分析指令！\n请发送给AI进行分析。`);
            setShowAiMenu(false);
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('复制失败，请手动复制。');
        });
    };

    const handleConfirmPartner = async () => {
        if (!partnerInfo.birthday) {
            alert('请选择配偶出生日期');
            return;
        }

        setIsCalculating(true);

        // Use setTimeout to allow UI to update with "Calculating..." state
        setTimeout(async () => {
            try {
                // Calculate Partner Horoscope
                const partnerHoroscope = astro.bySolar(
                    partnerInfo.birthday,
                    TIME_RANGES.indexOf(partnerInfo.birthTime),
                    partnerInfo.gender === 'male' ? '男' : '女',
                    true,
                    'zh-CN'
                );

                // Calculate Best Dates (The Heavy Lifting)
                const bestDates = await findBestConceptionDates(selectedBabyType);

                const prompt = generateBabyPrompt(selectedBabyType, basicInfo, horoscope, partnerHoroscope, bestDates);

                navigator.clipboard.writeText(prompt).then(() => {
                    alert(`✅ 已生成【${selectedBabyType === 'leader' ? '帝王' : selectedBabyType === 'iq' ? '文昌' : selectedBabyType === 'sport' ? '武曲' : '陶朱'}起居注】指令！\n\n已为您筛选出未来14天内Top3最佳受孕时机。\n请发送给AI获取详细解读。`);
                    setShowPartnerModal(false);
                }).catch(err => {
                    console.error('Failed to copy:', err);
                    alert('复制失败，请手动复制。');
                });

            } catch (error) {
                console.error('Calculation failed:', error);
                alert('计算失败，请重试。');
            } finally {
                setIsCalculating(false);
            }
        }, 100);
    };

    return (
        <div className="w-full max-w-3xl mx-auto bg-stone-200 text-slate-900 p-1 select-none flex flex-col gap-2 overflow-x-auto shadow-2xl rounded-sm">
            {/* Chart Grid - Min width to ensure readability on mobile */}
            <div className="aspect-square grid grid-cols-4 grid-rows-4 gap-[1px] bg-stone-300 border-2 border-stone-400 relative min-w-[600px] md:min-w-0 shadow-inner">
                {renderConnections()}
                {/* Row 1 */}
                <div className="bg-stone-50">{renderPalace('巳')}</div>
                <div className="bg-stone-50">{renderPalace('午')}</div>
                <div className="bg-stone-50">{renderPalace('未')}</div>
                <div className="bg-stone-50">{renderPalace('申')}</div>

                {/* Row 2 */}
                <div className="bg-stone-50">{renderPalace('辰')}</div>
                <div className="col-span-2 row-span-2 bg-stone-100 flex flex-col relative overflow-hidden border border-stone-200 m-[1px] shadow-inner">
                    {/* Background Watermark (Optional, simplified for now) */}
                    <div className="absolute inset-0 pointer-events-none opacity-5">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <path d="M50 10 L90 90 L10 90 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                        </svg>
                    </div>

                    {/* Top: Basic Info */}
                    <div className="flex-1 p-2 flex flex-col gap-1 z-10">
                        <div className="text-center text-purple-800 font-bold text-xs mb-1 flex items-center justify-center gap-1">
                            <span>{basicInfo.gender === 'male' ? '♂' : '♀'}</span>
                            <span>基本信息</span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] leading-tight text-slate-700">
                            <div className="flex justify-between">
                                <span className="text-slate-500">五行局：</span>
                                <span className="font-bold text-olive-600">{horoscope.fiveElementsClass}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">年龄(虚岁)：</span>
                                <span>{new Date().getFullYear() - new Date(basicInfo.birthday).getFullYear() + 1} 岁</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-slate-500">四柱：</span>
                                <span className="font-bold text-olive-600">{horoscope.chineseDate?.year} {horoscope.chineseDate?.month} {horoscope.chineseDate?.day} {horoscope.chineseDate?.time}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">阳历：</span>
                                <span>{basicInfo.birthday}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-slate-500">农历：</span>
                                <span>{horoscope.lunarDate?.year}年{horoscope.lunarDate?.month}{horoscope.lunarDate?.day}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">时辰：</span>
                                <span>{basicInfo.birthTime}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-slate-500">生肖：</span>
                                <span>{horoscope.zodiac}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">星座：</span>
                                <span>{getZodiacSign(basicInfo.birthday)}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-slate-500">命主：</span>
                                <span className="font-bold text-olive-600">{horoscope.soul}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">身主：</span>
                                <span className="font-bold text-olive-600">{horoscope.body}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-slate-500">命宫：</span>
                                <span>{horoscope.palaces.find(p => p.isBodyPalace === false && p.name === '命宫')?.earthlyBranch || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">身宫：</span>
                                <span>{horoscope.palaces.find(p => p.isBodyPalace)?.earthlyBranch || '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-dashed border-gray-300 w-full my-1"></div>

                    {/* Bottom: Limit Info (Layer Toggles) */}
                    <div className="flex-1 p-2 flex flex-col gap-1 z-10 bg-green-50/30">
                        <div className="text-center text-black font-bold text-xs mb-1">运限层级开关</div>

                        <div className="grid grid-cols-3 gap-1 text-[10px]">

                            {[
                                { key: 'origin', label: '本', color: 'text-red-600' },
                                { key: 'decadal', label: '限', color: 'text-green-600' },
                                { key: 'yearly', label: '年', color: 'text-blue-600' },
                                { key: 'monthly', label: '月', color: 'text-yellow-600' },
                                { key: 'daily', label: '日', color: 'text-purple-600' },
                                { key: 'hourly', label: '时', color: 'text-cyan-600' }
                            ].map(layer => (
                                <button
                                    key={layer.key}
                                    className={`border rounded px-1 py-0.5 flex items-center justify-center gap-1
                                        ${activeLayers[layer.key] ? 'bg-stone-100 border-stone-300 shadow-inner' : 'bg-stone-50 border-stone-200 text-gray-300'}
                                    `}
                                    onClick={() => setActiveLayers(prev => ({ ...prev, [layer.key]: !prev[layer.key] }))}
                                >
                                    <span className={`font-bold ${activeLayers[layer.key] ? layer.color : ''}`}>{layer.label}</span>
                                    {activeStems[layer.key] && <span className="font-mono text-stone-500">{activeStems[layer.key]}</span>}
                                </button>
                            ))}
                        </div>

                        <div className="text-right text-[8px] text-gray-300 mt-auto italic">
                            Powered by iztro
                        </div>
                    </div>
                </div>
                <div className="bg-stone-50">{renderPalace('酉')}</div>

                {/* Row 3 */}
                <div className="bg-stone-50">{renderPalace('卯')}</div>
                {/* Center spans here */}
                <div className="bg-stone-50">{renderPalace('戌')}</div>

                {/* Row 4 */}
                <div className="bg-stone-50">{renderPalace('寅')}</div>
                <div className="bg-stone-50">{renderPalace('丑')}</div>
                <div className="bg-stone-50">{renderPalace('子')}</div>
                <div className="bg-stone-50">{renderPalace('亥')}</div>
            </div>

            {/* Cascading Timeline Table */}
            <div className="bg-white border border-gray-300 text-xs overflow-x-auto">
                <table className="w-full text-center border-collapse">
                    <tbody>
                        {/* Da Xian Row */}
                        <tr className="border-b border-gray-200">
                            <td className="bg-gray-100 font-bold p-1 w-12 border-r">大限</td>
                            <td className="p-1 overflow-x-auto">
                                <div className="flex gap-1 overflow-x-auto">
                                    {[...palaces].sort((a, b) => a.decadal.range[0] - b.decadal.range[0]).map((p, idx) => (
                                        <button
                                            key={idx}
                                            className={`px - 2 py - 1 rounded whitespace - nowrap ${selection.daxianIndex === p.index ? 'bg-green-500 text-white' : 'text-gray-700 hover:bg-gray-100'} `}
                                            onClick={() => handleSelection('daxian', p.index)}
                                        >
                                            {p.decadal.range[0]}-{p.decadal.range[1]}<br />
                                            <span className="text-[10px]">{p.heavenlyStem}{p.earthlyBranch}</span>
                                        </button>
                                    ))}
                                </div>
                            </td>
                        </tr>

                        {/* Liu Nian Row (Only if Da Xian selected) */}
                        {selection.daxianIndex !== null && (
                            <tr className="border-b border-gray-200">
                                <td className="bg-gray-100 font-bold p-1 border-r">流年</td>
                                <td className="p-1">
                                    <div className="flex gap-1 overflow-x-auto">
                                        {(() => {
                                            const p = palaces[selection.daxianIndex];
                                            const startAge = p.decadal.range[0];
                                            const endAge = p.decadal.range[1];
                                            const birthYear = new Date(basicInfo.birthday).getFullYear();
                                            // Calculate years for this Da Xian
                                            // Age 1 = Birth Year. Age X = Birth Year + X - 1.
                                            const years = [];
                                            for (let age = startAge; age <= endAge; age++) {
                                                years.push(birthYear + age - 1);
                                            }
                                            return years.map(year => (
                                                <button
                                                    key={year}
                                                    className={`px - 2 py - 1 rounded whitespace - nowrap ${selection.year === year ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'} `}
                                                    onClick={() => handleSelection('year', year)}
                                                >
                                                    {year}年<br />
                                                    <span className="text-[10px]">{HEAVENLY_STEMS[getYearStemIndex(year)]}{EARTHLY_BRANCHES[(year - 4) % 12]}</span>
                                                </button>
                                            ));
                                        })()}
                                    </div>
                                </td>
                            </tr>
                        )}

                        {/* Liu Yue Row (Only if Year selected) */}
                        {selection.year && (
                            <tr className="border-b border-gray-200">

                                <td className="bg-gray-100 font-bold p-1 border-r relative">
                                    <div className="flex items-center justify-center gap-1 cursor-pointer hover:text-blue-600" onClick={() => setShowLunarTip(!showLunarTip)}>
                                        流月 <HelpCircle size={10} />
                                    </div>
                                    {showLunarTip && (
                                        <div className="absolute left-0 top-full mt-1 z-50 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg text-left font-normal leading-relaxed">
                                            <div className="font-bold text-yellow-400 mb-1">⚠️ 农历提醒</div>
                                            紫微斗数均按农历排盘。
                                            <br />
                                            例如：今日阳历12月6日，对应农历十月，请选择【10月】。
                                            <div className="mt-2 text-right">
                                                <button className="text-blue-300 underline" onClick={(e) => { e.stopPropagation(); setShowLunarTip(false); }}>知道了</button>
                                            </div>
                                        </div>
                                    )}
                                </td>
                                <td className="p-1">
                                    <div className="grid grid-cols-6 gap-1">
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                            <button
                                                key={month}
                                                className={`px - 2 py - 1 rounded whitespace - nowrap text - center ${selection.month === month ? 'bg-yellow-500 text-white' : 'text-gray-700 hover:bg-gray-100'} `}
                                                onClick={() => handleSelection('month', month)}
                                            >
                                                {month}月
                                            </button>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        )}

                        {/* Liu Ri Row (Only if Month selected) */}
                        {selection.month && (
                            <tr className="border-b border-gray-200">
                                <td className="bg-gray-100 font-bold p-1 border-r">流日</td>
                                <td className="p-1">
                                    <div className="grid grid-cols-7 gap-1">
                                        {(() => {
                                            // Dynamic days based on year and month
                                            const daysInMonth = new Date(selection.year, selection.month, 0).getDate();
                                            return Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                                                <button
                                                    key={day}
                                                    className={`px - 1 py - 1 rounded whitespace - nowrap text - center text - [10px] ${selection.day === day ? 'bg-purple-500 text-white' : 'text-gray-700 hover:bg-gray-100'} `}
                                                    onClick={() => handleSelection('day', day)}
                                                >
                                                    {day}
                                                </button>
                                            ));
                                        })()}
                                    </div>
                                </td>
                            </tr>
                        )}

                        {/* Liu Shi Row (Only if Day selected) */}
                        {selection.day && (
                            <tr className="border-b border-gray-200">
                                <td className="bg-gray-100 font-bold p-1 border-r">流时</td>
                                <td className="p-1">
                                    <div className="flex gap-1 overflow-x-auto">
                                        {EARTHLY_BRANCHES.map((branch, idx) => (
                                            <button
                                                key={branch}
                                                className={`px - 2 py - 1 rounded whitespace - nowrap flex flex - col items - center ${selection.hour === idx ? 'bg-cyan-500 text-white' : 'text-gray-700 hover:bg-gray-100'} `}
                                                onClick={() => handleSelection('hour', idx)}
                                            >
                                                <span>{branch}时</span>
                                                <span className="text-[9px] opacity-80">{TIME_RANGES[idx]}</span>
                                            </button>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- Unified Floating Action Buttons (Stack) --- */}
            <div className="fixed bottom-6 right-4 z-50 flex flex-col gap-3 items-end pointer-events-none">
                {/* Buttons wrapper - enable pointer events */}
                <div className="pointer-events-auto flex flex-col gap-3 items-end">

                    {/* 1. Archive List Button */}
                    <button
                        onClick={onOpenArchive}
                        className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-cyan-600 text-white shadow-lg hover:bg-cyan-500 hover:scale-110 transition-all duration-300"
                        title="查看档案"
                    >
                        <Archive className="w-5 h-5" />
                        <span className="absolute right-14 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            查看档案
                        </span>
                    </button>

                    {/* 2. Save Button */}
                    <button
                        onClick={onSave}
                        className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-500 hover:scale-110 transition-all duration-300"
                        title="保存档案"
                    >
                        <Save className="w-5 h-5" />
                        <span className="absolute right-14 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            保存档案
                        </span>
                    </button>

                    {/* 2. AI Analysis Button */}
                    <button
                        onClick={() => setShowAiMenu(!showAiMenu)}
                        className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:scale-110 transition-all duration-300"
                        title="AI 分析"
                    >
                        <Sparkles className="w-5 h-5" />
                        <span className="absolute right-14 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            AI 分析
                        </span>
                    </button>

                    {/* 3. Coffee Button */}
                    <button
                        onClick={() => setShowDonationModal(true)}
                        className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg hover:scale-110 transition-all duration-300"
                        title="请喝咖啡"
                    >
                        <Coffee className="w-5 h-5" />
                        <span className="absolute right-14 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            请喝咖啡
                        </span>
                    </button>
                </div>
            </div>

            {/* AI Analysis Menu (Drawer) - Repositioned relative to new button location? 
                Actually, let's keep it fixed absolute relative to this container or viewport.
                Since the stack is fixed bottom-right, the menu should probably open to the left or center.
                Original was bottom-left. Let's make it fixed centered-bottom or fixed bottom-right (shifted left).
            */}
            {showAiMenu && (
                <div className="fixed bottom-24 right-20 z-[60] w-64 bg-[#111]/95 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-2xl p-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="space-y-2">
                        {menuView === 'main' && (
                            <>
                                <button onClick={() => handleGeneratePrompt('scumbag')} className="w-full text-left px-4 py-3 rounded hover:bg-white/10 flex items-center gap-3 text-sm font-bold text-gray-200 border border-transparent hover:border-purple-500/30 transition-all">
                                    <span className="text-xl">🕵️</span> 一键鉴渣话术
                                </button>
                                <button onClick={() => handleGeneratePrompt('marriage')} className="w-full text-left px-4 py-3 rounded hover:bg-white/10 flex items-center gap-3 text-sm font-bold text-pink-300 border border-transparent hover:border-pink-500/30 transition-all">
                                    <span className="text-xl">💍</span> 何时结婚
                                </button>
                                <button onClick={() => handleGeneratePrompt('wealth')} className="w-full text-left px-4 py-3 rounded hover:bg-white/10 flex items-center gap-3 text-sm font-bold text-yellow-300 border border-transparent hover:border-yellow-500/30 transition-all">
                                    <span className="text-xl">💰</span> 何时发财
                                </button>
                                <div className="h-px bg-white/10 my-2"></div>
                                <button onClick={() => setMenuView('fortune')} className="w-full text-left px-4 py-3 rounded hover:bg-white/10 flex items-center justify-between text-sm font-bold text-blue-300 border border-transparent hover:border-blue-500/30 transition-all">
                                    <div className="flex items-center gap-3"><span className="text-xl">📅</span> 运势分析</div>
                                    <span>›</span>
                                </button>
                                <button onClick={() => setMenuView('baby')} className="w-full text-left px-4 py-3 rounded hover:bg-white/10 flex items-center justify-between text-sm font-bold text-green-300 border border-transparent hover:border-green-500/30 transition-all">
                                    <div className="flex items-center gap-3"><span className="text-xl">👶</span> 起居注 (备孕)</div>
                                    <span>›</span>
                                </button>
                            </>
                        )}

                        {menuView === 'fortune' && (
                            <>
                                <button onClick={() => setMenuView('main')} className="w-full text-left px-4 py-2 rounded hover:bg-white/10 flex items-center gap-2 text-xs font-bold text-gray-400 mb-2">
                                    <span>⬅️</span> 返回上一级
                                </button>
                                <button onClick={() => handleGeneratePrompt('yearly')} className="w-full text-left px-4 py-3 rounded hover:bg-white/10 flex items-center gap-3 text-sm font-bold text-blue-300 border border-transparent hover:border-blue-500/30 transition-all">
                                    <span className="text-xl">📅</span> 今年运势
                                </button>
                                <button onClick={() => handleGeneratePrompt('monthly')} className="w-full text-left px-4 py-3 rounded hover:bg-white/10 flex items-center gap-3 text-sm font-bold text-yellow-300 border border-transparent hover:border-yellow-500/30 transition-all">
                                    <span className="text-xl">🌙</span> 今月运势
                                </button>
                                <button onClick={() => handleGeneratePrompt('daily')} className="w-full text-left px-4 py-3 rounded hover:bg-white/10 flex items-center gap-3 text-sm font-bold text-purple-300 border border-transparent hover:border-purple-500/30 transition-all">
                                    <span className="text-xl">☀️</span> 今日运势
                                </button>
                                <button onClick={() => handleGeneratePrompt('hourly')} className="w-full text-left px-4 py-3 rounded hover:bg-white/10 flex items-center gap-3 text-sm font-bold text-cyan-300 border border-transparent hover:border-cyan-500/30 transition-all">
                                    <span className="text-xl">⏰</span> 今时运势
                                </button>
                            </>
                        )}

                        {menuView === 'baby' && (
                            <>
                                <button onClick={() => setMenuView('main')} className="w-full text-left px-4 py-2 rounded hover:bg-white/10 flex items-center gap-2 text-xs font-bold text-gray-400 mb-2">
                                    <span>⬅️</span> 返回上一级
                                </button>
                                <button onClick={() => handleGeneratePrompt('baby_leader')} className="w-full text-left px-4 py-3 rounded hover:bg-white/10 flex items-center gap-3 text-sm font-bold text-yellow-500 border border-transparent hover:border-yellow-500/30 transition-all">
                                    <span className="text-xl">👑</span> 帝王起居注 (领导型)
                                </button>
                                <button onClick={() => handleGeneratePrompt('baby_iq')} className="w-full text-left px-4 py-3 rounded hover:bg-white/10 flex items-center gap-3 text-sm font-bold text-blue-400 border border-transparent hover:border-blue-500/30 transition-all">
                                    <span className="text-xl">🧠</span> 文昌起居注 (高IQ)
                                </button>
                                <button onClick={() => handleGeneratePrompt('baby_sport')} className="w-full text-left px-4 py-3 rounded hover:bg-white/10 flex items-center gap-3 text-sm font-bold text-red-400 border border-transparent hover:border-red-500/30 transition-all">
                                    <span className="text-xl">💪</span> 武曲起居注 (体育型)
                                </button>
                                <button onClick={() => handleGeneratePrompt('baby_wealth')} className="w-full text-left px-4 py-3 rounded hover:bg-white/10 flex items-center gap-3 text-sm font-bold text-green-400 border border-transparent hover:border-green-500/30 transition-all">
                                    <span className="text-xl">💰</span> 陶朱起居注 (搞钱型)
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Partner Info Modal */}
            {showPartnerModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-purple-600 px-4 py-3 flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg">💑 输入配偶信息</h3>
                            <button onClick={() => setShowPartnerModal(false)} className="text-white/80 hover:text-white">✕</button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="text-sm text-gray-500 bg-purple-50 p-2 rounded">
                                为了更精准地进行优生备孕择吉，请提供另一半的生辰信息，系统将结合双人命盘进行推算。
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700">性别</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="gender"
                                            checked={partnerInfo.gender === 'male'}
                                            onChange={() => setPartnerInfo({ ...partnerInfo, gender: 'male' })}
                                            className="accent-purple-600"
                                        />
                                        <span className="text-sm">男</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="gender"
                                            checked={partnerInfo.gender === 'female'}
                                            onChange={() => setPartnerInfo({ ...partnerInfo, gender: 'female' })}
                                            className="accent-purple-600"
                                        />
                                        <span className="text-sm">女</span>
                                    </label>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setMenuView('baby');
                                    setShowAiMenu(false);
                                }}
                                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white p-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 font-bold"
                            >
                                <span className="text-xl">👶</span>
                                <span>紫微备孕 (起居注)</span>
                            </button>



                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700">出生日期 (阳历)</label>
                                <input
                                    type="date"
                                    value={partnerInfo.birthday}
                                    onChange={(e) => setPartnerInfo({ ...partnerInfo, birthday: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700">出生时辰</label>
                                <select
                                    value={partnerInfo.birthTime}
                                    onChange={(e) => setPartnerInfo({ ...partnerInfo, birthTime: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                                >
                                    {TIME_RANGES.map((time, index) => (
                                        <option key={index} value={time}>{time}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleConfirmPartner}
                                disabled={isCalculating}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-lg shadow-lg hover:opacity-90 transition-opacity mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isCalculating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>正在遍历未来14天命盘...</span>
                                    </>
                                ) : (
                                    <span>生成双人分析指令</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Donation Modal */}
            {showDonationModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDonationModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 text-white flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Coffee className="w-5 h-5" />
                                随喜打赏 (Buy me a coffee)
                            </h3>
                            <button onClick={() => setShowDonationModal(false)} className="hover:bg-white/20 rounded-full p-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 flex flex-col items-center gap-6">
                            <p className="text-center text-gray-600 text-sm">
                                如果觉得这个工具对您有帮助，<br />欢迎请作者喝杯咖啡，支持持续开发！☕️
                            </p>

                            <div className="flex justify-center gap-4 w-full">
                                <div className="flex flex-col items-center gap-2 flex-1">
                                    <div className="relative group">
                                        <img src={wechatPayImg} alt="微信支付" className="w-full rounded-lg shadow-md border border-green-100" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-lg" />
                                    </div>
                                    <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8.5,16.5c0-4.7,4.7-8.5,10.5-8.5c5.8,0,10.5,3.8,10.5,8.5c0,4.7-4.7,8.5-10.5,8.5c-1.3,0-2.6-0.2-3.7-0.6 c-0.5-0.2-1-0.2-1.5,0l-3.2,1.6c-0.6,0.3-1.2-0.3-1-0.9l0.8-3.3c0.1-0.5,0-1-0.3-1.4C8.9,19.1,8.5,17.8,8.5,16.5z M3,18.5 c0-4.1,4.1-7.5,9.2-7.5c0.6,0,1.2,0.1,1.8,0.2C13.2,7.3,9.8,4.5,5.5,4.5C2.5,4.5,0,6.5,0,9c0,1.5,0.9,2.8,2.3,3.6 c0.3,0.2,0.4,0.6,0.3,0.9l-0.6,2.3c-0.2,0.6,0.5,1.1,1,0.8l2.5-1.2c0.4-0.2,0.8-0.2,1.2,0c0.9,0.5,2,0.8,3.1,0.8 C6.8,15.7,4.7,14.4,3,12.6C3,12.6,3,18.5,3,18.5z" /></svg>
                                        微信支付
                                    </span>
                                </div>
                                <div className="flex flex-col items-center gap-2 flex-1">
                                    <div className="relative group">
                                        <img src={alipayImg} alt="支付宝" className="w-full rounded-lg shadow-md border border-blue-100" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-lg" />
                                    </div>
                                    <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M18.7,6.2c0.5,0,0.8-0.4,0.8-0.8s-0.4-0.8-0.8-0.8h-4.5V3.3c0-0.5-0.4-0.8-0.8-0.8s-0.8,0.4-0.8,0.8v1.3H8.1 c-0.5,0-0.8,0.4-0.8,0.8s0.4,0.8,0.8,0.8h8.2c-0.5,2.4-1.9,4.5-3.8,5.9c-1.2-1.1-2.1-2.4-2.6-3.8c-0.2-0.4-0.7-0.6-1.1-0.4 c-0.4,0.2-0.6,0.7-0.4,1.1c0.7,1.8,1.8,3.4,3.3,4.7c-1.7,0.9-3.6,1.4-5.6,1.4c-0.5,0-0.8,0.4-0.8,0.8s0.4,0.8,0.8,0.8 c2.3,0,4.5-0.6,6.4-1.7c1.6,1.1,3.5,1.7,5.5,1.7c0.5,0,0.8-0.4,0.8-0.8s-0.4-0.8-0.8-0.8c-1.7,0-3.3-0.5-4.7-1.4 c2.1-1.3,3.6-3.4,4.2-5.9H18.7z" /></svg>
                                        支付宝
                                    </span>
                                </div>
                            </div>

                            <div className="text-[10px] text-gray-400 text-center">
                                感谢您的每一份支持，都将化作代码的动力！❤️
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper to calculate Zodiac sign from date
function getZodiacSign(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;

    if ((month == 1 && day <= 19) || (month == 12 && day >= 22)) return "摩羯座";
    if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return "水瓶座";
    if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return "双鱼座";
    if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return "白羊座";
    if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return "金牛座";
    if ((month == 5 && day >= 21) || (month == 6 && day <= 21)) return "双子座";
    if ((month == 6 && day >= 22) || (month == 7 && day <= 22)) return "巨蟹座";
    if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return "狮子座";
    if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return "处女座";
    if ((month == 9 && day >= 23) || (month == 10 && day <= 23)) return "天秤座";
    if ((month == 10 && day >= 24) || (month == 11 && day <= 22)) return "天蝎座";
    if ((month == 11 && day >= 23) || (month == 12 && day <= 21)) return "射手座";
    return "未知";
}


class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ProfessionalChart Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <div className="p-4 text-red-500">Chart Error: {this.state.error.toString()}</div>;
        }
        return this.props.children;
    }
}

export default function ProfessionalChart(props) {
    return (
        <ErrorBoundary>
            <ProfessionalChartInner {...props} />
        </ErrorBoundary>
    );
}
