import { useState, useEffect, useRef } from 'react';
import { useWorkout } from '../store/WorkoutContext';
import type { Screen, RouteState } from '../App';
import { ArrowLeft, Check, Edit2, TrendingUp, Info } from 'lucide-react';
import type { ExerciseLog } from '../types';

interface HoldButtonProps {
  direction: 1 | -1;
  onStep: (delta: number) => void;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

function HoldButton({ direction, onStep, className, style, children }: HoldButtonProps) {
  const timerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const isHeldRef = useRef<boolean>(false);
  const countRef = useRef<number>(0);

  const stop = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timerRef.current = null;
    intervalRef.current = null;
    isHeldRef.current = false;
    countRef.current = 0;
  };

  const executeStep = () => {
    countRef.current += 1;
    const c = countRef.current;
    
    // Graduated acceleration step:
    // 1-2 steps: 0.5 kg
    // 3-4 steps: 1.0 kg
    // 5-6 steps: 2.5 kg
    // 7+ steps: 5.0 kg
    let stepAmount = 0.5;
    if (c >= 7) stepAmount = 5.0;
    else if (c >= 5) stepAmount = 2.5;
    else if (c >= 3) stepAmount = 1.0;

    onStep(stepAmount * direction);
  };

  const start = () => {
    if (isHeldRef.current) return;
    isHeldRef.current = true;
    countRef.current = 0;
    
    executeStep();

    timerRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        executeStep();
      }, 90);
    }, 280);
  };

  return (
    <button
      className={className}
      style={{ ...style, userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none' }}
      onMouseDown={start}
      onMouseUp={stop}
      onMouseLeave={stop}
      onTouchStart={start}
      onTouchEnd={stop}
      onTouchCancel={stop}
    >
      {children}
    </button>
  );
}

interface Props {
  weekId: number;
  dayId: number;
  navigate: (screen: Screen, params?: Partial<RouteState>) => void;
}

export function WorkoutSession({ weekId, dayId, navigate }: Props) {
  const { plan, journal, saveSessionLog, getSuggestedWeight, getLastLoggedWeight, unit } = useWorkout();
  
  const dayPlan = plan.weeks.find(w => w.week === weekId)?.days.find(d => d.day === dayId);
  const sessionKey = `w${weekId}-d${dayId}`;
  
  const [sessionData, setSessionData] = useState<Record<string, ExerciseLog>>({});
  const [startTime, setStartTime] = useState<string>('');
  const [activeSetInput, setActiveSetInput] = useState<{exId: string, setIndex: number, target: number} | null>(null);
  const [inputValue, setInputValue] = useState<string>('');

  const [editingWeightExId, setEditingWeightExId] = useState<string | null>(null);
  const [weightInputValue, setWeightInputValue] = useState<string>('');

  useEffect(() => {
    if (!dayPlan) return;

    const existingSession = journal.sessions[sessionKey];
    if (existingSession) {
      setSessionData(existingSession.exercises);
      setStartTime(existingSession.startedAt || new Date().toISOString());
    } else {
      setStartTime(new Date().toISOString());
      const initial: Record<string, ExerciseLog> = {};
      
      dayPlan.exercises.forEach(ex => {
        const suggested = getSuggestedWeight(ex.id, weekId);
        const lastLogged = getLastLoggedWeight(ex.id, weekId);
        
        const startWeight = suggested !== null 
          ? suggested 
          : (lastLogged !== null ? lastLogged : ex.targetWeight);
        
        initial[ex.id] = {
          weightUsed: startWeight,
          sets: Array(ex.sets).fill(null).map(() => ({ targetReps: ex.targetReps, actualReps: -1 }))
        };
      });
      setSessionData(initial);
    }
  }, [dayPlan, journal, sessionKey, weekId, getSuggestedWeight, getLastLoggedWeight]);

  if (!dayPlan) return <div>Workout not found</div>;

  const handleSetClick = (exId: string, setIndex: number, targetReps: number) => {
    setActiveSetInput({ exId, setIndex, target: targetReps });
    const currentActual = sessionData[exId].sets[setIndex].actualReps;
    setInputValue(currentActual > -1 ? currentActual.toString() : targetReps.toString());
  };

  const saveSet = () => {
    if (!activeSetInput) return;
    const { exId, setIndex } = activeSetInput;
    const val = parseInt(inputValue, 10);
    
    if (!isNaN(val) && val >= 0) {
      setSessionData(prev => {
        const newData = { ...prev };
        newData[exId].sets[setIndex].actualReps = val;
        return newData;
      });
    }
    setActiveSetInput(null);
  };

  const saveWeight = () => {
    if (!editingWeightExId) return;
    const val = parseFloat(weightInputValue);
    if (!isNaN(val) && val >= 0) {
      setSessionData(prev => {
        const newData = { ...prev };
        newData[editingWeightExId].weightUsed = val;
        return newData;
      });
    }
    setEditingWeightExId(null);
  };

  const handleWeightDelta = (delta: number) => {
    setWeightInputValue(prev => {
      const current = parseFloat(prev || '0');
      const updated = Math.max(0, Math.round((current + delta) * 10) / 10);
      return updated.toString();
    });
  };

  const handleRepsDelta = (delta: number) => {
    setInputValue(prev => {
      const current = parseInt(prev || '0', 10);
      const updated = Math.max(0, current + Math.sign(delta));
      return updated.toString();
    });
  };

  const handleFinish = () => {
    saveSessionLog(sessionKey, sessionData, startTime);
    navigate('dashboard');
  };

  // Helper for dual weight display
  const displayDualWeight = (weightKg: number) => {
    const lbs = (weightKg * 2.20462).toFixed(1);
    if (unit === 'lbs') {
      return `${lbs} lbs (${weightKg} кг)`;
    }
    return `${weightKg} кг (${lbs} lbs)`;
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button className="icon-btn" onClick={() => navigate('dashboard')}>
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-bold text-primary" style={{ fontSize: '1.2rem' }}>{dayPlan.label}</h2>
      </div>

      {dayPlan.exercises.map((ex, index) => {
        const log = sessionData[ex.id];
        if (!log) return null;


        return (
          <div key={ex.id} className="card">
            <div className="flex justify-between items-start mb-2">
              <h3 className="card-title" style={{ margin: 0 }}>{index + 1}. {ex.name}</h3>
              <div 
                className="editable-weight"
                onClick={() => {
                  setEditingWeightExId(ex.id);
                  setWeightInputValue(log.weightUsed.toString());
                }}
              >
                {displayDualWeight(log.weightUsed)} <Edit2 size={12} />
              </div>
            </div>
            
            <p className="text-secondary mb-2" style={{ fontSize: '0.85rem' }}>
              Цель: {ex.sets}x{ex.targetReps} • {ex.weightLevel}
            </p>

            <div className="sets-grid">
              {log.sets.map((set, i) => {
                const isCompleted = set.actualReps > -1;
                const isSuccess = isCompleted && set.actualReps >= set.targetReps;
                const isPartial = isCompleted && set.actualReps < set.targetReps;

                const fillPercent = isCompleted 
                  ? Math.min(100, Math.max(0, Math.round((set.actualReps / set.targetReps) * 100))) 
                  : 0;
                
                return (
                  <button 
                    key={i}
                    className={`set-btn ${isSuccess ? 'completed' : ''} ${isPartial ? 'partial' : ''}`}
                    style={isPartial ? {
                      background: `linear-gradient(to right, var(--completed-bg) 0%, var(--completed-bg) ${fillPercent}%, var(--surface-color-light) ${fillPercent}%, var(--surface-color-light) 100%)`
                    } : undefined}
                    onClick={() => handleSetClick(ex.id, i, set.targetReps)}
                  >
                    <span style={{ 
                      position: 'relative', 
                      zIndex: 2, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      color: isSuccess ? 'var(--completed-text)' : (isPartial && fillPercent >= 50 ? 'var(--completed-text)' : 'var(--text-primary)') 
                    }}>
                      <span>{isCompleted ? set.actualReps : '-'}</span>
                      <span 
                        className="set-btn-label" 
                        style={{ 
                          color: isSuccess ? 'var(--completed-text)' : (isPartial && fillPercent >= 50 ? 'var(--completed-text)' : 'var(--text-secondary)'),
                          opacity: 0.85
                        }}
                      >
                        /{set.targetReps}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="mt-6">
        <button className="btn btn-primary" onClick={handleFinish}>
          <Check size={18} /> Завершить тренировку
        </button>
      </div>

      {/* Set Input Modal */}
      {activeSetInput && (
        <div className="modal-overlay" onClick={() => setActiveSetInput(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="mb-2 text-center font-bold">
              Подход {activeSetInput.setIndex + 1}
            </h3>
            <p className="text-center text-secondary mb-4">Выполнено повторений:</p>
            
            <div className="flex justify-center items-center gap-4 mb-6">
              <HoldButton 
                direction={-1}
                className="stepper-btn" 
                style={{ width: '60px', height: '60px', fontSize: '1.75rem' }}
                onStep={handleRepsDelta}
              >-</HoldButton>
              
              <input 
                type="number" 
                inputMode="numeric"
                className="input input-number"
                style={{ width: '100px', height: '60px', fontSize: '2rem', textAlign: 'center' }}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
              />
              
              <HoldButton 
                direction={1}
                className="stepper-btn" 
                style={{ width: '60px', height: '60px', fontSize: '1.75rem' }}
                onStep={handleRepsDelta}
              >+</HoldButton>
            </div>

            <button className="btn btn-primary" onClick={saveSet}>
              Сохранить
            </button>
          </div>
        </div>
      )}

      {/* Weight Edit Modal - Direct keyboard entry + accelerated hold-to-repeat */}
      {editingWeightExId && (() => {
        const editingEx = dayPlan.exercises.find(e => e.id === editingWeightExId);
        const suggestedWeight = editingEx ? getSuggestedWeight(editingEx.id, weekId) : null;
        const hasSuggestion = suggestedWeight !== null && suggestedWeight !== editingEx?.targetWeight;

        return (
          <div className="modal-overlay" onClick={() => setEditingWeightExId(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3 className="mb-2 text-center font-bold">Изменение рабочего веса</h3>
              <p className="text-center text-secondary mb-4">
                Эквивалент: <span className="font-bold text-primary">≈ {((parseFloat(weightInputValue) || 0) * 2.20462).toFixed(1)} lbs</span>
              </p>
              
              {hasSuggestion && editingEx && (
                <div className="recommendation-banner" style={{ margin: '0 0 1.25rem 0' }}>
                  <TrendingUp size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <span className="font-bold">Рекомендация: {displayDualWeight(suggestedWeight)}</span><br/>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>(в прошлый раз было {displayDualWeight(editingEx.targetWeight)}).</span>
                  </div>
                </div>
              )}
              
              {!hasSuggestion && weekId > 1 && editingEx && (
                 <div className="recommendation-banner neutral" style={{ margin: '0 0 1.25rem 0' }}>
                   <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                   <div className="text-secondary">
                     В прошлый раз не все подходы были закрыты, оставляем прошлый рабочий вес.
                   </div>
                 </div>
              )}

              <div className="flex justify-center items-center gap-3 mb-6">
                <HoldButton 
                  direction={-1}
                  className="stepper-btn" 
                  style={{ width: '56px', height: '56px', fontSize: '1.5rem' }}
                  onStep={handleWeightDelta}
                >-</HoldButton>
                
                <input 
                  type="number" 
                  step="any"
                  inputMode="decimal"
                  className="input input-number"
                  style={{ width: '120px', height: '56px', fontSize: '1.5rem', textAlign: 'center', fontWeight: 'bold' }}
                  value={weightInputValue}
                  onChange={e => setWeightInputValue(e.target.value)}
                />
                
                <HoldButton 
                  direction={1}
                  className="stepper-btn" 
                  style={{ width: '56px', height: '56px', fontSize: '1.5rem' }}
                  onStep={handleWeightDelta}
                >+</HoldButton>
              </div>

              <button className="btn btn-primary" onClick={saveWeight}>
                Применить
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
