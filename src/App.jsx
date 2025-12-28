import React, { useState, Suspense, lazy } from 'react';
import ProfessionalChart from "./components/ProfessionalChart";
import ErrorBoundary from "./components/ErrorBoundary";
import { ArrowLeft, Save } from "lucide-react";
import * as iztro from "iztro";
import { archiveManager } from './utils/archiveManager';

// Lazy load the heavy components
const MoneyDivination = lazy(() => import("./components/MoneyDivination"));
const ArchiveView = lazy(() => import("./components/ArchiveView"));
const VideoLessons = lazy(() => import("./components/VideoLessons"));
const EnglishLearning = lazy(() => import("./components/EnglishLearning"));
const BaziDivination = lazy(() => import("./components/BaziDivination"));

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
  const [view, setView] = useState('home'); // 'home', 'input', 'chart', 'money', 'archive', 'videos', 'bazi'
  const [calendarType, setCalendarType] = useState('solar');
  const [gender, setGender] = useState('male');
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [birthTime, setBirthTime] = useState(0);
  const [horoscope, setHoroscope] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Archive Save Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveNote, setSaveNote] = useState('');
  const [saveGroup, setSaveGroup] = useState('friend');

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

  // --- Archive Logic ---

  const handleLoadRecord = (record) => {
    if (record.type === 'ziwei') {
      setName(record.name);
      setGender(record.gender);
      // Assuming stored date is solar for simplicity or we should store type
      // If the record has type 'lunar', we should handle that.
      // For now, let's assume we store the solar date string in saving logic
      setBirthday(record.solarDate);
      setBirthTime(record.timeHour);
      setCalendarType('solar');

      try {
        const newHoroscope = iztro.astro.astrolabeBySolarDate(record.solarDate, record.timeHour, record.gender);
        setHoroscope(newHoroscope);
        setView('chart');
      } catch (e) {
        alert('读取档案失败，数据可能损坏');
      }
    }
  };

  const handleSaveToArchive = () => {
    if (!horoscope) return;

    const newRecord = {
      name: name || '未命名',
      gender, // 'male' | 'female'
      type: 'ziwei',
      solarDate: birthday, // Current input state
      timeHour: birthTime,
      group: saveGroup,
      note: saveNote,
      data: {}
    };

    archiveManager.addRecord(newRecord);
    setIsSaveModalOpen(false);
    setSaveNote(''); // Reset
    alert('保存成功！');
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
            {view !== 'home' && (
              <button
                onClick={() => {
                  if (view === 'chart') setView('input');
                  else setView('home');
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
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
          <div className="flex items-center gap-3">
            {/* Archive Entry (Desktop/Mobile Header) */}
            {view === 'home' && (
              <button
                onClick={() => setView('archive')}
                className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
              >
                📂 档案
              </button>
            )}

            <button
              onClick={handleInstallClick}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-900/50 to-purple-900/50 border border-cyan-500/30 text-xs font-bold text-cyan-300 hover:border-cyan-400 transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)]"
            >
              📲 下载APP
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
        {view === 'home' ? (
          // --- HOME PORTAL VIEW ---
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8 animate-in fade-in zoom-in duration-500">
            <div className="text-center space-y-4 max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-orbitron">
                探索命运的玄机
              </h2>
              <p className="text-gray-400 text-lg">
                融合古老智慧与现代科技，为您揭示生命的奥秘。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-8">
              {/* Ziwei Entry Card */}
              <button
                onClick={() => setView('input')}
                className="group relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/40 to-black p-8 text-left transition-all hover:scale-[1.02] hover:border-purple-500/60 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]"
              >
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-all"></div>

                <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 group-hover:scale-110 transition-transform">
                    <span className="text-2xl">🔮</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">紫微斗数</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      排盘定命，洞察流年。通过生辰八字，全方位解析您的人生轨迹、事业财富与情感姻缘。
                    </p>
                  </div>
                  <div className="flex items-center text-purple-400 text-sm font-bold mt-2 group-hover:translate-x-2 transition-transform">
                    开始排盘 <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                  </div>
                </div>
              </button>

              {/* Money Divination Entry Card */}
              <button
                onClick={() => setView('money')}
                className="group relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-900/40 to-black p-8 text-left transition-all hover:scale-[1.02] hover:border-yellow-500/60 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]"
              >
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-yellow-500/20 rounded-full blur-3xl group-hover:bg-yellow-500/30 transition-all"></div>

                <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30 group-hover:scale-110 transition-transform">
                    {/* Chinese Copper Coin SVG */}
                    <svg viewBox="0 0 100 100" className="w-8 h-8 text-yellow-500 fill-current">
                      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="5" fill="none" />
                      <rect x="32" y="32" width="36" height="36" stroke="currentColor" strokeWidth="5" fill="none" />
                      <path d="M50 5 L50 25 M50 75 L50 95 M5 50 L25 50 M75 50 L95 50" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-yellow-300 transition-colors">金钱卦</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      六爻预测，指点迷津。针对具体财运、投资或决策问题，提供即时的占卜指引。
                    </p>
                  </div>
                  <div className="flex items-center text-yellow-400 text-sm font-bold mt-2 group-hover:translate-x-2 transition-transform">
                    立即占卜 <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                  </div>
                </div>
              </button>

              {/* Bazi Entry Card - NEW */}
              <button
                onClick={() => setView('bazi')}
                className="group relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-900/40 to-red-900/40 p-8 text-left transition-all hover:scale-[1.02] hover:border-orange-500/60 hover:shadow-[0_0_30px_rgba(249,115,22,0.3)]"
              >
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl group-hover:bg-orange-500/30 transition-all"></div>

                <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30 group-hover:scale-110 transition-transform">
                    <span className="text-2xl">🔥</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-orange-300 transition-colors">八字排盘</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      四柱八字，五行分析。通过生辰推演命格，洞察大运流年与人生轨迹。
                    </p>
                  </div>
                  <div className="flex items-center text-orange-400 text-sm font-bold mt-2 group-hover:translate-x-2 transition-transform">
                    立即排盘 <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                  </div>
                </div>
              </button>

              {/* English Learning Entry Card */}
              <button
                onClick={() => setView('english')}
                className="group relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-900/40 to-green-900/40 p-8 text-left transition-all hover:scale-[1.02] hover:border-blue-500/60 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]"
              >
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all"></div>

                <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 group-hover:scale-110 transition-transform">
                    <span className="text-2xl">📚</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">英语学习</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      AI驱动的英语学习平台，发音评估、智能对话、千小时进阶计划助您掌握英语。
                    </p>
                  </div>
                  <div className="flex items-center text-blue-400 text-sm font-bold mt-2 group-hover:translate-x-2 transition-transform">
                    开始学习 <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                  </div>
                </div>
              </button>

              {/* Video Lessons Entry Card */}
              <button
                onClick={() => setView('videos')}
                className="group relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-900/40 to-black p-8 text-left transition-all hover:scale-[1.02] hover:border-orange-500/60 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] md:col-span-3"
              >
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-red-500/20 rounded-full blur-3xl group-hover:bg-orange-500/30 transition-all"></div>

                <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30 group-hover:scale-110 transition-transform">
                      <span className="text-2xl">📹</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-orange-300 transition-colors">紫微课程</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        跟随古书派学习紫微斗数，从入门到精通，系统掌握命理玄学。
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-orange-400 text-sm font-bold group-hover:translate-x-2 transition-transform">
                    开始学习 <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                  </div>
                </div>
              </button>
              {/* Version Footer */}
              <div className="mt-8 text-center col-span-1 md:col-span-3">
                <p className="text-white/20 text-xs font-mono">v2025.12.09.Archive</p>
                <button
                  onClick={() => {
                    if (window.confirm('确定要清除所有缓存并强制更新吗？')) {
                      if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.getRegistrations().then(function (registrations) {
                          for (let registration of registrations) registration.unregister();
                          window.location.reload();
                        });
                      } else {
                        window.location.reload();
                      }
                    }
                  }}
                  className="mt-2 text-cyan-500/50 text-[10px] hover:text-cyan-400 underline cursor-pointer"
                >
                  强制更新 / Force Update
                </button>
              </div>
            </div>
          </div>
        ) : view === 'input' ? (
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
        ) : view === 'money' ? (
          // --- MONEY DIVINATION VIEW ---
          <ErrorBoundary>
            <Suspense fallback={
              <div className="flex-1 flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p>正在加载 3D 引擎...</p>
                </div>
              </div>
            }>
              <MoneyDivination onBack={() => setView('home')} />
            </Suspense>
          </ErrorBoundary>
        ) : view === 'archive' ? (
          // --- ARCHIVE VIEW ---
          <Suspense fallback={<div className="text-white p-10 text-center">Loading Archive...</div>}>
            <ArchiveView
              onBack={() => setView('home')}
              onLoadRecord={handleLoadRecord}
            />
          </Suspense>
        ) : view === 'videos' ? (
          // --- VIDEO LESSONS VIEW ---
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center text-white">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p>正在加载课程...</p>
              </div>
            </div>
          }>
            <VideoLessons onBack={() => setView('home')} />
          </Suspense>
        ) : view === 'english' ? (
          // --- ENGLISH LEARNING VIEW ---
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center text-white">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p>正在加载英语模块...</p>
              </div>
            </div>
          }>
            <EnglishLearning onBack={() => setView('home')} />
          </Suspense>
        ) : view === 'bazi' ? (
          // --- BAZI DIVINATION VIEW ---
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center text-white">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p>正在加载八字模块...</p>
              </div>
            </div>
          }>
            <BaziDivination onBack={() => setView('home')} />
          </Suspense>
        ) : (
          // --- CHART VIEW ---
          <div className="flex-1 relative overflow-hidden flex flex-col">
            {/* Chart Area */}
            <div className="flex-1 overflow-auto p-2 md:p-4 pb-24">
              <div className="max-w-3xl mx-auto bg-slate-50/95 rounded-lg overflow-hidden shadow-2xl border border-cyan-500/30 relative">

                <ProfessionalChart
                  horoscope={horoscope}
                  basicInfo={{
                    name,
                    gender,
                    birthday,
                    birthTime: getTimeDescription(birthTime),
                    lunarDate: horoscope?.lunarDate
                  }}
                  onSave={() => setIsSaveModalOpen(true)}
                  onOpenArchive={() => setView('archive')}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Save Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            onClick={() => setIsSaveModalOpen(false)}
          ></div>

          <div className="relative bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Save className="w-5 h-5 text-cyan-500" />
                保存到档案
              </h3>
              <button onClick={() => setIsSaveModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">✕</button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">姓名</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500/50 transition-all outline-none"
                placeholder="请输入姓名"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">分组</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'self', label: '自己' },
                  { id: 'father', label: '父亲' },
                  { id: 'mother', label: '母亲' },
                  { id: 'son', label: '儿子' },
                  { id: 'daughter', label: '女儿' },
                  { id: 'girlfriend', label: '女友' },
                  { id: 'boyfriend', label: '男友' },
                  { id: 'other', label: '其他' }
                ].map(g => (
                  <button
                    key={g.id}
                    onClick={() => setSaveGroup(g.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${saveGroup === g.id
                      ? 'bg-cyan-900/50 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/20'
                      }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">备注</label>
              <textarea
                value={saveNote}
                onChange={e => setSaveNote(e.target.value)}
                placeholder="备注信息..."
                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white h-24 text-sm resize-none focus:border-cyan-500/50 transition-all outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setIsSaveModalOpen(false)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-sm font-bold transition-all">取消</button>
              <button onClick={handleSaveToArchive} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold shadow-lg shadow-cyan-500/20 transition-all">确认保存</button>
            </div>
          </div>
        </div>
      )}

      {/* PWA Install Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
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
      )}
    </div>
  );
}