import { FlaskConical, Globe, Eye, EyeOff, ChevronLeft, ChevronRight, Cpu } from 'lucide-react';
import { GEOGRAPHY_MODELS } from '../data/geographyModels';
import { CHEMISTRY_MODELS } from '../data/chemistryModels';
import { useStudio } from '../context/StudioContext';

// ============================================================================
// 2. ЛІВА ПАНЕЛЬ: КАТАЛОГ ПРЕДМЕТІВ ТА ШАРІВ СЦЕНИ (LeftDrawer)
// ============================================================================
export default function LeftDrawer() {
  const {
    theme,
    leftState,
    setLeftState,
    activeSubject,
    activeModelId,
    selectModel,
    selectVerilogLesson,
    verilogState,
    layerFilter,
    setLayerFilter,
    sceneItems,
    selectedId,
    handleSelectEntity,
    apiRef,
  } = useStudio();

  const VERILOG_LESSONS = [
    { id: 'v-gates', badge: 'GATES', title: '1. Базові вентилі AND / OR / XOR' },
    { id: 'v-cascade', badge: 'LOGIC', title: '2. Ланцюг (A & B) | C' },
    { id: 'v-adder', badge: 'ADDER', title: '3. Півсуматор (Half-Adder)' },
    { id: 'v-mux', badge: 'MUX', title: '4. Мультиплексор 2-в-1' },
    { id: 'v-decoder', badge: 'DEC 2→4', title: '5. Дешифратор 2-в-4 (Decoder)' },
    { id: 'v-latch', badge: 'SR-LATCH', title: '6. RS-тригер з пам’яттю' },
  ];

  const isClosed = leftState === 'closed';

  return (
    <>
      {isClosed && (
        <button
          onClick={() => setLeftState('open')}
          className={`absolute top-3 left-3 z-20 p-2 rounded-xl border shadow-lg transition-all duration-300 ${theme.panelBg}`}
          title="Розгорнути каталог предметів"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      <aside
        className={`border-r flex flex-col shrink-0 z-10 overflow-hidden transition-all duration-300 ease-in-out ${
          isClosed ? 'w-0 opacity-0 border-r-0 pointer-events-none' : 'w-64 sm:w-72 opacity-100'
        } ${theme.panelBg}`}
      >
        <div className="w-64 sm:w-72 h-full flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Навчальні дисципліни
            </span>
            <button
              onClick={() => setLeftState('closed')}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              title="Згорнути панель"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="p-2 grid grid-cols-3 gap-1 border-b border-slate-800 bg-slate-950/40">
            <button
              onClick={() => selectModel(GEOGRAPHY_MODELS[0].id)}
              className={`py-1.5 px-1 rounded-lg text-[11px] font-bold flex flex-col items-center gap-0.5 transition ${
                activeSubject === 'geography'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Географія</span>
            </button>

            <button
              onClick={() => selectModel(CHEMISTRY_MODELS[0].id)}
              className={`py-1.5 px-1 rounded-lg text-[11px] font-bold flex flex-col items-center gap-0.5 transition ${
                activeSubject === 'chemistry'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Хімія</span>
            </button>

            <button
              onClick={() => selectVerilogLesson('v-gates')}
              className={`py-1.5 px-1 rounded-lg text-[11px] font-bold flex flex-col items-center gap-0.5 transition ${
                activeSubject === 'verilog'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Verilog</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
            {activeSubject === 'geography' && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-1">
                  Моделі з Географії (5)
                </div>
                {GEOGRAPHY_MODELS.map((m) => {
                  const active = activeModelId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => selectModel(m.id)}
                      className={`w-full text-left p-2.5 rounded-xl border transition ${
                        active
                          ? 'bg-emerald-600/20 border-emerald-500 text-white'
                          : `${theme.subCard} hover:border-slate-600`
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          {m.badge}
                        </span>
                        <span className="text-[10px] text-slate-400">{m.quiz.length} пит.</span>
                      </div>
                      <div className="text-xs font-semibold mt-1 leading-snug">{m.title}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {activeSubject === 'chemistry' && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400 px-1">
                  Хімічні сполуки (5)
                </div>
                {CHEMISTRY_MODELS.map((m) => {
                  const active = activeModelId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => selectModel(m.id)}
                      className={`w-full text-left p-2.5 rounded-xl border transition ${
                        active
                          ? 'bg-sky-600/20 border-sky-500 text-white'
                          : `${theme.subCard} hover:border-slate-600`
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">
                          {m.badge}
                        </span>
                        <span className="text-[10px] text-slate-400">{m.quiz.length} пит.</span>
                      </div>
                      <div className="text-xs font-semibold mt-1 leading-snug">{m.title}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {activeSubject === 'verilog' && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 px-1">
                  Схеми та модулі Verilog (6)
                </div>
                {VERILOG_LESSONS.map((lesson) => {
                  const active = verilogState.lessonId === lesson.id;
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => selectVerilogLesson(lesson.id)}
                      className={`w-full text-left p-2.5 rounded-xl border transition ${
                        active
                          ? 'bg-purple-600/25 border-purple-500 text-white'
                          : `${theme.subCard} hover:border-slate-600`
                      }`}
                    >
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                        {lesson.badge}
                      </span>
                      <div className="text-xs font-semibold mt-1 leading-snug">{lesson.title}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {activeSubject !== 'verilog' && (
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  Відображення шарів
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { id: 'all', label: 'Усі шари' },
                    { id: 'outer', label: 'Зовнішній' },
                    { id: 'middle', label: 'Середній' },
                    { id: 'core', label: 'Ядро / Атоми' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setLayerFilter(f.id)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold border transition ${
                        layerFilter === f.id
                          ? 'bg-sky-600/30 border-sky-500 text-white'
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Елементи у 3D-сцені ({sceneItems.length})
              </div>
              {sceneItems.map((item) => {
                const isSel = selectedId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleSelectEntity(item.id);
                      apiRef.current.focusOnObject(item.id);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left text-[11px] flex items-center justify-between transition ${
                      isSel
                        ? 'bg-sky-500/25 text-sky-200 border border-sky-500/40 font-semibold'
                        : 'hover:bg-slate-800/70 text-slate-300'
                    }`}
                  >
                    <span className="truncate flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate">{item.name}</span>
                    </span>
                    {isSel ? <Eye className="w-3 h-3 text-sky-400 shrink-0" /> : <EyeOff className="w-3 h-3 opacity-30 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

