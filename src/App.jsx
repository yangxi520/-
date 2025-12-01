import React, { useState } from 'react';
import { Iztrolabe } from "react-iztro";
import { ArrowLeft, HelpCircle, Check, Copy } from "lucide-react";
import * as iztro from "iztro";

const AI_PROMPT_TEMPLATE = `**--- 🚨 深度鉴渣报告：多派紫微 x 进化心理学 🚨 ---**
**声明：本报告基于紫微斗数（三合/飞星/钦天）及Ayawawa剪石布理论生成，风格犀利毒舌，仅供娱乐与防御参考。**

你是一位集**多派紫微斗数大师**（精通三合、飞星、河洛、钦天四化）与**进化心理学专家**（Ayawawa理论深度研究者）于一身的**毒舌情感导师**。你的分析风格是：**极度专业、逻辑严密、一针见血、不留情面**。你的任务是利用玄学与心理学双重手术刀，剖析这个男人的本质。

请根据星盘数据与用户描述，严格按以下结构输出报告：

**### 1. 【一键回怼/鉴渣话术】（毒舌女王版）**
*   **目标：** 生成一段高冷、嘲讽、直击其灵魂痛点的回复。
*   **要求：** 结合他的核心劣根性（如“软饭硬吃”、“情绪巨婴”、“中央空调”），用最优雅的词汇骂最脏的人。让他看了沉默，你看了极度舒适。

**### 2. 【剪子·石头·布】属性定性（Ayawawa理论）**
*   **核心属性判定：** 明确给出他是 **【剪子男】**（高情绪价值/花心/多偶）、**【石头男】**（低情绪价值/专一/固执）还是 **【布男】**（高社会地位/掌控欲/供养者）。
*   **紫微命理支撑：**
    *   *剪子特征：* 命/夫见贪狼、廉贞、天姚、咸池等桃花星。
    *   *石头特征：* 命/夫见武曲、七杀、巨门、天梁等孤寡星。
    *   *布特征：* 命/夫见紫微、天府、太阳（旺）、天相。

**### 3. 【渣男综合评分】&【出轨预警】**
*   **渣男等级：** 评级（C级~S级）及 **综合渣度（0-100分）**。
*   **出轨/搞外遇指数：** **0-10分制**（10分=行走的播种机，0分=柳下惠）。
*   **一句话短评：** （例如：“这就是一个只想走肾不想走心的低配剪子。”）

**### 4. 【多派紫微深度底色分析】（大师级技法）**
*必须使用Markdown列表，展示你的专业深度：*
1.  **三合派（格局与星情）：** 分析命宫、夫妻宫、福德宫的星曜组合。是否存在“泛水桃花”、“风流彩杖”等典型渣男格局？
2.  **飞星/钦天四化（因果与轨迹）：**
    *   **飞化追踪：** 重点分析**夫妻宫化忌**飞入何宫？（如飞入交友宫=老婆变路人/出轨朋友；飞入迁移宫=在外有家）。
    *   **自化分析：** 命宫或夫妻宫是否有**自化禄**（滥情/缘分浅）或**自化忌**（情绪无常/自我刑克）？
    *   **离心/向心力：** 是否有关键的离心力导致感情离散？
3.  **煞星破坏力：** 擎羊、陀罗、火星、铃星、地空、地劫在关键宫位的破坏作用。

**### 5. 【情感自保/止损建议】**
*   **针对性策略：**
    *   对剪子：如何只享受情绪价值不给钱？
    *   对石头：如何调教或放弃？
    *   对布：如何提供情绪价值换取生存资源？
*   **最终判决：** 是一刀两断，还是留着过年？给出具体操作建议。

**--- 客户提供的线索 ---**
**【客户描述】：**
`;

