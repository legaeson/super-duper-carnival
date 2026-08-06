import { useState } from 'react';
import { WorkoutProvider, useWorkout } from './store/WorkoutContext';
import { Dashboard } from './components/Dashboard';
import { WorkoutSession } from './components/WorkoutSession';
import { Statistics } from './components/Statistics';
import { JsonModal } from './components/JsonModal';
import { Dumbbell, BarChart2, FileCode, Sun, Moon } from 'lucide-react';

export type Screen = 'dashboard' | 'workout' | 'statistics';

export interface RouteState {
  screen: Screen;
  weekId?: number;
  dayId?: number;
}

function MainApp() {
  const { unit, setUnit, theme, setTheme } = useWorkout();
  const [route, setRoute] = useState<RouteState>({ screen: 'dashboard' });
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);

  const navigate = (screen: Screen, params?: Partial<RouteState>) => {
    setRoute({ screen, ...params });
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleUnit = () => {
    setUnit(unit === 'kg' ? 'lbs' : 'kg');
  };

  return (
    <>
      <header className="app-header">
        <div className="flex items-center gap-2">
          <Dumbbell color="var(--primary-color)" size={22} />
          <h1 className="app-title">Tracker</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Unit Toggle Button */}
          <button className="icon-btn" onClick={toggleUnit} title="Переключить КГ / ЛБС">
            {unit.toUpperCase()}
          </button>

          {/* Theme Toggle Button */}
          <button className="icon-btn" onClick={toggleTheme} title="Сменить тему">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {route.screen === 'dashboard' && (
            <>
              <button className="icon-btn" onClick={() => setShowJsonModal(true)} title="Импорт / Экспорт JSON">
                <FileCode size={18} />
              </button>
              <button className="icon-btn" onClick={() => navigate('statistics')} title="Статистика">
                <BarChart2 size={18} />
              </button>
            </>
          )}
        </div>
      </header>
      
      <main className="main-content" key={route.screen + (route.weekId || 0) + (route.dayId || 0)}>
        {route.screen === 'dashboard' && <Dashboard navigate={navigate} />}
        {route.screen === 'workout' && route.weekId && route.dayId && (
          <WorkoutSession 
            weekId={route.weekId} 
            dayId={route.dayId} 
            navigate={navigate} 
          />
        )}
        {route.screen === 'statistics' && <Statistics navigate={navigate} />}
      </main>

      {showJsonModal && (
        <JsonModal onClose={() => setShowJsonModal(false)} />
      )}
    </>
  );
}

export default function App() {
  return (
    <WorkoutProvider>
      <MainApp />
    </WorkoutProvider>
  );
}
