import { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Award,
  MessageSquarePlus,
  Check,
  Zap,
  Code2,
  PlayCircle,
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';

// ============================================================================
// 4. ПРАВА ПАНЕЛЬ: ТЕОРІЯ, СИМУЛЯТОР VERILOG ТА ІЗОЛЬОВАНІ ТЕСТИ (RightDrawer)
// ============================================================================
export default function RightDrawer() {
  const {
    user,
    theme,
    rightState,
    setRightState,
    activeSubject,
    activeModel,
    effectiveSummary,
    updateModelSummary,
    selectVerilogLesson,
    verilogState,
    setVerilogState,
    subjectSubView,
    setSubjectSubView,
    simValue,
    setSimValue,
    subjectQuizzes,
    quizIndex,
    goToQuizQuestion,
    quizFeedback,
    setQuizFeedback,
    quizScore,
    setQuizScore,
    measuredDistance,
    measureMode,
    assemblyMode,
    assembledIds,
    sceneItems,
    selectedItem,
    notes,
    noteDraft,
    setNoteDraft,
    saveNoteForSelected,
  } = useStudio();

  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState('');

  const isClosed = rightState === 'closed';

  const outVerilogY =
    verilogState.gateMode === 'AND'
      ? verilogState.inA & verilogState.inB
      : verilogState.gateMode === 'OR'
      ? verilogState.inA | verilogState.inB
      : verilogState.gateMode === 'XOR'
      ? verilogState.inA ^ verilogState.inB
      : !(verilogState.inA & verilogState.inB)
      ? 1
      : 0;

  const VERILOG_QUIZZES = [
    {
      q: '1. Базовий вентиль AND: Що поверне assign Y = A & B, якщо на вході A = 1, а B = 0?',
      options: ['0 (струм не пройде далі, потрібні обидві одиниці)', '1 (світлодіод Y загориться)', 'Помилку компіляції'],
      correct: 0,
      setup: { lessonId: 'v-gates', inA: 1, inB: 0, gateMode: 'AND' },
    },
    {
      q: '2. Вентиль OR: Який сигнал буде на виході Y, якщо A = 1, а B = 0 у вентилі OR (A | B)?',
      options: ['1 (достатньо хоча б одного активного входу)', '0 (струм заблокується)', 'Невизначений стан Z'],
      correct: 0,
      setup: { lessonId: 'v-gates', inA: 1, inB: 0, gateMode: 'OR' },
    },
    {
      q: '3. Виключне АБО (XOR): Чому дорівнює вихід A ^ B, коли обидва входи однакові (A = 1, B = 1)?',
      options: ['0 (XOR видає 1 лише при різних входах)', '1 (обидва входи активні)', '2'],
      correct: 0,
      setup: { lessonId: 'v-gates', inA: 1, inB: 1, gateMode: 'XOR' },
    },
    {
      q: '4. Двокаскадний ланцюг (A & B) | C: Якщо A = 0, B = 1, але резервний канал C = 1, чи пройде струм на Y?',
      options: ['Так, Y = 1 (струм пройде через обхідний канал C на вентиль OR)', 'Ні, Y = 0 (бо перший каскад AND закритий)', 'Схема згорить'],
      correct: 0,
      setup: { lessonId: 'v-cascade', inA: 0, inB: 1, inC: 1 },
    },
    {
      q: '5. Двокаскадний ланцюг (A & B) | C: Яка комбінація заблокує вихід Y (Y = 0)?',
      options: ['A = 1, B = 0, C = 0', 'A = 1, B = 1, C = 0', 'A = 0, B = 0, C = 1'],
      correct: 0,
      setup: { lessonId: 'v-cascade', inA: 1, inB: 0, inC: 0 },
    },
    {
      q: '6. Півсуматор (Half-Adder): При додаванні двох бітів A = 1 та B = 1 (1 + 1 у двійковій системі), які значення будуть на Sum та Carry?',
      options: ['Sum = 0, Carry = 1 (перенос у старший розряд)', 'Sum = 1, Carry = 0', 'Sum = 1, Carry = 1'],
      correct: 0,
      setup: { lessonId: 'v-adder', inA: 1, inB: 1 },
    },
    {
      q: '7. Півсуматор (Half-Adder): При A = 1 та B = 0 який вихідний світлодіод загориться?',
      options: ['Загориться зелений Sum = 1, а перенос Carry = 0', 'Загориться тільки Carry = 1', 'Обидва виходи будуть 0'],
      correct: 0,
      setup: { lessonId: 'v-adder', inA: 1, inB: 0 },
    },
    {
      q: '8. Мультиплексор MUX 2-в-1 (assign Y = C ? B : A): Якщо A = 0, B = 1, а керуючий вхід C = 1, який канал пропустить комутатор?',
      options: ['Канал B (вихід Y = 1)', 'Канал A (вихід Y = 0)', 'Обидва канали одночасно'],
      correct: 0,
      setup: { lessonId: 'v-mux', inA: 0, inB: 1, inC: 1 },
    },
    {
      q: '9. Дешифратор 2-в-4 (Decoder): Якщо на адресних входах A1 = 1 та A0 = 0 (двійкове 10₂ = 2), який вихід активується?',
      options: ['Вихід Y2 = 1, усі інші дорівнюють 0', 'Вихід Y0 = 1', 'Усі чотири виходи одночасно'],
      correct: 0,
      setup: { lessonId: 'v-decoder', inA: 1, inB: 0 },
    },
    {
      q: '10. RS-тригер із пам’яттю: Яка роль перехресних зворотних зв’язків у RS-тригері?',
      options: ['Утримують збережений біт (0 або 1) навіть після зняття сигналу зі входу', 'Зменшують напругу живлення вдвічі', 'Перетворюють змінний струм на постійний'],
      correct: 0,
      setup: { lessonId: 'v-latch', inA: 1, inB: 0 },
    },
  ];

  const handleSynthesizeVerilogCode = () => {
    const code = verilogState.codeSnippet.toUpperCase();
    let nextGate = verilogState.gateMode;
    let nextLesson = verilogState.lessonId;

    if (code.includes('?')) {
      nextLesson = 'v-mux';
    } else if (code.includes('SUM') || code.includes('CARRY')) {
      nextLesson = 'v-adder';
    } else if (code.includes('(') && code.includes('|')) {
      nextLesson = 'v-cascade';
    } else if (code.includes('~&') || code.includes('NAND')) {
      nextLesson = 'v-gates';
      nextGate = 'NAND';
    } else if (code.includes('^')) {
      nextLesson = 'v-gates';
      nextGate = 'XOR';
    } else if (code.includes('|')) {
      nextLesson = 'v-gates';
      nextGate = 'OR';
    } else if (code.includes('&')) {
      nextLesson = 'v-gates';
      nextGate = 'AND';
    }

    setVerilogState((prev) => ({
      ...prev,
      lessonId: nextLesson,
      gateMode: nextGate,
      feedback: { ok: true, text: `Код синтезовано! Активна схема: ${nextLesson} (${nextGate}).` },
    }));
    selectVerilogLesson(nextLesson, true);
  };

  const goToVerilogStep = (idx) => {
    const qObj = VERILOG_QUIZZES[idx];
    if (!qObj) return;
    setVerilogState((prev) => ({
      ...prev,
      chainStep: idx,
      lessonId: qObj.setup.lessonId,
      inA: qObj.setup.inA ?? prev.inA,
      inB: qObj.setup.inB ?? prev.inB,
      inC: qObj.setup.inC ?? prev.inC,
      gateMode: qObj.setup.gateMode ?? prev.gateMode,
      feedback: null,
    }));
    selectVerilogLesson(qObj.setup.lessonId, true);
  };

  const currentSubjQ = subjectQuizzes[quizIndex];
  const currentVerilogQ = VERILOG_QUIZZES[verilogState.chainStep] || VERILOG_QUIZZES[0];

  return (
    <>
      {isClosed && (
        <button
          onClick={() => setRightState('open')}
          className={`absolute top-3 right-3 z-20 p-2 rounded-xl border shadow-lg transition-all duration-300 ${theme.panelBg}`}
          title="Розгорнути панель теорії та тестів"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      <aside
        className={`border-l flex flex-col shrink-0 z-10 overflow-hidden transition-all duration-300 ease-in-out ${
          isClosed ? 'w-0 opacity-0 border-l-0 pointer-events-none' : 'w-80 sm:w-96 opacity-100'
        } ${theme.panelBg}`}
      >
        <div className="w-80 sm:w-96 h-full flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <BookOpen className={`w-4 h-4 ${theme.accentText}`} />
              <span className="text-xs font-bold uppercase tracking-wider">
                {activeSubject === 'geography'
                  ? 'Географія: Теорія і Тести'
                  : activeSubject === 'chemistry'
                  ? 'Хімія: Теорія і Тести'
                  : 'Verilog HDL: Лабораторія'}
              </span>
            </div>
            <button
              onClick={() => setRightState('closed')}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              title="Згорнути панель"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="p-2 border-b border-slate-800 grid grid-cols-2 gap-1.5 bg-slate-950/40">
            <button
              onClick={() => {
                if (activeSubject === 'verilog') {
                  setVerilogState((prev) => ({ ...prev, subView: 'theory', feedback: null }));
                } else {
                  setSubjectSubView('theory');
                }
              }}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                (activeSubject === 'verilog' ? verilogState.subView === 'theory' : subjectSubView === 'theory')
                  ? theme.accentBtn
                  : 'bg-slate-800/70 text-slate-300 hover:text-white'
              }`}
            >
              1. Теорія та база
            </button>

            <button
              onClick={() => {
                if (activeSubject === 'verilog') {
                  setVerilogState((prev) => ({ ...prev, subView: 'testing' }));
                  goToVerilogStep(verilogState.chainStep);
                } else {
                  setSubjectSubView('testing');
                  goToQuizQuestion(quizIndex);
                }
              }}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                (activeSubject === 'verilog' ? verilogState.subView === 'testing' : subjectSubView === 'testing')
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-slate-800/70 text-slate-300 hover:text-white'
              }`}
            >
              {activeSubject === 'verilog'
                ? `Тести Verilog (${VERILOG_QUIZZES.length})`
                : `Тести (${subjectQuizzes.length})`}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {activeSubject === 'verilog' ? (
              verilogState.subView === 'theory' ? (
                <div className="space-y-3">
                  <div className={`p-3 rounded-xl border ${theme.subCard} space-y-2`}>
                    <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold">
                      <Zap className="w-4 h-4" />
                      <span>Навіщо потрібен Verilog HDL?</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      <b>Verilog</b> — це мова опису апаратури (Hardware Description Language), за допомогою якої інженери проєктують процесори, відеокарти та мікросхеми ПЛІС (FPGA). На відміну від звичайного коду, тут описуються реальні <b>логічні вентилі та провідники</b>, якими одночасно тече електричний струм.
                    </p>
                  </div>

                  {/* Інтерактивна 2D-схема проходження сигналу для поточної схеми Verilog */}
                  <div className={`p-3 rounded-xl border ${theme.subCard} space-y-2`}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-400">Жива 2D-схема проходження струму</span>
                      <span className="font-mono text-slate-400">{verilogState.lessonId}</span>
                    </div>
                    <svg viewBox="0 0 280 120" className="w-full h-28 bg-slate-950 rounded-lg border border-slate-800">
                      <line x1="25" y1="30" x2="100" y2="30" stroke={verilogState.inA ? '#22c55e' : '#475569'} strokeWidth="3" />
                      <circle cx="25" cy="30" r="7" fill={verilogState.inA ? '#22c55e' : '#334155'} />
                      <text x="10" y="20" fill="#cbd5e1" fontSize="10" fontFamily="monospace">A={verilogState.inA}</text>

                      <line x1="25" y1="70" x2="100" y2="70" stroke={verilogState.inB ? '#22c55e' : '#475569'} strokeWidth="3" />
                      <circle cx="25" cy="70" r="7" fill={verilogState.inB ? '#22c55e' : '#334155'} />
                      <text x="10" y="88" fill="#cbd5e1" fontSize="10" fontFamily="monospace">B={verilogState.inB}</text>

                      <line x1="25" y1="102" x2="155" y2="102" stroke={verilogState.inC ? '#f59e0b' : '#475569'} strokeWidth="2.5" strokeDasharray="4 2" />
                      <circle cx="25" cy="102" r="6" fill={verilogState.inC ? '#f59e0b' : '#334155'} />
                      <text x="36" y="114" fill="#fbbf24" fontSize="9" fontFamily="monospace">C={verilogState.inC}</text>

                      <rect x="100" y="18" width="76" height="64" rx="10" fill="#1e1b4b" stroke="#8b5cf6" strokeWidth="2" />
                      <text x="138" y="47" fill="#e9d5ff" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        {verilogState.lessonId === 'v-gates'
                          ? verilogState.gateMode
                          : verilogState.lessonId === 'v-cascade'
                          ? '(A&B)|C'
                          : verilogState.lessonId === 'v-adder'
                          ? 'HALF-ADD'
                          : verilogState.lessonId === 'v-mux'
                          ? 'MUX 2:1'
                          : verilogState.lessonId === 'v-decoder'
                          ? 'DEC 2→4'
                          : 'SR-LATCH'}
                      </text>
                      <text x="138" y="64" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">
                        {verilogState.lessonId === 'v-gates' ? `Y = ${outVerilogY}` : 'HDL BLOCK'}
                      </text>

                      {(() => {
                        const isOutHigh =
                          verilogState.lessonId === 'v-gates'
                            ? Boolean(outVerilogY)
                            : verilogState.lessonId === 'v-cascade'
                            ? Boolean((verilogState.inA & verilogState.inB) | verilogState.inC)
                            : verilogState.lessonId === 'v-adder'
                            ? Boolean(verilogState.inA ^ verilogState.inB || (verilogState.inA & verilogState.inB))
                            : verilogState.lessonId === 'v-mux'
                            ? Boolean(verilogState.inC ? verilogState.inB : verilogState.inA)
                            : true;
                        return (
                          <>
                            <line x1="176" y1="50" x2="242" y2="50" stroke={isOutHigh ? '#22c55e' : '#475569'} strokeWidth="3.5" />
                            <circle cx="248" cy="50" r="12" fill={isOutHigh ? '#10b981' : '#334155'} stroke={isOutHigh ? '#a7f3d0' : '#64748b'} strokeWidth="2" />
                            <text x="248" y="54" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                              {isOutHigh ? '1' : '0'}
                            </text>
                            <text x="248" y="75" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">OUT</text>
                          </>
                        );
                      })()}
                    </svg>
                  </div>

                  <div className={`p-3 rounded-xl border ${theme.subCard} space-y-2.5`}>
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>Пульт подачі живлення (1 = струм є)</span>
                      <span className="font-mono text-[11px] text-emerald-400">Вихід Y = {outVerilogY}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => setVerilogState((p) => ({ ...p, inA: p.inA ? 0 : 1 }))}
                        className={`py-2 px-2 rounded-lg text-xs font-mono font-bold border transition ${
                          verilogState.inA
                            ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        Вхід A: {verilogState.inA}
                      </button>

                      <button
                        onClick={() => setVerilogState((p) => ({ ...p, inB: p.inB ? 0 : 1 }))}
                        className={`py-2 px-2 rounded-lg text-xs font-mono font-bold border transition ${
                          verilogState.inB
                            ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        Вхід B: {verilogState.inB}
                      </button>

                      <button
                        onClick={() => setVerilogState((p) => ({ ...p, inC: p.inC ? 0 : 1 }))}
                        className={`py-2 px-2 rounded-lg text-xs font-mono font-bold border transition ${
                          verilogState.inC
                            ? 'bg-amber-600/30 border-amber-400 text-amber-200'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        Вхід C: {verilogState.inC}
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-1">
                      {['AND', 'OR', 'XOR', 'NAND'].map((g) => (
                        <button
                          key={g}
                          onClick={() =>
                            setVerilogState((p) => ({
                              ...p,
                              gateMode: g,
                              codeSnippet:
                                g === 'AND'
                                  ? 'assign Y = A & B;'
                                  : g === 'OR'
                                  ? 'assign Y = A | B;'
                                  : g === 'XOR'
                                  ? 'assign Y = A ^ B;'
                                  : 'assign Y = ~(A & B);',
                            }))
                          }
                          className={`py-1.5 rounded-lg text-[11px] font-mono font-bold border transition ${
                            verilogState.gateMode === g
                              ? 'bg-purple-600 border-purple-400 text-white'
                              : 'bg-slate-900/70 border-slate-700 text-slate-300'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border ${theme.subCard} space-y-2`}>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
                      <Code2 className="w-4 h-4" />
                      <span>Редактор коду Verilog HDL</span>
                    </div>
                    <textarea
                      rows={3}
                      value={verilogState.codeSnippet}
                      onChange={(e) => setVerilogState((p) => ({ ...p, codeSnippet: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-[11px] text-emerald-300 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={handleSynthesizeVerilogCode}
                      className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Синтезувати код та пустити струм</span>
                    </button>
                    {verilogState.feedback && (
                      <div className="text-[11px] text-emerald-300 bg-emerald-500/15 border border-emerald-500/40 rounded-lg p-2">
                        {verilogState.feedback.text}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setVerilogState((p) => ({ ...p, subView: 'testing' }));
                      goToVerilogStep(0);
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow transition"
                  >
                    Почати тестування Verilog ({VERILOG_QUIZZES.length} симуляцій) →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={`p-3.5 rounded-xl border ${theme.subCard} space-y-3`}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-amber-400">
                        Симуляція {verilogState.chainStep + 1} із {VERILOG_QUIZZES.length}
                      </span>
                      <span className="font-mono font-bold text-emerald-400">
                        Бали: {verilogState.score}
                      </span>
                    </div>

                    <p className="text-xs font-bold leading-snug">{currentVerilogQ.q}</p>

                    <div className="space-y-1.5">
                      {currentVerilogQ.options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            const ok = idx === currentVerilogQ.correct;
                            setVerilogState((prev) => ({
                              ...prev,
                              score: ok ? prev.score + 1 : prev.score,
                              feedback: ok
                                ? { ok: true, text: 'Вірно! Подивіться на 3D-схему ліворуч: струм пройшов саме так!' }
                                : { ok: false, text: `Невірно. Правильно: ${currentVerilogQ.options[currentVerilogQ.correct]}` },
                            }));
                          }}
                          className="w-full text-left p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-xs transition"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>

                    {verilogState.feedback && (
                      <div
                        className={`p-2.5 rounded-lg text-xs border flex items-start gap-2 ${
                          verilogState.feedback.ok
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                            : 'bg-rose-500/20 border-rose-500/50 text-rose-200'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{verilogState.feedback.text}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        onClick={() =>
                          goToVerilogStep((verilogState.chainStep - 1 + VERILOG_QUIZZES.length) % VERILOG_QUIZZES.length)
                        }
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium"
                      >
                        ← Назад
                      </button>
                      <button
                        onClick={() => goToVerilogStep((verilogState.chainStep + 1) % VERILOG_QUIZZES.length)}
                        className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                      >
                        Наступна схема →
                      </button>
                    </div>
                  </div>
                </div>
              )
            ) : subjectSubView === 'theory' ? (
              <div className="space-y-3">
                <div className={`p-3 rounded-xl border ${theme.subCard} space-y-2`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">
                      {activeModel.category}
                    </span>
                    {user?.role === 'teacher' && (
                      <button
                        onClick={() => {
                          if (editingSummary) {
                            updateModelSummary(activeModel.id, summaryDraft);
                            setEditingSummary(false);
                          } else {
                            setSummaryDraft(effectiveSummary);
                            setEditingSummary(true);
                          }
                        }}
                        className="text-[10px] px-2 py-0.5 rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                      >
                        {editingSummary ? 'Зберегти' : 'Редагувати'}
                      </button>
                    )}
                  </div>

                  <h3 className="text-sm font-bold leading-snug">{activeModel.title}</h3>

                  {editingSummary ? (
                    <textarea
                      rows={4}
                      value={summaryDraft}
                      onChange={(e) => setSummaryDraft(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  ) : (
                    <p className="text-xs leading-relaxed text-slate-300">{effectiveSummary}</p>
                  )}

                  <div className="grid grid-cols-1 gap-1.5 pt-1 text-[11px]">
                    <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                      <span className="text-slate-400">Структура: </span>
                      <span className="font-semibold">{activeModel.geometryType}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                      <span className="text-slate-400">Взаємодія: </span>
                      <span className="font-semibold">{activeModel.bondType}</span>
                    </div>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border ${theme.subCard} space-y-2`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-sky-400" />
                      {activeModel.simLabel}
                    </span>
                    <span className="font-mono font-bold text-sky-400">
                      {simValue} {activeModel.simUnit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={activeModel.simMin}
                    max={activeModel.simMax}
                    value={simValue}
                    onChange={(e) => setSimValue(Number(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                </div>

                {measureMode && (
                  <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/40 text-xs">
                    <div className="font-bold text-sky-300">3D-лінійка активна</div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      {measuredDistance !== null
                        ? `Виміряна відстань: ${(measuredDistance * 1.4).toFixed(2)} од.`
                        : 'Натисніть на два об’єкти у 3D-сцені по черзі.'}
                    </p>
                  </div>
                )}

                {assemblyMode && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs">
                    <div className="font-bold text-emerald-300">
                      Режим збірки: {assembledIds.length} / {sceneItems.length}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Натискайте на рознесені деталі у 3D-сцені, щоб зібрати модель!
                    </p>
                  </div>
                )}

                {selectedItem && (
                  <div className={`p-3 rounded-xl border ${theme.subCard} space-y-2`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400">Вибрано: {selectedItem.name}</span>
                      <MessageSquarePlus className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Додати нотатку до цього шару..."
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-white"
                      />
                      <button
                        onClick={saveNoteForSelected}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                        title="Зберегти нотатку"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {notes[selectedItem.id] && (
                      <p className="text-[11px] text-amber-300 bg-slate-950/60 px-2 py-1 rounded">
                        Нотатка: {notes[selectedItem.id]}
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={() => {
                    setSubjectSubView('testing');
                    goToQuizQuestion(0);
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow transition"
                >
                  Перейти до тестів ({subjectQuizzes.length} запитань) →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {currentSubjQ ? (
                  <div className={`p-3.5 rounded-xl border ${theme.subCard} space-y-3`}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-amber-400">
                        Запитання {quizIndex + 1} із {subjectQuizzes.length}
                      </span>
                      <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        Бали: {quizScore}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/70 text-slate-300 inline-block">
                      Тема: {currentSubjQ.modelTitle}
                    </div>

                    <p className="text-xs font-bold leading-snug">{currentSubjQ.question}</p>

                    {currentSubjQ.type === 'click3d' ? (
                      <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/40 text-xs space-y-1">
                        <div className="font-bold text-sky-300">Інтерактивне завдання в 3D:</div>
                        <p className="text-[11px]">
                          Натисніть безпосередньо на потрібний шар або атом на 3D-моделі ліворуч!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {currentSubjQ.options.map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              const ok = idx === currentSubjQ.correctIndex;
                              if (ok) {
                                setQuizScore((s) => s + 1);
                                setQuizFeedback({ ok: true, text: 'Правильна відповідь! Молодець!' });
                              } else {
                                setQuizFeedback({
                                  ok: false,
                                  text: `Невірно. Правильний варіант: ${currentSubjQ.options[currentSubjQ.correctIndex]}`,
                                });
                              }
                            }}
                            className="w-full text-left p-2.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-700 text-xs transition"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {quizFeedback && (
                      <div
                        className={`p-2.5 rounded-lg text-xs border flex items-start gap-2 ${
                          quizFeedback.ok
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                            : 'bg-rose-500/20 border-rose-500/50 text-rose-200'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{quizFeedback.text}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        onClick={() => goToQuizQuestion((quizIndex - 1 + subjectQuizzes.length) % subjectQuizzes.length)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium"
                      >
                        ← Назад
                      </button>
                      <button
                        onClick={() => goToQuizQuestion((quizIndex + 1) % subjectQuizzes.length)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold ${theme.accentBtn}`}
                      >
                        Наступне питання →
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Для цього розділу запитання ще формуються.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

