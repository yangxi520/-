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
    let scumbagData = "--- 渣男星盘真实数据 ---\n";

    if (!horoscope.palaces) {
      return "--- 渣男星盘真实数据 ---\n数据获取失败\n";
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
    return "--- 渣男星盘真实数据 ---\n数据提取失败，请检查星盘计算结果\n";
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
**--- 渣男星盘数据 ---**

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
**--- 渣男星盘数据 ---**

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

  const handleShowChart = () => {
    if (!birthday.trim()) {
      alert('请输入生日');
      return;
    }
    setShowChart(true);
  };

  const handleCopyPrompt = async () => {
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

      // 组合完整的提示模板
      const fullPrompt = `${AI_PROMPT_TEMPLATE}\n\n${scumbagData}`;

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
        alert('🎉 鉴渣话术模板已复制到剪贴板！\n\n请粘贴到ChatGPT或Claude中使用。');
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
      <div className="min-h-screen flex flex-col relative">
        <nav className="w-full px-8 py-6 fixed top-0 z-50">
          <div className="text-2xl font-black text-[#6d28d9] tracking-tight">古书派</div>
        </nav>
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#c4b5fd] to-[#7c3aed] select-none tracking-tighter text-center leading-tight" style={{ filter: 'drop-shadow(0 4px 0px rgba(168,85,247,0.1))' }}>
            哥带你<br />识渣男
          </h1>
          <button onClick={() => setView('chart')} className="mt-16 px-16 py-4 bg-[#6d28d9] text-white text-2xl font-bold rounded-full shadow-xl hover:bg-[#5b21b6] hover:-translate-y-1 transition-all active:scale-95">
            排 盘
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <nav className="w-full px-6 py-4 flex justify-between items-center bg-white/60 backdrop-blur-md border-b border-white/40 z-50">
        <div className="text-xl font-black text-[#6d28d9] cursor-pointer" onClick={() => setView('home')}>古书派</div>
        <button onClick={() => setView('home')} className="text-sm text-gray-500 hover:text-[#6d28d9] font-medium transition-colors">返回首页</button>
      </nav>

      <div className="flex-1 flex relative overflow-hidden">
        <div className="flex-1 flex items-center justify-center relative bg-white/30 overflow-auto">
          {!showChart ? (
            <div className="text-center space-y-4 opacity-40 select-none">
              <h2 className="text-6xl font-black text-gray-300 tracking-tighter">哥带你<br />识渣男</h2>
              <p className="text-[#8b5cf6] text-lg font-medium tracking-wide">输入信息 → 点击排盘 → 获取真相</p>
            </div>
          ) : (
            <div className="w-full h-full p-4 animate-in zoom-in-95 duration-500 overflow-auto">
              <div className="w-full min-h-[600px] bg-white rounded-3xl shadow-2xl p-4 border border-white/50">
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
          )}
        </div>

        <div className="w-[400px] bg-[#fcfbf9] border-l border-white/60 shadow-2xl flex flex-col h-full overflow-y-auto z-20 relative">
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 flex gap-1"><span className="text-red-500">*</span> 日期类型</label>
              <div className="flex bg-white p-1.5 rounded-xl border border-gray-200/80 shadow-sm">
                <button
                  onClick={() => setCalendarType('solar')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${calendarType === 'solar'
                      ? 'bg-[#6d28d9] text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  阳历
                </button>
                <button
                  onClick={() => setCalendarType('lunar')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${calendarType === 'lunar'
                      ? 'bg-[#6d28d9] text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  农历
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-bold text-gray-500 flex gap-1"><span className="text-red-500">*</span> 他的生日</label>
                <div className="group relative flex items-center">
                  <HelpCircle size={14} className="text-gray-400 cursor-help hover:text-[#6d28d9]" style={{ cursor: 'help' }} />
                  <div className="absolute left-0 bottom-6 w-80 bg-gray-800 text-white text-xs p-3 rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    请输入YYYY-M-D格式的日期，阳历或农历格式一样，比如农历二〇〇〇年三月初四，请输入2000-3-4
                  </div>
                </div>
              </div>
              <input
                type="text"
                placeholder="1995-08-20"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#6d28d9] focus:ring-4 focus:ring-[#6d28d9]/5"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-bold text-gray-500 flex gap-1"><span className="text-red-500">*</span> 他的时辰</label>
                <div className="group relative flex items-center">
                  <HelpCircle size={14} className="text-gray-400 cursor-help hover:text-[#6d28d9]" style={{ cursor: 'help' }} />
                  <div className="absolute left-0 bottom-6 w-80 bg-gray-800 text-white text-xs p-3 rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    一天分为12个时辰，但是子时分为早子时和晚子时，请注意查看时间范围，时间范围包含起始时间但是不包含结束时间，比如01:00是丑时，03:00是寅时
                  </div>
                </div>
              </div>
              <div className="relative">
                <select
                  value={birthTime}
                  onChange={(e) => setBirthTime(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#6d28d9] focus:ring-4 focus:ring-[#6d28d9]/5 appearance-none cursor-pointer"
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
                <div className="absolute right-4 top-3.5 text-gray-400 pointer-events-none">▼</div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500">他的名字</label>
              <input
                type="text"
                placeholder="请输入姓名（可选）"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#6d28d9] focus:ring-4 focus:ring-[#6d28d9]/5"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 flex gap-1"><span className="text-red-500">*</span> 对方性别</label>
              <div className="flex gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={gender === 'male'}
                    onChange={(e) => setGender(e.target.value)}
                    className="hidden"
                  />
                  <div className="w-5 h-5 rounded-full border-2 border-[#6d28d9] flex items-center justify-center">
                    {gender === 'male' && <div className="w-2.5 h-2.5 rounded-full bg-[#6d28d9]"></div>}
                  </div>
                  <span className="text-gray-600 font-medium">男 (渣男鉴定)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={gender === 'female'}
                    onChange={(e) => setGender(e.target.value)}
                    className="hidden"
                  />
                  <div className="w-5 h-5 rounded-full border-2 border-[#6d28d9] flex items-center justify-center">
                    {gender === 'female' && <div className="w-2.5 h-2.5 rounded-full bg-[#6d28d9]"></div>}
                  </div>
                  <span className="text-gray-600 font-medium">女</span>
                </label>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleShowChart}
                className="w-full py-4 bg-gradient-to-r from-[#6d28d9] to-[#5b21b6] text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
              >
                排 盘
              </button>
            </div>

            {showChart && (
              <div className="pt-6 border-t-2 border-dashed border-gray-200 animate-in slide-in-from-bottom-4 fade-in duration-500 space-y-3">
                <button
                  onClick={handleCopyPrompt}
                  className="w-full py-4 border-2 border-dashed border-[#6d28d9] text-[#6d28d9] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#6d28d9]/5 transition-all"
                >
                  <Copy size={20} /> 一键复制鉴渣话术
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}