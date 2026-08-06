import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { WorkoutPlan, WorkoutJournal, PlanWeek, LevelWeights } from '../types';
import defaultPlanData from '../defaultPlan.json';

interface WorkoutContextType {
  plan: WorkoutPlan;
  setPlan: (plan: WorkoutPlan) => void;
  resetToDefaultPlan: () => void;
  setWeekLevelWeights: (weekId: number, weights: LevelWeights) => void;
  journal: WorkoutJournal;
  setJournal: (journal: WorkoutJournal) => void;
  getSuggestedWeight: (exerciseId: string, currentWeekId: number) => number | null;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useLocalStorage<WorkoutPlan>('workout_plan', defaultPlanData as WorkoutPlan);
  const [journal, setJournal] = useLocalStorage<WorkoutJournal>('workout_journal', { sessions: {} });

  // Auto-upgrade plan if stored plan is outdated (e.g. only 2 weeks from previous initial build)
  useEffect(() => {
    if (!plan.weeks || plan.weeks.length < (defaultPlanData as WorkoutPlan).weeks.length) {
      setPlan(defaultPlanData as WorkoutPlan);
    }
  }, [plan, setPlan]);

  const resetToDefaultPlan = () => {
    setPlan(defaultPlanData as WorkoutPlan);
  };

  const setWeekLevelWeights = (weekId: number, weights: LevelWeights) => {
    const updatedPlan: WorkoutPlan = {
      ...plan,
      weeks: plan.weeks.map(w => {
        if (w.week !== weekId) return w;

        // Apply level weights to exercises in this week
        const updatedDays = w.days.map(d => ({
          ...d,
          exercises: d.exercises.map(ex => {
            const level = (ex.weightLevel || '').toLowerCase();
            let newWeight = ex.targetWeight;

            if (level.includes('тяж') && weights.heavy !== undefined) {
              newWeight = weights.heavy;
            } else if (level.includes('средн') && weights.medium !== undefined) {
              newWeight = weights.medium;
            } else if ((level.includes('лёгк') || level.includes('слаб')) && weights.light !== undefined) {
              newWeight = weights.light;
            }

            return {
              ...ex,
              targetWeight: newWeight
            };
          })
        }));

        return {
          ...w,
          levelWeights: { ...w.levelWeights, ...weights },
          days: updatedDays
        };
      })
    };

    setPlan(updatedPlan);
  };

  // Logic to suggest weight based on the previous week's performance
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
      // Propose +5% rounded to nearest 2.5kg
      const increase = log.weightUsed * 1.05;
      return Math.round(increase / 2.5) * 2.5;
    }

    return null; // No progression suggested
  };

  return (
    <WorkoutContext.Provider value={{ 
      plan, 
      setPlan, 
      resetToDefaultPlan, 
      setWeekLevelWeights, 
      journal, 
      setJournal, 
      getSuggestedWeight 
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
