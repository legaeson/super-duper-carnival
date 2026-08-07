import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { WorkoutPlan, WorkoutJournal, PlanWeek, WeightUnit, ThemeMode } from '../types';
import defaultPlanData from '../defaultPlan.json';

interface WorkoutContextType {
  plan: WorkoutPlan;
  setPlan: (plan: WorkoutPlan) => void;
  resetToDefaultPlan: () => void;
  journal: WorkoutJournal;
  setJournal: (journal: WorkoutJournal) => void;
  saveSessionLog: (sessionKey: string, sessionData: any, startedAt: string) => void;
  getSuggestedWeight: (exerciseId: string, currentWeekId: number) => number | null;
  getLastLoggedWeight: (exerciseId: string, currentWeekId: number) => number | null;
  unit: WeightUnit;
  setUnit: (unit: WeightUnit) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  formatWeight: (weightKg: number) => string;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useLocalStorage<WorkoutPlan>('workout_plan', defaultPlanData as WorkoutPlan);
  const [journal, setJournal] = useLocalStorage<WorkoutJournal>('workout_journal', { sessions: {} });
  const [unit, setUnit] = useLocalStorage<WeightUnit>('workout_unit', 'kg');
  const [theme, setTheme] = useLocalStorage<ThemeMode>('workout_theme', 'light');

  // Backup journal in secondary storage for safety against accidental reset/clear
  useEffect(() => {
    if (journal && journal.sessions && Object.keys(journal.sessions).length > 0) {
      try {
        window.localStorage.setItem('workout_journal_backup', JSON.stringify(journal));
      } catch (err) {
        console.error('Backup write error', err);
      }
    }
  }, [journal]);

  // Sync theme attribute to <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Auto-upgrade plan if stored plan is outdated (e.g. only 2 weeks from previous initial build)
  useEffect(() => {
    if (!plan.weeks || plan.weeks.length < (defaultPlanData as WorkoutPlan).weeks.length) {
      setPlan(defaultPlanData as WorkoutPlan);
    }
  }, [plan, setPlan]);

  const resetToDefaultPlan = () => {
    setPlan(defaultPlanData as WorkoutPlan);
  };

  // Safe session log save helper with dual-write to ensure zero data loss
  const saveSessionLog = (sessionKey: string, sessionData: any, startedAt: string) => {
    const newSession = {
      date: new Date().toISOString().split('T')[0],
      startedAt: startedAt || new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      exercises: sessionData
    };

    setJournal(prevJournal => {
      const updated = {
        ...prevJournal,
        sessions: {
          ...prevJournal.sessions,
          [sessionKey]: newSession
        }
      };
      try {
        window.localStorage.setItem('workout_journal', JSON.stringify(updated));
        window.localStorage.setItem('workout_journal_backup', JSON.stringify(updated));
      } catch (e) {
        console.error('Direct localStorage save error:', e);
      }
      return updated;
    });
  };

  // Helper to format weight based on active unit (kg or lbs)
  const formatWeight = (weightKg: number): string => {
    if (unit === 'lbs') {
      const lbs = weightKg * 2.20462;
      return `${Math.round(lbs * 10) / 10} lbs`;
    }
    return `${weightKg} кг`;
  };

  // Helper to get the most recent logged weight for an exercise from previous weeks
  const getLastLoggedWeight = (exerciseId: string, currentWeekId: number): number | null => {
    for (let w = currentWeekId - 1; w >= 1; w--) {
      for (let d = 1; d <= 7; d++) {
        const sessionKey = `w${w}-d${d}`;
        const session = journal.sessions[sessionKey];
        if (session && session.exercises && session.exercises[exerciseId]) {
          return session.exercises[exerciseId].weightUsed;
        }
      }
    }
    return null;
  };

  // Scientific classification helper for progressive overload increment
  const isCompoundExercise = (exerciseId: string): boolean => {
    const compoundKeywords = ['присед', 'жим_штанги', 'тяга', 'румынская'];
    return compoundKeywords.some(kw => exerciseId.toLowerCase().includes(kw));
  };

  // Logic to suggest weight based on the previous week's performance (Scientific Progressive Overload)
  const getSuggestedWeight = (exerciseId: string, currentWeekId: number): number | null => {
    if (currentWeekId <= 1) return null;
    
    // Find previous week
    const prevWeek = plan.weeks.find((w: PlanWeek) => w.week === currentWeekId - 1);
    if (!prevWeek) return null;

    // We need to find if this exercise was performed in the previous week
    let prevTargetWeight: number | null = null;
    let performedDayId: number | null = null;

    for (const day of prevWeek.days) {
      const ex = day.exercises.find(e => e.id === exerciseId);
      if (ex) {
        prevTargetWeight = ex.targetWeight;
        performedDayId = day.day;
        break;
      }
    }

    if (prevTargetWeight === null || performedDayId === null) return null;

    // Check journal if they did it
    const sessionKey = `w${currentWeekId - 1}-d${performedDayId}`;
    const session = journal.sessions[sessionKey];
    if (!session || !session.exercises[exerciseId]) return null;

    const log = session.exercises[exerciseId];
    
    // Check if ALL sets were completed successfully (actual >= target)
    const allSetsCompleted = log.sets.every(set => set.actualReps >= set.targetReps);
    
    if (allSetsCompleted) {
      const currentWeight = log.weightUsed;
      const compound = isCompoundExercise(exerciseId);

      if (compound) {
        // Compound exercises (Squat, Bench, Deadlift, Rows): +2.5 kg step
        return Math.round((currentWeight + 2.5) * 10) / 10;
      } else {
        // Isolation exercises (Biceps, Triceps, Lateral Raises): +0.5 kg to +1.0 kg micro-step
        if (currentWeight < 10) {
          return Math.round((currentWeight + 0.5) * 10) / 10;
        } else {
          return Math.round((currentWeight + 1.0) * 10) / 10;
        }
      }
    }

    return null; // No progression suggested if sets failed
  };

  return (
    <WorkoutContext.Provider value={{ 
      plan, 
      setPlan, 
      resetToDefaultPlan, 
      journal, 
      setJournal, 
      saveSessionLog,
      getSuggestedWeight,
      getLastLoggedWeight,
      unit,
      setUnit,
      theme,
      setTheme,
      formatWeight
    }}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
}
