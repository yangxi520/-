import React, { useState } from 'react';
import ProfessionalChart from "./components/ProfessionalChart";
import { ArrowLeft } from "lucide-react";
import * as iztro from "iztro";

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

export default function App() {
  const [view, setView] = useState('input'); // 'input' or 'chart'
  const [calendarType, setCalendarType] = useState('solar');
  const [gender, setGender] = useState('male');
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [birthTime, setBirthTime] = useState(0);
  const [horoscope, setHoroscope] = useState(null);
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

  const handleStartScan = () => {
    if (!birthday) {
      alert('请输入生日');
      return;
    }
    try {
      const newHoroscope = calendarType === 'lunar'
        ? iztro.astro.astrolabeByLunarDate(birthday, birthTime, gender)
        : iztro.astro.astrolabeBySolarDate(birthday, birthTime, gender);
      setHoroscope(newHoroscope);
      setView('chart');
    } catch (error) {
      console.error("Error generating horoscope:", error);
      alert("生成星盘失败，请检查日期和时间格式是否正确。");
      setHoroscope(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 font-sans selection:bg-cyan-500/30 overflow-hidden flex flex-col">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {view === 'chart' && (
              <button onClick={() => setView('input')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-cyan-400" />
              </button>
            )}
            <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <span className="text-lg font-black text-white font-orbitron">古</span>
            </div>
            <h1 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 font-orbitron">
              古书派·紫微
            </h1>
          </div>
          <button
            onClick={handleInstallClick}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-900/50 to-purple-900/50 border border-cyan-500/30 text-xs font-bold text-cyan-300 hover:border-cyan-400 transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)]"
          >
            📲 下载APP
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
        {view === 'input' ? (
          // --- INPUT VIEW ---
          <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-md bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-6 md:p-8 space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white">开启您的紫微之旅</h2>
                <p className="text-gray-400 text-sm">输入生辰，洞察命运玄机</p>
              </div>

              {/* Date Type */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-cyan-500 uppercase tracking-widest">日期类型</label>
                <div className="flex bg-black/50 p-1 rounded border border-white/10">
                  <button onClick={() => setCalendarType('solar')} className={`flex-1 py-2 text-xs font-bold transition-all rounded ${calendarType === 'solar' ? 'bg-cyan-900/50 text-cyan-300 border border-cyan-500/50' : 'text-gray-500'}`}>阳历</button>
                  <button onClick={() => setCalendarType('lunar')} className={`flex-1 py-2 text-xs font-bold transition-all rounded ${calendarType === 'lunar' ? 'bg-purple-900/50 text-purple-300 border border-purple-500/50' : 'text-gray-500'}`}>农历</button>
                </div>
              </div>

              {/* Birthday Input */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-cyan-500 uppercase tracking-widest">出生日期</label>
                <input type="text" placeholder="YYYY-MM-DD" value={birthday} onChange={(e) => setBirthday(e.target.value)} className="w-full px-4 py-3 bg-black/50 border border-white/10 text-white rounded outline-none focus:border-cyan-500/50 transition-all font-mono text-sm" />
              </div>

              {/* Birth Time Input */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-cyan-500 uppercase tracking-widest">出生时辰</label>
                <select value={birthTime} onChange={(e) => setBirthTime(Number(e.target.value))} className="w-full px-4 py-3 bg-black/50 border border-white/10 text-white rounded outline-none focus:border-cyan-500/50 transition-all font-mono text-sm appearance-none cursor-pointer">
                  {Array.from({ length: 13 }).map((_, i) => (
                    <option key={i} value={i}>{getTimeDescription(i)}</option>
                  ))}
                </select>
              </div>

              {/* Name Input */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-cyan-500 uppercase tracking-widest">您的姓名</label>
                <input type="text" placeholder="请输入姓名" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 bg-black/50 border border-white/10 text-white rounded outline-none focus:border-cyan-500/50 transition-all text-sm" />
              </div>

              {/* Gender Input */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-cyan-500 uppercase tracking-widest">您的性别</label>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setGender('male')} className={`py-3 border rounded transition-all flex items-center justify-center gap-2 ${gender === 'male' ? 'bg-cyan-900/20 border-cyan-500 text-cyan-400' : 'bg-black/50 border-white/10 text-gray-500'}`}>
                    <span className="font-bold">男</span>
                  </button>
                  <button onClick={() => setGender('female')} className={`py-3 border rounded transition-all flex items-center justify-center gap-2 ${gender === 'female' ? 'bg-pink-900/20 border-pink-500 text-pink-400' : 'bg-black/50 border-white/10 text-gray-500'}`}>
                    <span className="font-bold">女</span>
                  </button>
                </div>
              </div>

              {/* Start Button */}
              <button onClick={handleStartScan} className="w-full py-4 bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-bold text-lg uppercase tracking-widest hover:from-cyan-500 hover:to-purple-500 transition-all shadow-lg shadow-cyan-500/20 rounded">
                开始排盘
              </button>
            </div>
          </div>
        ) : (
          // --- CHART VIEW ---
          <div className="flex-1 relative overflow-hidden flex flex-col">
            {/* Chart Area */}
            <div className="flex-1 overflow-auto p-2 md:p-4 pb-24">
              <div className="max-w-3xl mx-auto bg-slate-50/95 rounded-lg overflow-hidden shadow-2xl border border-cyan-500/30">
                <ProfessionalChart
                  horoscope={horoscope}
                  basicInfo={{
                    name,
                    gender,
                    birthday,
                    birthTime: getTimeDescription(birthTime),
                    lunarDate: horoscope?.lunarDate
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* PWA Install Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111] border border-cyan-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
            <button onClick={() => setShowInstallModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">📲</span> 安装 App
            </h3>
            <div className="space-y-4 text-sm text-gray-300">
              <p>为了获得最佳体验（全屏、离线使用），请将本应用添加到主屏幕。</p>
              <div className="bg-white/5 p-3 rounded border border-white/10">
                <p className="font-bold text-cyan-400 mb-1">🍎 iOS (Safari):</p>
                <p>点击底部中间的分享按钮 <span className="inline-block border border-gray-500 px-1 rounded">⎋</span>，然后选择 <span className="font-bold text-white">"添加到主屏幕"</span>。</p>
              </div>
              <div className="bg-white/5 p-3 rounded border border-white/10">
                <p className="font-bold text-green-400 mb-1">🤖 Android (Chrome):</p>
                <p>点击右上角菜单 <span className="font-bold text-white">⋮</span>，然后选择 <span className="font-bold text-white">"安装应用"</span> 或 <span className="font-bold text-white">"添加到主屏幕"</span>。</p>
              </div>
            </div>
            <button onClick={() => setShowInstallModal(false)} className="w-full mt-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded transition-colors">
              知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}