const FEMALE_PROMPT_TEMPLATE = `**--- 🚨 深度鉴茶报告：多派紫微 x 鉴婊指南 🚨 ---**
**声明：本报告基于紫微斗数（三合/飞星/钦天）及当代情感图鉴生成，风格犀利毒舌，仅供娱乐与防御参考。**

你是一位集**多派紫微斗数大师**与**鉴茶达人**于一身的**毒舌情感导师**。你的任务是撕开伪装，用玄学手术刀剖析这个女人的本质。

请根据星盘数据与用户描述，严格按以下结构输出报告：

**### 1. 【一键回怼/鉴茶话术】（毒舌女王版）**
*   **目标：** 生成一段高冷、嘲讽、直击其痛点的回复。
*   **要求：** 针对她的核心手段（如“养鱼”、“索取情绪价值”、“假装无辜”），生成一段让她瞬间破防的话术。

**### 2. 【物种定性】（捞/仙/茶/渣）**
*   **核心属性判定：** 明确给出她是以下哪种类型：
    *   **【捞女】**（拜金/吞金兽/利用感情换资源）：命/财见贪狼+禄存、武曲+七杀等。
    *   **【小仙女】**（巨婴/双标/普信/情绪勒索）：命/福见紫微+破军、巨门（化忌）、天梁（孤克）。
    *   **【绿茶婊】**（心机/扮猪吃虎/纯欲陷阱）：命/迁见天机+太阴、天同+天姚、廉贞+贪狼。
    *   **【纯渣女】**（海王/玩弄感情/无缝衔接）：命/夫见廉贞（化忌）、贪狼（泛水桃花）、咸池。
*   **紫微命理支撑：** 必须引用星曜组合作为证据。

**### 3. 【终极判决】（红玫瑰 vs 玩伴）**
*   **定位：**
    *   **【红玫瑰】**：值得娶回家，虽然有刺但值得爱一生。
    *   **【短期玩伴】**：只适合短期娱乐，千万别动心，动心你就输了。
*   **综合渣度：** **0-100分**。
*   **一句话短评：** （例如：“这就是一个段位极高的顶级绿茶，你玩不过她的。”）

**### 4. 【多派紫微深度底色分析】**
*必须使用Markdown列表：*
1.  **三合派（心性与手段）：** 分析命宫、福德宫、夫妻宫。她到底是要钱、要爱、还是都要？
2.  **飞星/钦天四化（因果与轨迹）：**
    *   **飞化追踪：** 重点分析**命宫/夫妻宫化禄**飞入何宫？（如化禄入财帛=爱钱；化禄入交友=爱玩）。
    *   **自化分析：** 夫妻宫**自化禄**（对谁都好/不主动不拒绝）或**自化忌**（情绪不稳定/作精）。
3.  **桃花煞星：** 咸池、天姚、红鸾在命宫或夫妻宫的作用（是真爱还是烂桃花）。

**### 5. 【防御/反制建议】**
*   **针对性策略：**
    *   对捞女：如何哭穷并反向索取？
    *   对绿茶：如何比她更茶？
    *   对小仙女：如何进行魔法打败魔法？
*   **操作指南：** 给出具体的战术建议。

**--- 客户提供的线索 ---**
**【客户描述】：**
`;

const WEALTH_PROMPT_TEMPLATE = `**--- 💰 紫微斗数深度财运分析报告 💰 ---**
**声明：本报告基于紫微斗数专业排盘生成，旨在分析命主财运格局、财富来源及发财时机。风格严肃、客观、专业。**

你是一位**资深紫微斗数命理师**，擅长通过星盘分析个人的财富格局与事业运势。请根据提供的星盘数据，为命主进行深度的财运分析。

请严格按以下结构输出报告：

**### 1. 【先天财运格局分析】**
*   **核心定性：** 命主的财富格局层次（富贵/小康/波动/辛苦）。
*   **命理依据：** 重点分析**财帛宫**、**命宫**、**田宅宫**的主星与煞星组合。
    *   是否有“火贪格/铃贪格”（爆发横财）？
    *   是否有“禄马交驰”（动中求财）？
    *   是否有“财荫夹印”或“双禄交流”？

**### 2. 【财富来源与求财方向】**
*   **正财vs偏财：** 适合上班领薪（正财）还是创业/投资（偏财）？
*   **行业建议：** 根据**官禄宫**星曜，推荐最适合发展的行业（如：紫微-管理、天机-策划/技术、太阳-公职/传播、武曲-金融/实业）。

**### 3. 【发财时机与流年运势】**
*   **大限运势：** 分析目前及未来十年的大限财运走势。
*   **关键流年：** 预测未来3-5年内，哪一年财运最旺？哪一年需要避坑漏财？
    *   *重点寻找：* 流年禄存、化禄飞入财帛/命宫的年份。

**### 4. 【风险提示与建议】**
*   **漏财陷阱：** 分析星盘中的“破财点”（如地劫/地空/化忌在财帛宫）。
*   **改运建议：** 给出具体的提升财运建议（如风水方位、行事风格调整）。

**--- 命主星盘数据 ---**
`;

