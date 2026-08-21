export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export type ScheduleFrequency =
  | 'all'
  | 'week_1_2'
  | 'week_3_4'
  | 'odd_weeks'
  | 'even_weeks'
  | 'week_1'
  | 'week_2'
  | 'week_3'
  | 'week_4';

export type UserRole = 'admin' | 'teacher' | 'student';

export interface Teacher {
  id: string; // e.g., 'T001' or 'T-PHY-01'
  name: string; // e.g., 'Mr Sharma' or 'Teacher T001'
  department: string; // e.g., 'Physics', 'Mathematics', 'Chemistry'
  phone: string;
  email: string;
  primarySubject: string; // e.g., 'Physics'
  maxPeriodsPerDay?: number;
  anonymousCode?: string; // e.g., 'T-01'
}

export interface ClassItem {
  id: string; // e.g., '12-A'
  grade: string; // e.g., '12'
  section: string; // e.g., 'A'
  academicYear: string; // e.g., '2026-27'
}

export interface Subject {
  id: string; // Code: 'PHY', 'MAT', 'CHEM', 'CS', 'ENG', 'BIO', 'PE', 'SOC'
  name: string; // 'Physics', 'Mathematics', 'Chemistry', 'CS', 'English', 'Biology'
  department: string; // 'Science', 'Mathematics', 'Languages', 'Social Studies', 'Sports'
}

export interface TimetableEntry {
  id: string;
  day: DayOfWeek;
  period: number; // 1 to 8
  classId: string; // '12-A'
  subjectId: string; // 'PHY'
  teacherId: string; // 'T001'
  batch?: string; // e.g., 'Whole Class', 'Batch 1 (CS)', 'Batch 2 (Bio)', 'Group A', 'Group B'
  frequency?: ScheduleFrequency; // Occurrence: 'all', 'week_1_2', 'odd_weeks', etc.
}

export interface Absence {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  reason: string;
  createdAt: string;
  affectedPeriodsCount: number;
}

export interface AffectedPeriod {
  period: number;
  classId: string;
  subjectId: string;
  subjectName: string;
  day: DayOfWeek;
  batch?: string;
  frequency?: ScheduleFrequency;
}

export interface Substitution {
  id: string;
  absenceId: string;
  date: string; // YYYY-MM-DD
  day: DayOfWeek;
  period: number;
  classId: string;
  subjectId: string;
  subjectName: string;
  originalTeacherId: string;
  originalTeacherName: string;
  batch?: string;
  frequency?: ScheduleFrequency;
  status: 'Pending' | 'Assigned' | 'Cancelled';
  assignedSubstituteId?: string;
  assignedSubstituteName?: string;
  assignedAt?: string;
  assignedReason?: string;
  notes?: string;
}

export interface SubstituteRecommendation {
  teacher: Teacher;
  score: number;
  reason: string;
  isAvailable: boolean;
  departmentMatch: boolean;
  subjectMatch: boolean;
  periodsToday: number;
  consecutivePeriodsIfAssigned?: number;
  wouldCause4Consecutive?: boolean;
  needsRestWarning?: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  errorMessage: string | null;
  isSplitElectiveNotice?: string | null;
}

