
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
import {
    MUTAGEN_META,
    buildPalaceFlights,
    getAllMutagenStarMaps,
    getMutagenStarMap,
    groupSelfMutationsByBranch,
} from '../utils/ziweiMutations';
import { Sparkles, Coffee, Save, Archive, Calendar, Printer } from "lucide-react";
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

const LUNAR_MONTH_NAMES = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
const LUNAR_DAY_NAMES = [
    '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
];
const GANZHI_TONES = {
    甲: 'wood', 乙: 'wood', 寅: 'wood', 卯: 'wood',
    丙: 'fire', 丁: 'fire', 巳: 'fire', 午: 'fire',
    戊: 'earth', 己: 'earth', 辰: 'earth', 戌: 'earth', 丑: 'earth', 未: 'earth',
    庚: 'metal', 辛: 'metal', 申: 'metal', 酉: 'metal',
    壬: 'water', 癸: 'water', 子: 'water', 亥: 'water',
};
const getGanzhiTone = (ganzhi = '') => GANZHI_TONES[ganzhi[0]] || 'ink';

const MUTAGEN_MEANINGS = {
    '禄': {
        title: '舒适与获得',
        detail: '常用来观察满足感、资源与较容易投入的方向。',
    },
    '权': {
        title: '掌控与责任',
        detail: '常用来观察主导欲、责任感与需要多付出的方向。',
    },
    '科': {
        title: '表达与名声',
        detail: '常用来观察展示、名誉、信心与较平顺的方向。',
    },
    '忌': {
        title: '在意与牵挂',
        detail: '常用来观察特别在乎、容易纠结或需要反复处理的方向。',
    },
};

const formatPalaceName = (name = '') => name.endsWith('宫') ? name : `${name}宫`;

// Helper: Get Year Stem (0-9 index)
const getYearStemIndex = (year) => (year - 4) % 10;

