export interface LevelWeights {
  heavy?: number;  // Тяжёлый
  medium?: number; // Средний
  light?: number;  // Лёгкий
}

export interface PlanExercise {
  id: string;
  name: string;
  sets: number;
  targetReps: number;
  targetWeight: number;
  weightLevel?: string; // e.g. "тяжёлая" | "средняя" | "лёгкая"
}

export interface PlanDay {
  day: number;
  label: string;
  exercises: PlanExercise[];
}

export interface PlanWeek {
  week: number;
  days: PlanDay[];
  levelWeights?: LevelWeights;
}

export interface WorkoutPlan {
  weeks: PlanWeek[];
  defaultLevelWeights?: LevelWeights;
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

export type WeightUnit = 'kg' | 'lbs';
export type ThemeMode = 'light' | 'dark';

export interface WorkoutJournal {
  sessions: Record<string, SessionLog>; // Key format: "w{weekId}-d{dayId}"
}

