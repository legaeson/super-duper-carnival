import { useState, useEffect } from 'react';
import { useWorkout } from '../store/WorkoutContext';
import type { Screen, RouteState } from '../App';
import { ArrowLeft, Check, Edit2, TrendingUp, Info } from 'lucide-react';
import type { ExerciseLog } from '../types';

interface Props {
  weekId: number;
  dayId: number;
  navigate: (screen: Screen, params?: Partial<RouteState>) => void;
}

export function WorkoutSession({ weekId, dayId, navigate }: Props) {
  const { plan, journal, setJournal, getSuggestedWeight, unit } = useWorkout();
  
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
        
        initial[ex.id] = {
          weightUsed: suggested !== null ? suggested : ex.targetWeight,
          sets: Array(ex.sets).fill(null).map(() => ({ targetReps: ex.targetReps, actualReps: -1 }))
        };
      });
      setSessionData(initial);
    }
  }, [dayPlan, journal, sessionKey, weekId, getSuggestedWeight]);

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

  const handleFinish = () => {
    const updatedJournal = { ...journal };
    updatedJournal.sessions[sessionKey] = {
      date: new Date().toISOString().split('T')[0],
      startedAt: startTime,
      finishedAt: new Date().toISOString(),
      exercises: sessionData
    };
    
    setJournal(updatedJournal);
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

        const suggestedWeight = getSuggestedWeight(ex.id, weekId);
        const hasSuggestion = suggestedWeight !== null && suggestedWeight !== ex.targetWeight;

        return (
          <div key={ex.id} className="card">
            {hasSuggestion && (
              <div className="recommendation-banner">
                <TrendingUp size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <span className="font-bold">Рекомендация: {displayDualWeight(suggestedWeight)}</span> (было {displayDualWeight(ex.targetWeight)} — все подходы закрыты).
                </div>
              </div>
            )}
            
            {!hasSuggestion && weekId > 1 && (
               <div className="recommendation-banner neutral">
                 <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                 <div className="text-secondary">
                   Вес: {displayDualWeight(log.weightUsed)} (в прошлый раз не все подходы закрыты).
                 </div>
               </div>
            )}

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
                const isFailed = isCompleted && set.actualReps < set.targetReps;
                const isSuccess = isCompleted && set.actualReps >= set.targetReps;
                
                return (
                  <button 
                    key={i}
                    className={`set-btn ${isSuccess ? 'completed' : ''} ${isFailed ? 'failed' : ''}`}
                    onClick={() => handleSetClick(ex.id, i, set.targetReps)}
                  >
                    {isCompleted ? set.actualReps : '-'}
                    <span className="set-btn-label">/{set.targetReps}</span>
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
              <button 
                className="stepper-btn" 
                style={{ width: '60px', height: '60px', fontSize: '1.75rem' }}
                onClick={() => setInputValue(prev => Math.max(0, parseInt(prev || '0') - 1).toString())}
              >-</button>
              
              <input 
                type="text" 
                readOnly
                inputMode="none"
                className="input input-number"
                style={{ width: '100px', height: '60px', fontSize: '2rem', cursor: 'default' }}
                value={inputValue}
              />
              
              <button 
                className="stepper-btn" 
                style={{ width: '60px', height: '60px', fontSize: '1.75rem' }}
                onClick={() => setInputValue(prev => (parseInt(prev || '0') + 1).toString())}
              >+</button>
            </div>

            <button className="btn btn-primary" onClick={saveSet}>
              Сохранить
            </button>
          </div>
        </div>
      )}

      {/* Weight Edit Modal - Clean number input without 'кг' inside */}
      {editingWeightExId && (
        <div className="modal-overlay" onClick={() => setEditingWeightExId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="mb-2 text-center font-bold">Изменение рабочего веса (в кг)</h3>
            <p className="text-center text-secondary mb-4">
              Эквивалент: <span className="font-bold text-primary">≈ {((parseFloat(weightInputValue) || 0) * 2.20462).toFixed(1)} lbs</span>
            </p>
            
            <div className="flex justify-center items-center gap-4 mb-6">
              <button 
                className="stepper-btn" 
                style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}
                onClick={() => setWeightInputValue(prev => Math.max(0, parseFloat(prev || '0') - 2.5).toString())}
              >-</button>
              
              <input 
                type="text" 
                readOnly
                inputMode="none"
                className="input input-number"
                style={{ width: '120px', height: '60px', fontSize: '1.5rem', cursor: 'default' }}
                value={weightInputValue}
              />
              
              <button 
                className="stepper-btn" 
                style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}
                onClick={() => setWeightInputValue(prev => (parseFloat(prev || '0') + 2.5).toString())}
              >+</button>
            </div>

            <button className="btn btn-primary" onClick={saveWeight}>
              Применить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
