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
import { Sparkles, HelpCircle } from "lucide-react";

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

function ProfessionalChartInner({ horoscope, basicInfo }) {
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

    // AI Menu State
    const [showAiMenu, setShowAiMenu] = React.useState(false);
    const [menuView, setMenuView] = React.useState('main'); // 'main', 'fortune', 'baby'
    // Lunar Tip State
    const [showLunarTip, setShowLunarTip] = React.useState(false);

    // Partner Modal State
    const [showPartnerModal, setShowPartnerModal] = React.useState(false);
    const [selectedBabyType, setSelectedBabyType] = React.useState(null);
    const [partnerInfo, setPartnerInfo] = React.useState({
        gender: 'female',
        birthday: '',
        birthTime: '子'
    });

    // Calculate Stems for each layer based on selection
    // Calculate Stems for each layer based on selection using iztro for accuracy
    const activeStems = useMemo(() => {
        if (!horoscope) return {};
        const stems = {};

        // 1. Origin (Ben)
        if (horoscope.chineseDate) {
            if (typeof horoscope.chineseDate === 'string') {
                // Format: "Year Month Day Hour" (e.g., "辛丑 癸巳 癸亥 壬子")
                stems.origin = horoscope.chineseDate.split(' ')[0][0];
            } else if (horoscope.chineseDate.yearly) {
                stems.origin = horoscope.chineseDate.yearly[0];
            }
        }

        // 2. Decadal (Xian)
        if (selection.daxianIndex !== null && palaces[selection.daxianIndex]) {
            stems.decadal = palaces[selection.daxianIndex].heavenlyStem;
        }

        // 3. Yearly (Nian)
        let yearStemIndex = null;
        if (selection.year) {
            yearStemIndex = getYearStemIndex(selection.year);
            stems.yearly = HEAVENLY_STEMS[yearStemIndex];
        }

        // 4. Monthly (Yue) - Five Tigers Chasing Month
        // Based on Year Stem and Month Index (1-12)
        // Formula: Start Stem = (YearStemIndex % 5) * 2 + 2
        if (yearStemIndex !== null && selection.month) {
            const startStem = (yearStemIndex % 5) * 2 + 2;
            // Month 1 is Tiger (Index 2 in Branches), but we just need the stem sequence.
            // The sequence starts from Month 1.
            const monthStemIndex = (startStem + (selection.month - 1)) % 10;
            stems.monthly = HEAVENLY_STEMS[monthStemIndex];
        }

        // 5. Daily (Ri) - Requires Calendar Lookup
        // We use astro.byLunar to get the Day Stem (Day Pillar)
        // 6. Hourly (Shi) - Five Rats Chasing Hour
        // Based on Day Stem and Hour Index (0-11)
        if (selection.year && selection.month && selection.day) {
            try {
                // Use byLunar to get accurate Day Pillar
                // Note: We use hour 0 just to get the day
                const tempHoroscope = astro.byLunar(
                    `${selection.year}-${selection.month}-${selection.day}`,
                    0,
                    basicInfo.gender === 'male' ? '男' : '女',
                    false, // isLeapMonth (Assuming false for now as UI doesn't support it)
                    true // fixLeap
                );

                if (tempHoroscope && tempHoroscope.chineseDate) {
                    let dayStemIndex = null;
                    if (typeof tempHoroscope.chineseDate === 'string') {
                        const parts = tempHoroscope.chineseDate.trim().split(/\s+/);
                        // parts[2] is Day Pillar (e.g. "戊戌")
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

                    // Calculate Hourly Stem if Day Stem is found and Hour is selected
                    if (dayStemIndex !== -1 && dayStemIndex !== null && selection.hour !== null) {
                        // Formula: Start Stem = (DayStemIndex % 5) * 2
                        const startStem = (dayStemIndex % 5) * 2;
                        const hourStemIndex = (startStem + selection.hour) % 10;
                        stems.hourly = HEAVENLY_STEMS[hourStemIndex];
                    }
                }
            } catch (e) {
                console.error("Error calculating daily/hourly stems:", e);
            }
        }

        return stems;
    }, [horoscope, palaces, selection, basicInfo.gender]);

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

    const getPalaceByBranch = (branch) => {
        return palaces.find(p => p.earthlyBranch === branch);
    };

    const renderPalace = (branch) => {
        const palace = getPalaceByBranch(branch);
        if (!palace) return null;

        const isFocused = focusedIndex === palace.index;

        return (
            <div
                className={`h-full w-full border ${isFocused ? 'border-2 border-red-500 z-10' : 'border-gray-300'} bg-white relative p-1 text-xs flex flex-col justify-between transition-all cursor-pointer hover:bg-slate-50`}
                onClick={() => setFocusedIndex(palace.index)}
            >
                {/* Major Stars */}
                <div className="flex flex-col items-start w-full">
                    {palace.majorStars.map((star, idx) => {
                        const siHuaBadges = getActiveSiHua(star.name);
                        return (
                            <div key={idx} className={`font-bold ${star.brightness === '庙' || star.brightness === '旺' ? 'text-red-600' : 'text-blue-600'} flex items-center flex-wrap gap-0.5`}>
                                <span>{star.name}</span>
                                <span className="text-[10px] font-normal text-gray-500 scale-90 origin-left">{star.brightness}</span>

                                {/* Si Hua Badges */}
                                {siHuaBadges && siHuaBadges.map((badge, bIdx) => (
                                    <span key={bIdx} className={`${badge.color} text-white px-[1px] rounded text-[8px] scale-90 flex items-center justify-center min-w-[12px]`}>
                                        {badge.type}
                                    </span>
                                ))}
                            </div>
                        );
                    })}
                </div>

                {/* Minor Stars (Simplified) */}
                <div className="flex flex-wrap gap-1 text-[10px] text-gray-600 absolute top-1 right-1 w-1/2 justify-end pointer-events-none">
                    {palace.minorStars.map((star, idx) => (
                        <span key={idx} className="bg-white/80 px-0.5 rounded">{star.name}</span>
                    ))}
                </div>

                {/* Bottom Info */}
                <div className="mt-auto flex justify-between items-end w-full">
                    {/* Da Xian Range */}
                    <div className="text-blue-500 font-bold text-sm transform -translate-y-1">
                        {palace.decadal.range[0]}-{palace.decadal.range[1]}
                    </div>

                    {/* Palace Name & Stem/Branch */}
                    <div className="text-right">
                        <div className="text-purple-600 font-bold">{palace.name}</div>
                        <div className="text-gray-400 text-[10px]">{palace.heavenlyStem}{palace.earthlyBranch}</div>
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
                    x1={`${pSelf.x}%`} y1={`${pSelf.y}%`}
                    x2={`${pDuiGong.x}%`} y2={`${pDuiGong.y}%`}
                    stroke="rgba(34, 211, 238, 0.8)"
                    strokeWidth="2"
                    strokeDasharray="4,2"
                    filter="url(#glow)"
                />

                {/* Dots at intersections */}
                <circle cx={`${pSelf.x}%`} cy={`${pSelf.y}%`} r="3" fill="#ec4899" />
                <circle cx={`${pSanHe1.x}%`} cy={`${pSanHe1.y}%`} r="3" fill="#ec4899" />
                <circle cx={`${pSanHe2.x}%`} cy={`${pSanHe2.y}%`} r="3" fill="#ec4899" />
                <circle cx={`${pDuiGong.x}%`} cy={`${pDuiGong.y}%`} r="3" fill="#22d3ee" />
            </svg>
        );
    };

    // Generate Prompt for AI Analysis
    const handleGeneratePrompt = (type) => {
        let prompt = '';
        const scumbagData = generateScumbagPrompt(horoscope);
        const basicInfoData = `
**--- 命主基本信息 (用于推算大限流年) ---**
- **姓名**：${basicInfo.name || '未填写'}
- **性别**：${basicInfo.gender === 'male' ? '男' : '女'}
- **生辰**：${basicInfo.birthday}
- **出生时辰**：${basicInfo.birthTime}
`;

        if (type === 'scumbag') {
            const template = basicInfo.gender === 'female' ? FEMALE_PROMPT_TEMPLATE : AI_PROMPT_TEMPLATE;
            prompt = `${template}\n${basicInfoData}\n${scumbagData}`;
        } else if (type === 'marriage') {
            prompt = `${MARRIAGE_PROMPT_TEMPLATE}\n${basicInfoData}\n${scumbagData}`;
        } else if (type === 'wealth') {
            prompt = `${WEALTH_PROMPT_TEMPLATE}\n${basicInfoData}\n${scumbagData}`;
        } else if (['yearly', 'monthly', 'daily', 'hourly'].includes(type)) {
            prompt = generateFortunePromptText(type, selection, activeStems, basicInfo, horoscope, palaces, SI_HUA_MAP);
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

    const handleConfirmPartner = () => {
        if (!partnerInfo.birthday) {
            alert('请选择配偶出生日期');
            return;
        }

        try {
            // Calculate Partner Horoscope
            const partnerHoroscope = astro.bySolar(
                partnerInfo.birthday,
                TIME_RANGES.indexOf(partnerInfo.birthTime),
                partnerInfo.gender === 'male' ? '男' : '女',
                true,
                'zh-CN'
            );

            const prompt = generateBabyPrompt(selectedBabyType, basicInfo, horoscope, partnerHoroscope);

            navigator.clipboard.writeText(prompt).then(() => {
                alert(`已复制双人命盘分析指令！\n请发送给AI进行分析。`);
                setShowPartnerModal(false);
            }).catch(err => {
                console.error('Failed to copy:', err);
                alert('复制失败，请手动复制。');
            });

        } catch (error) {
            console.error('Partner horoscope calculation failed:', error);
            alert('配偶命盘计算失败，请检查输入信息。');
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto bg-slate-100 text-slate-900 p-1 select-none flex flex-col gap-2">
            {/* Chart Grid */}
            <div className="aspect-square grid grid-cols-4 grid-rows-4 gap-[1px] bg-gray-300 border border-gray-400 relative">
                {renderConnections()}
                {/* Row 1 */}
                <div className="bg-white">{renderPalace('巳')}</div>
                <div className="bg-white">{renderPalace('午')}</div>
                <div className="bg-white">{renderPalace('未')}</div>
                <div className="bg-white">{renderPalace('申')}</div>

                {/* Row 2 */}
                <div className="bg-white">{renderPalace('辰')}</div>
                <div className="col-span-2 row-span-2 bg-[#F5F7FA] flex flex-col relative overflow-hidden border border-gray-200 m-[1px]">
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
                            {['origin', 'decadal', 'yearly', 'monthly', 'daily', 'hourly'].map(layer => (
                                <button
                                    key={layer}
                                    className={`border rounded px-1 py-0.5 ${activeLayers[layer] ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                                    onClick={() => setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }))}
                                >
                                    {layer === 'origin' ? '本' : layer === 'decadal' ? '限' : layer === 'yearly' ? '年' : layer === 'monthly' ? '月' : layer === 'daily' ? '日' : '时'}
                                    {activeStems[layer] && <span className="ml-1 font-bold">{activeStems[layer]}</span>}
                                </button>
                            ))}
                        </div>

                        <div className="text-right text-[8px] text-gray-300 mt-auto italic">
                            Powered by iztro
                        </div>
                    </div>
                </div>
                <div className="bg-white">{renderPalace('酉')}</div>

                {/* Row 3 */}
                <div className="bg-white">{renderPalace('卯')}</div>
                {/* Center spans here */}
                <div className="bg-white">{renderPalace('戌')}</div>

                {/* Row 4 */}
                <div className="bg-white">{renderPalace('寅')}</div>
                <div className="bg-white">{renderPalace('丑')}</div>
                <div className="bg-white">{renderPalace('子')}</div>
                <div className="bg-white">{renderPalace('亥')}</div>
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
                                            className={`px-2 py-1 rounded whitespace-nowrap ${selection.daxianIndex === p.index ? 'bg-green-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
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
                                                    className={`px-2 py-1 rounded whitespace-nowrap ${selection.year === year ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
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
                                                className={`px-2 py-1 rounded whitespace-nowrap text-center ${selection.month === month ? 'bg-yellow-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
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
                                                    className={`px-1 py-1 rounded whitespace-nowrap text-center text-[10px] ${selection.day === day ? 'bg-purple-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
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
                                                className={`px-2 py-1 rounded whitespace-nowrap flex flex-col items-center ${selection.hour === idx ? 'bg-cyan-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
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

            {/* AI Analysis Floating Button */}
            <div className="absolute bottom-6 left-6 z-50">
                <button
                    onClick={() => setShowAiMenu(!showAiMenu)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:scale-105 transition-transform animate-pulse"
                >
                    <Sparkles className="w-5 h-5" />
                    AI 分析
                </button>
            </div>

            {/* AI Analysis Menu (Drawer) */}
            {showAiMenu && (
                <div className="absolute bottom-20 left-6 z-50 w-64 bg-black/90 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-2xl p-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
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
                                    <span className="text-xl">👑</span> 领导型宝宝
                                </button>
                                <button onClick={() => handleGeneratePrompt('baby_iq')} className="w-full text-left px-4 py-3 rounded hover:bg-white/10 flex items-center gap-3 text-sm font-bold text-blue-400 border border-transparent hover:border-blue-500/30 transition-all">
                                    <span className="text-xl">🧠</span> 高IQ宝宝
                                </button>
                                <button onClick={() => handleGeneratePrompt('baby_sport')} className="w-full text-left px-4 py-3 rounded hover:bg-white/10 flex items-center gap-3 text-sm font-bold text-red-400 border border-transparent hover:border-red-500/30 transition-all">
                                    <span className="text-xl">🏅</span> 体育型宝宝
                                </button>
                                <button onClick={() => handleGeneratePrompt('baby_wealth')} className="w-full text-left px-4 py-3 rounded hover:bg-white/10 flex items-center gap-3 text-sm font-bold text-green-400 border border-transparent hover:border-green-500/30 transition-all">
                                    <span className="text-xl">💰</span> 搞钱型宝宝
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
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-lg shadow-lg hover:opacity-90 transition-opacity mt-2"
                            >
                                生成双人分析指令
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Debug Info Removed */}
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
