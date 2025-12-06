import { astro } from 'iztro';

// Helper to check if a star is in a list
const hasStar = (stars, name) => stars.some(s => s.name === name);
const hasBrightness = (stars, name, levels) => stars.some(s => s.name === name && levels.includes(s.brightness));
const hasMutagen = (stars, name, type) => stars.some(s => s.name === name && s.mutagen === type);

// Scoring Rules for each Type
const SCORING_RULES = {
    'leader': (horoscope) => {
        let score = 0;
        const ming = horoscope.palaces.find(p => p.name === '命宫');
        const guan = horoscope.palaces.find(p => p.name === '官禄宫');
        const cai = horoscope.palaces.find(p => p.name === '财帛宫');
        const qian = horoscope.palaces.find(p => p.name === '迁移宫');

        // 1. Major Stars (Emperor Vibe)
        if (hasStar(ming.majorStars, '紫微')) score += 20;
        if (hasStar(ming.majorStars, '天府')) score += 15;
        if (hasBrightness(ming.majorStars, '太阳', ['庙', '旺'])) score += 15;
        if (hasStar(ming.majorStars, '天相')) score += 10;

        // 2. Si Hua (Power)
        if (ming.majorStars.some(s => s.mutagen === '权')) score += 25;
        if (guan.majorStars.some(s => s.mutagen === '权')) score += 20;

        // 3. Aux Stars (Support)
        const sanFang = [...ming.minorStars, ...guan.minorStars, ...cai.minorStars, ...qian.minorStars];
        if (hasStar(sanFang, '左辅')) score += 10;
        if (hasStar(sanFang, '右弼')) score += 10;
        if (hasStar(sanFang, '天魁')) score += 5;
        if (hasStar(sanFang, '天钺')) score += 5;

        // 4. Avoid Bad Stars in Ming
        if (hasStar(ming.minorStars, '地空') || hasStar(ming.minorStars, '地劫')) score -= 15;

        return { score, desc: '紫府坐命/百官朝拱/权禄巡逢' };
    },
    'iq': (horoscope) => {
        let score = 0;
        const ming = horoscope.palaces.find(p => p.name === '命宫');
        const guan = horoscope.palaces.find(p => p.name === '官禄宫');

        // 1. Major Stars (Intelligence)
        if (hasStar(ming.majorStars, '天机')) score += 20;
        if (hasStar(ming.majorStars, '天梁')) score += 15;
        if (hasStar(ming.majorStars, '太阴')) score += 15;
        if (hasStar(ming.majorStars, '巨门')) score += 10;

        // 2. Si Hua (Fame/Exam)
        if (ming.majorStars.some(s => s.mutagen === '科')) score += 25;
        if (guan.majorStars.some(s => s.mutagen === '科')) score += 20;

        // 3. Aux Stars (Literary)
        const sanFang = [...ming.minorStars, ...guan.minorStars, ...horoscope.palaces.find(p => p.name === '财帛宫').minorStars];
        if (hasStar(sanFang, '文昌')) score += 15;
        if (hasStar(sanFang, '文曲')) score += 15;
        if (hasStar(sanFang, '天魁')) score += 10; // Nobleman help

        return { score, desc: '机月同梁/阳梁昌禄/科名会照' };
    },
    'sport': (horoscope) => {
        let score = 0;
        const ming = horoscope.palaces.find(p => p.name === '命宫');

        // 1. Major Stars (Action/Power)
        if (hasStar(ming.majorStars, '七杀')) score += 20;
        if (hasStar(ming.majorStars, '破军')) score += 20;
        if (hasStar(ming.majorStars, '贪狼')) score += 20;
        if (hasStar(ming.majorStars, '武曲')) score += 15;

        // 2. Si Hua (Force)
        if (ming.majorStars.some(s => s.mutagen === '权')) score += 20;

        // 3. Special (Explosive Power)
        if (hasStar(ming.minorStars, '火星')) score += 10;
        if (hasStar(ming.minorStars, '铃星')) score += 10;
        if (hasStar(ming.minorStars, '擎羊')) score += 10; // Competitiveness

        return { score, desc: '杀破狼/武贪格/火贪格' };
    },
    'wealth': (horoscope) => {
        let score = 0;
        const ming = horoscope.palaces.find(p => p.name === '命宫');
        const cai = horoscope.palaces.find(p => p.name === '财帛宫');
        const tian = horoscope.palaces.find(p => p.name === '田宅宫');

        // 1. Major Stars (Wealth)
        if (hasStar(ming.majorStars, '武曲')) score += 20;
        if (hasStar(ming.majorStars, '太阴')) score += 15;
        if (hasStar(ming.majorStars, '天府')) score += 15;
        if (hasStar(ming.majorStars, '贪狼')) score += 10;

        // 2. Si Hua (Money Flow)
        if (ming.majorStars.some(s => s.mutagen === '禄')) score += 25;
        if (cai.majorStars.some(s => s.mutagen === '禄')) score += 25;
        if (hasStar(ming.minorStars, '禄存')) score += 20;
        if (hasStar(cai.minorStars, '禄存')) score += 20;
        if (hasStar(tian.minorStars, '禄存')) score += 15;

        // 3. Special (Windfall)
        if (hasStar(ming.majorStars, '贪狼') && (hasStar(ming.minorStars, '火星') || hasStar(ming.minorStars, '铃星'))) score += 30;

        // 4. Avoid Leakage
        if (hasStar(cai.minorStars, '地空') || hasStar(cai.minorStars, '地劫')) score -= 50; // Critical hit

        return { score, desc: '武贪格/火贪格/双禄交流/财荫夹印' };
    }
};

export const findBestConceptionDates = async (type, limit = 3) => {
    const results = [];
    const today = new Date();
    // Scan next 180 days for Conception
    // Conception Date + 280 days = Birth Date

    // Optimization: Don't scan every single day if it's too slow. 
    // But for 180 days it's ~2000 checks. JS is fast enough.

    const scanDays = 120; // Scan 4 months window

    for (let i = 0; i < scanDays; i += 2) { // Step by 2 days to save time
        const conceptionDate = new Date(today);
        conceptionDate.setDate(today.getDate() + i);

        const birthDate = new Date(conceptionDate);
        birthDate.setDate(conceptionDate.getDate() + 280);

        const dateStr = birthDate.toISOString().split('T')[0];

        // Check 12 hours (0, 2, 4 ... 22)
        for (let h = 0; h < 24; h += 2) {
            try {
                const horoscope = astro.bySolar(dateStr, h / 2, '男', true, 'zh-CN'); // Assume Male for pattern check (patterns are mostly gender neutral for these archetypes)

                const scorer = SCORING_RULES[type] || SCORING_RULES['leader'];
                const { score, desc } = scorer(horoscope);

                if (score > 60) { // Threshold
                    results.push({
                        conceptionDate: conceptionDate.toLocaleDateString(),
                        birthDate: birthDate.toLocaleDateString(),
                        birthTimeIndex: h / 2,
                        score,
                        desc,
                        horoscope // Keep for reference if needed, but heavy
                    });
                }
            } catch (e) {
                // Ignore errors
            }
        }
    }

    // Sort by score desc
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
};
