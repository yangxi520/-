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
  const [saveGroup, setSaveGroup] = useState('self');

  React.useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  React.useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return;
      if (showInstallModal) setShowInstallModal(false);
      if (isSaveModalOpen) setIsSaveModalOpen(false);
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showInstallModal, isSaveModalOpen]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
      } catch (error) {
        console.warn('Native install prompt unavailable:', error);
        setShowInstallModal(true);
      } finally {
        // A BeforeInstallPromptEvent can only be consumed once, including when
        // the user dismisses it. Future clicks should show the manual guide.
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
      // Records created before calendarType/birthDate existed were always
      // reloaded as solar dates. Keep that fallback while preserving the
      // original calendar for all newly saved records.
      const recordCalendarType = record.calendarType === 'lunar' ? 'lunar' : 'solar';
      const recordBirthDate = record.birthDate || record.solarDate;
      const recordBirthTime = Number(record.timeHour) || 0;
      const recordGender = record.gender === 'female' ? 'female' : 'male';

      if (!recordBirthDate) {
        alert('读取档案失败，缺少出生日期');
        return;
      }

      try {
        const newHoroscope = recordCalendarType === 'lunar'
          ? iztro.astro.astrolabeByLunarDate(recordBirthDate, recordBirthTime, recordGender)
          : iztro.astro.astrolabeBySolarDate(recordBirthDate, recordBirthTime, recordGender);

        setName(record.name || '');
        setGender(recordGender);
        setBirthday(recordBirthDate);
        setBirthTime(recordBirthTime);
        setCalendarType(recordCalendarType);
        setHoroscope(newHoroscope);
        setView('chart');
      } catch {
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
      calendarType,
      birthDate: birthday,
      // Keep the legacy field so existing archive-list displays and exports
      // remain compatible. Loading now uses birthDate + calendarType first.
      solarDate: birthday,
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

  const usesOwnHeader = ['money', 'bazi', 'videos', 'english'].includes(view);

  return (
    <div className="app-shell">
      <div className="app-ambient" aria-hidden="true"></div>

      {/* Header */}
      {!usesOwnHeader && <header className="app-header">
        <div className="header-inner">
          <div className="brand-lockup">
            {view !== 'home' && (
              <button
                type="button"
                aria-label={view === 'chart' ? '返回生辰输入' : '返回首页'}
                onClick={() => {
                  if (view === 'chart') setView('input');
                  else setView('home');
                }}
                className="icon-button"
              >
                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
            <div className="brand-seal" aria-hidden="true">古</div>
            <div className="brand-copy">
              <h1 className="brand-name">古书派·紫微</h1>
              <p className="brand-caption">传统命理 · 当代排盘</p>
            </div>
          </div>
          <nav className="header-actions" aria-label="快捷入口">
            {view === 'home' && (
              <button
                type="button"
                aria-label="打开命盘档案"
                onClick={() => setView('archive')}
                className="header-action header-action--archive"
              >
                <span aria-hidden="true">册</span>
                <span className="archive-label">我的档案</span>
              </button>
            )}

            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={showInstallModal}
              onClick={handleInstallClick}
              className="header-action header-action--install"
            >
              <span aria-hidden="true">＋</span>
              {deferredPrompt ? '安装到手机' : '添加到主屏幕'}
            </button>
          </nav>
        </div>
      </header>}

      {/* Main Content */}
      <main className="app-main">
        {view === 'home' ? (
          // --- HOME PORTAL VIEW ---
          <div className="home-page animate-in fade-in duration-500">
            <section className="home-hero" aria-labelledby="home-title">
              <p className="section-kicker">古法为体 · 数理为用</p>
              <h2 id="home-title" className="home-title">
                以星曜为镜，<em>观人生脉络</em>
              </h2>
              <p className="home-subtitle">
                从一张命盘开始，查看本命格局、大限与流年。传统术数，用更清晰的方式呈现。
              </p>
              <div className="home-assurances" aria-label="产品特点">
                <span className="assurance-chip">专业命盘</span>
                <span className="assurance-chip">运限推演</span>
                <span className="assurance-chip">AI 辅助解读</span>
              </div>
            </section>

            <section aria-label="核心功能">
              <button
                type="button"
                aria-label="进入紫微斗数专业排盘"
                onClick={() => setView('input')}
                className="primary-destiny-card"
              >
                <div className="primary-card-copy">
                  <p className="card-overline">主入口 · 紫微斗数</p>
                  <h3 className="primary-card-title">紫微斗数专业排盘</h3>
                  <p className="primary-card-description">
                    输入出生年月日与时辰，生成十二宫命盘；继续查看大限、流年、流月、流日与 AI 解读。
                  </p>
                  <ul className="primary-card-features" aria-hidden="true">
                    <li>本命十二宫</li>
                    <li>大限流年</li>
                    <li>命理话术</li>
                  </ul>
                  <span className="primary-card-cta">
                    输入生辰，开始排盘 <span aria-hidden="true">→</span>
                  </span>
                </div>
                <div className="destiny-orbit" aria-hidden="true">
                  <span className="orbit-label orbit-label--top">天</span>
                  <span className="orbit-label orbit-label--right">命</span>
                  <span className="orbit-label orbit-label--bottom">地</span>
                  <span className="orbit-label orbit-label--left">运</span>
                  <span className="orbit-center">紫微</span>
                </div>
              </button>
            </section>

            <div className="section-heading">
              <h3>更多术数工具</h3>
              <p>按你的问题，选择合适的推演方式</p>
            </div>

            <section className="secondary-tools" aria-label="术数工具">
              <button
                type="button"
                onClick={() => setView('bazi')}
                className="tool-card tool-card--cinnabar"
              >
                <span className="tool-card-copy">
                  <span className="tool-card-eyebrow">四柱 · 五行</span>
                  <span className="tool-card-title">八字排盘</span>
                  <span className="tool-card-description">以年、月、日、时四柱，查看十神、五行与大运流年。</span>
                  <span className="tool-card-action">进入排盘 <span aria-hidden="true">→</span></span>
                </span>
                <span className="tool-symbol" aria-hidden="true">柱</span>
              </button>

              <button
                type="button"
                onClick={() => setView('money')}
                className="tool-card"
              >
                <span className="tool-card-copy">
                  <span className="tool-card-eyebrow">一事一问 · 即时起卦</span>
                  <span className="tool-card-title">金钱卦</span>
                  <span className="tool-card-description">针对财运、选择与具体问题，模拟摇卦并查看卦象提示。</span>
                  <span className="tool-card-action">立即起卦 <span aria-hidden="true">→</span></span>
                </span>
                <span className="tool-symbol" aria-hidden="true">卦</span>
              </button>
            </section>

            <div className="section-heading">
              <h3>我的内容</h3>
              <p>档案与学习功能</p>
            </div>

            <nav className="quiet-links" aria-label="档案与学习">
              <button type="button" onClick={() => setView('archive')} className="quiet-link">
                <span className="quiet-link-icon" aria-hidden="true">册</span>
                <span className="quiet-link-copy">
                  <span className="quiet-link-title">命盘档案</span>
                  <span className="quiet-link-caption">查看已保存的人物命盘</span>
                </span>
                <span className="quiet-link-arrow" aria-hidden="true">›</span>
              </button>
              <button type="button" onClick={() => setView('videos')} className="quiet-link">
                <span className="quiet-link-icon" aria-hidden="true">学</span>
                <span className="quiet-link-copy">
                  <span className="quiet-link-title">紫微课程</span>
                  <span className="quiet-link-caption">从基础概念到实盘解析</span>
                </span>
                <span className="quiet-link-arrow" aria-hidden="true">›</span>
              </button>
              <button type="button" onClick={() => setView('english')} className="quiet-link">
                <span className="quiet-link-icon" aria-hidden="true">EN</span>
                <span className="quiet-link-copy">
                  <span className="quiet-link-title">英语学习</span>
                  <span className="quiet-link-caption">发音评估与智能对话</span>
                </span>
                <span className="quiet-link-arrow" aria-hidden="true">›</span>
              </button>
            </nav>

            <footer className="home-footer">
              <p>v2026.08.22.Jade-UI</p>
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('确定要清除所有缓存并强制更新吗？')) {
                    try {
                      if ('serviceWorker' in navigator) {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        await Promise.all(registrations.map((registration) => registration.unregister()));
                      }
                      if ('caches' in window) {
                        const cacheNames = await window.caches.keys();
                        await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
                      }
                    } finally {
                      const refreshUrl = new URL(window.location.href);
                      refreshUrl.searchParams.set('refresh', Date.now().toString());
                      window.location.replace(refreshUrl.toString());
                    }
                  }
                }}
                className="force-update-button"
              >
                页面显示异常？清除缓存并更新
              </button>
            </footer>
          </div>
        ) : view === 'input' ? (
          // --- INPUT VIEW ---
          <div className="input-page animate-in fade-in duration-500">
            <section className="input-panel" aria-labelledby="birth-form-title">
              <header className="input-panel-header">
                <p className="input-panel-eyebrow">紫微斗数 · 生辰排盘</p>
                <h2 id="birth-form-title" className="panel-title">请录入生辰</h2>
                <p className="panel-subtitle">日期与时辰会影响命宫及星曜位置，请按出生资料准确填写。</p>
              </header>

              <form
                className="birth-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleStartScan();
                }}
              >
                <fieldset className="form-fieldset">
                  <legend className="field-legend">历法</legend>
                  <div className="segmented-control" aria-label="选择出生日期历法">
                    <button
                      type="button"
                      aria-pressed={calendarType === 'solar'}
                      onClick={() => setCalendarType('solar')}
                      className="segment-button"
                    >
                      阳历
                    </button>
                    <button
                      type="button"
                      aria-pressed={calendarType === 'lunar'}
                      onClick={() => setCalendarType('lunar')}
                      className="segment-button"
                    >
                      农历
                    </button>
                  </div>
                </fieldset>

                <div className="form-fieldset">
                  <label htmlFor="birth-date" className="field-label">出生日期</label>
                  <input
                    id="birth-date"
                    type={calendarType === 'solar' ? 'date' : 'text'}
                    inputMode={calendarType === 'lunar' ? 'numeric' : undefined}
                    placeholder={calendarType === 'solar' ? 'YYYY-MM-DD' : '例如：1990-08-15'}
                    value={birthday}
                    onChange={(event) => setBirthday(event.target.value)}
                    aria-describedby="birth-date-hint"
                    className="field-control"
                    autoComplete="bday"
                    required
                  />
                  <p
                    id="birth-date-hint"
                    className={`field-hint ${calendarType === 'lunar' ? 'field-hint--warning' : ''}`}
                  >
                    {calendarType === 'solar'
                      ? '请选择公历出生日期。'
                      : '请按 YYYY-MM-DD 输入农历日期；当前不支持闰月标记。'}
                  </p>
                </div>

                <div className="form-fieldset">
                  <label htmlFor="birth-time" className="field-label">出生时辰</label>
                  <select
                    id="birth-time"
                    value={birthTime}
                    onChange={(event) => setBirthTime(Number(event.target.value))}
                    aria-describedby="birth-time-hint"
                    className="field-control"
                  >
                    {Array.from({ length: 13 }).map((_, i) => (
                      <option key={i} value={i}>{getTimeDescription(i)}</option>
                    ))}
                  </select>
                  <p id="birth-time-hint" className="field-hint">23:00 后请选择“晚子时”，00:00 后请选择“早子时”。</p>
                </div>

                <div className="form-fieldset">
                  <label htmlFor="birth-name" className="field-label">
                    姓名<span className="field-optional">选填</span>
                  </label>
                  <input
                    id="birth-name"
                    type="text"
                    placeholder="用于区分命盘档案"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="field-control"
                    autoComplete="name"
                  />
                </div>

                <fieldset className="form-fieldset">
                  <legend className="field-legend">性别</legend>
                  <div className="choice-grid">
                    <button
                      type="button"
                      aria-pressed={gender === 'male'}
                      onClick={() => setGender('male')}
                      className="choice-button"
                    >
                      男命
                    </button>
                    <button
                      type="button"
                      aria-pressed={gender === 'female'}
                      onClick={() => setGender('female')}
                      className="choice-button"
                    >
                      女命
                    </button>
                  </div>
                </fieldset>

                <button type="submit" className="submit-button">生成紫微命盘</button>
                <p className="privacy-note">
                  <span aria-hidden="true">◇</span>
                  生辰资料仅用于本次排盘；只有主动保存档案后，才会存入当前设备的浏览器。
                </p>
              </form>
            </section>
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
            <div className="chart-scroll-area flex-1 overflow-auto p-2 md:p-4">
              <div className="max-w-3xl mx-auto bg-slate-50/95 rounded-lg overflow-hidden shadow-2xl border border-emerald-700/30 relative">

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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 safe-modal-padding">
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            onClick={() => setIsSaveModalOpen(false)}
          ></div>

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-dialog-title"
            className="relative bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200"
          >
            <div className="flex justify-between items-center">
              <h3 id="save-dialog-title" className="text-xl font-bold text-white flex items-center gap-2">
                <Save className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                保存到档案
              </h3>
              <button type="button" aria-label="关闭保存档案弹窗" onClick={() => setIsSaveModalOpen(false)} className="min-w-11 min-h-11 text-gray-500 hover:text-white transition-colors">✕</button>
            </div>

            <div className="space-y-2">
              <label htmlFor="archive-name" className="text-xs font-bold text-gray-500 uppercase tracking-widest">姓名</label>
              <input
                id="archive-name"
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
                    type="button"
                    key={g.id}
                    onClick={() => setSaveGroup(g.id)}
                    aria-pressed={saveGroup === g.id}
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
              <label htmlFor="archive-note" className="text-xs font-bold text-gray-500 uppercase tracking-widest">备注</label>
              <textarea
                id="archive-note"
                value={saveNote}
                onChange={e => setSaveNote(e.target.value)}
                placeholder="备注信息..."
                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white h-24 text-sm resize-none focus:border-cyan-500/50 transition-all outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setIsSaveModalOpen(false)} className="flex-1 min-h-11 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-sm font-bold transition-all">取消</button>
              <button type="button" onClick={handleSaveToArchive} className="flex-1 min-h-11 py-3 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-bold shadow-lg shadow-emerald-950/30 transition-all">确认保存</button>
            </div>
          </section>
        </div>
      )}

      {/* PWA Install Modal */}
      {showInstallModal && (
        <div
          className="modal-overlay animate-in fade-in duration-200"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowInstallModal(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-dialog-title"
            aria-describedby="install-dialog-description"
            className="install-dialog"
          >
            <button
              type="button"
              aria-label="关闭添加到主屏幕说明"
              onClick={() => setShowInstallModal(false)}
              className="install-close"
            >
              ✕
            </button>
            <p className="install-eyebrow">手机快捷入口</p>
            <h3 id="install-dialog-title" className="install-title">添加到主屏幕</h3>
            <p id="install-dialog-description" className="install-intro">
              添加后可像普通 App 一样从桌面快速打开，无需经过应用商店。
            </p>

            <div className="install-steps">
              <div className="install-step">
                <p className="install-step-title">iPhone / iPad · Safari</p>
                <p>点击浏览器的“分享”按钮，再向下找到并选择“添加到主屏幕”，最后点击“添加”。</p>
              </div>
              <div className="install-step">
                <p className="install-step-title">Android · Chrome</p>
                <p>点击右上角“⋮”菜单，选择“添加到主屏幕”或“安装应用”，按提示确认。</p>
              </div>
            </div>

            <p className="install-note">
              这是网页快捷方式，不是 App Store 下载。网络可用性与当前网站一致，不代表所有内容都能离线使用。
            </p>
            <button type="button" onClick={() => setShowInstallModal(false)} className="install-confirm">
              我知道了
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
