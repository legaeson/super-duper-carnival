import { useState } from 'react';
import { WorkoutProvider } from './store/WorkoutContext';
import { Dashboard } from './components/Dashboard';
import { WorkoutSession } from './components/WorkoutSession';
import { Statistics } from './components/Statistics';
import { SettingsModal } from './components/SettingsModal';
import { BarChart2, Settings } from 'lucide-react';

export type Screen = 'dashboard' | 'workout' | 'statistics';

export interface RouteState {
  screen: Screen;
  weekId?: number;
  dayId?: number;
}

function MainApp() {
  const [route, setRoute] = useState<RouteState>({ screen: 'dashboard' });
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  const navigate = (screen: Screen, params?: Partial<RouteState>) => {
    setRoute({ screen, ...params });
  };

  return (
    <>
      <header className="app-header">
        <div className="flex items-center">
          <h1 className="app-title">TRACKER</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {route.screen === 'dashboard' && (
            <>
              <button className="icon-btn" onClick={() => setShowSettingsModal(true)} title="Настройки">
                <Settings size={20} />
              </button>
              <button className="icon-btn" onClick={() => navigate('statistics')} title="Статистика">
                <BarChart2 size={20} />
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

      {showSettingsModal && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} />
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
