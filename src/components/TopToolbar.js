import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Pause,
  Grid,
  Glasses,
  Layers,
  Globe,
  UserCheck,
  LogOut,
  Maximize2,
  Ruler,
  Wrench,
} from 'lucide-react';
import { UI_THEMES } from '../data/themes';
import { useStudio } from '../context/StudioContext';

// ============================================================================
// 1. ВЕРХНЯ ПАНЕЛЬ ІНСТРУМЕНТІВ (TopToolbar)
// ============================================================================
export default function TopToolbar() {
  const {
    user,
    setUser,
    setShowSubjectModal,
    theme,
    themeId,
    setThemeId,
    activeSubject,
    isPlaying,
    setIsPlaying,
    wireframe,
    setWireframe,
    showGrid,
    setShowGrid,
    exploded,
    setExploded,
    measureMode,
    setMeasureMode,
    setMeasurePoints,
    setMeasuredDistance,
    assemblyMode,
    toggleAssemblyMode,
    xrMessage,
    apiRef,
  } = useStudio();

  const subjectBadge =
    activeSubject === 'geography'
      ? { label: 'Географія', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' }
      : activeSubject === 'chemistry'
      ? { label: 'Хімія', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' }
      : { label: 'Verilog HDL', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };

  return (
    <header className={`h-13 px-3 border-b flex items-center justify-between gap-2 shrink-0 z-20 ${theme.panelBg}`}>
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-600 flex items-center justify-center shrink-0 shadow">
          <Globe className="w-4 h-4 text-white" />
        </div>
        <div className="hidden sm:block truncate">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-tight">WebXR EduLab</span>
            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${subjectBadge.color}`}>
              {subjectBadge.label}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowSubjectModal(true)}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold transition shrink-0"
          title="Відкрити меню вибору предметів"
        >
          Предмети (3)
        </button>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto py-1">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition"
          title={isPlaying ? 'Пауза анімації' : 'Запустити анімацію'}
        >
          {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
        </button>

        <button
          onClick={() => apiRef.current.zoomIn()}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition"
          title="Наблизити"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => apiRef.current.zoomOut()}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition"
          title="Віддалити"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={() => apiRef.current.resetCamera()}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition"
          title="Скинути камеру"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-700/70 mx-1" />

        <button
          onClick={() => setExploded(!exploded)}
          className={`px-2 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1 transition ${
            exploded ? 'bg-amber-600 text-white' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200'
          }`}
          title="Розкласти модель на шари"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Розріз</span>
        </button>

        <button
          onClick={toggleAssemblyMode}
          className={`px-2 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1 transition ${
            assemblyMode ? 'bg-emerald-600 text-white' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200'
          }`}
          title="Інтерактивна збірка об'єкта"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Збірка</span>
        </button>

        <button
          onClick={() => {
            const next = !measureMode;
            setMeasureMode(next);
            if (!next) {
              setMeasurePoints([]);
              setMeasuredDistance(null);
              apiRef.current.clearMeasureLine();
            }
          }}
          className={`px-2 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1 transition ${
            measureMode ? 'bg-sky-600 text-white' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200'
          }`}
          title="3D-лінійка між точками"
        >
          <Ruler className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Лінійка</span>
        </button>

        <button
          onClick={() => setWireframe(!wireframe)}
          className={`p-1.5 rounded-lg transition ${
            wireframe ? 'bg-indigo-600 text-white' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200'
          }`}
          title="Каркасна сітка (Wireframe)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-1.5 rounded-lg transition ${
            showGrid ? 'bg-slate-700 text-sky-400' : 'bg-slate-800/80 text-slate-400'
          }`}
          title="Показати / приховати сітку"
        >
          <Grid className="w-4 h-4" />
        </button>

        <button
          onClick={() => apiRef.current.enterVR()}
          className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 shadow transition"
          title="Увійти в immersive-vr через WebXR (VRButton)"
        >
          <Glasses className="w-3.5 h-3.5" />
          <span>WebXR</span>
        </button>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {xrMessage && (
          <span className="max-w-[280px] truncate text-[10px] px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
            {xrMessage}
          </span>
        )}

        <select
          value={themeId}
          onChange={(e) => setThemeId(e.target.value)}
          className="hidden sm:block bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
          title="Змінити тему"
        >
          {UI_THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        {user && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700/70">
            <UserCheck className="w-4 h-4 text-emerald-400 hidden sm:block" />
            <div className="hidden md:block text-right leading-tight">
              <div className="text-[11px] font-semibold truncate max-w-[110px]">{user.name}</div>
              <div className="text-[9px] text-slate-400">{user.group}</div>
            </div>
            <button
              onClick={() => setUser(null)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/80 text-slate-300 hover:text-white transition"
              title="Вийти з профілю"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