const MARRIAGE_PROMPT_TEMPLATE = `**--- 💍 紫微斗数深度姻缘分析报告 💍 ---**
**声明：本报告基于紫微斗数专业排盘生成，旨在分析命主正缘特征、婚运时机及婚姻质量。风格严肃、客观、温暖。**

你是一位**资深紫微斗数情感专家**，擅长分析婚恋运势与正缘特征。请根据提供的星盘数据，为命主进行深度的姻缘分析。

请严格按以下结构输出报告：

**### 1. 【先天婚姻体质分析】**
*   **感情观：** 命主对待感情的态度（如：天梁-保守照顾、贪狼-浪漫多情、七杀-敢爱敢恨）。
*   **婚姻质量预测：** 分析**夫妻宫**星曜，判断婚姻是和谐美满，还是多有争吵/波折？

**### 2. 【正缘特征画像】**
*   **另一半特征：** 详细描述未来伴侣的形象、性格、职业特征。
    *   *外貌：* 高矮胖瘦、气质类型。
    *   *性格：* 强势/温柔、开朗/内向。
    *   *能力/家境：* 对方的经济状况与社会地位。

**### 3. 【红鸾天喜与婚运时机】**
*   **遇见时机：** 预测何时能遇到正缘？（分析流年红鸾/天喜/夫妻宫化禄）。
*   **结婚时机：** 预测未来3-5年内，哪一年最适合结婚？

**### 4. 【经营建议与避坑指南】**
*   **潜在危机：** 指出星盘中可能影响婚姻的负面因素（如：寡宿、化忌、桃花煞）。
*   **相处之道：** 给出一对一的感情经营建议，如何化解矛盾，长久维系。

**--- 命主星盘数据 ---**
`;

const getTimeDescription = (time) => {
  const timeMap = {
    0: "早子时 (00:00-01:00)",
    1: "丑时 (01:00-03:00)",
    2: "寅时 (03:00-05:00)",
    3: "卯时 (05:00-07:00)",
    4: "辰时 (07:00-09:00)",
    5: "巳时 (09:00-11:00)",
    6: "午时 (11:00-13:00)",
    7: "未时 (13:00-15:00)",
    8: "申时 (15:00-17:00)",
    9: "酉时 (17:00-19:00)",
    10: "戌时 (19:00-21:00)",
    11: "亥时 (21:00-23:00)",
    12: "晚子时 (23:00-24:00)"
  };
  return timeMap[time] || "未知时辰";
};

const generateScumbagPrompt = (horoscope) => {
  try {
    // 🔍 完整调试信息
    console.log('🔍 完整horoscope对象:', horoscope);
    console.log('🔍 宫位数量:', horoscope.palaces ? horoscope.palaces.length : 'no palaces');

    // 输出所有宫位的详细信息
    if (horoscope.palaces) {
      horoscope.palaces.forEach((palace, index) => {
        console.log(`🔍 宫位${index}详情:`, {
          name: palace.name,
          majorStars: palace.majorStars,
          minorStars: palace.minorStars,
          adjectiveStars: palace.adjectiveStars,
          changeSummarize: palace.changeSummarize,
          stage: palace.stage
        });
      });
    }

    // 现在生成所有12宫的完整数据（不再只提取4宫）
    let scumbagData = "--- 渣男/渣女星盘真实数据 ---\n";

    if (!horoscope.palaces) {
      return "--- 渣男/渣女星盘真实数据 ---\n数据获取失败\n";
    }

    // 遍历所有12宫，输出完整星盘数据
    horoscope.palaces.forEach((palace, index) => {
      // 使用宫位的实际名称（从数据中获取），而不是我们预设的映射
      const palaceName = palace.name || `宫位${index}`;

      // 【关键修改】加入干支信息，以便AI推算飞星
      const stemBranch = `${palace.heavenlyStem}${palace.earthlyBranch}`;

      let palaceInfo = `- **${palaceName}(${stemBranch})**：`;
      let parts = [];

      // 提取主星
      if (palace.majorStars && palace.majorStars.length > 0) {
        const majorStarNames = palace.majorStars.map(star => {
          // 检查四化
          if (star.mutagen) {
            return `${star.name}(${star.mutagen})`;
          }
          return star.name;
        });
        parts.push(`主星[${majorStarNames.join('、')}]`);
      }

      // 提取辅星
      if (palace.minorStars && palace.minorStars.length > 0) {
        const minorStarNames = palace.minorStars.map(star => star.name);
        parts.push(`辅星[${minorStarNames.join('、')}]`);
      }

      // 提取形容星（包括煞星）
      if (palace.adjectiveStars && palace.adjectiveStars.length > 0) {
        const adjectiveNames = palace.adjectiveStars.map(star => star.name);
        parts.push(`杂曜[${adjectiveNames.join('、')}]`);
      }

      // 提取四化信息
      if (palace.changeSummarize && palace.changeSummarize.length > 0) {
        parts.push(`四化[${palace.changeSummarize.join('、')}]`);
      }

      // 提取长生十二神
      if (palace.stage) {
        parts.push(`长生[${palace.stage}]`);
      }

      if (parts.length > 0) {
        palaceInfo += parts.join('，');
      } else {
        palaceInfo += "空宫";
      }

      scumbagData += palaceInfo + "\n";
    });

    return scumbagData;
  } catch (error) {
    console.error('生成渣男数据失败:', error);
    return "--- 渣男/渣女星盘真实数据 ---\n数据提取失败，请检查星盘计算结果\n";
  }
};

