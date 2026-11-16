import { useState, useRef, useEffect, createContext, useContext } from 'react';
import { UI_THEMES } from '../data/themes';
import { GEOGRAPHY_MODELS } from '../data/geographyModels';
import { CHEMISTRY_MODELS } from '../data/chemistryModels';
import { ALL_MODELS } from '../data/models';

const StudioContext = createContext(null);

export function StudioProvider({ children }) {
  const [user, setUser] = useState(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [themeId, setThemeId] = useState('cosmos');
  const [customSummaries, setCustomSummaries] = useState({});

  const [leftState, setLeftState] = useState('open');
  const [rightState, setRightState] = useState('open');

  const [activeSubject, setActiveSubject] = useState('geography');
  const [activeModelId, setActiveModelId] = useState('geo-earth-layers');
  const [layerFilter, setLayerFilter] = useState('all');

  const [verilogState, setVerilogState] = useState({
    lessonId: 'v-gates',
    inA: 1,
    inB: 0,
    inC: 1,
    gateMode: 'AND',
    codeSnippet: 'assign Y = A & B;',
    subView: 'theory',
    chainStep: 0,
    score: 0,
    feedback: null,
  });

  const [sceneItems, setSceneItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [subjectSubView, setSubjectSubView] = useState('theory');
  const [rightTab, setRightTab] = useState('learn');
  const [guideStep, setGuideStep] = useState(0);
  const [simValue, setSimValue] = useState(8);

  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState([]);
  const [measuredDistance, setMeasuredDistance] = useState(null);

  const [assemblyMode, setAssemblyMode] = useState(false);
  const [assembledIds, setAssembledIds] = useState([]);

  const [notes, setNotes] = useState({});
  const [noteDraft, setNoteDraft] = useState('');

  const [quizIndexBySubject, setQuizIndexBySubject] = useState({
    geography: 0,
    chemistry: 0,
  });
  const [quizScoreBySubject, setQuizScoreBySubject] = useState({
    geography: 0,
    chemistry: 0,
  });
  const [quizFeedback, setQuizFeedback] = useState(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [exploded, setExploded] = useState(false);
  const [xrMessage, setXrMessage] = useState('');

  const theme = UI_THEMES.find((t) => t.id === themeId) || UI_THEMES[0];
  const activeModel = ALL_MODELS.find((m) => m.id === activeModelId) || ALL_MODELS[0];
  const selectedItem = sceneItems.find((item) => item.id === selectedId) || null;

  const subjectModels = activeSubject === 'chemistry' ? CHEMISTRY_MODELS : GEOGRAPHY_MODELS;
  const subjectQuizzes = subjectModels.flatMap((m) =>
    m.quiz.map((q) => ({
      ...q,
      modelTitle: m.title,
      badge: m.badge,
      subject: m.subject,
    }))
  );

  const currentSubjectKey = activeSubject === 'chemistry' ? 'chemistry' : 'geography';
  const quizIndex = quizIndexBySubject[currentSubjectKey] || 0;
  const quizScore = quizScoreBySubject[currentSubjectKey] || 0;

  const setQuizIndex = (val) => {
    setQuizIndexBySubject((prev) => ({ ...prev, [currentSubjectKey]: val }));
  };

  const setQuizScore = (updater) => {
    setQuizScoreBySubject((prev) => ({
      ...prev,
      [currentSubjectKey]:
        typeof updater === 'function' ? updater(prev[currentSubjectKey] || 0) : updater,
    }));
  };

  const apiRef = useRef({
    zoomIn: () => {},
    zoomOut: () => {},
    resetCamera: () => {},
    focusOnObject: () => {},
    loadModel: () => {},
    getObjectWorldPos: () => null,
    clearMeasureLine: () => {},
    drawMeasureLine: () => {},
    enterVR: () => {},
  });

  const liveFlagsRef = useRef({
    isPlaying: true,
    wireframe: false,
    showGrid: true,
    exploded: false,
    assemblyMode: false,
    assembledIds: [],
    selectedId: null,
    simValue: 8,
    activeModelId: 'geo-earth-layers',
    layerFilter: 'all',
    activeSubject: 'geography',
    verilogState,
  });

  useEffect(() => {
    liveFlagsRef.current = {
      isPlaying,
      wireframe,
      showGrid,
      exploded,
      assemblyMode,
      assembledIds,
      selectedId,
      simValue,
      activeModelId,
      layerFilter,
      activeSubject,
      verilogState,
    };
  }, [
    isPlaying,
    wireframe,
    showGrid,
    exploded,
    assemblyMode,
    assembledIds,
    selectedId,
    simValue,
    activeModelId,
    layerFilter,
    activeSubject,
    verilogState,
  ]);

  const selectModel = (modelId, autoFocusPartId = null, keepSubView = false) => {
    const found = ALL_MODELS.find((m) => m.id === modelId);
    if (!found) return;
    setActiveSubject(found.subject);
    setActiveModelId(modelId);
    setSimValue(found.simDefault);
    setGuideStep(0);
    setLayerFilter('all');
    if (!keepSubView) {
      setSubjectSubView('theory');
      setQuizFeedback(null);
    }
    setAssemblyMode(false);
    setAssembledIds([]);
    setMeasurePoints([]);
    setMeasuredDistance(null);
    apiRef.current.clearMeasureLine();
    apiRef.current.loadModel(modelId);

    if (autoFocusPartId) {
      setTimeout(() => {
        setSelectedId(autoFocusPartId);
        apiRef.current.focusOnObject(autoFocusPartId);
      }, 90);
    }
  };

  const selectVerilogLesson = (lessonId, keepSubView = false) => {
    setActiveSubject('verilog');
    setActiveModelId(lessonId);
    setLayerFilter('all');
    setAssemblyMode(false);
    setExploded(false);
    const defaultCodes = {
      'v-gates': 'assign Y = A & B; // Базовий логічний вентиль',
      'v-cascade': 'assign Y = (A & B) | C; // Двокаскадна логіка',
      'v-adder': 'assign Sum = A ^ B;\nassign Carry = A & B;',
      'v-mux': 'assign Y = C ? B : A; // Мультиплексор 2-в-1',
    };
    setVerilogState((prev) => ({
      ...prev,
      lessonId,
      subView: keepSubView ? prev.subView : 'theory',
      codeSnippet: defaultCodes[lessonId] || prev.codeSnippet,
    }));
    apiRef.current.loadModel(lessonId);
  };

  const goToQuizQuestion = (idx) => {
    const q = subjectQuizzes[idx];
    setQuizIndex(idx);
    setQuizFeedback(null);
    if (!q) return;

    if (q.modelId && q.modelId !== activeModelId) {
      selectModel(q.modelId, q.focusPartId || null, true);
    } else if (q.focusPartId) {
      setSelectedId(q.focusPartId);
      apiRef.current.focusOnObject(q.focusPartId);
    }
    setLayerFilter('all');
    setExploded(false);
  };

  const toggleAssemblyMode = () => {
    setAssemblyMode((prev) => {
      const next = !prev;
      if (next) {
        setExploded(false);
        setAssembledIds([]);
      } else {
        setAssembledIds([]);
      }
      return next;
    });
  };

  const handleSelectEntity = (entityId) => {
    setSelectedId(entityId);
    setNoteDraft(entityId ? notes[entityId] || '' : '');

    if (!entityId) return;

    if (assemblyMode) {
      setAssembledIds((prev) => (prev.includes(entityId) ? prev : [...prev, entityId]));
    }

    if (measureMode) {
      const pos = apiRef.current.getObjectWorldPos(entityId);
      const itemObj = sceneItems.find((i) => i.id === entityId);
      if (pos && itemObj) {
        setMeasurePoints((prev) => {
          const nextPts =
            prev.length >= 2
              ? [{ id: entityId, name: itemObj.name, pos }]
              : [...prev, { id: entityId, name: itemObj.name, pos }];
          if (nextPts.length === 2) {
            const dist = nextPts[0].pos.distanceTo(nextPts[1].pos);
            setMeasuredDistance(dist);
            apiRef.current.drawMeasureLine(nextPts[0].pos, nextPts[1].pos);
          } else {
            setMeasuredDistance(null);
            apiRef.current.clearMeasureLine();
          }
          return nextPts;
        });
      }
      return;
    }

    if (rightTab === 'learn' && subjectSubView === 'testing' && activeSubject !== 'verilog') {
      const currentQ = subjectQuizzes[quizIndex];
      if (currentQ && currentQ.type === 'click3d') {
        if (entityId === currentQ.targetId) {
          setQuizFeedback({
            ok: true,
            text: 'Правильно! Ви точно знайшли потрібний шар / об’єкт у 3D-сцені.',
          });
          setQuizScore((s) => s + 1);
        } else {
          setQuizFeedback({
            ok: false,
            text: `Це інший шар/елемент. Підказка: ${currentQ.hint}`,
          });
        }
      }
    }
  };

  const saveNoteForSelected = () => {
    if (!selectedId) return;
    setNotes((prev) => ({ ...prev, [selectedId]: noteDraft.trim() }));
  };

  const updateModelSummary = (modelId, newText) => {
    setCustomSummaries((prev) => ({ ...prev, [modelId]: newText }));
  };

  const effectiveSummary = customSummaries[activeModelId] ?? activeModel.summary;

  const value = {
    user,
    setUser,
    showSubjectModal,
    setShowSubjectModal,
    theme,
    themeId,
    setThemeId,
    effectiveSummary,
    updateModelSummary,
    leftState,
    setLeftState,
    rightState,
    setRightState,
    activeSubject,
    setActiveSubject,
    activeModelId,
    activeModel,
    selectModel,
    selectVerilogLesson,
    verilogState,
    setVerilogState,
    layerFilter,
    setLayerFilter,
    sceneItems,
    setSceneItems,
    selectedId,
    setSelectedId,
    handleSelectEntity,
    selectedItem,
    subjectSubView,
    setSubjectSubView,
    rightTab,
    setRightTab,
    guideStep,
    setGuideStep,
    simValue,
    setSimValue,
    measureMode,
    setMeasureMode,
    measurePoints,
    setMeasurePoints,
    measuredDistance,
    setMeasuredDistance,
    assemblyMode,
    toggleAssemblyMode,
    assembledIds,
    notes,
    noteDraft,
    setNoteDraft,
    saveNoteForSelected,
    subjectQuizzes,
    quizIndex,
    goToQuizQuestion,
    quizFeedback,
    setQuizFeedback,
    quizScore,
    setQuizScore,
    isPlaying,
    setIsPlaying,
    wireframe,
    setWireframe,
    showGrid,
    setShowGrid,
    exploded,
    setExploded,
    xrMessage,
    setXrMessage,
    apiRef,
    liveFlagsRef,
  };

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export const useStudio = () => useContext(StudioContext);

