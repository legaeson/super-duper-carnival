import { useMemo } from 'react';
import { useWorkout } from '../store/WorkoutContext';
import type { Screen, RouteState } from '../App';
import { ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { differenceInMinutes } from 'date-fns';

interface Props {
  navigate: (screen: Screen, params?: Partial<RouteState>) => void;
}

export function Statistics({ navigate }: Props) {
  const { journal } = useWorkout();

  // Process data for charts
  const sessionsList = Object.values(journal.sessions).sort((a, b) => 
    new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
  );

  const durationData = useMemo(() => {
    return sessionsList.map((s, index) => {
      const diff = differenceInMinutes(new Date(s.finishedAt), new Date(s.startedAt));
      return {
        name: `Трен. ${index + 1}`,
        duration: diff,
        date: s.date
      };
    });
  }, [sessionsList]);

  // Find a popular exercise for progression chart (e.g. Squat or Bench Press)
  const progressionData = useMemo(() => {
    const data: any[] = [];
    sessionsList.forEach((s, index) => {
      if (s.exercises['squat']) {
        data.push({
          name: `Трен. ${index + 1}`,
          weight: s.exercises['squat'].weightUsed
        });
      }
    });
    return data;
  }, [sessionsList]);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button className="icon-btn" onClick={() => navigate('dashboard')}>
          <ArrowLeft size={24} />
        </button>
        <h2 className="font-bold text-primary" style={{ fontSize: '1.25rem' }}>Статистика</h2>
      </div>

      <div className="card mb-6">
        <h3 className="card-title mb-4">Всего тренировок</h3>
        <div className="text-primary" style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1 }}>
          {sessionsList.length}
        </div>
      </div>

      {durationData.length > 0 && (
        <div className="card mb-6">
          <h3 className="card-title mb-4">Длительность (мин)</h3>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={durationData}>
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface-color-light)', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--primary-color)' }}
                />
                <Bar dataKey="duration" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {progressionData.length > 0 && (
        <div className="card">
          <h3 className="card-title mb-4">Прогрессия: Присед (кг)</h3>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={progressionData}>
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis domain={['dataMin - 10', 'dataMax + 10']} stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface-color-light)', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--secondary-color)' }}
                />
                <Line type="monotone" dataKey="weight" stroke="var(--secondary-color)" strokeWidth={3} dot={{ r: 4, fill: 'var(--secondary-color)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
