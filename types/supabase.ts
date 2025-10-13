// --------------------
// Athlete base profile
// --------------------
export type Athlete = {
  id: string;
  user_id: string | null;
  coach_id: string;
  status: 'invited' | 'active' | 'paused' | 'archived';
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  date_of_birth: string | null; // ISO date
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// --------------------
// Athlete daily/weekly check-ins
// --------------------
export type AthleteCheckin = {
  id: string;
  athlete_id: string;
  coach_id: string;
  checkin_date: string; // ISO date
  mood: string | null;
  readiness: number | null; // 1–10
  soreness: number | null; // 1–10
  sleep_hours: number | null;
  body_weight_kg: number | null;
  notes: string | null;
  created_at: string;
};

// --------------------
// Periodic body metrics / PRs
// --------------------
export type AthleteStats = {
  id: string;
  athlete_id: string;
  coach_id: string;
  captured_at: string; // ISO date
  height_cm: number | null;
  weight_kg: number | null;
  body_fat_pct: number | null;
  vo2max: number | null;
  resting_hr: number | null;
  notes: string | null;
};

// --------------------
// Assigned programs history
// --------------------
export type ProgramHistory = {
  id: string;
  athlete_id: string;
  coach_id: string;
  program_id: string;
  assigned_on: string; // ISO date
  status: 'assigned' | 'active' | 'completed' | 'dropped';
};
