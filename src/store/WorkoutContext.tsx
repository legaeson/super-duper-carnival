import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { WorkoutPlan, WorkoutJournal, PlanWeek } from '../types';
import defaultPlanData from '../defaultPlan.json';

interface WorkoutContextType {
  plan: WorkoutPlan;
  setPlan: (plan: WorkoutPlan) => void;
  journal: WorkoutJournal;
  setJournal: (journal: WorkoutJournal) => void;
  getSuggestedWeight: (exerciseId: string, currentWeekId: number) => number | null;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useLocalStorage<WorkoutPlan>('workout_plan', defaultPlanData as WorkoutPlan);
  const [journal, setJournal] = useLocalStorage<WorkoutJournal>('workout_journal', { sessions: {} });

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
    <WorkoutContext.Provider value={{ plan, setPlan, journal, setJournal, getSuggestedWeight }}>
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
