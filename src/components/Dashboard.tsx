import { useState } from 'react';
import { useWorkout } from '../store/WorkoutContext';
import type { Screen, RouteState } from '../App';
import { Play, Sliders } from 'lucide-react';
import { LevelWeightsModal } from './LevelWeightsModal';

interface Props {
  navigate: (screen: Screen, params?: Partial<RouteState>) => void;
}

export function Dashboard({ navigate }: Props) {
  const { plan, journal, formatWeight } = useWorkout();
  
  const [activeWeek, setActiveWeek] = useState(plan.weeks[0]?.week || 1);
  const [showLevelWeightsModal, setShowLevelWeightsModal] = useState(false);

  const currentWeekData = plan.weeks.find(w => w.week === activeWeek) || plan.weeks[0];

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold text-primary" style={{ fontSize: '1.1rem' }}>Выберите неделю</h2>
        <span className="text-secondary" style={{ fontSize: '0.85rem' }}>Всего: {plan.weeks.length} нед.</span>
      </div>
      
      <div className="week-selector mb-5">
        {plan.weeks.map(week => (
          <button
            key={week.week}
            className={`week-tab ${activeWeek === week.week ? 'active' : ''}`}
            onClick={() => setActiveWeek(week.week)}
          >
            Неделя {week.week}
          </button>
        ))}
      </div>

      {/* Level Weights Configuration Button for the week */}
      <div className="card mb-6 flex justify-between items-center" style={{ gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <h4 className="font-bold text-primary mb-1" style={{ fontSize: '0.95rem' }}>Базовые веса недели {activeWeek}</h4>
          <p className="text-secondary" style={{ fontSize: '0.825rem', lineHeight: '1.4' }}>
            {currentWeekData?.levelWeights ? (
              <>
                Тяж: {formatWeight(currentWeekData.levelWeights.heavy || 0)} • 
                Средн: {formatWeight(currentWeekData.levelWeights.medium || 0)} • 
                Лёгк: {formatWeight(currentWeekData.levelWeights.light || 0)}
              </>
            ) : (
              <>Укажите базовые Тяжёлый / Средний / Лёгкий веса</>
            )}
          </p>
        </div>
        <button 
          className="btn btn-secondary" 
          style={{ width: 'auto', padding: '0.55rem 1rem', fontSize: '0.825rem' }}
          onClick={() => setShowLevelWeightsModal(true)}
        >
          <Sliders size={14} /> Настроить
        </button>
      </div>

      <div>
        <h2 className="mb-4 font-bold text-primary" style={{ fontSize: '1.1rem' }}>Дни тренировок</h2>
        {currentWeekData?.days.map(day => {
          const sessionKey = `w${activeWeek}-d${day.day}`;
          const isCompleted = !!journal.sessions[sessionKey];

          return (
            <div key={day.day} className="card flex items-center justify-between mb-3">
              <div>
                <h3 className="card-title mb-1">{day.label}</h3>
                <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
                  {day.exercises.length} упражнений
                </p>
                {isCompleted && (
                  <p className="text-primary mt-1 font-semibold" style={{ fontSize: '0.8rem' }}>
                    ✓ Выполнено
                  </p>
                )}
              </div>
              <button 
                className="icon-btn" 
                style={{ backgroundColor: 'var(--btn-bg)', color: 'var(--btn-text)', padding: '0.875rem', border: 'none', borderRadius: '12px' }}
                onClick={() => navigate('workout', { weekId: activeWeek, dayId: day.day })}
              >
                <Play fill="currentColor" size={18} />
              </button>
            </div>
          );
        })}
      </div>

      {showLevelWeightsModal && (
        <LevelWeightsModal 
          weekId={activeWeek} 
          onClose={() => setShowLevelWeightsModal(false)} 
        />
      )}
    </div>
  );
}
