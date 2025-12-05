import React, { useMemo } from 'react';
import { astro } from 'iztro';

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
        if (selection.year) {
            // Simple calculation for year stem is reliable
            const idx = getYearStemIndex(selection.year);
            stems.yearly = HEAVENLY_STEMS[idx];
        }

        // For Monthly, Daily, Hourly - we need accurate Lunar conversion from Solar date
        if (selection.year && selection.month) {
            try {
                // Construct a representative date for the selected month
                // Default to 1st day if day not selected, or selected day
                const day = selection.day || 1;
                // Default to hour 0 (Zi) if not selected, or selected hour index directly
                // iztro expects hour index (0-12), not solar hour (0-23)
                const hour = selection.hour !== null ? selection.hour : 0;

                // Create a temporary horoscope to get the accurate Chinese Date
                // We use the user's gender, but the date is the *selected timeline date*
                const tempHoroscope = astro.bySolar(
                    `${selection.year}-${selection.month}-${day}`,
                    hour,
                    basicInfo.gender === 'male' ? '男' : '女',
                    true // fixLeap
                );

                if (tempHoroscope && tempHoroscope.chineseDate) {
                    if (typeof tempHoroscope.chineseDate === 'string') {
                        // Use regex to split by whitespace to handle potential multiple spaces
                        const parts = tempHoroscope.chineseDate.trim().split(/\s+/);
                        // parts[0] = Year, parts[1] = Month, parts[2] = Day, parts[3] = Hour

                        if (parts.length >= 2) stems.monthly = parts[1][0];
                        if (parts.length >= 3 && selection.day) stems.daily = parts[2][0];
                        if (parts.length >= 4 && selection.day && selection.hour !== null) stems.hourly = parts[3][0];
                    } else {
                        // Fallback for object format
                        if (tempHoroscope.chineseDate.monthly) stems.monthly = tempHoroscope.chineseDate.monthly[0];
                        if (selection.day && tempHoroscope.chineseDate.daily) stems.daily = tempHoroscope.chineseDate.daily[0];
                        if (selection.day && selection.hour !== null && tempHoroscope.chineseDate.hourly) stems.hourly = tempHoroscope.chineseDate.hourly[0];
                    }
                }
            } catch (e) {
                console.error("Error calculating timeline stems:", e);
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
                                {star.mutagen && <span className="bg-red-500 text-white px-[1px] rounded text-[8px] scale-90">{star.mutagen}</span>}

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
                <div className="flex flex-wrap gap-1 text-[10px] text-gray-600 absolute top-1 right-1 w-1/2 justify-end">
                    {palace.minorStars.map((star, idx) => (
                        <span key={idx}>{star.name}</span>
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
                                <td className="bg-gray-100 font-bold p-1 border-r">流月</td>
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
                                                className={`px-2 py-1 rounded whitespace-nowrap ${selection.hour === idx ? 'bg-cyan-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                                                onClick={() => handleSelection('hour', idx)}
                                            >
                                                {branch}时
                                            </button>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Debug Info (Temporary) */}
            <div className="bg-black text-white p-2 text-xs font-mono overflow-auto">
                <div>Active Stems: {JSON.stringify(activeStems)}</div>
                <div>Selection: {JSON.stringify(selection)}</div>
                <div>Active Layers: {JSON.stringify(activeLayers)}</div>
                {/* Add debug for tempHoroscope if needed, but activeStems should be enough now */}
            </div>
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
