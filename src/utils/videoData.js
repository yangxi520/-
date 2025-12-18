/**
 * 视频数据配置
 * 在完成 Cloudflare R2 配置后，将 url 和 thumbnail 替换为您的 R2 链接
 * 例如: https://videos.gspzw.store/lesson-1.mp4
 */

export const VIDEO_BASE_URL = 'https://videos.gspzw.store';

// 视频分类
export const categories = [
    { id: 'beginner', label: '入门篇', icon: '📖' },
    { id: 'advanced', label: '进阶篇', icon: '🎯' },
];

// 视频列表
export const videos = [
    // ===== 入门篇 =====
    {
        id: 'lesson-1',
        title: '紫微斗数入门：什么是紫微斗数？',
        description: '了解紫微斗数的历史渊源和基本概念，带您走进中国传统命理学的神秘世界。',
        // 临时使用开源视频，配置 R2 后替换
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnail: null, // 使用默认渐变背景
        duration: '10:35',
        category: 'beginner',
    },
    {
        id: 'lesson-2',
        title: '认识十二宫位：命宫与十一主宫',
        description: '详解紫微斗数的核心——十二宫位，包括命宫、父母宫、福德宫等的基本含义。',
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        thumbnail: null,
        duration: '15:20',
        category: 'beginner',
    },
    {
        id: 'lesson-3',
        title: '主星与辅星：认识紫微星系',
        description: '学习紫微、天府、武曲、太阳等主星的基本特质，以及辅星的作用。',
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnail: null,
        duration: '18:45',
        category: 'beginner',
    },

    // ===== 进阶篇 =====
    {
        id: 'lesson-4',
        title: '四化飞星：禄权科忌的奥秘',
        description: '深入解析紫微斗数的核心变化——四化飞星，掌握化禄、化权、化科、化忌的运用。',
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        thumbnail: null,
        duration: '22:10',
        category: 'advanced',
    },
    {
        id: 'lesson-5',
        title: '大限流年：解读人生的时间密码',
        description: '学习如何推算大限和流年运势，预测人生各阶段的吉凶祸福。',
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        thumbnail: null,
        duration: '25:30',
        category: 'advanced',
    },
    {
        id: 'lesson-6',
        title: '实战案例：如何解读一张完整命盘',
        description: '通过真实案例，学习如何综合分析命盘，给出准确的命理判断。',
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        thumbnail: null,
        duration: '30:00',
        category: 'advanced',
    },
];

// 获取指定分类的视频
export const getVideosByCategory = (categoryId) => {
    if (categoryId === 'all') return videos;
    return videos.filter(v => v.category === categoryId);
};

// 根据 ID 获取视频
export const getVideoById = (id) => {
    return videos.find(v => v.id === id);
};
