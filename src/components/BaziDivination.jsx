/**
 * 八字排盘组件 - 古书派·紫微
 * 基于 lunar-javascript 库实现专业八字排盘
 */
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Calendar, Clock, User, Sparkles, TrendingUp } from 'lucide-react';
import { Solar, Lunar } from 'lunar-javascript';

// 时辰映射
const SHICHEN_MAP = [
    { index: 0, name: '子时', range: '23:00-01:00', branch: '子' },
    { index: 1, name: '丑时', range: '01:00-03:00', branch: '丑' },
    { index: 2, name: '寅时', range: '03:00-05:00', branch: '寅' },
    { index: 3, name: '卯时', range: '05:00-07:00', branch: '卯' },
    { index: 4, name: '辰时', range: '07:00-09:00', branch: '辰' },
    { index: 5, name: '巳时', range: '09:00-11:00', branch: '巳' },
    { index: 6, name: '午时', range: '11:00-13:00', branch: '午' },
    { index: 7, name: '未时', range: '13:00-15:00', branch: '未' },
    { index: 8, name: '申时', range: '15:00-17:00', branch: '申' },
    { index: 9, name: '酉时', range: '17:00-19:00', branch: '酉' },
    { index: 10, name: '戌时', range: '19:00-21:00', branch: '戌' },
    { index: 11, name: '亥时', range: '21:00-23:00', branch: '亥' },
];

