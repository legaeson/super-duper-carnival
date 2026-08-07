import { useWorkout } from '../store/WorkoutContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Screen, RouteState } from '../App';
import { Play } from 'lucide-react';

interface Props {
  navigate: (screen: Screen, params?: Partial<RouteState>) => void;
}

export function Dashboard({ navigate }: Props) {
  const { plan, journal } = useWorkout();
  
  const [activeWeek, setActiveWeek] = useLocalStorage<number>('active_workout_week', plan.weeks[0]?.week || 1);
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
    </div>
  );
}