const generateChartTextData = (birthday, birthTime, gender, calendarType, name) => {
  try {
    // 使用 iztro 库计算星盘
    const horoscope = calendarType === 'lunar'
      ? iztro.astro.astrolabeByLunarDate(birthday, birthTime, gender)
      : iztro.astro.astrolabeBySolarDate(birthday, birthTime, gender);

    // 宫位名称映射
    const palaceNames = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '事业', '田宅', '福德', '父母'];

    let chartText = `
**--- 渣男/渣女星盘数据 ---**

**基本信息：**
- 姓名：${name || '未填写'}
- 生日：${birthday}（${calendarType === 'lunar' ? '农历' : '阳历'}）
- 时辰：${getTimeDescription(birthTime)}
- 性别：${gender === 'male' ? '男' : '女'}

**十二宫位星曜配置：**`;

    // 遍历十二宫位
    horoscope.palaces.forEach((palace, index) => {
      const palaceName = palaceNames[index];
      chartText += `\n\n**${palaceName}：**`;

      // 主星
      if (palace.majorStars && palace.majorStars.length > 0) {
        chartText += `\n- 主星：${palace.majorStars.map(star => star.name).join('、')}`;
      }

      // 辅星
      if (palace.minorStars && palace.minorStars.length > 0) {
        chartText += `\n- 辅星：${palace.minorStars.map(star => star.name).join('、')}`;
      }

      // 煞星
      if (palace.adjectiveStars && palace.adjectiveStars.length > 0) {
        chartText += `\n- 煞星：${palace.adjectiveStars.map(star => star.name).join('、')}`;
      }

      // 四化
      if (palace.changeSummarize && palace.changeSummarize.length > 0) {
        chartText += `\n- 四化：${palace.changeSummarize.join('、')}`;
      }
    });

    chartText += `\n\n**--- 再次声明：所有分析内容【仅供娱乐参考】 ---**`;

    return chartText;
  } catch (error) {
    console.error('生成星盘数据失败:', error);
    return `
**--- 渣男/渣女星盘数据 ---**

**基本信息：**
- 姓名：${name || '未填写'}
- 生日：${birthday}（${calendarType === 'lunar' ? '农历' : '阳历'}）
- 时辰：${getTimeDescription(birthTime)}
- 性别：${gender === 'male' ? '男' : '女'}

**星盘生成失败，请检查输入信息是否正确**

**--- 再次声明：所有分析内容【仅供娱乐参考】 ---**`;
  }
};