// 五行颜色映射
const WUXING_COLORS = {
    '金': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' },
    '木': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
    '水': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
    '火': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
    '土': { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/50' },
};

// 天干五行
const TIANGAN_WUXING = {
    '甲': '木', '乙': '木',
    '丙': '火', '丁': '火',
    '戊': '土', '己': '土',
    '庚': '金', '辛': '金',
    '壬': '水', '癸': '水',
};

// 地支五行
const DIZHI_WUXING = {
    '子': '水', '丑': '土', '寅': '木', '卯': '木',
    '辰': '土', '巳': '火', '午': '火', '未': '土',
    '申': '金', '酉': '金', '戌': '土', '亥': '水',
};

// 十神名称
const SHISHEN_NAMES = {
    '比': '比肩', '劫': '劫财',
    '食': '食神', '伤': '伤官',
    '财': '偏财', '才': '正财',
    '杀': '七杀', '官': '正官',
    '枭': '偏印', '印': '正印',
};

export default function BaziDivination({ onBack }) {
    const [step, setStep] = useState('input'); // 'input' | 'result'
    const [calendarType, setCalendarType] = useState('solar'); // 'solar' | 'lunar'
    const [birthYear, setBirthYear] = useState(1990);
    const [birthMonth, setBirthMonth] = useState(1);
    const [birthDay, setBirthDay] = useState(1);
    const [birthHour, setBirthHour] = useState(6); // 默认午时
    const [gender, setGender] = useState('male');
    const [loading, setLoading] = useState(false);

    // 生成年份选项 (1940-当前年)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1940 + 1 }, (_, i) => 1940 + i);

    // 生成月份选项
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    // 根据年月计算当月天数
    const getDaysInMonth = (year, month) => {
        if (calendarType === 'lunar') {
            // 农历固定30天选项
            return 30;
        }
        return new Date(year, month, 0).getDate();
    };
    const days = Array.from({ length: getDaysInMonth(birthYear, birthMonth) }, (_, i) => i + 1);

    // 计算八字
    const baziResult = useMemo(() => {
        if (step !== 'result') return null;

        try {
            const year = birthYear;
            const month = birthMonth;
            const day = birthDay;

            // 根据时辰获取小时
            const hourMap = [23, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];
            const hour = hourMap[birthHour] || 12;

            let solar;
            if (calendarType === 'solar') {
                solar = Solar.fromYmdHms(year, month, day, hour, 0, 0);
            } else {
                const lunar = Lunar.fromYmd(year, month, day);
                solar = lunar.getSolar();
            }

            const lunar = solar.getLunar();
            const eightChar = lunar.getEightChar();

            // 获取四柱
            const yearGan = eightChar.getYearGan();
            const yearZhi = eightChar.getYearZhi();
            const monthGan = eightChar.getMonthGan();
            const monthZhi = eightChar.getMonthZhi();
            const dayGan = eightChar.getDayGan();
            const dayZhi = eightChar.getDayZhi();
            const timeGan = eightChar.getTimeGan();
            const timeZhi = eightChar.getTimeZhi();

            // 计算五行统计
            const wuxingCount = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
            [yearGan, monthGan, dayGan, timeGan].forEach(gan => {
                const wx = TIANGAN_WUXING[gan];
                if (wx) wuxingCount[wx]++;
            });
            [yearZhi, monthZhi, dayZhi, timeZhi].forEach(zhi => {
                const wx = DIZHI_WUXING[zhi];
                if (wx) wuxingCount[wx]++;
            });

            // 获取纳音
            const yearNaYin = eightChar.getYearNaYin();
            const monthNaYin = eightChar.getMonthNaYin();
            const dayNaYin = eightChar.getDayNaYin();
            const timeNaYin = eightChar.getTimeNaYin();

            // 获取十神
            const yearShiShen = eightChar.getYearShiShenGan();
            const monthShiShen = eightChar.getMonthShiShenGan();
            const timeShiShen = eightChar.getTimeShiShenGan();

            // 获取大运
            let yun;
            try {
                yun = eightChar.getYun(gender === 'male' ? 1 : 0);
            } catch (e) {
                yun = null;
            }

            // 获取流年
            const currentYear = new Date().getFullYear();
            let liuNian = [];
            try {
                if (yun) {
                    const daYuns = yun.getDaYun();
                    if (daYuns && daYuns.length > 0) {
                        // 找到当前大运
                        for (const dy of daYuns) {
                            const lns = dy.getLiuNian();
                            for (const ln of lns) {
                                if (ln.getYear() >= currentYear && liuNian.length < 10) {
                                    liuNian.push({
                                        year: ln.getYear(),
                                        ganZhi: ln.getGanZhi(),
                                    });
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                // Ignore errors
            }

            return {
                // 四柱
                pillars: [
                    { name: '年柱', gan: yearGan, zhi: yearZhi, naYin: yearNaYin, shiShen: yearShiShen },
                    { name: '月柱', gan: monthGan, zhi: monthZhi, naYin: monthNaYin, shiShen: monthShiShen },
                    { name: '日柱', gan: dayGan, zhi: dayZhi, naYin: dayNaYin, shiShen: '日主' },
                    { name: '时柱', gan: timeGan, zhi: timeZhi, naYin: timeNaYin, shiShen: timeShiShen },
                ],
                dayMaster: dayGan,
                dayMasterWuxing: TIANGAN_WUXING[dayGan],
                wuxingCount,
                // 大运
                yun: yun ? {
                    startAge: yun.getStartYear() - year,
                    daYun: yun.getDaYun().slice(0, 8).map(dy => ({
                        startAge: dy.getStartAge(),
                        endAge: dy.getEndAge(),
                        ganZhi: dy.getGanZhi(),
                    })),
                } : null,
                liuNian,
                // 农历信息
                lunarInfo: {
                    year: lunar.getYearInChinese(),
                    month: lunar.getMonthInChinese(),
                    day: lunar.getDayInChinese(),
                    zodiac: lunar.getYearShengXiao(),
                },
            };
        } catch (error) {
            console.error('计算八字失败:', error);
            return null;
        }
    }, [step, birthYear, birthMonth, birthDay, birthHour, calendarType, gender]);

    const handleCalculate = () => {
        setLoading(true);
        setTimeout(() => {
            setStep('result');
            setLoading(false);
        }, 500);
    };

    // 渲染五行柱状图
    const WuxingBar = ({ label, count, maxCount = 8 }) => {
        const colors = WUXING_COLORS[label];
        const percentage = (count / maxCount) * 100;

        return (
            <div className="flex items-center gap-2">
                <span className={`w-6 text-center font-bold ${colors.text}`}>{label}</span>
                <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${colors.bg} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <span className="w-4 text-right text-sm text-gray-400">{count}</span>
            </div>
        );
    };

    // 渲染柱（年月日时）
    const PillarCard = ({ pillar }) => {
        const ganWuxing = TIANGAN_WUXING[pillar.gan];
        const zhiWuxing = DIZHI_WUXING[pillar.zhi];
        const ganColors = WUXING_COLORS[ganWuxing];
        const zhiColors = WUXING_COLORS[zhiWuxing];

        return (
            <div className="flex-1 text-center">
                <div className="text-xs text-gray-500 mb-2">{pillar.name}</div>

                {/* 十神 */}
                <div className="text-xs text-purple-400 mb-1 h-4">
                    {pillar.shiShen || ''}
                </div>

                {/* 天干 */}
                <div className={`text-3xl font-bold py-3 rounded-t-xl border-t border-x ${ganColors.bg} ${ganColors.text} ${ganColors.border}`}>
                    {pillar.gan}
                </div>

                {/* 地支 */}
                <div className={`text-3xl font-bold py-3 rounded-b-xl border-b border-x ${zhiColors.bg} ${zhiColors.text} ${zhiColors.border}`}>
                    {pillar.zhi}
                </div>

                {/* 纳音 */}
                <div className="text-xs text-gray-500 mt-2 truncate">{pillar.naYin}</div>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-black/50 backdrop-blur-md">
                <button
                    onClick={step === 'result' ? () => setStep('input') : onBack}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-orange-400" />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                        <span className="text-lg">🔥</span>
                    </div>
                    <h1 className="text-lg font-bold text-white">八字排盘</h1>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
                {step === 'input' ? (
                    // --- INPUT FORM ---
                    <div className="max-w-md mx-auto space-y-6 animate-in fade-in duration-300">
                        <div className="text-center space-y-2 mb-8">
                            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
                                探索您的命格
                            </h2>
                            <p className="text-gray-400 text-sm">
                                输入出生信息，洞察四柱八字奥秘
                            </p>
                        </div>

                        {/* 日历类型 */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-orange-500 uppercase tracking-widest flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> 日期类型
                            </label>
                            <div className="flex bg-black/50 p-1 rounded-lg border border-white/10">
                                <button
                                    onClick={() => setCalendarType('solar')}
                                    className={`flex-1 py-2.5 text-sm font-bold rounded transition-all ${calendarType === 'solar'
                                        ? 'bg-orange-900/50 text-orange-300 border border-orange-500/50'
                                        : 'text-gray-500'
                                        }`}
                                >
                                    阳历
                                </button>
                                <button
                                    onClick={() => setCalendarType('lunar')}
                                    className={`flex-1 py-2.5 text-sm font-bold rounded transition-all ${calendarType === 'lunar'
                                        ? 'bg-red-900/50 text-red-300 border border-red-500/50'
                                        : 'text-gray-500'
                                        }`}
                                >
                                    农历
                                </button>
                            </div>
                        </div>

                        {/* 出生日期 - 年月日下拉框 */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-orange-500 uppercase tracking-widest">
                                出生日期
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {/* 年 */}
                                <select
                                    value={birthYear}
                                    onChange={(e) => setBirthYear(Number(e.target.value))}
                                    className="px-3 py-3 bg-black/50 border border-white/10 text-white rounded-lg outline-none focus:border-orange-500/50 transition-all appearance-none cursor-pointer text-center"
                                >
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}年</option>
                                    ))}
                                </select>
                                {/* 月 */}
                                <select
                                    value={birthMonth}
                                    onChange={(e) => setBirthMonth(Number(e.target.value))}
                                    className="px-3 py-3 bg-black/50 border border-white/10 text-white rounded-lg outline-none focus:border-orange-500/50 transition-all appearance-none cursor-pointer text-center"
                                >
                                    {months.map(m => (
                                        <option key={m} value={m}>{m}月</option>
                                    ))}
                                </select>
                                {/* 日 */}
                                <select
                                    value={birthDay}
                                    onChange={(e) => setBirthDay(Number(e.target.value))}
                                    className="px-3 py-3 bg-black/50 border border-white/10 text-white rounded-lg outline-none focus:border-orange-500/50 transition-all appearance-none cursor-pointer text-center"
                                >
                                    {days.map(d => (
                                        <option key={d} value={d}>{d}日</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* 出生时辰 */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-orange-500 uppercase tracking-widest flex items-center gap-1">
                                <Clock className="w-3 h-3" /> 出生时辰
                            </label>
                            <select
                                value={birthHour}
                                onChange={(e) => setBirthHour(Number(e.target.value))}
                                className="w-full px-4 py-3 bg-black/50 border border-white/10 text-white rounded-lg outline-none focus:border-orange-500/50 transition-all appearance-none cursor-pointer"
                            >
                                {SHICHEN_MAP.map((sc, i) => (
                                    <option key={i} value={i}>
                                        {sc.name} ({sc.range})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 性别 */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-orange-500 uppercase tracking-widest flex items-center gap-1">
                                <User className="w-3 h-3" /> 性别
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setGender('male')}
                                    className={`py-3 border rounded-lg transition-all flex items-center justify-center gap-2 ${gender === 'male'
                                        ? 'bg-blue-900/20 border-blue-500 text-blue-400'
                                        : 'bg-black/50 border-white/10 text-gray-500'
                                        }`}
                                >
                                    <span>♂</span>
                                    <span className="font-bold">男</span>
                                </button>
                                <button
                                    onClick={() => setGender('female')}
                                    className={`py-3 border rounded-lg transition-all flex items-center justify-center gap-2 ${gender === 'female'
                                        ? 'bg-pink-900/20 border-pink-500 text-pink-400'
                                        : 'bg-black/50 border-white/10 text-gray-500'
                                        }`}
                                >
                                    <span>♀</span>
                                    <span className="font-bold">女</span>
                                </button>
                            </div>
                        </div>

                        {/* 计算按钮 */}
                        <button
                            onClick={handleCalculate}
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold text-lg uppercase tracking-widest hover:from-orange-500 hover:to-red-500 transition-all shadow-lg shadow-orange-500/20 rounded-xl disabled:opacity-50"
                        >
                            {loading ? '排盘中...' : '开始排盘'}
                        </button>
                    </div>
                ) : (
                    // --- RESULT VIEW ---
                    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300 pb-20">
                        {baziResult ? (
                            <>
                                {/* 农历信息 */}
                                <div className="text-center text-gray-400 text-sm">
                                    农历 {baziResult.lunarInfo.year}年 {baziResult.lunarInfo.month}月{baziResult.lunarInfo.day}
                                    <span className="ml-2">生肖: {baziResult.lunarInfo.zodiac}</span>
                                </div>

                                {/* 四柱八字 */}
                                <div className="bg-black/40 backdrop-blur-md border border-orange-500/30 rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-orange-400 mb-4 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5" /> 四柱八字
                                    </h3>
                                    <div className="flex gap-2">
                                        {baziResult.pillars.map((pillar, i) => (
                                            <PillarCard key={i} pillar={pillar} />
                                        ))}
                                    </div>

                                    {/* 日主信息 */}
                                    <div className="mt-4 pt-4 border-t border-white/10 text-center">
                                        <span className="text-gray-400">日主: </span>
                                        <span className={`font-bold ${WUXING_COLORS[baziResult.dayMasterWuxing]?.text}`}>
                                            {baziResult.dayMaster}{baziResult.dayMasterWuxing}
                                        </span>
                                    </div>
                                </div>

                                {/* 五行分析 */}
                                <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-white mb-4">五行分布</h3>
                                    <div className="space-y-3">
                                        {Object.entries(baziResult.wuxingCount).map(([wx, count]) => (
                                            <WuxingBar key={wx} label={wx} count={count} />
                                        ))}
                                    </div>

                                    {/* 五行简析 */}
                                    <div className="mt-4 pt-4 border-t border-white/10 text-sm text-gray-400">
                                        {(() => {
                                            const counts = baziResult.wuxingCount;
                                            const max = Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b);
                                            const min = Object.entries(counts).reduce((a, b) => a[1] < b[1] ? a : b);
                                            return (
                                                <>
                                                    <span className={WUXING_COLORS[max[0]]?.text}>{max[0]}</span>
                                                    <span> 最旺 ({max[1]}个)，</span>
                                                    <span className={WUXING_COLORS[min[0]]?.text}>{min[0]}</span>
                                                    <span> 偏弱 ({min[1]}个)</span>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* 大运 */}
                                {baziResult.yun && (
                                    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-purple-400" /> 大运流年
                                        </h3>
                                        <div className="grid grid-cols-4 gap-2">
                                            {baziResult.yun.daYun.map((dy, i) => (
                                                <div
                                                    key={i}
                                                    className="text-center p-2 bg-white/5 rounded-lg border border-white/5 hover:border-purple-500/30 transition-all"
                                                >
                                                    <div className="text-xs text-gray-500">{dy.startAge}-{dy.endAge}岁</div>
                                                    <div className="font-bold text-purple-300">{dy.ganZhi}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* 未来流年 */}
                                        {baziResult.liuNian.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-white/10">
                                                <div className="text-sm text-gray-400 mb-2">未来流年:</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {baziResult.liuNian.slice(0, 5).map((ln, i) => (
                                                        <span
                                                            key={i}
                                                            className="px-2 py-1 bg-purple-900/30 rounded text-xs text-purple-300"
                                                        >
                                                            {ln.year} {ln.ganZhi}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 重新排盘按钮 */}
                                <button
                                    onClick={() => setStep('input')}
                                    className="w-full py-3 border border-orange-500/30 text-orange-400 font-bold rounded-xl hover:bg-orange-500/10 transition-all"
                                >
                                    重新排盘
                                </button>
                            </>
                        ) : (
                            <div className="text-center text-red-400 py-10">
                                计算失败，请检查输入的日期是否正确
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
