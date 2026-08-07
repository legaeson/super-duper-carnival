import { useMemo } from 'react';
import { useWorkout } from '../store/WorkoutContext';
import type { Screen, RouteState } from '../App';
import { ArrowLeft, TrendingUp, Award, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  navigate: (screen: Screen, params?: Partial<RouteState>) => void;
}

export function Statistics({ navigate }: Props) {
  const { journal } = useWorkout();

  // Process data for charts
  const sessionsList = useMemo(() => {
    return Object.values(journal.sessions).sort((a, b) => 
      new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
    );
  }, [journal]);

  // Calculate total tonnage (Volume = weight * reps) per session
  const tonnageData = useMemo(() => {
    return sessionsList.map((s, index) => {
      let totalKg = 0;
      Object.values(s.exercises).forEach(ex => {
        const repsCount = ex.sets.reduce((acc, set) => acc + (set.actualReps > 0 ? set.actualReps : 0), 0);
        totalKg += ex.weightUsed * repsCount;
      });
      return {
        name: `Трен. ${index + 1}`,
        tonnage: Math.round((totalKg / 1000) * 10) / 10, // in tons
        tonnageKg: totalKg,
        date: s.date
      };
    });
  }, [sessionsList]);

  const totalMonthlyTonnageKg = useMemo(() => {
    return tonnageData.reduce((acc, curr) => acc + curr.tonnageKg, 0);
  }, [tonnageData]);

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <button className="icon-btn" onClick={() => navigate('dashboard')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="font-bold text-primary" style={{ fontSize: '1.2rem', margin: 0 }}>Аналитика и объём</h2>
          <span className="text-secondary" style={{ fontSize: '0.8rem' }}>Научный трекинг нагрузки</span>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="card flex-1" style={{ margin: 0, padding: '1.25rem' }}>
          <div className="flex items-center gap-2 text-secondary mb-2" style={{ fontSize: '0.85rem' }}>
            <Activity size={18} /> Всего тренировок
          </div>
          <div className="text-primary mt-1" style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1 }}>
            {sessionsList.length}
          </div>
        </div>

        <div className="card flex-1" style={{ margin: 0, padding: '1.25rem' }}>
          <div className="flex items-center gap-2 text-secondary mb-2" style={{ fontSize: '0.85rem' }}>
            <Award size={18} /> Суммарный тоннаж
          </div>
          <div className="text-primary mt-1" style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1 }}>
            {(totalMonthlyTonnageKg / 1000).toFixed(1)} <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>тонн</span>
          </div>
        </div>
      </div>

      {tonnageData.length > 0 && (
        <div className="card mb-6">
          <h3 className="card-title mb-1 flex items-center gap-2" style={{ fontSize: '0.95rem' }}>
            <TrendingUp size={18} /> Динамика тоннажа за месяц
          </h3>
          <p className="text-secondary mb-4" style={{ fontSize: '0.8rem' }}>
            Общий физический объём поднят на каждой тренировке (тонны)
          </p>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={tonnageData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }} barCategoryGap="25%">
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.8rem', boxShadow: 'var(--card-shadow)' }}
                  formatter={(val: any) => [`${val} т`, 'Тоннаж']}
                  cursor={{ fill: 'var(--surface-color-light)' }}
                />
                <Bar dataKey="tonnage" fill="var(--primary-color)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