function ProfessionalChartInner({ horoscope, basicInfo, onSave, onOpenArchive, onQuickChart }) {
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
    const [showChartSettings, setShowChartSettings] = React.useState(false);
    const [showCommonMenu, setShowCommonMenu] = React.useState(false);
    const [professionalToolMode, setProfessionalToolMode] = React.useState('sanhe');
    const [selectedMutationInfo, setSelectedMutationInfo] = React.useState(null);

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

    const palaceFlights = useMemo(
        () => buildPalaceFlights(horoscope),
        [horoscope],
    );

    const selfMutationsByBranch = useMemo(
        () => groupSelfMutationsByBranch(palaceFlights),
        [palaceFlights],
    );

    const focusedPalaceFlights = useMemo(() => {
        if (!focusedPalace) return [];
        return palaceFlights.filter((flight) => flight.sourceIndex === focusedPalace.index);
    }, [focusedPalace, palaceFlights]);

    const selectMutationInfo = (flight, layer) => {
        setSelectedMutationInfo({ ...flight, layer });
    };

    const handleMutationKeyDown = (event, flight, layer) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        event.stopPropagation();
        selectMutationInfo(flight, layer);
    };

    const sortedDaxianPalaces = useMemo(
        () => [...palaces].sort((a, b) => a.decadal.range[0] - b.decadal.range[0]),
        [palaces],
    );
    const birthYear = Number(String(horoscope.solarDate || basicInfo.birthday || '').slice(0, 4)) || new Date().getFullYear();
    const currentYear = new Date().getFullYear();
    const currentHoroscope = useMemo(() => {
        try {
            return horoscope.horoscope(new Date());
        } catch (error) {
            console.error('Unable to read current horoscope:', error);
            return null;
        }
    }, [horoscope]);
    const virtualAge = currentHoroscope?.age?.nominalAge ?? (currentYear - birthYear + 1);
    const currentDaxianPalace = palaces.find((palace) => palace.index === currentHoroscope?.decadal?.index)
        || sortedDaxianPalaces.find((palace) => (
            virtualAge >= palace.decadal.range[0] && virtualAge <= palace.decadal.range[1]
        ))
        || sortedDaxianPalaces[0]
        || null;
    const timelineDaxianPalace = selectedDaxianPalace || currentDaxianPalace;
    const timelineYears = useMemo(() => (
        timelineDaxianPalace
            ? Array.from(
                { length: timelineDaxianPalace.decadal.range[1] - timelineDaxianPalace.decadal.range[0] + 1 },
                (_, offset) => birthYear + timelineDaxianPalace.decadal.range[0] + offset - 1,
            )
            : []
    ), [birthYear, timelineDaxianPalace]);
    const timelineYearModels = useMemo(() => timelineYears.map((year) => {
        try {
            const fortune = horoscope.horoscope(`${year}-06-15`);
            return {
                year,
                nominalAge: fortune?.age?.nominalAge ?? (year - birthYear + 1),
                ganZhi: `${fortune?.yearly?.heavenlyStem || ''}${fortune?.yearly?.earthlyBranch || ''}`,
            };
        } catch {
            return {
                year,
                nominalAge: year - birthYear + 1,
                ganZhi: `${HEAVENLY_STEMS[getYearStemIndex(year)]}${EARTHLY_BRANCHES[(year - 4 + 12) % 12]}`,
            };
        }
    }), [birthYear, horoscope, timelineYears]);
    const timelineMonthOptions = getLunarMonthOptions(selection.lunarYear || selection.year || currentYear);
    const timelineDayCount = selection.month
        ? getLunarMonthDays(
            selection.lunarYear || selection.year || currentYear,
            selection.month,
            selection.isLeapMonth,
        )
        : 30;
    const pillarParts = typeof horoscope.chineseDate === 'string'
        ? horoscope.chineseDate.trim().split(/\s+/).slice(0, 4)
        : [];
    const currentTimeLabel = new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date()).replaceAll('/', '-');

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

            const map = getMutagenStarMap(stem);
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

    const handleTimelineYear = (year) => {
        if (selection.daxianIndex !== null || !timelineDaxianPalace) {
            handleSelection('year', year);
            return;
        }

        setCurrentFortuneContext(null);
        setFocusedIndex(timelineDaxianPalace.index);
        setActiveLayers((prev) => ({ ...prev, decadal: true, yearly: true }));
        setSelection((prev) => ({
            ...prev,
            daxianIndex: timelineDaxianPalace.index,
            year,
            lunarYear: year,
            month: null,
            day: null,
            hour: null,
            isLeapMonth: false,
            targetSolarDate: null,
        }));
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
        const starColumns = [
            ...palace.majorStars.map((star) => ({ star, kind: 'major' })),
            ...softStars.map((star) => ({ star, kind: 'soft' })),
            ...toughStars.map((star) => ({ star, kind: 'tough' })),
            ...adjectiveStars.map((star) => ({ star, kind: 'adjective' })),
        ];

        return (
            <div
                className={`wenmo-palace w-full h-full relative p-0.5 md:p-1 flex flex-col justify-between transition-all duration-200 cursor-pointer overflow-hidden
                ${isFocused ? 'bg-amber-50 ring-2 ring-amber-400 z-10 shadow-lg' : 'bg-stone-50 hover:bg-stone-100'}
                ${isMing ? 'bg-red-50/30' : ''}
            `}
                data-relation={showConnections && professionalToolMode === 'sanhe' ? relationship || undefined : undefined}
                onClick={() => {
                    setFocusedIndex(palace.index);
                    setSelectedMutationInfo(null);
                }}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setFocusedIndex(palace.index);
                        setSelectedMutationInfo(null);
                    }
                }}
                role="button"
                tabIndex={0}
                aria-pressed={isFocused}
                aria-label={`${palace.name}，${palace.heavenlyStem}${palace.earthlyBranch}宫`}
            >
                <div className="wenmo-star-columns">
                    {starColumns.slice(0, 10).map(({ star, kind }, idx) => {
                        const activeSiHua = getActiveSiHua(star.name);
                        return (
                            <span key={`${kind}-${star.name}-${idx}`} className="wenmo-star-column" data-kind={kind}>
                                <b>{star.name}</b>
                                {star.brightness && <small>{star.brightness}</small>}
                                {activeSiHua.slice(0, 1).map((badge, badgeIndex) => (
                                    <em key={badgeIndex} className={`wenmo-star-transform ${badge.color}`}>{badge.type}</em>
                                ))}
                            </span>
                        );
                    })}
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

    const getBranchCenter = (branch) => {
        const pos = GRID_MAP[branch];
        if (!pos) return null;
        return {
            x: (pos.col - 0.5) * 100,
            y: (pos.row - 0.5) * 100,
            pos,
        };
    };

    const getCenterFacingPoint = (branch) => {
        const point = getBranchCenter(branch);
        if (!point) return null;

        return {
            x: point.pos.col === 1 ? 100 : point.pos.col === 4 ? 300 : point.x,
            y: point.pos.row === 1 ? 100 : point.pos.row === 4 ? 300 : point.y,
        };
    };

    const getOutwardVector = (branch) => {
        const point = getBranchCenter(branch);
        if (!point) return null;

        const rawX = point.pos.col === 1 ? -1 : point.pos.col === 4 ? 1 : 0;
        const rawY = point.pos.row === 1 ? -1 : point.pos.row === 4 ? 1 : 0;
        const length = Math.hypot(rawX, rawY) || 1;
        return { x: rawX / length, y: rawY / length };
    };

    const getMutationArrowGeometry = (entry, slotIndex, slotCount) => {
        const center = getBranchCenter(entry.sourceBranch);
        const outward = getOutwardVector(entry.sourceBranch);
        if (!center || !outward) return null;

        const tangent = { x: -outward.y, y: outward.x };
        const offset = (slotIndex - (slotCount - 1) / 2) * 6.5;
        const direction = entry.kind === 'outward'
            ? outward
            : { x: -outward.x, y: -outward.y };

        let boundaryDistance;
        if (entry.kind === 'outward') {
            const candidates = [];
            if (direction.x < 0) candidates.push((0 - center.x) / direction.x);
            if (direction.x > 0) candidates.push((400 - center.x) / direction.x);
            if (direction.y < 0) candidates.push((0 - center.y) / direction.y);
            if (direction.y > 0) candidates.push((400 - center.y) / direction.y);
            boundaryDistance = Math.min(...candidates.filter((distance) => distance >= 0));
        } else {
            const candidates = [];
            if (center.x < 100 && direction.x > 0) candidates.push((100 - center.x) / direction.x);
            if (center.x > 300 && direction.x < 0) candidates.push((300 - center.x) / direction.x);
            if (center.y < 100 && direction.y > 0) candidates.push((100 - center.y) / direction.y);
            if (center.y > 300 && direction.y < 0) candidates.push((300 - center.y) / direction.y);
            boundaryDistance = Math.max(...candidates.filter((distance) => distance >= 0));
        }

        if (!Number.isFinite(boundaryDistance)) return null;

        const startDistance = Math.max(8, boundaryDistance - (entry.kind === 'outward' ? 21 : 22));
        const endDistance = boundaryDistance + (entry.kind === 'outward' ? 4 : 6);

        return {
            start: {
                x: center.x + direction.x * startDistance + tangent.x * offset,
                y: center.y + direction.y * startDistance + tangent.y * offset,
            },
            end: {
                x: center.x + direction.x * endDistance + tangent.x * offset,
                y: center.y + direction.y * endDistance + tangent.y * offset,
            },
        };
    };

    // 三方四正只使用灰色虚线；四化颜色不再冒充宫位关系。
    const renderSanheConnections = () => {
        if (!showConnections || professionalToolMode !== 'sanhe' || !palaceRelationship) return null;

        const selfPoint = getCenterFacingPoint(palaceRelationship.self);
        const sanHePoints = palaceRelationship.sanHe.map(getCenterFacingPoint).filter(Boolean);
        const oppositePoint = getCenterFacingPoint(palaceRelationship.opposite);
        if (!selfPoint || sanHePoints.length !== 2 || !oppositePoint) return null;

        return (
            <svg
                className="wenmo-sanhe-lines absolute inset-0 h-full w-full pointer-events-none"
                data-testid="ziwei-sanhe-layer"
                viewBox="0 0 400 400"
                preserveAspectRatio="none"
                aria-hidden="true"
            >
                <defs>
                    <marker id="sanhe-opposite-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="strokeWidth">
                        <path d="M0,0 L7,3.5 L0,7 Z" fill="#858585" />
                    </marker>
                </defs>
                <polygon
                    points={[selfPoint, ...sanHePoints].map((point) => `${point.x},${point.y}`).join(' ')}
                    fill="rgba(80, 80, 80, 0.018)"
                    stroke="rgba(105, 105, 105, 0.52)"
                    strokeWidth="1.15"
                    strokeDasharray="4 4"
                    vectorEffect="non-scaling-stroke"
                />
                <line
                    x1={selfPoint.x}
                    y1={selfPoint.y}
                    x2={oppositePoint.x}
                    y2={oppositePoint.y}
                    stroke="rgba(105, 105, 105, 0.52)"
                    strokeWidth="1.15"
                    strokeDasharray="4 4"
                    markerEnd="url(#sanhe-opposite-arrow)"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
        );
    };

    // 宫干四化：落本宫为离心自化（向盘外），落对宫为向心自化（向中宫）。
    const renderSelfMutationArrows = () => {
        const isInteractive = professionalToolMode !== 'fly';
        const arrowModels = Object.entries(selfMutationsByBranch).flatMap(([branch, entries]) => (
            ['outward', 'inward'].flatMap((kind) => {
                const sameDirection = entries.filter((entry) => entry.kind === kind);
                return sameDirection.map((entry, slotIndex) => ({
                    ...entry,
                    sourceBranch: branch,
                    geometry: getMutationArrowGeometry(entry, slotIndex, sameDirection.length),
                }));
            })
        )).filter((entry) => entry.geometry);

        if (arrowModels.length === 0) return null;

        return (
            <svg
                className="wenmo-self-mutations absolute inset-0 h-full w-full"
                data-testid="ziwei-self-mutation-layer"
                viewBox="0 0 400 400"
                preserveAspectRatio="none"
                role="group"
                aria-label="宫干自化箭头，点击查看含义"
            >
                <defs>
                    {MUTAGEN_META.map((meta) => (
                        <marker
                            key={meta.key}
                            id={`self-mutation-arrow-${meta.key}`}
                            markerWidth="5.4"
                            markerHeight="5.4"
                            refX="4.65"
                            refY="2.7"
                            orient="auto"
                            markerUnits="strokeWidth"
                        >
                            <path d="M0,0 L5.4,2.7 L0,5.4 Z" fill={meta.color} />
                        </marker>
                    ))}
                </defs>
                {arrowModels.map((entry) => (
                    <g
                        key={`${entry.sourceIndex}-${entry.mutagen}-${entry.kind}`}
                        className={`wenmo-mutation-hit${isInteractive ? '' : ' is-passive'}`}
                        data-mutagen={entry.mutagen}
                        data-mutation-direction={entry.kind}
                        role={isInteractive ? 'button' : undefined}
                        tabIndex={isInteractive ? 0 : undefined}
                        aria-label={isInteractive ? `${formatPalaceName(entry.sourceName)}${entry.sourceStem}干使${entry.starName}化${entry.mutagen}，${entry.kind === 'outward' ? '离心自化' : '向心自化'}，点击查看说明` : undefined}
                        onClick={isInteractive ? (event) => {
                            event.stopPropagation();
                            selectMutationInfo(entry, 'self');
                        } : undefined}
                        onKeyDown={isInteractive ? (event) => handleMutationKeyDown(event, entry, 'self') : undefined}
                    >
                        <title>{`${formatPalaceName(entry.sourceName)}干化${entry.mutagen}·${entry.kind === 'outward' ? '离心自化' : '向心自化'}`}</title>
                        {isInteractive && (
                            <>
                                <circle
                                    className="wenmo-arrow-hit-pad"
                                    cx={(entry.geometry.start.x + entry.geometry.end.x) / 2}
                                    cy={(entry.geometry.start.y + entry.geometry.end.y) / 2}
                                    r="4.5"
                                />
                                <line
                                    className="wenmo-arrow-hit-target"
                                    x1={entry.geometry.start.x}
                                    y1={entry.geometry.start.y}
                                    x2={entry.geometry.end.x}
                                    y2={entry.geometry.end.y}
                                    vectorEffect="non-scaling-stroke"
                                />
                            </>
                        )}
                        <line
                            className="wenmo-self-arrow-line"
                            x1={entry.geometry.start.x}
                            y1={entry.geometry.start.y}
                            x2={entry.geometry.end.x}
                            y2={entry.geometry.end.y}
                            stroke={entry.color}
                            strokeWidth="1.75"
                            markerEnd={`url(#self-mutation-arrow-${entry.key})`}
                            vectorEffect="non-scaling-stroke"
                        />
                    </g>
                ))}
            </svg>
        );
    };

    // 飞星模式只画当前所选宫位的四条宫干四化，避免 48 条线同时堆叠。
    const renderFlyConnections = () => {
        if (!showConnections || professionalToolMode !== 'fly' || focusedPalaceFlights.length === 0) return null;

        const duplicateCounts = focusedPalaceFlights.reduce((counts, flight) => {
            counts[flight.targetIndex] = (counts[flight.targetIndex] || 0) + 1;
            return counts;
        }, {});
        const duplicateSlots = {};

        const paths = focusedPalaceFlights.map((flight, flightIndex) => {
            const source = getBranchCenter(flight.sourceBranch);
            const target = getBranchCenter(flight.targetBranch);
            if (!source || !target) return null;

            const slotIndex = duplicateSlots[flight.targetIndex] || 0;
            duplicateSlots[flight.targetIndex] = slotIndex + 1;
            const slotCount = duplicateCounts[flight.targetIndex] || 1;
            const slotOffset = (slotIndex - (slotCount - 1) / 2) * 12;

            if (flight.sourceIndex === flight.targetIndex) {
                const outward = getOutwardVector(flight.sourceBranch) || { x: 0, y: -1 };
                const tangent = { x: -outward.y, y: outward.x };
                const anchor = {
                    x: source.x + outward.x * 23 + tangent.x * slotOffset,
                    y: source.y + outward.y * 23 + tangent.y * slotOffset,
                };
                const start = { x: anchor.x - tangent.x * 11, y: anchor.y - tangent.y * 11 };
                const end = { x: anchor.x + tangent.x * 11, y: anchor.y + tangent.y * 11 };
                const controlA = { x: start.x + outward.x * 29 - tangent.x * 8, y: start.y + outward.y * 29 - tangent.y * 8 };
                const controlB = { x: end.x + outward.x * 29 + tangent.x * 8, y: end.y + outward.y * 29 + tangent.y * 8 };
                return {
                    ...flight,
                    flightIndex,
                    path: `M ${start.x} ${start.y} C ${controlA.x} ${controlA.y}, ${controlB.x} ${controlB.y}, ${end.x} ${end.y}`,
                    hitCenter: {
                        x: (start.x + 3 * controlA.x + 3 * controlB.x + end.x) / 8,
                        y: (start.y + 3 * controlA.y + 3 * controlB.y + end.y) / 8,
                    },
                };
            }

            const delta = { x: target.x - source.x, y: target.y - source.y };
            const length = Math.hypot(delta.x, delta.y) || 1;
            const unit = { x: delta.x / length, y: delta.y / length };
            const tangent = { x: -unit.y, y: unit.x };
            const start = {
                x: source.x + unit.x * 19 + tangent.x * slotOffset,
                y: source.y + unit.y * 19 + tangent.y * slotOffset,
            };
            const end = {
                x: target.x - unit.x * 20 + tangent.x * slotOffset,
                y: target.y - unit.y * 20 + tangent.y * slotOffset,
            };
            const bend = (flightIndex - 1.5) * 5;
            const control = {
                x: (start.x + end.x) / 2 + tangent.x * bend,
                y: (start.y + end.y) / 2 + tangent.y * bend,
            };

            return {
                ...flight,
                flightIndex,
                path: `M ${start.x} ${start.y} Q ${control.x} ${control.y}, ${end.x} ${end.y}`,
                hitCenter: {
                    x: (start.x + 2 * control.x + end.x) / 4,
                    y: (start.y + 2 * control.y + end.y) / 4,
                },
            };
        }).filter(Boolean);

        return (
            <svg
                className="wenmo-fly-lines absolute inset-0 h-full w-full"
                data-testid="ziwei-fly-layer"
                viewBox="0 0 400 400"
                preserveAspectRatio="none"
                role="group"
                aria-label="宫干飞星箭头，点击查看含义"
            >
                <defs>
                    {MUTAGEN_META.map((meta) => (
                        <marker
                            key={meta.key}
                            id={`fly-arrow-${meta.key}`}
                            markerWidth="6"
                            markerHeight="6"
                            refX="5.2"
                            refY="3"
                            orient="auto"
                            markerUnits="strokeWidth"
                        >
                            <path d="M0,0 L6,3 L0,6 Z" fill={meta.color} />
                        </marker>
                    ))}
                </defs>
                {paths.map((flight) => (
                    <g
                        key={`${flight.sourceIndex}-${flight.mutagen}-${flight.targetIndex}`}
                        className="wenmo-mutation-hit"
                        data-mutagen={flight.mutagen}
                        onClick={(event) => {
                            event.stopPropagation();
                            selectMutationInfo(flight, 'fly');
                        }}
                    >
                        <title>{`${formatPalaceName(flight.sourceName)}化${flight.mutagen}→${formatPalaceName(flight.targetName)}`}</title>
                        <path
                            className="wenmo-arrow-hit-target"
                            d={flight.path}
                            pathLength="100"
                            fill="none"
                            vectorEffect="non-scaling-stroke"
                        />
                        <path
                            className="wenmo-fly-path"
                            d={flight.path}
                            pathLength="100"
                            stroke={flight.color}
                            strokeWidth="1.65"
                            fill="none"
                            markerEnd={`url(#fly-arrow-${flight.key})`}
                            vectorEffect="non-scaling-stroke"
                            style={{ '--flight-index': flight.flightIndex }}
                        />
                    </g>
                ))}
                {paths.map((flight) => (
                    <circle
                        key={`fly-hit-${flight.sourceIndex}-${flight.mutagen}-${flight.targetIndex}`}
                        className="wenmo-arrow-hit-pad wenmo-fly-anchor"
                        cx={flight.hitCenter.x}
                        cy={flight.hitCenter.y}
                        r="4.5"
                        role="button"
                        tabIndex="0"
                        aria-label={`${formatPalaceName(flight.sourceName)}${flight.sourceStem}干使${flight.starName}化${flight.mutagen}飞入${formatPalaceName(flight.targetName)}，点击查看说明`}
                        style={{ color: flight.color }}
                        onClick={(event) => {
                            event.stopPropagation();
                            selectMutationInfo(flight, 'fly');
                        }}
                        onKeyDown={(event) => handleMutationKeyDown(event, flight, 'fly')}
                    />
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
                    getAllMutagenStarMaps(),
                    fortuneContext,
                );

                if (!prompt) throw new Error(`无法生成${FORTUNE_LAYER_LABELS[type] || '运势'}话术`);

                setSelectedMutationInfo(null);
                setPromptPreview({
                    title: `${FORTUNE_LAYER_LABELS[type]}运势话术`,
                    text: prompt,
                });
                setShowAiMenu(false);
                return;
            } else if (type.startsWith('baby_')) {
                const babyType = type.replace('baby_', '');
                setSelectedBabyType(babyType);
                setSelectedMutationInfo(null);
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

    const renderMutationExplanation = () => {
        if (!selectedMutationInfo) return null;

        const info = selectedMutationInfo;
        const meaning = MUTAGEN_MEANINGS[info.mutagen] || {
            title: '四化关系',
            detail: '请结合整张命盘综合观察。',
        };
        const typeLabel = info.kind === 'outward'
            ? '离心自化'
            : info.kind === 'inward'
                ? '向心自化'
                : '宫干飞化';

        let ruleText;
        if (info.layer === 'self' && info.kind === 'outward') {
            ruleText = `${formatPalaceName(info.sourceName)}的${info.sourceStem}干使本宫${info.starName}化${info.mutagen}。四化星仍落在本宫，所以用朝盘外的箭头标记“离心自化”。`;
        } else if (info.layer === 'self' && info.kind === 'inward') {
            ruleText = `${formatPalaceName(info.sourceName)}的${info.sourceStem}干使对宫${formatPalaceName(info.targetName)}的${info.starName}化${info.mutagen}。四化星落在对宫，所以用朝中宫的箭头标记“向心自化”。`;
        } else {
            const relationNote = info.kind === 'outward'
                ? '这条飞化落回本宫，同时构成离心自化。'
                : info.kind === 'inward'
                    ? '这条飞化落入对宫，同时构成向心自化。'
                    : '彩色箭头从起宫指向真实落宫。';
            ruleText = `${formatPalaceName(info.sourceName)}的${info.sourceStem}干使${info.starName}化${info.mutagen}，飞入${formatPalaceName(info.targetName)}。${relationNote}`;
        }

        return (
            <aside
                className="wenmo-arrow-explainer print:hidden"
                data-testid="ziwei-mutation-explainer"
                data-mutagen={info.mutagen}
                role="dialog"
                aria-modal="false"
                aria-live="polite"
                aria-labelledby="mutation-explainer-title"
                style={{ '--mutation-color': info.color }}
            >
                <header>
                    <span className="wenmo-arrow-explainer__badge">化{info.mutagen}</span>
                    <div>
                        <small>{info.layer === 'fly' ? '飞星箭头' : '宫干自化箭头'} · {typeLabel}</small>
                        <h2 id="mutation-explainer-title">{formatPalaceName(info.sourceName)} · {info.sourceStem}干 · {info.starName}化{info.mutagen}</h2>
                    </div>
                    <button type="button" onClick={() => setSelectedMutationInfo(null)} aria-label="关闭箭头说明">×</button>
                </header>

                <p>{ruleText}</p>

                <dl>
                    <div><dt>起宫</dt><dd>{info.sourceStem}{info.sourceBranch} · {formatPalaceName(info.sourceName)}</dd></div>
                    <div><dt>目标星</dt><dd>{info.starName}化{info.mutagen}</dd></div>
                    <div><dt>落宫</dt><dd>{info.targetBranch} · {formatPalaceName(info.targetName)}</dd></div>
                </dl>

                <footer>
                    <span aria-hidden="true" />
                    <strong>{meaning.title}</strong>
                    <p>{meaning.detail}</p>
                    <small>单条飞化只表示结构关系，不宜单独下吉凶结论。</small>
                </footer>
            </aside>
        );
    };

    return (
        <div className="professional-chart wenmo-chart">
            <header className="wenmo-professional-bar print:hidden">
                <button type="button" onClick={onOpenArchive} aria-label="打开命例档案">
                    <span aria-hidden="true">‹</span> 命例
                </button>
                <h1 data-testid="ziwei-chart-title">古书派紫微专业版</h1>
                <button
                    type="button"
                    onClick={() => {
                        setSelectedMutationInfo(null);
                        setShowChartSettings((visible) => !visible);
                    }}
                    aria-expanded={showChartSettings}
                    aria-controls="chart-settings-panel"
                >
                    设置 <span aria-hidden="true">›</span>
                </button>
            </header>

            {showChartSettings && (
                <section id="chart-settings-panel" className="wenmo-settings-panel print:hidden" aria-label="命盘设置">
                    <div>
                        <span>显示模式</span>
                        <button type="button" aria-pressed={mobileChartMode === 'professional'} onClick={() => setMobileChartMode('professional')}>专业盘</button>
                        <button type="button" aria-pressed={mobileChartMode === 'simple'} onClick={() => setMobileChartMode('simple')}>简洁盘</button>
                    </div>
                    <div>
                        <span>连线图层</span>
                        <button type="button" aria-pressed={showConnections} onClick={() => setShowConnections((visible) => !visible)}>三合 / 飞星</button>
                    </div>
                </section>
            )}

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

            {/* Chart Grid - Min width to ensure readability on mobile */}
            <div className={`chart-professional-grid ${mobileChartMode === 'professional' ? 'block' : 'hidden'} md:block`}>
                <div className="wenmo-board-shell">
                    <div className="wenmo-direction wenmo-direction--top" data-direction="south">
                        <span>正南方</span><span>南偏西</span>
                    </div>
                    <div className="wenmo-direction wenmo-direction--right" data-direction="west">
                        <span>西偏南</span><span>正西方</span><span>西偏北</span><span>北偏西</span>
                    </div>
                    <div className="wenmo-direction wenmo-direction--bottom" data-direction="north">
                        <span>北偏东</span><span>正北方</span>
                    </div>
                    <div className="wenmo-direction wenmo-direction--left" data-direction="east">
                        <span>南偏东</span><span>东偏南</span><span>正东方</span><span>东偏北</span>
                    </div>
                    <div className="wenmo-board relative grid grid-cols-4 grid-rows-4">
                {renderSanheConnections()}
                {renderFlyConnections()}
                {renderSelfMutationArrows()}
                {/* Row 1 */}
                <div className="wenmo-grid-cell">{renderPalace('巳')}</div>
                <div className="wenmo-grid-cell">{renderPalace('午')}</div>
                <div className="wenmo-grid-cell">{renderPalace('未')}</div>
                <div className="wenmo-grid-cell">{renderPalace('申')}</div>

                {/* Row 2 */}
                <div className="wenmo-grid-cell">{renderPalace('辰')}</div>
                <div className="wenmo-center col-span-2 row-span-2 flex flex-col relative overflow-hidden">
                    <div className="wenmo-center-info z-10 flex flex-col">
                        <div className="wenmo-center-heading">
                            <strong>古书派紫微</strong><sup>PRO</sup>
                            <span>{basicInfo.gender === 'male' ? '阳男' : '阴女'} · {horoscope.fiveElementsClass}</span>
                        </div>

                        <div className="wenmo-profile-lines">
                            <p><span>姓名：</span><strong>{basicInfo.name || '匿名'}</strong><span className="wenmo-profile-side">虚岁 {virtualAge} 岁</span></p>
                            <p><span>出生时间：</span><strong>{basicInfo.birthday} {basicInfo.birthTime}</strong></p>
                            <p><span>当前时间：</span><strong>{currentTimeLabel}</strong></p>
                            <p><span>农历：</span><strong>{horoscope.lunarDate || '-'}</strong></p>
                            <p><span>命主：</span><strong>{horoscope.soul || '-'}</strong><span>身主：</span><strong>{horoscope.body || '-'}</strong><span>生肖：</span><strong>{horoscope.zodiac || '-'}</strong></p>
                        </div>

                        <div className="wenmo-pillar-panels">
                            <div>
                                <b>本命四柱</b>
                                <div className="wenmo-pillar-row">
                                    {pillarParts.map((pillar, index) => (
                                        <span key={`${pillar}-${index}`} data-tone={getGanzhiTone(pillar)}>{pillar}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <b>四化天干</b>
                                <div className="wenmo-pillar-row">
                                    {['origin', 'decadal', 'yearly', 'monthly'].map((layer) => (
                                        <span key={layer} data-tone={getGanzhiTone(activeStems[layer])}>{activeStems[layer] || '—'}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <p className="wenmo-start-limit">
                            出生后约 {sortedDaxianPalaces[0]?.decadal.range[0] || 1} 岁起运
                            {selectedDaxianPalace && ` · 当前查看 ${selectedDaxianPalace.decadal.range[0]}-${selectedDaxianPalace.decadal.range[1]}岁`}
                        </p>

                        <div className="wenmo-center-stepper" role="group" aria-label="运盘快捷调整">
                            <button type="button" disabled={!selection.day} onClick={() => handleSelection('day', Math.max(1, selection.day - 1))}>日↑</button>
                            <button type="button" disabled={!selection.day || selection.day >= timelineDayCount} onClick={() => handleSelection('day', selection.day + 1)}>日↓</button>
                            <button type="button" aria-pressed={activeLayers.origin} onClick={() => setActiveLayers((prev) => ({ ...prev, origin: !prev.origin }))}>天盘▽</button>
                            <button type="button" disabled={selection.hour === null} onClick={() => handleSelection('hour', Math.max(0, selection.hour - 1))}>时↑</button>
                            <button type="button" disabled={selection.hour === null || selection.hour >= FORTUNE_HOUR_OPTIONS.length - 1} onClick={() => handleSelection('hour', selection.hour + 1)}>时↓</button>
                        </div>

                        <div className="wenmo-transform-legend">
                            宫干自化：<span>禄</span><span>权</span><span>科</span><span>忌</span><small>外离·内向</small>
                        </div>

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
            </div>

            <div className="wenmo-luck-table chart-timeline" aria-label="运限时间选择">
                <section className="wenmo-luck-row" aria-label="大限">
                    <h3>大限</h3>
                    <div className="wenmo-luck-viewport">
                        <div className="wenmo-luck-track">
                            <button type="button" className="wenmo-luck-cell is-childhood" disabled><b>起限前</b><small>童限</small></button>
                            {sortedDaxianPalaces.map((palace) => (
                                <button
                                    key={palace.index}
                                    type="button"
                                    className={`wenmo-luck-cell ${selection.daxianIndex === palace.index ? 'is-active' : ''} ${currentDaxianPalace?.index === palace.index ? 'is-current' : ''}`}
                                    aria-pressed={selection.daxianIndex === palace.index}
                                    aria-label={`选择${palace.decadal.range[0]}至${palace.decadal.range[1]}岁大限，${palace.decadal.heavenlyStem}${palace.decadal.earthlyBranch}`}
                                    onClick={() => handleSelection('daxian', palace.index)}
                                >
                                    <b>{palace.decadal.range[0]}-{palace.decadal.range[1]}</b>
                                    <small>{palace.decadal.heavenlyStem}{palace.decadal.earthlyBranch}限</small>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="wenmo-luck-row" aria-label="流年">
                    <h3>流年<small>小限</small></h3>
                    <div className="wenmo-luck-viewport">
                        <div className="wenmo-luck-track">
                            {timelineYearModels.map(({ year, nominalAge, ganZhi }) => (
                                <button
                                    key={year}
                                    type="button"
                                    className={`wenmo-luck-cell ${selection.year === year ? 'is-active' : ''} ${year === currentYear ? 'is-current' : ''}`}
                                    aria-pressed={selection.year === year}
                                    aria-label={`选择${year}流年`}
                                    onClick={() => handleTimelineYear(year)}
                                >
                                    <b>{year}年</b>
                                    <small>{ganZhi}{nominalAge}岁</small>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="wenmo-luck-row" aria-label="流月">
                    <h3>流月</h3>
                    <div className="wenmo-luck-viewport">
                        <div className="wenmo-luck-track">
                            {timelineMonthOptions.map((monthOption, index) => (
                                <button
                                    key={`${monthOption.month}-${monthOption.isLeap ? 'leap' : 'regular'}`}
                                    type="button"
                                    className={`wenmo-luck-cell ${selection.month === monthOption.month && selection.isLeapMonth === monthOption.isLeap ? 'is-active' : ''}`}
                                    aria-pressed={selection.month === monthOption.month && selection.isLeapMonth === monthOption.isLeap}
                                    aria-label={`选择${monthOption.label}`}
                                    disabled={!selection.year}
                                    onClick={() => handleSelection('month', monthOption)}
                                >
                                    <b>{monthOption.isLeap ? `闰${LUNAR_MONTH_NAMES[index % 12]}` : LUNAR_MONTH_NAMES[(monthOption.month - 1) % 12]}</b>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="wenmo-luck-row wenmo-luck-row--days" aria-label="流日">
                    <h3>流日</h3>
                    <div className="wenmo-day-grid">
                        {Array.from({ length: 30 }, (_, index) => index + 1).map((day) => (
                            <button
                                key={day}
                                type="button"
                                className={`wenmo-day-cell ${selection.day === day ? 'is-active' : ''}`}
                                aria-pressed={selection.day === day}
                                aria-label={`选择农历${day}日`}
                                disabled={!selection.month || day > timelineDayCount}
                                onClick={() => handleSelection('day', day)}
                            >
                                {LUNAR_DAY_NAMES[day - 1]}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="wenmo-luck-row" aria-label="流时">
                    <h3>流时</h3>
                    <div className="wenmo-luck-viewport">
                        <div className="wenmo-luck-track">
                            {FORTUNE_HOUR_OPTIONS.map((hourOption) => (
                                <button
                                    key={hourOption.index}
                                    type="button"
                                    className={`wenmo-luck-cell ${selection.hour === hourOption.index ? 'is-active' : ''}`}
                                    aria-pressed={selection.hour === hourOption.index}
                                    aria-label={`选择${hourOption.name}，${hourOption.range}`}
                                    disabled={!selection.day}
                                    onClick={() => handleSelection('hour', hourOption.index)}
                                >
                                    <b>{hourOption.name}</b>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            <div className="wenmo-mode-bar print:hidden">
                <button
                    type="button"
                    className="wenmo-mode-side"
                    onClick={() => {
                        setSelectedMutationInfo(null);
                        setShowCommonMenu((visible) => !visible);
                    }}
                    aria-expanded={showCommonMenu}
                >常用功能</button>
                <div className="wenmo-mode-segments" role="group" aria-label="命盘叠层模式">
                    {[
                        { key: 'fly', label: '飞星' },
                        { key: 'sanhe', label: '三合' },
                        { key: 'sihua', label: '四化' },
                    ].map((mode) => (
                        <button
                            key={mode.key}
                            type="button"
                            aria-pressed={professionalToolMode === mode.key}
                            onClick={() => {
                                setSelectedMutationInfo(null);
                                setProfessionalToolMode(mode.key);
                                if (mode.key === 'sanhe' || mode.key === 'fly') setShowConnections(true);
                                if (mode.key === 'sihua') setActiveLayers((prev) => Object.fromEntries(Object.keys(prev).map((key) => [key, true])));
                            }}
                        >
                            {mode.label}
                        </button>
                    ))}
                </div>
                <button type="button" className="wenmo-mode-side" onClick={onQuickChart}>快捷排盘</button>
            </div>

            {renderMutationExplanation()}

            {showCommonMenu && (
                <nav className="wenmo-common-menu print:hidden" aria-label="常用功能菜单">
                    <button type="button" onClick={onOpenArchive}>命例档案</button>
                    <button type="button" onClick={onSave}>保存命盘</button>
                    <button type="button" onClick={() => { setSelectedMutationInfo(null); setShowAiMenu(true); setShowCommonMenu(false); }}>AI 分析</button>
                    <button type="button" onClick={() => window.print()}>打印导出</button>
                </nav>
            )}

            <nav className="wenmo-bottom-tabs print:hidden" aria-label="专业盘导航">
                <button type="button" className="is-active" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span>◉</span>命盘</button>
                <button type="button" onClick={() => { setSelectedMutationInfo(null); setShowAiMenu(true); }}><span>?</span>帮助</button>
                <button type="button" onClick={() => { setSelectedMutationInfo(null); setShowDonationModal(true); }}><span>ⓘ</span>关于</button>
            </nav>

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
                            else {
                                setSelectedMutationInfo(null);
                                setShowAiMenu(true);
                            }
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
                                        setSelectedMutationInfo(null);
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
