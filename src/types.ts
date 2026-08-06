export interface PlanExercise {
  id: string;
  name: string;
  sets: number;
  targetReps: number;
  targetWeight: number;
  weightLevel?: "тяжёлый" | "средний" | "слабый";
}

export interface PlanDay {
  day: number;
  label: string;
  exercises: PlanExercise[];
}

export interface PlanWeek {
  week: number;
  days: PlanDay[];
}

export interface WorkoutPlan {
  weeks: PlanWeek[];
}

export interface SetLog {
  targetReps: number;
  actualReps: number;
}

export interface ExerciseLog {
  weightUsed: number;
  sets: SetLog[];
}

export interface SessionLog {
  date: string;
  startedAt: string;
  finishedAt: string;
  exercises: Record<string, ExerciseLog>;
}

export interface WorkoutJournal {
  sessions: Record<string, SessionLog>; // Key format: "w{weekId}-d{dayId}"
}
