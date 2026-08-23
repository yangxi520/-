
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
import {
    buildCurrentFortuneContext,
    FORTUNE_HOUR_OPTIONS,
    FORTUNE_LAYER_LABELS,
    getLunarMonthDays,
    getLunarMonthOptions,
} from '../utils/fortuneContext';
import { Sparkles, HelpCircle, Coffee, Save, Archive, Calendar, Printer } from "lucide-react";
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
    "00:00-01:00（早子时）", // Early Zi
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
    "21:00-23:00", // Hai
    "23:00-24:00（晚子时）" // Late Zi
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
        lunarYear: null,   // Numeric lunar year for daily/hourly calculations
        month: null,       // Month Index (1-12)
        day: null,         // Day Index (1-30)
        hour: null,        // Hour Index (0-12, including late Zi hour)
        isLeapMonth: false,
        targetSolarDate: null,
    });

    // iztro-computed current luck cycles used by the “current” shortcut buttons.
    const [currentFortuneContext, setCurrentFortuneContext] = React.useState(null);

    // State for focused palace (for San Fang Si Zheng lines)
    // This can be independent of timeline selection, or synced.
    // Let's make it independent but initialized by Da Xian selection.
    const [focusedIndex, setFocusedIndex] = React.useState(null);
    const [showConnections, setShowConnections] = React.useState(true);

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
    const [promptPreview, setPromptPreview] = React.useState(null);
    const [mobileChartMode, setMobileChartMode] = React.useState('professional');
    // Lunar Tip State
    const [showLunarTip, setShowLunarTip] = React.useState(false);

    // State for Partner Modal (Conception Planner)
    const [showPartnerModal, setShowPartnerModal] = React.useState(false);
    const [selectedBabyType, setSelectedBabyType] = React.useState(null);
    const [partnerInfo, setPartnerInfo] = React.useState({
        gender: 'female',
        birthday: '',
        birthTime: TIME_RANGES[0]
    });
    const [isCalculating, setIsCalculating] = React.useState(false);

    // State for Donation Modal
    const [showDonationModal, setShowDonationModal] = React.useState(false);

    const selectedDaxianPalace = selection.daxianIndex !== null
        ? palaces.find((palace) => palace.index === selection.daxianIndex) || palaces[selection.daxianIndex]
        : null;

    const focusedPalace = useMemo(() => {
        if (focusedIndex === null) return null;
        return palaces.find((palace) => palace.index === focusedIndex) || palaces[focusedIndex] || null;
    }, [focusedIndex, palaces]);

    React.useEffect(() => {
        if (focusedIndex !== null || palaces.length === 0) return;
        const mingPalace = palaces.find((palace) => palace.name === '命宫');
        setFocusedIndex(mingPalace?.index ?? palaces[0]?.index ?? 0);
    }, [focusedIndex, palaces]);

    const palaceRelationship = useMemo(() => {
        if (!focusedPalace) return null;

        const branchIndex = BRANCH_ORDER.indexOf(focusedPalace.earthlyBranch);
        if (branchIndex === -1) return null;

        const self = BRANCH_ORDER[branchIndex];
        const sanHe = [
            BRANCH_ORDER[(branchIndex + 4) % 12],
            BRANCH_ORDER[(branchIndex + 8) % 12],
        ];
        const opposite = BRANCH_ORDER[(branchIndex + 6) % 12];

        return {
            self,
            sanHe,
            opposite,
            byBranch: {
                [self]: 'self',
                [sanHe[0]]: 'sanhe',
                [sanHe[1]]: 'sanhe',
                [opposite]: 'opposite',
            },
        };
    }, [focusedPalace]);

    const relationshipLabels = useMemo(() => {
        if (!palaceRelationship) return null;
        const getName = (branch) => palaces.find((palace) => palace.earthlyBranch === branch)?.name || `${branch}宫`;
        return {
            self: getName(palaceRelationship.self),
            sanHe: palaceRelationship.sanHe.map(getName),
            opposite: getName(palaceRelationship.opposite),
        };
    }, [palaceRelationship, palaces]);

    const closeAiMenu = () => {
        setShowAiMenu(false);
        setMenuView('main');
    };

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
        if (sel.daxianIndex !== null) {
            const decadalPalace = horo.palaces.find((palace) => palace.index === sel.daxianIndex)
                || horo.palaces[sel.daxianIndex];
            if (decadalPalace) stems.decadal = decadalPalace.heavenlyStem;
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
                    `${sel.lunarYear || sel.year}-${sel.month}-${sel.day}`,
                    sel.hour ?? 0,
                    info.gender === 'male' ? '男' : '女',
                    Boolean(sel.isLeapMonth),
                    true
                );

                if (tempHoroscope && tempHoroscope.chineseDate) {
                    const rawChineseDate = tempHoroscope.rawDates?.chineseDate;
                    const parts = typeof tempHoroscope.chineseDate === 'string'
                        ? tempHoroscope.chineseDate.trim().split(/\s+/)
                        : [];

                    stems.daily = rawChineseDate?.daily?.[0] || parts[2]?.[0];
                    if (sel.hour !== null) {
                        stems.hourly = rawChineseDate?.hourly?.[0] || parts[3]?.[0];
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
        if (currentFortuneContext) return currentFortuneContext.activeStems;
        return calculateActiveStems(selection, horoscope, basicInfo);
    }, [horoscope, selection, basicInfo, currentFortuneContext]);

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
        setCurrentFortuneContext(null);
        const layerBySelection = {
            daxian: 'decadal',
            year: 'yearly',
            month: 'monthly',
            day: 'daily',
            hour: 'hourly',
        };
        setActiveLayers(prev => ({ ...prev, [layerBySelection[type]]: true }));
        setSelection(prev => {
            const next = { ...prev };
            if (type === 'daxian') {
                next.daxianIndex = value;
                // Reset children
                next.year = null; next.lunarYear = null; next.month = null; next.day = null; next.hour = null;
                next.isLeapMonth = false; next.targetSolarDate = null;
                // Auto-select first year of Da Xian? Or wait for user?
                // Let's wait.
                // Also set focusedIndex to highlight the palace
                setFocusedIndex(value);
            } else if (type === 'year') {
                next.year = value;
                next.lunarYear = value;
                next.month = null; next.day = null; next.hour = null;
                next.isLeapMonth = false; next.targetSolarDate = null;
            } else if (type === 'month') {
                next.month = typeof value === 'object' ? value.month : value;
                next.day = null; next.hour = null;
                next.isLeapMonth = typeof value === 'object' ? Boolean(value.isLeap) : false;
                next.targetSolarDate = null;
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

        const isFocused = focusedPalace?.earthlyBranch === branch;
        const relationship = palaceRelationship?.byBranch?.[branch] || null;

        // Determine if this palace is Ming or Shen
        const isMing = palace.name === '命宫';
        const isShen = palace.isBodyPalace;

        // Filter Stars by Type for styling
        const softStars = palace.minorStars.filter(s => s.type === 'soft');
        const toughStars = palace.minorStars.filter(s => s.type === 'tough');
        const adjectiveStars = palace.adjectiveStars || [];

        // --- Age Calculations ---
        // 1. Xiao Xian (Small Limit) - from iztro
        const xiaoXianAges = palace.ages || [];

        // 2. Liu Nian (Flow Year)
        // Formula: Ages where (Age - 1 + BirthBranchIndex) % 12 === PalaceBranchIndex
        // We need Birth Branch Index.
        // Try to get from horoscope.chineseDate.yearly[1] or calculate from solar year.
        let birthBranchIndex = 0;
        if (basicInfo.birthday) {
            const birthYear = new Date(basicInfo.birthday).getFullYear();
            // 1984=0(Rat), 1990=6(Horse). (Year-4)%12
            birthBranchIndex = (birthYear - 4) % 12;
        }
        const palaceBranchIndex = BRANCH_ORDER.indexOf(palace.earthlyBranch);

        // Generate Liu Nian ages (e.g., 1 to 100)
        const liuNianAges = [];
        // Age 1 corresponds to the birth branch.
        // We want ages where the current branch (calculated as (birthBranchIndex + age - 1) % 12)
        // matches the palaceBranchIndex.
        // (birthBranchIndex + age - 1) % 12 === palaceBranchIndex
        // age - 1 === (palaceBranchIndex - birthBranchIndex + 12) % 12
        // age = (palaceBranchIndex - birthBranchIndex + 12) % 12 + 1
        let baseAge = (palaceBranchIndex - birthBranchIndex + 12) % 12 + 1;
        for (let a = baseAge; a <= 110; a += 12) {
            liuNianAges.push(a);
        }

        // Display Logic: Limit to ~5 entries to prevent overflow
        const displayLiuNian = liuNianAges.slice(0, 5); // e.g. 11, 23, 35, 47, 59
        const displayXiaoXian = xiaoXianAges.slice(0, 5);

        return (
            <div
                className={`wenmo-palace w-full h-full relative p-0.5 md:p-1 flex flex-col justify-between transition-all duration-200 cursor-pointer overflow-hidden
                ${isFocused ? 'bg-amber-50 ring-2 ring-amber-400 z-10 shadow-lg' : 'bg-stone-50 hover:bg-stone-100'}
                ${isMing ? 'bg-red-50/30' : ''}
            `}
                data-relation={showConnections ? relationship || undefined : undefined}
                onClick={() => setFocusedIndex(palace.index)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setFocusedIndex(palace.index);
                    }
                }}
                role="button"
                tabIndex={0}
                aria-pressed={isFocused}
                aria-label={`${palace.name}，${palace.heavenlyStem}${palace.earthlyBranch}宫`}
            >
                {/* --- TOP AREA: Stars --- */}
                <div className="flex flex-row gap-0.5 h-full relative">

                    {/* Left Column: Major & Minor */}
                    <div className="flex flex-col items-start gap-0.5 min-w-[42%] z-10">

                        {/* Major Stars (Red) */}
                        {palace.majorStars.map((star, idx) => {
                            const activeSiHua = getActiveSiHua(star.name);
                            return (
                                <div key={`major-${idx}`} className="wenmo-star wenmo-star--major flex items-center gap-0.5 font-serif font-bold text-sm md:text-base text-red-600 leading-none whitespace-nowrap">
                                    <span>{star.name}</span>
                                    <span className="text-[8px] md:text-[9px] text-gray-400 font-normal ml-[1px]">{star.brightness}</span>
                                    {activeSiHua.map((badge, bIdx) => (
                                        <span key={bIdx} className={`text-[8px] px-0.5 rounded-sm text-white scale-90 origin-left shadow-sm ${badge.color}`}>
                                            {badge.type}
                                        </span>
                                    ))}
                                </div>
                            );
                        })}

                        {/* Soft Stars (Purple) */}
                        {softStars.map((star, idx) => {
                            const activeSiHua = getActiveSiHua(star.name);
                            return (
                                <div key={`soft-${idx}`} className="wenmo-star wenmo-star--soft flex items-center gap-0.5 text-xs md:text-sm font-bold text-purple-600 leading-none whitespace-nowrap">
                                    <span>{star.name}</span>
                                    <span className="text-[8px] md:text-[9px] text-gray-400 font-normal ml-[1px]">{star.brightness}</span>
                                    {activeSiHua.map((badge, bIdx) => (
                                        <span key={bIdx} className={`wenmo-sihua-badge text-[8px] px-0.5 rounded-sm text-white ${badge.color}`}>
                                            {badge.type}
                                        </span>
                                    ))}
                                </div>
                            );
                        })}

                        {/* Tough Stars (Black) */}
                        {toughStars.map((star, idx) => {
                            const activeSiHua = getActiveSiHua(star.name);
                            return (
                                <div key={`tough-${idx}`} className="wenmo-star wenmo-star--tough flex items-center gap-0.5 text-xs md:text-sm font-bold text-gray-900 leading-none whitespace-nowrap">
                                    <span>{star.name}</span>
                                    <span className="text-[8px] md:text-[9px] text-gray-400 font-normal ml-[1px]">{star.brightness}</span>
                                    {activeSiHua.map((badge, bIdx) => (
                                        <span key={bIdx} className={`wenmo-sihua-badge text-[8px] px-0.5 rounded-sm text-white ${badge.color}`}>
                                            {badge.type}
                                        </span>
                                    ))}
                                </div>
                            );
                        })}
                    </div>

                    {/* Right Area: Adjective Stars (Blue) */}
                    <div className="wenmo-adjective-stars flex flex-wrap content-start items-start gap-x-1 gap-y-0.5 text-[10px] md:text-xs pl-1">
                        {adjectiveStars.map((star, idx) => {
                            const activeSiHua = getActiveSiHua(star.name);
                            return (
                                <span key={`adj-${idx}`} className="inline-flex items-center gap-px text-blue-500 font-medium leading-tight">
                                    {star.name}
                                    {activeSiHua.map((badge, bIdx) => (
                                        <span key={bIdx} className={`wenmo-sihua-badge text-[7px] px-px rounded-sm text-white ${badge.color}`}>
                                            {badge.type}
                                        </span>
                                    ))}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* --- BOTTOM AREA: Meta Info (Wen Mo Style) --- */}
                <div className="wenmo-palace-meta mt-auto flex justify-between items-end w-full border-t border-gray-100/50 pt-1">

                    {/* Left Bottom: Stacked Ages (Liu Nian / Xiao Xian) */}
                    <div className="flex flex-col gap-0.5 text-[9px] leading-tight">
                        {/* Row 1: Liu Nian */}
                        <div className="flex items-baseline gap-1">
                            <span className="text-gray-400 scale-90 origin-left whitespace-nowrap">流年</span>
                            <span className="text-black font-mono">{displayLiuNian.join(' ')}</span>
                        </div>
                        {/* Row 2: Xiao Xian */}
                        <div className="flex items-baseline gap-1">
                            <span className="text-gray-400 scale-90 origin-left whitespace-nowrap">小限</span>
                            <span className="text-black font-mono">{displayXiaoXian.join(' ')}</span>
                        </div>
                    </div>

                    {/* Right Bottom: Palace Info & Gods */}
                    <div className="flex flex-col items-end text-right min-w-[35%]">

                        {/* Gods Row (Compact, Top) */}
                        <div className="flex flex-wrap justify-end gap-1 text-[9px] text-gray-800 scale-90 origin-right mb-0.5 opacity-80">
                            <span>{palace.boshi12} • {palace.jiangqian12} • {palace.suiqian12}</span>
                        </div>

                        {/* Main Info Block: Separated into Columns for strict alignment */}
                        <div className="flex items-end justify-end gap-1.5">

                            {/* Col 1: Life Stage & Stem/Branch */}
                            <div className="flex flex-col items-end gap-0.5">
                                {/* Life Stage */}
                                <div className="text-[10px] text-gray-900 font-bold leading-none">
                                    {palace.changsheng12}
                                </div>
                                {/* Stem/Branch */}
                                <div className="text-[10px] text-stone-500 font-mono leading-none">
                                    {palace.heavenlyStem}{palace.earthlyBranch}
                                </div>
                            </div>

                            {/* Col 2: Palace Name & Decade (Target: Aligned) */}
                            <div className="flex flex-col items-end gap-0.5">
                                {/* Palace Name Row (with Body Palace Badge) */}
                                <div className="flex items-center justify-end gap-1">
                                    {/* Body Palace Badge */}
                                    {isShen && (
                                        <span className="text-[9px] border border-amber-600 text-amber-700 px-0.5 rounded-sm leading-none bg-amber-50">
                                            身宫
                                        </span>
                                    )}
                                    {/* Palace Name */}
                                    <div className={`font-serif font-bold text-sm md:text-base leading-none ${isMing ? 'text-red-700' : isShen ? 'text-amber-700' : 'text-slate-700'}`}>
                                        {palace.name}
                                    </div>
                                </div>
                                {/* Decade Range - Aligned under Palace Name */}
                                <div className="text-blue-500 font-bold text-[10px] leading-none">
                                    {palace.decadal.range[0]}-{palace.decadal.range[1]}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderSimplePalaceCard = (palace) => {
        if (!palace) return null;

        const isFocused = focusedIndex === palace.index;
        const isSelectedDaxian = selection.daxianIndex === palace.index;
        const majorStars = palace.majorStars || [];
        const minorStars = palace.minorStars || [];
        const visibleMinorStars = minorStars.slice(0, 5);
        const hiddenMinorStarCount = Math.max(minorStars.length - visibleMinorStars.length, 0);

        return (
            <button
                key={palace.earthlyBranch}
                type="button"
                onClick={() => setFocusedIndex(palace.index)}
                aria-pressed={isFocused}
                aria-label={`${palace.name}，${palace.heavenlyStem}${palace.earthlyBranch}，大限${palace.decadal.range[0]}至${palace.decadal.range[1]}岁`}
                className={`min-h-36 rounded-2xl border p-3 text-left shadow-sm transition active:scale-[0.98]
                    ${isFocused
                        ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300/60'
                        : 'border-stone-200 bg-white hover:border-purple-300'
                    }`}
            >
                <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className={`text-base font-black ${palace.name === '命宫' ? 'text-red-700' : 'text-slate-800'}`}>
                                {palace.name}
                            </span>
                            {palace.isBodyPalace && (
                                <span className="rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                                    身宫
                                </span>
                            )}
                        </div>
                        <div className="mt-0.5 font-mono text-xs text-stone-500">
                            {palace.heavenlyStem}{palace.earthlyBranch} · {palace.changsheng12}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-bold text-blue-600">
                            大限 {palace.decadal.range[0]}-{palace.decadal.range[1]}
                        </div>
                        {isSelectedDaxian && (
                            <span className="mt-1 inline-block rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                {currentFortuneContext ? '当前大限' : '已选大限'}
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-2 space-y-2">
                    <div>
                        <div className="mb-1 text-[10px] font-bold tracking-wider text-stone-400">主星</div>
                        <div className="flex flex-wrap gap-1.5">
                            {majorStars.length > 0 ? majorStars.map((star) => (
                                <span key={star.name} className="rounded-lg bg-red-50 px-2 py-1 text-sm font-bold text-red-700">
                                    {star.name}
                                    {star.brightness && <span className="ml-0.5 text-[10px] font-normal text-red-400">{star.brightness}</span>}
                                </span>
                            )) : (
                                <span className="text-sm text-stone-400">无主星</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="mb-1 text-[10px] font-bold tracking-wider text-stone-400">辅星</div>
                        <div className="flex flex-wrap gap-1 text-xs text-purple-700">
                            {visibleMinorStars.length > 0 ? visibleMinorStars.map((star) => (
                                <span key={star.name} className="rounded-md bg-purple-50 px-1.5 py-1 font-semibold">
                                    {star.name}
                                </span>
                            )) : (
                                <span className="text-stone-400">无辅星</span>
                            )}
                            {hiddenMinorStarCount > 0 && (
                                <span className="rounded-md bg-stone-100 px-1.5 py-1 text-stone-500">+{hiddenMinorStarCount}</span>
                            )}
                        </div>
                    </div>
                </div>
            </button>
        );
    };

    // Calculate connection lines for San Fang Si Zheng
    const renderConnections = () => {
        if (!showConnections || !palaceRelationship) return null;

        // The centre occupies x/y 100..300 in a 400×400 logical grid.
        // Each arrow begins on the centre boundary and points into its palace,
        // keeping the relationship readable without drawing through star text.
        const getArrowPoints = (branch) => {
            const pos = GRID_MAP[branch];
            if (!pos) return null;

            const center = {
                x: (pos.col - 0.5) * 100,
                y: (pos.row - 0.5) * 100,
            };

            if (pos.row === 1) return { start: { x: center.x, y: 104 }, end: { x: center.x, y: 78 } };
            if (pos.row === 4) return { start: { x: center.x, y: 296 }, end: { x: center.x, y: 322 } };
            if (pos.col === 1) return { start: { x: 104, y: center.y }, end: { x: 78, y: center.y } };
            return { start: { x: 296, y: center.y }, end: { x: 322, y: center.y } };
        };

        const targets = [
            { branch: palaceRelationship.self, role: 'self', color: '#d43d35', marker: 'relation-arrow-self' },
            { branch: palaceRelationship.sanHe[0], role: 'sanhe', color: '#1677c8', marker: 'relation-arrow-sanhe-a' },
            { branch: palaceRelationship.sanHe[1], role: 'sanhe', color: '#168a62', marker: 'relation-arrow-sanhe-b' },
            { branch: palaceRelationship.opposite, role: 'opposite', color: '#813ca3', marker: 'relation-arrow-opposite' },
        ].map((target) => ({ ...target, points: getArrowPoints(target.branch) })).filter((target) => target.points);

        const trianglePoints = targets
            .filter((target) => target.role !== 'opposite')
            .map((target) => `${target.points.start.x},${target.points.start.y}`)
            .join(' ');
        const selfTarget = targets.find((target) => target.role === 'self');
        const oppositeTarget = targets.find((target) => target.role === 'opposite');

        return (
            <svg
                className="wenmo-connections absolute inset-0 h-full w-full pointer-events-none"
                viewBox="0 0 400 400"
                preserveAspectRatio="none"
                aria-hidden="true"
            >
                <defs>
                    {targets.map((target) => (
                        <marker
                            key={target.marker}
                            id={target.marker}
                            markerWidth="8"
                            markerHeight="8"
                            refX="6.4"
                            refY="4"
                            orient="auto"
                            markerUnits="strokeWidth"
                        >
                            <path d="M0,0 L8,4 L0,8 Z" fill={target.color} />
                        </marker>
                    ))}
                </defs>

                <polygon
                    points={trianglePoints}
                    fill="rgba(22, 119, 200, 0.035)"
                    stroke="rgba(49, 92, 125, 0.36)"
                    strokeWidth="1.25"
                    strokeDasharray="5 4"
                    vectorEffect="non-scaling-stroke"
                />

                {selfTarget && oppositeTarget && (
                    <line
                        x1={selfTarget.points.start.x}
                        y1={selfTarget.points.start.y}
                        x2={oppositeTarget.points.start.x}
                        y2={oppositeTarget.points.start.y}
                        stroke="rgba(91, 69, 112, 0.3)"
                        strokeWidth="1.2"
                        strokeDasharray="4 4"
                        vectorEffect="non-scaling-stroke"
                    />
                )}

                {targets.map((target) => (
                    <g key={`${target.role}-${target.branch}`}>
                        <circle
                            cx={target.points.start.x}
                            cy={target.points.start.y}
                            r="3"
                            fill="#fff"
                            stroke={target.color}
                            strokeWidth="1.4"
                            vectorEffect="non-scaling-stroke"
                        />
                        <line
                            x1={target.points.start.x}
                            y1={target.points.start.y}
                            x2={target.points.end.x}
                            y2={target.points.end.y}
                            stroke={target.color}
                            strokeWidth={target.role === 'self' ? 2.1 : 1.8}
                            markerEnd={`url(#${target.marker})`}
                            vectorEffect="non-scaling-stroke"
                        />
                    </g>
                ))}
            </svg>
        );
    };

    // Generic Copy Helper
    const copyToClipboard = async (text) => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                alert('已复制分析指令！\n请发送给AI进行分析。');
            } else {
                throw new Error('Clipboard API unavailable');
            }
        } catch {
            // Fallback for HTTP or Mobile restrictions
            try {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed"; // Avoid scrolling to bottom
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (successful) {
                    alert('已复制分析指令！\n请发送给AI进行分析。');
                    return;
                }
            } catch (fallbackErr) {
                console.error('Fallback copy failed:', fallbackErr);
            }
            alert('自动复制失败，可能因浏览器安全限制(非HTTPS)。\n请尝试截图或手动输入。');
        }
    };

    // Generate Prompt for AI Analysis
    const handleGeneratePrompt = async (type) => {
        try {
            let prompt = '';
            const scumbagData = generateScumbagPrompt(horoscope);
            const basicInfoData = `\n**--- 命主基本信息 (用于推算大限流年) ---**\n- **姓名**：${basicInfo.name || '未填写'}\n- **性别**：${basicInfo.gender === 'male' ? '男' : '女'}\n- **生辰**：${basicInfo.birthday}\n- **出生时辰**：${basicInfo.birthTime}\n`;

            if (type === 'scumbag') {
                const template = basicInfo.gender === 'female' ? FEMALE_PROMPT_TEMPLATE : AI_PROMPT_TEMPLATE;
                prompt = `${template}\n${basicInfoData}\n${scumbagData}`;
            } else if (type === 'marriage') {
                prompt = `${MARRIAGE_PROMPT_TEMPLATE}\n${basicInfoData}\n${scumbagData}`;
            } else if (type === 'wealth') {
                prompt = `${WEALTH_PROMPT_TEMPLATE}\n${basicInfoData}\n${scumbagData}`;
            } else if (['yearly', 'monthly', 'daily', 'hourly'].includes(type)) {
                const fortuneContext = buildCurrentFortuneContext({
                    horoscope,
                    basicInfo,
                    type,
                    now: new Date(),
                });
                const targetOrder = ['yearly', 'monthly', 'daily', 'hourly'];
                const targetIndex = targetOrder.indexOf(type);

                setSelection(fortuneContext.selection);
                setCurrentFortuneContext(fortuneContext);
                setFocusedIndex(fortuneContext.fortune[type]?.index ?? fortuneContext.fortune.decadal.index);
                setActiveLayers({
                    origin: true,
                    decadal: true,
                    yearly: true,
                    monthly: targetIndex >= 1,
                    daily: targetIndex >= 2,
                    hourly: targetIndex >= 3,
                });

                prompt = generateFortunePromptText(
                    type,
                    fortuneContext.selection,
                    fortuneContext.activeStems,
                    basicInfo,
                    horoscope,
                    palaces,
                    SI_HUA_MAP,
                    fortuneContext,
                );

                if (!prompt) throw new Error(`无法生成${FORTUNE_LAYER_LABELS[type] || '运势'}话术`);

                setPromptPreview({
                    title: `${FORTUNE_LAYER_LABELS[type]}运势话术`,
                    text: prompt,
                });
                setShowAiMenu(false);
                return;
            } else if (type.startsWith('baby_')) {
                const babyType = type.replace('baby_', '');
                setSelectedBabyType(babyType);
                setShowPartnerModal(true);
                setShowAiMenu(false); // Close menu
                return; // Stop here, wait for modal
            }

            if (prompt) {
                await copyToClipboard(prompt);
                setShowAiMenu(false);
            }
        } catch (error) {
            console.error("Generate prompt error:", error);
            alert("生成话术失败，请检查数据完整性或刷新重试。");
        }
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
        <div className="professional-chart wenmo-chart">
            {/* Mobile-only readable summary and chart mode selector. */}
            <section
                className="chart-mobile-controls chart-mobile-summary md:hidden"
                aria-label="命盘基本信息摘要"
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-slate-900">{basicInfo.name || '未命名命盘'}</span>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${basicInfo.gender === 'male' ? 'bg-cyan-100 text-cyan-700' : 'bg-pink-100 text-pink-700'}`}>
                                {basicInfo.gender === 'male' ? '男命' : '女命'}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{basicInfo.birthday} · {basicInfo.birthTime}</p>
                    </div>
                    <div className="rounded-xl bg-purple-700 px-3 py-2 text-right text-white shadow-sm">
                        <div className="text-[10px] text-purple-100">五行局</div>
                        <div className="text-sm font-black">{horoscope.fiveElementsClass}</div>
                    </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-white/80 p-2.5">
                        <div className="text-slate-400">四柱</div>
                        <div className="mt-0.5 font-semibold text-slate-700">{horoscope.chineseDate || '-'}</div>
                    </div>
                    <div className="rounded-xl bg-white/80 p-2.5">
                        <div className="text-slate-400">农历</div>
                        <div className="mt-0.5 font-semibold text-slate-700">{horoscope.lunarDate || '-'}</div>
                    </div>
                    <div className="rounded-xl bg-white/80 p-2.5">
                        <div className="text-slate-400">命主 / 身主</div>
                        <div className="mt-0.5 font-semibold text-slate-700">{horoscope.soul || '-'} / {horoscope.body || '-'}</div>
                    </div>
                    <div className="rounded-xl bg-white/80 p-2.5">
                        <div className="text-slate-400">当前查看</div>
                        <div className="mt-0.5 font-semibold text-slate-700">
                            {selectedDaxianPalace
                                ? `${selectedDaxianPalace.decadal.range[0]}-${selectedDaxianPalace.decadal.range[1]}岁 ${selectedDaxianPalace.heavenlyStem}${selectedDaxianPalace.earthlyBranch}`
                                : '尚未选择大限'}
                        </div>
                    </div>
                </div>
            </section>

            <div
                className="chart-mobile-controls chart-mobile-mode md:hidden grid grid-cols-2"
                role="group"
                aria-label="手机命盘显示方式"
            >
                <button
                    type="button"
                    onClick={() => setMobileChartMode('simple')}
                    aria-pressed={mobileChartMode === 'simple'}
                    className={`min-h-11 rounded-lg px-3 py-2 text-sm font-bold transition ${mobileChartMode === 'simple' ? 'bg-white text-purple-700 shadow' : 'text-stone-600'}`}
                >
                    简洁盘
                </button>
                <button
                    type="button"
                    onClick={() => setMobileChartMode('professional')}
                    aria-pressed={mobileChartMode === 'professional'}
                    className={`min-h-11 rounded-lg px-3 py-2 text-sm font-bold transition ${mobileChartMode === 'professional' ? 'bg-slate-900 text-white shadow' : 'text-stone-600'}`}
                >
                    专业盘
                </button>
            </div>

            {mobileChartMode === 'simple' && (
                <section className="chart-simple-grid md:hidden" aria-label="简洁十二宫命盘">
                    <div className="mb-2 flex items-center justify-between px-1">
                        <h2 className="text-sm font-black text-slate-800">十二宫速览</h2>
                        <span className="text-[11px] text-stone-500">点宫位可高亮查看</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2">
                        {BRANCH_ORDER
                            .map((branch) => palaces.find((palace) => palace.earthlyBranch === branch))
                            .filter(Boolean)
                            .map(renderSimplePalaceCard)}
                    </div>
                </section>
            )}

            {mobileChartMode === 'professional' && (
                <p className="md:hidden px-1 text-center text-[11px] text-stone-500">左右滑动查看完整传统命盘</p>
            )}

            {/* Chart Grid - Min width to ensure readability on mobile */}
            <div className={`chart-professional-grid ${mobileChartMode === 'professional' ? 'block' : 'hidden'} md:block`}>
                <div className="wenmo-board relative grid grid-cols-4 grid-rows-4">
                {renderConnections()}
                {/* Row 1 */}
                <div className="wenmo-grid-cell">{renderPalace('巳')}</div>
                <div className="wenmo-grid-cell">{renderPalace('午')}</div>
                <div className="wenmo-grid-cell">{renderPalace('未')}</div>
                <div className="wenmo-grid-cell">{renderPalace('申')}</div>

                {/* Row 2 */}
                <div className="wenmo-grid-cell">{renderPalace('辰')}</div>
                <div className="wenmo-center col-span-2 row-span-2 flex flex-col relative overflow-hidden">
                    {/* Top: Basic Info */}
                    <div className="wenmo-center-info z-10 flex flex-col">
                        <div className="wenmo-center-heading">
                            <strong>古书派紫微</strong>
                            <span>{basicInfo.name || '未命名'} · {basicInfo.gender === 'male' ? '男命' : '女命'} · {horoscope.fiveElementsClass}</span>
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
                                <span className="font-bold text-olive-600">{horoscope.chineseDate || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">公历：</span>
                                <span>{basicInfo.birthday}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-slate-500">农历：</span>
                                <span>{horoscope.lunarDate || '-'}</span>
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
                                <span>{horoscope.palaces.find(p => p.name === '命宫')?.earthlyBranch || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">身宫：</span>
                                <span>{horoscope.palaces.find(p => p.isBodyPalace)?.earthlyBranch || '-'}</span>
                            </div>
                        </div>

                        <div className="wenmo-current-view">
                            {selectedDaxianPalace
                                ? `所选大限 ${selectedDaxianPalace.decadal.range[0]}-${selectedDaxianPalace.decadal.range[1]}岁 · ${selectedDaxianPalace.heavenlyStem}${selectedDaxianPalace.earthlyBranch}`
                                : '本命盘 · 点击下方大限进入运限盘'}
                        </div>

                        {relationshipLabels && (
                            <div className="wenmo-center-relation" aria-live="polite">
                                <span><i className="is-self" />本宫<strong>{relationshipLabels.self}</strong></span>
                                <span><i className="is-sanhe" />三合<strong>{relationshipLabels.sanHe.join('、')}</strong></span>
                                <span><i className="is-opposite" />对宫<strong>{relationshipLabels.opposite}</strong></span>
                            </div>
                        )}

                        <div className="wenmo-powered">Powered by iztro</div>
                    </div>
                </div>
                <div className="wenmo-grid-cell">{renderPalace('酉')}</div>

                {/* Row 3 */}
                <div className="wenmo-grid-cell">{renderPalace('卯')}</div>
                {/* Center spans here */}
                <div className="wenmo-grid-cell">{renderPalace('戌')}</div>

                {/* Row 4 */}
                <div className="wenmo-grid-cell">{renderPalace('寅')}</div>
                <div className="wenmo-grid-cell">{renderPalace('丑')}</div>
                <div className="wenmo-grid-cell">{renderPalace('子')}</div>
                <div className="wenmo-grid-cell">{renderPalace('亥')}</div>
                </div>
            </div>

            <section className="wenmo-chart-tools" aria-label="命盘关系与四化图层">
                <div className="wenmo-relation-control">
                    <button
                        type="button"
                        className="wenmo-relation-toggle"
                        aria-pressed={showConnections}
                        onClick={() => setShowConnections((visible) => !visible)}
                    >
                        <span aria-hidden="true">↗</span>
                        三方四正
                        <small>{showConnections ? '已显示' : '已隐藏'}</small>
                    </button>
                    <p>点击任一宫位，箭头会自动显示本宫、两个三合宫与对宫。</p>
                </div>

                <div className="wenmo-four-transform-control">
                    <span className="wenmo-tool-label">四化叠层</span>
                    <div className="wenmo-layer-grid grid grid-cols-6 text-[10px]">
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
                                type="button"
                                className={`wenmo-layer-button border px-1 py-0.5 flex flex-col items-center justify-center
                                    ${activeLayers[layer.key] ? 'bg-stone-100 border-stone-300 shadow-inner' : 'bg-stone-50 border-stone-200 text-gray-300'}
                                `}
                                onClick={() => setActiveLayers(prev => ({ ...prev, [layer.key]: !prev[layer.key] }))}
                                aria-pressed={activeLayers[layer.key]}
                                aria-label={`${activeLayers[layer.key] ? '隐藏' : '显示'}${layer.label}层四化`}
                            >
                                <span className={`font-bold ${activeLayers[layer.key] ? layer.color : ''}`}>{layer.label}</span>
                                {activeStems[layer.key] && <span className="font-mono text-stone-500">{activeStems[layer.key]}</span>}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Cascading Timeline Table */}
            <div className="chart-timeline wenmo-timeline overflow-x-auto text-[11px] md:text-xs">
                <table className="min-w-full text-center border-collapse" aria-label="运限时间选择">
                    <tbody>
                        {/* Da Xian Row */}
                        <tr className="wenmo-daxian-row border-b border-gray-200">
                            <td className="wenmo-timeline-label sticky left-0 z-10 min-w-14 border-r bg-stone-100 p-2 font-bold">大限</td>
                            <td className="overflow-x-auto p-0">
                                <div className="wenmo-timeline-options flex overflow-x-auto touch-pan-x">
                                    {[...palaces].sort((a, b) => a.decadal.range[0] - b.decadal.range[0]).map((p, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            aria-pressed={selection.daxianIndex === p.index}
                                            aria-label={`选择${p.decadal.range[0]}至${p.decadal.range[1]}岁大限，${p.heavenlyStem}${p.earthlyBranch}`}
                                            className={`wenmo-timeline-option min-h-12 min-w-16 px-3 py-2 whitespace-nowrap transition active:scale-95 ${selection.daxianIndex === p.index ? 'is-active bg-green-600 text-white' : 'bg-stone-50 text-gray-700 hover:bg-gray-100'} `}
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
                                <td className="sticky left-0 z-10 min-w-14 border-r bg-stone-100 p-2 font-bold">流年</td>
                                <td className="p-2">
                                    <div className="flex gap-2 overflow-x-auto touch-pan-x">
                                        {(() => {
                                            const p = selectedDaxianPalace;
                                            if (!p) return null;
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
                                                    type="button"
                                                    aria-pressed={selection.year === year}
                                                    aria-label={`选择${year}流年`}
                                                    className={`min-h-12 min-w-16 rounded-lg px-3 py-2 whitespace-nowrap transition active:scale-95 ${selection.year === year ? 'bg-blue-600 text-white shadow' : 'bg-stone-50 text-gray-700 hover:bg-gray-100'} `}
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

                                <td className="sticky left-0 z-20 min-w-14 border-r bg-stone-100 p-2 font-bold">
                                    <button
                                        type="button"
                                        className="flex min-h-10 w-full items-center justify-center gap-1 rounded-lg hover:bg-white hover:text-blue-600"
                                        onClick={() => setShowLunarTip(!showLunarTip)}
                                        aria-expanded={showLunarTip}
                                        aria-label="查看流月农历说明"
                                    >
                                        流月 <HelpCircle size={10} />
                                    </button>
                                    {showLunarTip && (
                                        <div className="absolute left-0 top-full mt-1 z-50 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg text-left font-normal leading-relaxed">
                                            <div className="font-bold text-yellow-400 mb-1">⚠️ 农历提醒</div>
                                            紫微斗数均按农历排盘。
                                            <br />
                                            例如：今日阳历12月6日，对应农历十月，请选择【10月】。
                                            <div className="mt-2 text-right">
                                                <button type="button" className="min-h-10 px-2 text-blue-300 underline" onClick={(e) => { e.stopPropagation(); setShowLunarTip(false); }}>知道了</button>
                                            </div>
                                        </div>
                                    )}
                                </td>
                                <td className="p-2">
                                    <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
                                        {getLunarMonthOptions(selection.lunarYear || selection.year).map(monthOption => (
                                            <button
                                                key={`${monthOption.month}-${monthOption.isLeap ? 'leap' : 'regular'}`}
                                                type="button"
                                                aria-pressed={selection.month === monthOption.month && selection.isLeapMonth === monthOption.isLeap}
                                                aria-label={`选择${monthOption.label}`}
                                                className={`min-h-11 rounded-lg px-2 py-2 whitespace-nowrap text-center transition active:scale-95 ${selection.month === monthOption.month && selection.isLeapMonth === monthOption.isLeap ? 'bg-yellow-500 text-white shadow' : 'bg-stone-50 text-gray-700 hover:bg-gray-100'} `}
                                                onClick={() => handleSelection('month', monthOption)}
                                            >
                                                {monthOption.label}
                                            </button>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        )}

                        {/* Liu Ri Row (Only if Month selected) */}
                        {selection.month && (
                            <tr className="border-b border-gray-200">
                                <td className="sticky left-0 z-10 min-w-14 border-r bg-stone-100 p-2 font-bold">流日</td>
                                <td className="p-2">
                                    <div className="grid grid-cols-7 gap-1.5">
                                        {(() => {
                                            const daysInMonth = getLunarMonthDays(
                                                selection.lunarYear || selection.year,
                                                selection.month,
                                                selection.isLeapMonth,
                                            );
                                            return Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    aria-pressed={selection.day === day}
                                                    aria-label={`选择农历${day}日`}
                                                    className={`min-h-10 rounded-lg px-1 py-2 whitespace-nowrap text-center text-[11px] transition active:scale-95 ${selection.day === day ? 'bg-purple-600 text-white shadow' : 'bg-stone-50 text-gray-700 hover:bg-gray-100'} `}
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
                                <td className="sticky left-0 z-10 min-w-14 border-r bg-stone-100 p-2 font-bold">流时</td>
                                <td className="p-2">
                                    <div className="flex gap-2 overflow-x-auto touch-pan-x">
                                        {FORTUNE_HOUR_OPTIONS.map((hourOption) => (
                                            <button
                                                key={hourOption.index}
                                                type="button"
                                                aria-pressed={selection.hour === hourOption.index}
                                                aria-label={`选择${hourOption.name}，${hourOption.range}`}
                                                className={`min-h-12 min-w-24 rounded-lg px-3 py-2 whitespace-nowrap flex flex-col items-center justify-center transition active:scale-95 ${selection.hour === hourOption.index ? 'bg-cyan-600 text-white shadow' : 'bg-stone-50 text-gray-700 hover:bg-gray-100'} `}
                                                onClick={() => handleSelection('hour', hourOption.index)}
                                            >
                                                <span>{hourOption.name}</span>
                                                <span className="text-[9px] opacity-80">{hourOption.range}</span>
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
            <div className="chart-action-bar fixed inset-x-0 bottom-0 z-50 pointer-events-none md:inset-x-auto md:right-4 md:bottom-6">
                <nav
                    className="pointer-events-auto grid grid-cols-4 gap-2 border-t border-white/10 bg-black/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl md:flex md:flex-col md:items-end md:border-0 md:bg-transparent md:p-0 md:shadow-none"
                    aria-label="命盘操作"
                >

                    {/* 1. Archive List Button */}
                    <button
                        type="button"
                        onClick={onOpenArchive}
                        className="group relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl bg-cyan-700 text-white shadow-lg transition active:scale-95 md:h-12 md:min-h-0 md:w-12 md:rounded-full md:bg-cyan-600 md:hover:scale-110 md:hover:bg-cyan-500"
                        title="查看档案"
                        aria-label="查看档案"
                    >
                        <Archive className="w-5 h-5" />
                        <span className="text-[11px] font-bold md:hidden">档案</span>
                        <span className="absolute right-14 hidden bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none md:block">
                            查看档案
                        </span>
                    </button>

                    {/* 2. Save Button */}
                    <button
                        type="button"
                        onClick={onSave}
                        className="group relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl bg-indigo-700 text-white shadow-lg transition active:scale-95 md:h-12 md:min-h-0 md:w-12 md:rounded-full md:bg-indigo-600 md:hover:scale-110 md:hover:bg-indigo-500"
                        title="保存档案"
                        aria-label="保存档案"
                    >
                        <Save className="w-5 h-5" />
                        <span className="text-[11px] font-bold md:hidden">保存</span>
                        <span className="absolute right-14 hidden bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none md:block">
                            保存档案
                        </span>
                    </button>

                    {/* 2. AI Analysis Button */}
                    <button
                        type="button"
                        onClick={() => {
                            if (showAiMenu) closeAiMenu();
                            else setShowAiMenu(true);
                        }}
                        className="group relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-purple-700 to-pink-700 text-white shadow-lg transition active:scale-95 md:h-12 md:min-h-0 md:w-12 md:rounded-full md:from-purple-600 md:to-pink-600 md:hover:scale-110"
                        title="AI 分析"
                        aria-label="打开 AI 分析菜单"
                        aria-expanded={showAiMenu}
                        aria-controls="ai-analysis-menu"
                    >
                        <Sparkles className="w-5 h-5" />
                        <span className="text-[11px] font-bold md:hidden">AI 分析</span>
                        <span className="absolute right-14 hidden bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none md:block">
                            AI 分析
                        </span>
                    </button>

                    {/* 4. Print / PDF Export Button */}
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="group relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-amber-700 to-orange-700 text-white shadow-lg transition active:scale-95 md:h-12 md:min-h-0 md:w-12 md:rounded-full md:from-amber-600 md:to-orange-600 md:hover:scale-110"
                        title="打印 / 存为 PDF"
                        aria-label="打印命盘或存为 PDF"
                    >
                        <Printer className="w-5 h-5" />
                        <span className="text-[11px] font-bold md:hidden">导出</span>
                        <span className="absolute right-14 hidden bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none md:block">
                            打印 / 存为 PDF
                        </span>
                    </button>
                </nav>
            </div>

            {/* Mobile bottom sheet / desktop popover for AI actions. */}
            {showAiMenu && (
                <div className="chart-modal fixed inset-0 z-[60]">
                    <button
                        type="button"
                        className="absolute inset-0 h-full w-full bg-black/60 md:bg-transparent"
                        onClick={closeAiMenu}
                        aria-label="关闭 AI 分析菜单"
                    />
                    <div
                        id="ai-analysis-menu"
                        role="dialog"
                        aria-modal="true"
                        aria-label="AI 分析菜单"
                        className="absolute inset-x-0 bottom-0 max-h-[78vh] overflow-hidden rounded-t-3xl border border-purple-500/30 bg-[#111]/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 fade-in duration-300 md:inset-x-auto md:right-20 md:bottom-24 md:w-72 md:rounded-xl md:pb-4"
                    >
                        <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3 md:hidden">
                            <div>
                                <div className="text-base font-black text-white">AI 分析</div>
                                <div className="text-[11px] text-gray-400">选择要生成的话术</div>
                            </div>
                            <button
                                type="button"
                                onClick={closeAiMenu}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white"
                                aria-label="关闭 AI 分析菜单"
                            >
                                ×
                            </button>
                        </div>
                        <div className="max-h-[62vh] space-y-2 overflow-y-auto overscroll-contain md:max-h-none">
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
                                <div className="h-px bg-white/10 my-2"></div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        closeAiMenu();
                                        setShowDonationModal(true);
                                    }}
                                    className="w-full text-left px-4 py-3 rounded hover:bg-white/10 flex items-center gap-3 text-sm font-bold text-orange-300 border border-transparent hover:border-orange-500/30 transition-all"
                                >
                                    <Coffee className="h-5 w-5" /> 支持作者
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
                </div>
            )}

            {/* Generated fortune prompt preview */}
            {promptPreview && (
                <div className="chart-modal fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 md:p-6">
                    <div className="w-full max-w-3xl max-h-[88vh] bg-stone-50 text-slate-900 rounded-2xl shadow-2xl border border-purple-300 flex flex-col overflow-hidden">
                        <div className="px-4 py-3 md:px-6 md:py-4 bg-gradient-to-r from-purple-700 to-cyan-700 text-white flex items-center justify-between gap-3">
                            <div>
                                <h3 className="font-bold text-lg">{promptPreview.title}</h3>
                                <p className="text-xs text-white/80">已自动带入当前大限与对应运限盘</p>
                            </div>
                            <button
                                onClick={() => setPromptPreview(null)}
                                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-xl leading-none"
                                aria-label="关闭话术预览"
                            >
                                ×
                            </button>
                        </div>

                        <textarea
                            readOnly
                            value={promptPreview.text}
                            className="flex-1 min-h-[52vh] p-4 md:p-6 bg-stone-50 text-slate-800 text-sm leading-relaxed font-mono resize-none outline-none"
                            aria-label="运势分析话术"
                        />

                        <div className="p-3 md:p-4 border-t border-stone-200 bg-white flex gap-3 justify-end">
                            <button
                                onClick={() => setPromptPreview(null)}
                                className="px-4 py-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100"
                            >
                                关闭
                            </button>
                            <button
                                onClick={() => copyToClipboard(promptPreview.text)}
                                className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold shadow hover:opacity-90"
                            >
                                复制完整话术
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Partner Info Modal */}
            {showPartnerModal && (
                <div className="chart-modal fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" role="dialog" aria-modal="true" aria-labelledby="partner-dialog-title">
                    <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-sm flex-col overflow-hidden rounded-xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="bg-purple-600 px-4 py-3 flex justify-between items-center">
                            <h3 id="partner-dialog-title" className="text-white font-bold text-lg">💑 输入配偶信息</h3>
                            <button type="button" aria-label="关闭配偶信息" onClick={() => setShowPartnerModal(false)} className="text-white/80 hover:text-white">✕</button>
                        </div>
                        <div className="overflow-y-auto p-4 space-y-4">
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

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700">出生日期 (阳历)</label>
                                {/* Date Picker with Enhanced UX for Android */}
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar className="h-5 w-5 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
                                    </div>
                                    <input
                                        type="date"
                                        id="partner-birthday"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 text-base border-2 border-dashed border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-indigo-50/50 text-indigo-900 shadow-sm transition-all hover:bg-white hover:border-indigo-400 cursor-pointer appearance-none"
                                        value={partnerInfo.birthday}
                                        onChange={(e) => setPartnerInfo({ ...partnerInfo, birthday: e.target.value })}
                                    />
                                    {/* Visual Cue for interaction */}
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <span className="text-xs text-indigo-400 font-medium bg-white/80 px-1 rounded">
                                            选取
                                        </span>
                                    </div>
                                </div>
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
                <div className="chart-modal fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={() => setShowDonationModal(false)} role="dialog" aria-modal="true" aria-labelledby="donation-dialog-title">
                    <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 text-white flex justify-between items-center">
                            <h3 id="donation-dialog-title" className="font-bold text-lg flex items-center gap-2">
                                <Coffee className="w-5 h-5" />
                                随喜打赏 (Buy me a coffee)
                            </h3>
                            <button type="button" aria-label="关闭打赏窗口" onClick={() => setShowDonationModal(false)} className="hover:bg-white/20 rounded-full p-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="overflow-y-auto p-6 flex flex-col items-center gap-6">
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
