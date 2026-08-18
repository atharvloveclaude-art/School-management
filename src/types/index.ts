export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

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
  roomDefault?: string; // e.g., '204'
}

export interface Subject {
  id: string; // Code: 'PHY', 'MAT', 'CHEM', 'CS', 'ENG', 'BIO', 'PE', 'SOC'
  name: string; // 'Physics', 'Mathematics', 'Chemistry', 'CS', 'English', 'Biology'
  department: string; // 'Science', 'Mathematics', 'Languages', 'Social Studies', 'Sports'
}

export interface Room {
  id: string; // '204', '205', '301', '102'
  capacity: number; // 40
  type: string; // 'Classroom', 'Laboratory', 'Computer Lab'
}

export interface TimetableEntry {
  id: string;
  day: DayOfWeek;
  period: number; // 1 to 8
  classId: string; // '12-A'
  subjectId: string; // 'PHY'
  teacherId: string; // 'T001'
  roomId: string; // '204'
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
  roomId: string;
  day: DayOfWeek;
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
  roomId: string;
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
}
