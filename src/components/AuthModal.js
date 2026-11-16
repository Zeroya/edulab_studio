import { useState } from 'react';
import { Globe, Palette, AlertCircle } from 'lucide-react';
import { UI_THEMES } from '../data/themes';
import { useStudio } from '../context/StudioContext';

// ============================================================================
// 0. МОДАЛЬНЕ ВІКНО АВТОРИЗАЦІЇ З ОБОВ’ЯЗКОВОЮ ВАЛІДАЦІЄЮ І ВИБОРОМ 5 ТЕМ
// ============================================================================
export default function AuthModal() {
  const { user, setUser, setShowSubjectModal, themeId, setThemeId } = useStudio();
  const [role, setRole] = useState('student');
  const [fullName, setFullName] = useState('');
  const [groupOrDept, setGroupOrDept] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  if (user) return null;

  const validateFields = (nameVal, groupVal, roleVal) => {
    const nextErrors = {};
    const cleanName = nameVal.trim();
    const cleanGroup = groupVal.trim();

    if (!cleanName) {
      nextErrors.fullName = 'Введіть прізвище та ім’я (обов’язкове поле)';
    } else if (cleanName.length < 4) {
      nextErrors.fullName = 'Мінімум 4 символи (наприклад: Петренко Іван)';
    } else if (!/^[А-Яа-яІіЇїЄєҐґA-Za-z'\-\s.]+$/.test(cleanName)) {
      nextErrors.fullName = 'Використовуйте лише літери, пробіли або дефіс';
    } else if (cleanName.split(/\s+/).length < 2) {
      nextErrors.fullName = 'Вкажіть і прізвище, і ім’я (мінімум 2 слова)';
    }

    if (!cleanGroup) {
      nextErrors.groupOrDept =
        roleVal === 'teacher'
          ? 'Вкажіть кафедру або навчальний заклад'
          : 'Вкажіть клас або групу (напр. 8-Б або ІК-11)';
    } else if (cleanGroup.length < 2) {
      nextErrors.groupOrDept = 'Занадто коротке значення (мінімум 2 символи)';
    }

    return nextErrors;
  };

  const currentErrors = validateFields(fullName, groupOrDept, role);
  const isFormValid = Object.keys(currentErrors).length === 0;

  const handleLogin = (e) => {
    e.preventDefault();
    setTouched({ fullName: true, groupOrDept: true });
    const validationResult = validateFields(fullName, groupOrDept, role);
    setErrors(validationResult);

    if (Object.keys(validationResult).length > 0) return;

    setUser({
      name: fullName.trim(),
      role,
      group: groupOrDept.trim(),
    });
    setShowSubjectModal(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/92 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <form
        onSubmit={handleLogin}
        noValidate
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-5 text-slate-100"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-600 flex items-center justify-center shadow-lg shrink-0">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">WebXR EduLab — Географія, Хімія та Verilog</h1>
            <p className="text-xs text-slate-400">
              Заповніть дані профілю та оберіть тему інтерфейсу (5 варіантів)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              setRole('student');
              setErrors(validateFields(fullName, groupOrDept, 'student'));
            }}
            className={`p-3 rounded-xl border text-left transition ${
              role === 'student'
                ? 'bg-sky-600/25 border-sky-500 text-white shadow'
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <div className="text-xs font-bold">Учень / Студент</div>
            <div className="text-[11px] text-slate-300/80 mt-0.5">
              Дослідження шарів Землі, молекул, схем Verilog та проходження тестів
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole('teacher');
              setErrors(validateFields(fullName, groupOrDept, 'teacher'));
            }}
            className={`p-3 rounded-xl border text-left transition ${
              role === 'teacher'
                ? 'bg-emerald-600/25 border-emerald-500 text-white shadow'
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <div className="text-xs font-bold">Вчитель / Викладач</div>
            <div className="text-[11px] text-slate-300/80 mt-0.5">
              Редагування методичних матеріалів та демонстрація у VR
            </div>
          </button>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Palette className="w-3.5 h-3.5 text-sky-400" />
            Тема оформлення середовища:
          </label>
          <div className="grid grid-cols-5 gap-2">
            {UI_THEMES.map((t) => {
              const active = themeId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThemeId(t.id)}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                    active
                      ? 'bg-slate-800 border-sky-400 ring-2 ring-sky-400/30'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${t.preview} shadow`} />
                  <span className="text-[10px] font-medium text-center leading-tight text-slate-200">
                    {t.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Прізвище та ім’я <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, fullName: true }));
                setErrors(validateFields(fullName, groupOrDept, role));
              }}
              onChange={(e) => {
                setFullName(e.target.value);
                if (touched.fullName) {
                  setErrors(validateFields(e.target.value, groupOrDept, role));
                }
              }}
              placeholder={role === 'teacher' ? 'Напр.: Коваленко Олена' : 'Напр.: Петренко Іван'}
              className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition ${
                touched.fullName && currentErrors.fullName
                  ? 'border-rose-500 ring-1 ring-rose-500/40'
                  : 'border-slate-700 focus:border-sky-500'
              }`}
            />
            {touched.fullName && currentErrors.fullName && (
              <p className="flex items-center gap-1 text-[10px] text-rose-400 mt-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{currentErrors.fullName}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {role === 'teacher' ? 'Кафедра / Школа' : 'Клас / Група'}{' '}
              <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={groupOrDept}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, groupOrDept: true }));
                setErrors(validateFields(fullName, groupOrDept, role));
              }}
              onChange={(e) => {
                setGroupOrDept(e.target.value);
                if (touched.groupOrDept) {
                  setErrors(validateFields(fullName, e.target.value, role));
                }
              }}
              placeholder={role === 'teacher' ? 'Напр.: Кафедра АМЕС' : 'Напр.: 8-Б'}
              className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition ${
                touched.groupOrDept && currentErrors.groupOrDept
                  ? 'border-rose-500 ring-1 ring-rose-500/40'
                  : 'border-slate-700 focus:border-sky-500'
              }`}
            />
            {touched.groupOrDept && currentErrors.groupOrDept && (
              <p className="flex items-center gap-1 text-[10px] text-rose-400 mt-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{currentErrors.groupOrDept}</span>
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          className={`w-full py-2.5 rounded-xl text-white text-xs font-bold shadow-lg transition ${
            isFormValid
              ? 'bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 cursor-pointer'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
          }`}
        >
          Увійти в лабораторію ({role === 'teacher' ? 'Викладач' : 'Учень / Студент'})
        </button>
      </form>
    </div>
  );
}

