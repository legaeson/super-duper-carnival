import { useState } from 'react';
import { useWorkout } from '../store/WorkoutContext';
import type { Screen, RouteState } from '../App';
import { Play } from 'lucide-react';

interface Props {
  navigate: (screen: Screen, params?: Partial<RouteState>) => void;
}

export function Dashboard({ navigate }: Props) {
  const { plan, journal } = useWorkout();
  
  // Find the latest week or default to week 1
  const [activeWeek, setActiveWeek] = useState(plan.weeks[0]?.week || 1);

  const currentWeekData = plan.weeks.find(w => w.week === activeWeek);

  return (
    <div>
      <h2 className="mb-4 font-bold">Выберите неделю</h2>
      
      <div className="week-selector">
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

      <div className="mt-4">
        <h2 className="mb-4 font-bold">Тренировки</h2>
        {currentWeekData?.days.map(day => {
          const sessionKey = `w${activeWeek}-d${day.day}`;
          const isCompleted = !!journal.sessions[sessionKey];

          return (
            <div key={day.day} className="card flex items-center justify-between">
              <div>
                <h3 className="card-title mb-1">{day.label}</h3>
                <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
                  {day.exercises.length} упражнений
                </p>
                {isCompleted && (
                  <p className="text-success mt-1" style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                    ✓ Выполнено
                  </p>
                )}
              </div>
              <button 
                className="icon-btn" 
                style={{ backgroundColor: 'var(--primary-color)', color: 'var(--bg-color)', padding: '1rem' }}
                onClick={() => navigate('workout', { weekId: activeWeek, dayId: day.day })}
              >
                <Play fill="currentColor" size={24} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