export default function App() {
  const [view, setView] = useState('home');
  const [calendarType, setCalendarType] = useState('solar');
  const [gender, setGender] = useState('male');
  const [showChart, setShowChart] = useState(false);
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [birthTime, setBirthTime] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  React.useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  const handleShowChart = () => {
    if (!birthday.trim()) {
      alert('请输入生日');
      return;
    }
    setShowChart(true);
  };

  const handleCopyPrompt = async (type = 'scumbag') => {
    if (!birthday.trim()) {
      alert('请先输入生日信息并生成星盘');
      return;
    }

    try {
      // 计算 iztro 星盘数据
      const horoscope = calendarType === 'lunar'
        ? iztro.astro.astrolabeByLunarDate(birthday, birthTime, gender)
        : iztro.astro.astrolabeBySolarDate(birthday, birthTime, gender);

      // 使用新的 generateScumbagPrompt 函数提取关键数据
      const scumbagData = generateScumbagPrompt(horoscope);

      // 根据类型选择不同的提示词模板
      let template;
      if (type === 'wealth') {
        template = WEALTH_PROMPT_TEMPLATE;
      } else if (type === 'marriage') {
        template = MARRIAGE_PROMPT_TEMPLATE;
      } else {
        template = gender === 'female' ? FEMALE_PROMPT_TEMPLATE : AI_PROMPT_TEMPLATE;
      }

      // 组合完整的提示模板
      const fullPrompt = `${template}\n\n${scumbagData}`;

      // 尝试多种复制方法
      let copySuccess = false;

      // 方法1：现代浏览器的 navigator.clipboard
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(fullPrompt);
          copySuccess = true;
        } catch (clipboardErr) {
          console.log('Clipboard API failed:', clipboardErr);
        }
      }

      // 方法2：备用的 document.execCommand (兼容老浏览器)
      if (!copySuccess) {
        try {
          const textArea = document.createElement('textarea');
          textArea.value = fullPrompt;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          textArea.remove();
          copySuccess = true;
        } catch (execErr) {
          console.log('execCommand failed:', execErr);
        }
      }

      if (copySuccess) {
        let msg = '🎉 鉴渣话术模板已复制到剪贴板！';
        if (type === 'wealth') msg = '💰 财运分析模板已复制到剪贴板！';
        if (type === 'marriage') msg = '💍 姻缘分析模板已复制到剪贴板！';
        alert(msg + '\n\n请粘贴到ChatGPT或Claude中使用。');
      } else {
        // 显示内容让用户手动复制
        const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
        newWindow.document.write(`
          <html>
            <head><title>鉴渣话术模板 - 请手动复制</title></head>
            <body style="font-family: monospace; padding: 20px; line-height: 1.6;">
              <h2>🎯 鉴渣话术模板生成成功！</h2>
              <p><strong>说明：</strong>请全选下面的内容并复制到AI助手中使用</p>
              <hr>
              <pre style="white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 8px;">${fullPrompt}</pre>
              <hr>
              <button onclick="navigator.clipboard.writeText(document.querySelector('pre').textContent).then(()=>alert('复制成功！')).catch(()=>alert('请手动选择复制'))" style="padding: 10px 20px; background: #6d28d9; color: white; border: none; border-radius: 5px; cursor: pointer;">再次尝试复制</button>
            </body>
          </html>
        `);
      }

    } catch (err) {
      console.error('🚨 完整错误信息:', err);
      console.error('🚨 错误堆栈:', err.stack);
      console.log('🚨 输入参数:', { birthday, birthTime, gender, calendarType });

      // 测试iztro导入
      console.log('🧪 iztro对象:', iztro);
      console.log('🧪 iztro.astro:', iztro ? iztro.astro : 'undefined');

      // 测试astro函数是否能正常工作
      try {
        console.log('🧪 测试astro函数...');
        const testResult = iztro.astro.astrolabeBySolarDate('1996-06-14', 0, 'male');
        console.log('🧪 astro测试结果:', testResult);
      } catch (astroErr) {
        console.error('🚨 astro函数错误:', astroErr);
      }

      alert(`生成失败！\n错误：${err.message}\n请查看浏览器控制台获取详细信息`);
    }
  };

  if (view === 'home') {
    return (
      <div className="min-h-screen flex flex-col relative bg-[#050505] overflow-hidden font-['Orbitron']">
        {/* Cyberpunk Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

        {/* Neon Glow Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px] pointer-events-none"></div>

        <nav className="w-full px-8 py-6 fixed top-0 z-50 flex justify-between items-center">
          <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-widest drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
            古书派
          </div>
        </nav>

        <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
          <div className="relative w-full max-w-2xl mx-auto">
            <h1 className="text-5xl md:text-9xl font-black text-white tracking-tighter text-center leading-tight mix-blend-overlay opacity-50 select-none break-words">
              SCUMBAG<br />SCANNER
            </h1>
            <h1 className="absolute inset-0 text-5xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-transparent tracking-tighter text-center leading-tight select-none break-words" style={{ textShadow: '0 0 40px rgba(168,85,247,0.5)' }}>
              哥带你<br />识渣男
            </h1>
          </div>

          <p className="mt-8 text-cyan-300/80 text-sm md:text-lg tracking-[0.2em] md:tracking-[0.5em] font-bold uppercase text-center">System Online // 准备扫描</p>

          <button
            onClick={() => setView('chart')}
            className="group mt-12 md:mt-16 relative px-8 md:px-12 py-3 md:py-4 bg-black border border-cyan-500/50 text-cyan-400 text-lg md:text-xl font-bold uppercase tracking-widest overflow-hidden transition-all hover:border-cyan-400 hover:text-cyan-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] active:scale-95"
          >
            <div className="absolute inset-0 bg-cyan-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <span className="relative z-10 flex items-center gap-2">
              开始排盘 <ArrowLeft className="rotate-180" />
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative bg-[#050505] font-['Orbitron'] text-gray-200">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-5%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-cyan-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      <nav className="w-full px-4 md:px-6 py-4 flex justify-between items-center bg-black/40 backdrop-blur-xl border-b border-white/10 z-50 sticky top-0">
        <div className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 cursor-pointer tracking-widest" onClick={() => setView('home')}>
          古书派
        </div>
        <button onClick={() => setView('home')} className="text-[10px] md:text-xs text-cyan-500/70 hover:text-cyan-400 font-bold uppercase tracking-widest border border-cyan-900/50 px-3 md:px-4 py-1.5 md:py-2 rounded hover:bg-cyan-950/30 transition-all">
          返回首页
        </button>
      </nav>

      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        {/* Left Side: Chart Display (Top on mobile) */}
        <div className="flex-1 flex items-center justify-center relative overflow-auto p-2 md:p-4 min-h-[400px] md:min-h-0 order-2 md:order-1">
          {!showChart ? (
            <div className="text-center space-y-6 opacity-60 select-none animate-pulse hidden md:block">
              <div className="w-32 h-32 mx-auto border-2 border-dashed border-cyan-500/30 rounded-full flex items-center justify-center">
                <div className="w-24 h-24 bg-cyan-500/10 rounded-full animate-ping"></div>
              </div>
              <h2 className="text-4xl font-black text-white tracking-widest">等待数据输入</h2>
              <p className="text-cyan-400/60 text-sm font-mono">请输入目标参数以初始化扫描...</p>
            </div>
          ) : (
            <div className="w-full h-full max-w-4xl animate-in zoom-in-95 duration-500">
              <div className="w-full min-h-[400px] md:min-h-[600px] bg-slate-50/95 backdrop-blur-xl rounded-none border border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.2)] p-2 md:p-6 relative overflow-hidden text-slate-900">
                {/* Decorative Corner Lines */}
                <div className="absolute top-0 left-0 w-4 md:w-8 h-4 md:h-8 border-t-2 border-l-2 border-cyan-500"></div>
                <div className="absolute top-0 right-0 w-4 md:w-8 h-4 md:h-8 border-t-2 border-r-2 border-cyan-500"></div>
                <div className="absolute bottom-0 left-0 w-4 md:w-8 h-4 md:h-8 border-b-2 border-l-2 border-cyan-500"></div>
                <div className="absolute bottom-0 right-0 w-4 md:w-8 h-4 md:h-8 border-b-2 border-r-2 border-cyan-500"></div>

                <div className="overflow-x-auto">
                  <Iztrolabe
                    birthday={birthday || "2000-01-01"}
                    birthTime={birthTime}
                    gender={gender}
                    horoscope={{
                      birthday: birthday || "2000-01-01",
                      birthTime: birthTime,
                      gender: gender,
                      isLunar: calendarType === 'lunar'
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Control Panel (Bottom on mobile) */}
        <div className="w-full md:w-[400px] bg-[#0a0a0a]/90 backdrop-blur-xl border-t md:border-t-0 md:border-l border-white/10 shadow-2xl flex flex-col h-auto md:h-full overflow-y-auto z-20 relative order-1 md:order-2">
          <div className="p-6 md:p-8 space-y-6 md:space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-bold text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                日期类型
              </label>
              <div className="flex bg-black/50 p-1 rounded border border-white/10">
                <button
                  onClick={() => setCalendarType('solar')}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all ${calendarType === 'solar'
                    ? 'bg-cyan-900/50 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}
                >
                  阳历
                </button>
                <button
                  onClick={() => setCalendarType('lunar')}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all ${calendarType === 'lunar'
                    ? 'bg-purple-900/50 text-purple-300 border border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}
                >
                  农历
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                  他的生日
                </label>
                <div className="group relative">
                  <HelpCircle size={14} className="text-gray-600 hover:text-cyan-400 cursor-help transition-colors" />
                  <div className="absolute right-0 bottom-6 w-64 bg-black border border-cyan-500/30 text-cyan-300 text-xs p-3 shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    请输入YYYY-M-D格式的日期，阳历或农历格式一样，比如农历二〇〇〇年三月初四，请输入2000-3-4
                  </div>
                </div>
              </div>
              <input
                type="text"
                placeholder="YYYY-MM-DD"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 text-white placeholder-gray-700 outline-none focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all font-mono text-sm"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                {/* Fixed Layout: Increased width and nowrap to prevent truncation */}
                <label className="text-xs font-bold text-cyan-500 uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                  他的时辰
                </label>
                <div className="group relative">
                  <HelpCircle size={14} className="text-gray-600 hover:text-cyan-400 cursor-help transition-colors" />
                  <div className="absolute right-0 bottom-6 w-64 bg-black border border-cyan-500/30 text-cyan-300 text-xs p-3 shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    一天分为12个时辰，但是子时分为早子时和晚子时，请注意查看时间范围，时间范围包含起始时间但是不包含结束时间，比如01:00是丑时，03:00是寅时
                  </div>
                </div>
              </div>
              <div className="relative">
                <select
                  value={birthTime}
                  onChange={(e) => setBirthTime(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 text-white outline-none focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] appearance-none cursor-pointer font-mono text-sm transition-all hover:border-white/20"
                >
                  <option value={0}>早子时 (00:00-01:00)</option>
                  <option value={1}>丑时 (01:00-03:00)</option>
                  <option value={2}>寅时 (03:00-05:00)</option>
                  <option value={3}>卯时 (05:00-07:00)</option>
                  <option value={4}>辰时 (07:00-09:00)</option>
                  <option value={5}>巳时 (09:00-11:00)</option>
                  <option value={6}>午时 (11:00-13:00)</option>
                  <option value={7}>未时 (13:00-15:00)</option>
                  <option value={8}>申时 (15:00-17:00)</option>
                  <option value={9}>酉时 (17:00-19:00)</option>
                  <option value={10}>戌时 (19:00-21:00)</option>
                  <option value={11}>亥时 (21:00-23:00)</option>
                  <option value={12}>晚子时 (23:00-24:00)</option>
                </select>
                <div className="absolute right-4 top-3.5 text-cyan-500 pointer-events-none text-xs">▼</div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                他的名字
              </label>
              <input
                type="text"
                placeholder="请输入姓名（可选）"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 text-white placeholder-gray-700 outline-none focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all font-mono text-sm"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                对方性别
              </label>
              <div className="grid grid-cols-1 gap-3 pt-1">
                <label className={`relative flex items-center p-3 border cursor-pointer transition-all group ${gender === 'male' ? 'bg-cyan-950/30 border-cyan-500/50' : 'bg-black/50 border-white/10 hover:border-white/30'}`}>
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={gender === 'male'}
                    onChange={(e) => setGender(e.target.value)}
                    className="hidden"
                  />
                  <div className={`w-4 h-4 border flex items-center justify-center mr-3 transition-colors ${gender === 'male' ? 'border-cyan-400' : 'border-gray-600'}`}>
                    {gender === 'male' && <div className="w-2 h-2 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>}
                  </div>
                  <span className={`font-bold text-sm tracking-wider ${gender === 'male' ? 'text-cyan-300' : 'text-gray-500'}`}>男 (渣男鉴定)</span>
                </label>

                <label className={`relative flex items-center p-3 border cursor-pointer transition-all group ${gender === 'female' ? 'bg-pink-950/30 border-pink-500/50' : 'bg-black/50 border-white/10 hover:border-white/30'}`}>
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={gender === 'female'}
                    onChange={(e) => setGender(e.target.value)}
                    className="hidden"
                  />
                  <div className={`w-4 h-4 border flex items-center justify-center mr-3 transition-colors ${gender === 'female' ? 'border-pink-400' : 'border-gray-600'}`}>
                    {gender === 'female' && <div className="w-2 h-2 bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.8)]"></div>}
                  </div>
                  <span className={`font-bold text-sm tracking-wider ${gender === 'female' ? 'text-pink-300' : 'text-gray-500'}`}>女 (渣女鉴定)</span>
                </label>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleShowChart}
                className="w-full py-4 bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-black text-lg uppercase tracking-[0.2em] border border-white/20 shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] hover:border-cyan-400 transition-all active:scale-95 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative z-10">开始排盘</span>
              </button>
            </div>

            {showChart && (
              <div className="pt-6 border-t border-dashed border-white/20 animate-in slide-in-from-bottom-4 fade-in duration-500 space-y-3">
                <button
                  onClick={() => handleCopyPrompt('scumbag')}
                  className="w-full py-4 border border-dashed border-cyan-500/50 text-cyan-400 hover:bg-cyan-950/30 hover:border-cyan-400 hover:text-cyan-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all font-bold uppercase tracking-wider flex items-center justify-center gap-2 group"
                >
                  <Copy size={18} className="group-hover:rotate-12 transition-transform" />
                  <span>一键复制鉴渣话术</span>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleCopyPrompt('wealth')}
                    className="w-full py-3 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-950/30 hover:border-yellow-400 hover:text-yellow-300 hover:shadow-[0_0_20px_rgba(234,179,8,0.2)] transition-all font-bold uppercase tracking-wider flex items-center justify-center gap-2 group text-sm"
                  >
                    <Copy size={16} className="group-hover:rotate-12 transition-transform" />
                    <span>何时发财</span>
                  </button>
                  <button
                    onClick={() => handleCopyPrompt('marriage')}
                    className="w-full py-3 border border-pink-500/50 text-pink-400 hover:bg-pink-950/30 hover:border-pink-400 hover:text-pink-300 hover:shadow-[0_0_20px_rgba(236,72,153,0.2)] transition-all font-bold uppercase tracking-wider flex items-center justify-center gap-2 group text-sm"
                  >
                    <Copy size={16} className="group-hover:rotate-12 transition-transform" />
                    <span>何时结婚</span>
                  </button>
                </div>
              </div>
            )}

            <div className="pt-6 mt-auto border-t border-white/10">
              <button
                onClick={handleInstallClick}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs uppercase tracking-widest transition-all rounded flex items-center justify-center gap-2"
              >
                <span>📲 下载APP (防走丢)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Install Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowInstallModal(false)}>
          <div className="bg-[#111] border border-cyan-500/30 p-6 max-w-sm w-full relative shadow-[0_0_50px_rgba(6,182,212,0.2)]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowInstallModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-cyan-400">📲</span> 安装到手机
            </h3>
            <div className="space-y-4 text-sm text-gray-300">
              <p>为了获得最佳体验（全屏、离线使用），请将本应用添加到主屏幕。</p>

              <div className="bg-white/5 p-3 rounded border border-white/10">
                <strong className="text-white block mb-1">🍎 iOS (Safari浏览器):</strong>
                1. 点击底部工具栏的 <span className="text-cyan-400 font-bold">分享按钮</span><br />
                2. 下滑找到并点击 <span className="text-cyan-400 font-bold">"添加到主屏幕"</span>
              </div>

              <div className="bg-white/5 p-3 rounded border border-white/10">
                <strong className="text-white block mb-1">🤖 Android (Chrome浏览器):</strong>
                1. 点击右上角菜单 (⋮)<br />
                2. 点击 <span className="text-cyan-400 font-bold">"安装应用"</span> 或 <span className="text-cyan-400 font-bold">"添加到主屏幕"</span>
              </div>
            </div>
            <button onClick={() => setShowInstallModal(false)} className="w-full mt-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase tracking-wider transition-all">
              知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}