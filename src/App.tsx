import { useState } from 'react';
import { WorkoutProvider } from './store/WorkoutContext';
import { Dashboard } from './components/Dashboard';
import { WorkoutSession } from './components/WorkoutSession';
import { Statistics } from './components/Statistics';
import { Dumbbell, BarChart2 } from 'lucide-react';

export type Screen = 'dashboard' | 'workout' | 'statistics';

export interface RouteState {
  screen: Screen;
  weekId?: number;
  dayId?: number;
}

function MainApp() {
  const [route, setRoute] = useState<RouteState>({ screen: 'dashboard' });

  const navigate = (screen: Screen, params?: Partial<RouteState>) => {
    setRoute({ screen, ...params });
  };

  return (
    <>
      <header className="app-header">
        <div className="flex items-center gap-2">
          <Dumbbell color="var(--primary-color)" />
          <h1 className="app-title">Tracker</h1>
        </div>
        {route.screen === 'dashboard' && (
          <button className="icon-btn" onClick={() => navigate('statistics')}>
            <BarChart2 size={24} />
          </button>
        )}
      </header>
      
      <main className="main-content">
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
