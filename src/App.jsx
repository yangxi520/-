import React, { useState, Suspense, lazy } from 'react';
import ProfessionalChart from "./components/ProfessionalChart";
import ErrorBoundary from "./components/ErrorBoundary";
import { AlertCircle, ArrowLeft, CheckCircle2, Save } from "lucide-react";
import * as iztro from "iztro";
import { archiveManager } from './utils/archiveManager';
import { buildHomeFortune, HOME_FORTUNE_PERIODS } from './utils/homeFortune';

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
  const [archiveRecords, setArchiveRecords] = useState(() => archiveManager.getRecords());
  const [homeProfileId, setHomeProfileId] = useState(null);
  const [homePeriod, setHomePeriod] = useState('daily');
  const [homeNow, setHomeNow] = useState(() => new Date());

  // Archive Save Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveNote, setSaveNote] = useState('');
  const [saveGroup, setSaveGroup] = useState('self');
  const [archiveNotice, setArchiveNotice] = useState(null);
  const saveDialogRef = React.useRef(null);
  const saveOpenerRef = React.useRef(null);

  React.useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  React.useEffect(() => {
    const refreshArchives = () => setArchiveRecords(archiveManager.getRecords());
    const refreshNow = () => setHomeNow(new Date());
    const handleVisibilityChange = () => {
      if (!document.hidden) refreshNow();
    };

    window.addEventListener('archive-updated', refreshArchives);
    window.addEventListener('focus', refreshNow);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('archive-updated', refreshArchives);
      window.removeEventListener('focus', refreshNow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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

  React.useEffect(() => {
    if (!archiveNotice || archiveNotice.type === 'error') return undefined;
    const timer = window.setTimeout(() => setArchiveNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [archiveNotice]);

  React.useEffect(() => {
    if (!isSaveModalOpen || !saveDialogRef.current) return undefined;

    const dialog = saveDialogRef.current;
    const opener = saveOpenerRef.current;
    const focusableSelector = 'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
    const getFocusableItems = () => Array.from(dialog.querySelectorAll(focusableSelector));
    const focusFrame = window.requestAnimationFrame(() => {
      (dialog.querySelector('#archive-name') || getFocusableItems()[0])?.focus();
    });

    const trapFocus = (event) => {
      if (event.key !== 'Tab') return;
      const items = getFocusableItems();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener('keydown', trapFocus);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      dialog.removeEventListener('keydown', trapFocus);
      opener?.focus?.();
    };
  }, [isSaveModalOpen]);

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

  const openSaveArchive = () => {
    saveOpenerRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    setSaveGroup('self');
    setSaveNote('');
    setIsSaveModalOpen(true);
  };

  const handleLoadRecord = (record) => {
    if (record.type === 'ziwei') {
      // Records created before calendarType/birthDate existed were always
      // reloaded as solar dates. Keep that fallback while preserving the
      // original calendar for all newly saved records.
      const recordCalendarType = record.calendarType === 'lunar' ? 'lunar' : 'solar';
      const recordBirthDate = record.birthDate
        || record.solarDate
        || record.data?.birthDate
        || record.data?.solarDate;
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
      solarDate: horoscope?.solarDate || (calendarType === 'solar' ? birthday : ''),
      timeHour: birthTime,
      group: saveGroup,
      note: saveNote,
      data: {}
    };

    const savedRecord = archiveManager.addRecord(newRecord);
    if (!savedRecord) {
      setArchiveNotice({ type: 'error', message: '保存失败，请检查浏览器存储空间后重试' });
      return;
    }
    setIsSaveModalOpen(false);
    setSaveNote(''); // Reset
    setArchiveNotice({ type: 'success', message: `已保存「${savedRecord.name}」的紫微命盘` });
  };

  const ziweiRecords = React.useMemo(
    () => archiveRecords.filter((record) => record.type === 'ziwei'),
    [archiveRecords],
  );

  const homeProfile = React.useMemo(() => {
    const selected = ziweiRecords.find((record) => record.id === homeProfileId);
    return selected
      || ziweiRecords.find((record) => record.group === 'self')
      || ziweiRecords[0]
      || null;
  }, [homeProfileId, ziweiRecords]);

  const homeFortuneState = React.useMemo(() => {
    if (!homeProfile) return { data: null, error: null };

    try {
      return {
        data: buildHomeFortune(homeProfile, homePeriod, homeNow),
        error: null,
      };
    } catch (error) {
      console.warn('Unable to build home fortune:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : '当前档案无法生成运势简报',
      };
    }
  }, [homeNow, homePeriod, homeProfile]);

  const homeFortune = homeFortuneState.data;

  const usesOwnHeader = ['money', 'bazi', 'archive', 'videos', 'english'].includes(view);

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
            <div className="home-overview">
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

              <section className={`fortune-brief ${homeFortune ? '' : 'fortune-brief--empty'}`} aria-labelledby="fortune-brief-title">
                <header className="fortune-brief-header">
                  <div>
                    <p className="fortune-brief-eyebrow">私人运势简报</p>
                    <h3 id="fortune-brief-title">{homeFortune ? `${homeFortune.profileName}的${homeFortune.periodLabel}` : '每天打开，就有当下重点'}</h3>
                  </div>
                  <span className="fortune-brief-seal" aria-hidden="true">今</span>
                </header>

                {homeFortune ? (
                  <>
                    {ziweiRecords.length > 1 && (
                      <div className="fortune-profiles" aria-label="切换命盘档案">
                        {ziweiRecords.slice(0, 5).map((record) => (
                          <button
                            key={record.id}
                            type="button"
                            aria-pressed={homeProfile?.id === record.id}
                            onClick={() => setHomeProfileId(record.id)}
                          >
                            {record.name || '未命名'}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="fortune-periods" role="group" aria-label="选择运势时间层">
                      {HOME_FORTUNE_PERIODS.map((period) => (
                        <button
                          key={period.key}
                          type="button"
                          aria-pressed={homePeriod === period.key}
                          onClick={() => setHomePeriod(period.key)}
                        >
                          <span aria-hidden="true">{period.icon}</span>
                          {period.label}
                        </button>
                      ))}
                    </div>

                    <div className="fortune-brief-date">
                      <span>{homeFortune.dateLabel}</span>
                      <strong>{homeFortune.stemBranch}</strong>
                    </div>

                    <p className="fortune-summary">{homeFortune.summary}</p>

                    <dl className="fortune-facts">
                      <div>
                        <dt>运限命宫</dt>
                        <dd>{homeFortune.palaceName}{homeFortune.palaceBranch ? ` · ${homeFortune.palaceBranch}` : ''}</dd>
                      </div>
                      <div>
                        <dt>当前大限</dt>
                        <dd>{homeFortune.decadalPalaceName || '—'}{homeFortune.nominalAge ? ` · 虚岁${homeFortune.nominalAge}` : ''}</dd>
                      </div>
                    </dl>

                    <div className="fortune-guidance" aria-label="当下参考">
                      <p><span>宜</span>{homeFortune.action}</p>
                      <p><span>慎</span>{homeFortune.caution}</p>
                    </div>

                    <div className="fortune-mutagens" aria-label="当前四化">
                      {homeFortune.mutagens.map((item) => (
                        <span key={item.label} data-kind={item.label}>
                          <b>{item.label}</b>{item.star}
                        </span>
                      ))}
                    </div>

                    {homeFortune.movingStars.length > 0 && (
                      <p className="fortune-moving-stars">流耀：{homeFortune.movingStars.join(' · ')}</p>
                    )}
                    {homeFortune.dayBoundaryNote && <p className="fortune-boundary-note">{homeFortune.dayBoundaryNote}</p>}

                    <button type="button" className="fortune-open-chart" onClick={() => handleLoadRecord(homeProfile)}>
                      查看完整命盘与专业依据 <span aria-hidden="true">→</span>
                    </button>
                    <p className="fortune-disclaimer">按当前设备时间自动排盘，仅供传统文化研究；具体判断需结合本命与三方四正。</p>
                  </>
                ) : (
                  <div className="fortune-empty-content">
                    <p>{homeFortuneState.error || '保存一次本人的紫微命盘，首页便会自动显示今时、今日、今月与今年的运限重点。'}</p>
                    <button type="button" onClick={() => setView(homeFortuneState.error ? 'archive' : 'input')}>
                      {homeFortuneState.error ? '检查命盘档案' : '保存我的第一张命盘'} <span aria-hidden="true">→</span>
                    </button>
                    <span>出生资料只保存在当前设备</span>
                  </div>
                )}
              </section>
            </div>

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
              <p>v2026.08.23.Archive-UI</p>
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
                  onSave={openSaveArchive}
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
            className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity"
            onClick={() => setIsSaveModalOpen(false)}
          ></div>

          <section
            ref={saveDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-dialog-title"
            aria-describedby="save-dialog-description"
            className="relative w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[28px] border border-[#cbbfac] bg-[#f3ecdf] text-[#302a25] shadow-2xl animate-in fade-in zoom-in duration-200"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#c8bba7] bg-[#e7ddcc]/80 p-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#a33b30]/40 bg-[#a33b30]/[0.06] text-[#96372e]" aria-hidden="true">
                  <Save className="size-5" />
                </span>
                <div>
                  <p className="text-[10px] font-bold tracking-[0.2em] text-[#81776b]">命盘归档</p>
                  <h3 id="save-dialog-title" className="mt-0.5 font-serif text-xl font-bold tracking-[0.08em] text-[#28231f]">保存到档案</h3>
                </div>
              </div>
              <button type="button" aria-label="关闭保存档案弹窗" onClick={() => setIsSaveModalOpen(false)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-xl text-[#756d63] hover:bg-[#d8cdbb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d6b62]">✕</button>
            </div>

            <div className="space-y-5 p-5">
              <p id="save-dialog-description" className="rounded-xl border border-[#cbbfac]/80 bg-[#fffaf0]/65 px-3 py-2 text-[11px] leading-5 text-[#6f665d]">
                出生资料和备注只保存在当前设备。建议定期前往档案页备份，清除浏览器数据可能导致档案丢失。
              </p>

              <div className="space-y-2">
                <label htmlFor="archive-name" className="text-xs font-bold tracking-[0.12em] text-[#6f665d]">命主称呼</label>
                <input
                  id="archive-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="min-h-12 w-full rounded-xl border border-[#b9ad98] bg-[#fffaf0] px-4 text-[#302a25] outline-none transition focus:border-[#2d6b62] focus-visible:ring-2 focus-visible:ring-[#2d6b62]/30"
                  placeholder="例如：杨先生"
                />
              </div>

              <fieldset className="space-y-2">
                <legend className="text-xs font-bold tracking-[0.12em] text-[#6f665d]">归档分组</legend>
                <div className="grid grid-cols-4 gap-2">
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
                      className={`min-h-11 rounded-xl border px-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d6b62] ${saveGroup === g.id
                        ? 'border-[#2d6b62] bg-[#2d6b62] text-white shadow-sm'
                        : 'border-[#cbbfac] bg-[#fffaf0]/70 text-[#6f665d] hover:border-[#9e8f7a]'
                        }`}
                    >
                      {g.label}{saveGroup === g.id ? ' ✓' : ''}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="space-y-2">
                <label htmlFor="archive-note" className="text-xs font-bold tracking-[0.12em] text-[#6f665d]">备注</label>
                <textarea
                  id="archive-note"
                  value={saveNote}
                  onChange={e => setSaveNote(e.target.value)}
                  placeholder="记录咨询主题、关键事件或后续提醒……"
                  className="h-24 w-full resize-none rounded-xl border border-[#b9ad98] bg-[#fffaf0] p-3 text-sm text-[#302a25] outline-none transition focus:border-[#2d6b62] focus-visible:ring-2 focus-visible:ring-[#2d6b62]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button type="button" onClick={() => setIsSaveModalOpen(false)} className="min-h-12 rounded-xl border border-[#b9ad98] bg-[#fffaf0]/60 px-4 text-sm font-bold text-[#6f665d] hover:bg-[#e9dfcd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d6b62]">取消</button>
                <button type="button" onClick={handleSaveToArchive} className="min-h-12 rounded-xl bg-[#a33b30] px-4 text-sm font-bold text-white shadow-lg shadow-[#7f2c24]/20 hover:bg-[#8f3028] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d18275]">确认保存</button>
              </div>
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

      {archiveNotice && (
        <div className="fixed inset-x-3 z-[240] flex justify-center print:hidden" style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }} role={archiveNotice.type === 'error' ? 'alert' : 'status'} aria-live="polite">
          <div className={`flex min-h-12 max-w-xl items-center gap-2 rounded-2xl border pl-4 pr-1 py-1 text-sm font-bold text-white shadow-2xl backdrop-blur ${archiveNotice.type === 'error' ? 'border-[#d1847b]/60 bg-[#6f2520]/95' : 'border-[#78a69f]/50 bg-[#163d38]/95'}`}>
            {archiveNotice.type === 'error'
              ? <AlertCircle className="size-5 text-[#f0b5ae]" aria-hidden="true" />
              : <CheckCircle2 className="size-5 text-[#8ec8bd]" aria-hidden="true" />}
            <span className="flex-1 py-2">{archiveNotice.message}</span>
            <button
              type="button"
              onClick={() => setArchiveNotice(null)}
              aria-label="关闭档案提示"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-lg text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
