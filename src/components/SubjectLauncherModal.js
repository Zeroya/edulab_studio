import { useState } from 'react';
import { FlaskConical, Globe, Cpu } from 'lucide-react';
import { GEOGRAPHY_MODELS } from '../data/geographyModels';
import { CHEMISTRY_MODELS } from '../data/chemistryModels';
import { useStudio } from '../context/StudioContext';

// ============================================================================
// 0.1. ДРУГЕ ВІКНО ПІСЛЯ АВТОРИЗАЦІЇ: ОГЛЯД ТА ВИБІР ПРЕДМЕТА
// ============================================================================
export default function SubjectLauncherModal() {
  const {
    user,
    showSubjectModal,
    setShowSubjectModal,
    selectModel,
    selectVerilogLesson,
    setRightTab,
    setSubjectSubView,
    setVerilogState,
  } = useStudio();

  const [expandedSubject, setExpandedSubject] = useState('geography');

  if (!user || !showSubjectModal) return null;

  const geoQuizCount = GEOGRAPHY_MODELS.reduce((sum, m) => sum + m.quiz.length, 0);
  const chemQuizCount = CHEMISTRY_MODELS.reduce((sum, m) => sum + m.quiz.length, 0);
  const verilogQuizCount = 10;

  const SUBJECT_CARDS = [
    {
      id: 'geography',
      title: '1. Географія (Будова Землі та Атмосфера)',
      badge: 'ГЕОГРАФІЯ',
      quizCount: geoQuizCount,
      modelsCount: GEOGRAPHY_MODELS.length,
      accentBorder: 'border-emerald-500/50',
      accentBg: 'bg-emerald-500/15 text-emerald-300',
      icon: Globe,
      topics: GEOGRAPHY_MODELS.map((m) => `${m.title} (${m.quiz.length} пит.)`),
      summary: 'Інтерактивний 3D-розріз Землі, супутникові текстури NASA, стратовулкан, рельєф та кліматичні пояси.',
    },
    {
      id: 'chemistry',
      title: '2. Хімія (Молекули та кристалічні ґратки)',
      badge: 'ХІМІЯ',
      quizCount: chemQuizCount,
      modelsCount: CHEMISTRY_MODELS.length,
      accentBorder: 'border-sky-500/50',
      accentBg: 'bg-sky-500/15 text-sky-300',
      icon: FlaskConical,
      topics: CHEMISTRY_MODELS.map((m) => `${m.title} (${m.quiz.length} пит.)`),
      summary: 'Просторові 3D-моделі води, вуглекислого газу, метану, бензолу та іонної ґратки NaCl.',
    },
    {
      id: 'verilog',
      title: '3. Verilog HDL (Цифрова електроніка та логіка)',
      badge: 'VERILOG',
      quizCount: verilogQuizCount,
      modelsCount: 6,
      accentBorder: 'border-purple-500/50',
      accentBg: 'bg-purple-500/15 text-purple-300',
      icon: Cpu,
      topics: [
        '1. Базові логічні вентилі AND / OR / XOR (3 пит.)',
        '2. Двокаскадні логічні ланцюги (A & B) | C (2 пит.)',
        '3. Півсуматор Half-Adder: Sum та Carry (2 пит.)',
        '4. Мультиплексор 2-в-1 MUX, Дешифратор та RS-тригер (3 пит.)',
      ],
      summary: 'Жива 3D-симуляція проходження електричного струму через логічні вентилі та редактор коду Verilog.',
    },
  ];

  const handleLaunchSubject = (subjId) => {
    setRightTab('learn');
    if (subjId === 'geography') {
      selectModel(GEOGRAPHY_MODELS[0].id);
      setSubjectSubView('theory');
    } else if (subjId === 'chemistry') {
      selectModel(CHEMISTRY_MODELS[0].id);
      setSubjectSubView('theory');
    } else if (subjId === 'verilog') {
      selectVerilogLesson('v-gates');
      setVerilogState((prev) => ({ ...prev, subView: 'theory' }));
    }
    setShowSubjectModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-5 text-slate-100">
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                Доступно 3 предмети
              </span>
              <span className="text-xs text-slate-400">
                Вітаємо, <b className="text-white">{user.name}</b> ({user.group})
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1.5">
              Оберіть навчальний предмет для старту роботи
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ви можете розгорнути будь-який предмет, щоб переглянути теми й кількість тестів, а під час роботи вільно перемикатися між ними.
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {SUBJECT_CARDS.map((card) => {
            const Icon = card.icon;
            const isExpanded = expandedSubject === card.id;

            return (
              <div
                key={card.id}
                className={`rounded-xl border transition bg-slate-950/70 ${
                  isExpanded ? card.accentBorder : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div
                    onClick={() => setExpandedSubject(isExpanded ? null : card.id)}
                    className="flex items-start gap-3 cursor-pointer flex-1 min-w-0"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.accentBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{card.title}</h3>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                          Тестів: {card.quizCount}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{card.summary}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setExpandedSubject(isExpanded ? null : card.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700 transition"
                    >
                      {isExpanded ? 'Згорнути ▲' : 'Теми та питання ▼'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLaunchSubject(card.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white text-xs font-bold shadow transition"
                    >
                      Відкрити →
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-3.5 pt-2 border-t border-slate-800/80 bg-slate-900/50 rounded-b-xl space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-300">
                        Теми, що розглядаються ({card.modelsCount} модулі):
                      </span>
                      <span className="text-emerald-400 font-semibold">
                        Усього запитань у тесті: {card.quizCount}
                      </span>
                    </div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {card.topics.map((topic, idx) => (
                        <li
                          key={idx}
                          className="text-[11px] text-slate-300 bg-slate-950/70 border border-slate-800/90 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                          <span className="truncate">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="rounded-xl bg-slate-800/40 border border-dashed border-slate-700 p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider shrink-0">
              Скоро більше
            </span>
            <p className="text-[11px] text-slate-300 leading-snug">
              Нові навчальні предмети (<b>Фізика та оптика</b>, <b>Астрономія</b>, <b>Робототехніка</b>) перебувають на етапі розробки та додавання до платформи!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

