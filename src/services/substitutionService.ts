import {
  Teacher,
  Subject,
  TimetableEntry,
  Absence,
  Substitution,
  SubstituteRecommendation,
  DayOfWeek,
  ScheduleFrequency,
  AffectedPeriod
} from '../types';

/**
 * Period timings for standard 8-period school day
 */
export const PERIOD_TIMINGS: Record<number, string> = {
  1: '08:30 – 09:15 AM',
  2: '09:20 – 10:05 AM',
  3: '10:20 – 11:05 AM',
  4: '11:10 – 11:55 AM',
  5: '12:40 – 01:25 PM',
  6: '01:30 – 02:15 PM',
  7: '02:20 – 03:05 PM',
  8: '03:10 – 03:55 PM'
};

/**
 * Helper to determine which week/occurrence of the month a date belongs to (1, 2, 3, 4, or 5).
 * e.g., Day 1-7 is 1st occurrence (1st Wednesday), Day 8-14 is 2nd occurrence (2nd Wednesday).
 */
export function getOccurrenceWeekOfMonth(dateStr: string): number {
  const parts = dateStr.split('-');
  if (parts.length < 3) return 1;
  const day = parseInt(parts[2], 10) || 1;
  return Math.ceil(day / 7);
}

/**
 * Checks if a timetable slot or schedule frequency is active on a specific date.
 */
export function isScheduleActiveOnDate(
  frequency: ScheduleFrequency | undefined,
  dateStr: string
): boolean {
  if (!frequency || frequency === 'all') return true;
  const week = getOccurrenceWeekOfMonth(dateStr);
  switch (frequency) {
    case 'week_1_2':
      return week === 1 || week === 2;
    case 'week_3_4':
      return week === 3 || week === 4;
    case 'odd_weeks':
      return week % 2 === 1; // 1st, 3rd, 5th
    case 'even_weeks':
      return week % 2 === 0; // 2nd, 4th
    case 'week_1':
      return week === 1;
    case 'week_2':
      return week === 2;
    case 'week_3':
      return week === 3;
    case 'week_4':
      return week === 4;
    default:
      return true;
  }
}

/**
 * Human-readable label for a schedule frequency
 */
export function getFrequencyLabel(frequency?: ScheduleFrequency): string {
  switch (frequency) {
    case 'week_1_2':
      return '1st & 2nd Week of Month';
    case 'week_3_4':
      return '3rd & 4th Week of Month';
    case 'odd_weeks':
      return '1st & 3rd Week (Odd Weeks)';
    case 'even_weeks':
      return '2nd & 4th Week (Even Weeks)';
    case 'week_1':
      return '1st Week of Month';
    case 'week_2':
      return '2nd Week of Month';
    case 'week_3':
      return '3rd Week of Month';
    case 'week_4':
      return '4th Week of Month';
    case 'all':
    default:
      return 'Every Week';
  }
}

/**
 * Calculates teacher's schedule and consecutive periods on a given date/day.
 * Ensures a teacher NEVER gets 4 periods in a row (consecutive periods) to guarantee rest.
 */
export function getTeacherWorkloadInfo(
  teacherId: string,
  day: DayOfWeek,
  date: string,
  timetables: TimetableEntry[],
  substitutions: Substitution[],
  potentialPeriod?: number
): {
  scheduledPeriods: number[];
  hypotheticalPeriods: number[];
  maxConsecutive: number;
  wouldCause4Consecutive: boolean;
  totalPeriodsToday: number;
  hasAdequateRest: boolean;
  restPeriodsRemaining: number;
} {
  // 1. Regular timetable periods for this teacher on this day of week (filtered by active frequency on date)
  const regularPeriods = timetables
    .filter((t) => t.day === day && t.teacherId === teacherId && isScheduleActiveOnDate(t.frequency, date))
    .map((t) => Number(t.period));

  // 2. Already assigned substitution periods for this teacher on this date
  const subPeriods = substitutions
    .filter(
      (s) =>
        s.date === date &&
        s.assignedSubstituteId === teacherId &&
        s.status === 'Assigned'
    )
    .map((s) => Number(s.period));

  // Combine and deduplicate
  const existingSet = new Set<number>([...regularPeriods, ...subPeriods]);
  const scheduledPeriods = Array.from(existingSet).sort((a, b) => a - b);

  // Hypothetical set if potentialPeriod is added
  const hypotheticalSet = new Set<number>(scheduledPeriods);
  if (potentialPeriod !== undefined) {
    hypotheticalSet.add(Number(potentialPeriod));
  }
  const hypotheticalPeriods = Array.from(hypotheticalSet).sort((a, b) => a - b);

  // Compute maximum consecutive run in hypotheticalPeriods
  let maxConsecutive = 0;
  let currentRun = 0;
  for (let p = 1; p <= 8; p++) {
    if (hypotheticalSet.has(p)) {
      currentRun++;
      if (currentRun > maxConsecutive) {
        maxConsecutive = currentRun;
      }
    } else {
      currentRun = 0;
    }
  }

  // A teacher must NOT get 4 periods in a row without a rest period
  const wouldCause4Consecutive = maxConsecutive >= 4;
  const totalPeriodsToday = hypotheticalPeriods.length;
  const restPeriodsRemaining = Math.max(0, 8 - totalPeriodsToday);
  const hasAdequateRest = !wouldCause4Consecutive && totalPeriodsToday <= 5;

  return {
    scheduledPeriods,
    hypotheticalPeriods,
    maxConsecutive,
    wouldCause4Consecutive,
    totalPeriodsToday,
    hasAdequateRest,
    restPeriodsRemaining
  };
}

/**
 * Intelligent recommendation engine with teacher rest protection (no 4 periods altogether / consecutive).
 */
export function getRecommendedSubstitutes(
  substitution: {
    date: string;
    day: DayOfWeek;
    period: number;
    subjectId: string;
    originalTeacherId: string;
  },
  teachers: Teacher[],
  subjects: Subject[],
  timetables: TimetableEntry[],
  absences: Absence[],
  substitutions: Substitution[]
): SubstituteRecommendation[] {
  const targetSubject = subjects.find((s) => s.id === substitution.subjectId);
  const targetSubjectName = targetSubject ? targetSubject.name.toLowerCase() : '';
  const targetDepartment = targetSubject ? targetSubject.department.toLowerCase() : '';

  // 1. Teachers absent on this date
  const absentTeacherIds = new Set(
    absences
      .filter((a) => a.date === substitution.date)
      .map((a) => a.teacherId)
  );

  // 2. Teachers busy teaching a regular class during this day & period (active on this date)
  const busyRegularTeacherIds = new Set(
    timetables
      .filter(
        (t) =>
          t.day === substitution.day &&
          Number(t.period) === Number(substitution.period) &&
          isScheduleActiveOnDate(t.frequency, substitution.date)
      )
      .map((t) => t.teacherId)
  );

  // 3. Teachers already assigned to another cover duty during this date & period
  const busySubstituteTeacherIds = new Set(
    substitutions
      .filter(
        (s) =>
          s.date === substitution.date &&
          Number(s.period) === Number(substitution.period) &&
          s.status === 'Assigned' &&
          s.assignedSubstituteId
      )
      .map((s) => s.assignedSubstituteId as string)
  );

  const recommendations: SubstituteRecommendation[] = [];

  for (const teacher of teachers) {
    // Cannot substitute for self
    if (teacher.id === substitution.originalTeacherId) {
      continue;
    }

    const isAbsent = absentTeacherIds.has(teacher.id);
    const isBusyRegular = busyRegularTeacherIds.has(teacher.id);
    const isBusySub = busySubstituteTeacherIds.has(teacher.id);

    // Compute workload and consecutive periods including this potential assignment
    const workload = getTeacherWorkloadInfo(
      teacher.id,
      substitution.day,
      substitution.date,
      timetables,
      substitutions,
      Number(substitution.period)
    );

    const isAvailable = !isAbsent && !isBusyRegular && !isBusySub && !workload.wouldCause4Consecutive;

    const teacherDept = (teacher.department || '').toLowerCase();
    const teacherSubj = (teacher.primarySubject || '').toLowerCase();

    // Matching criteria
    const subjectMatch =
      teacherSubj === targetSubjectName ||
      (targetSubjectName.length > 2 && teacherSubj.includes(targetSubjectName.slice(0, 3)));
    const departmentMatch =
      teacherDept === targetDepartment ||
      (targetDepartment.length > 2 && teacherDept.includes(targetDepartment.slice(0, 3)));

    let score = 0;
    const reasonParts: string[] = [];

    if (isAbsent) {
      reasonParts.push('Absent today');
    } else if (isBusyRegular) {
      reasonParts.push(`Teaching regular class (Period ${substitution.period})`);
    } else if (isBusySub) {
      reasonParts.push(`Assigned to another cover duty (Period ${substitution.period})`);
    } else if (workload.wouldCause4Consecutive) {
      reasonParts.push('Rest rule: Would exceed 3 consecutive periods');
    } else {
      score = 40; // Base score for available

      if (subjectMatch) {
        score += 35;
        reasonParts.push(`Same subject specialist (${targetSubject?.name || 'Subject'})`);
      } else if (departmentMatch) {
        score += 25;
        reasonParts.push(`${teacher.department} Department Faculty`);
      } else {
        score += 10;
        reasonParts.push('Free period available');
      }

      // Workload balancing
      if (workload.scheduledPeriods.length <= 2) {
        score += 15;
        reasonParts.push('Light daily load');
      } else if (workload.scheduledPeriods.length <= 4) {
        score += 8;
        reasonParts.push('Moderate load');
      }

      if (workload.maxConsecutive <= 2) {
        score += 10;
        reasonParts.push('Optimal rest interval');
      }
    }

    const finalScore = Math.max(0, Math.min(100, score));

    recommendations.push({
      teacher,
      score: finalScore,
      reason: reasonParts.join(' • ') || (isAvailable ? 'Available for duty' : 'Unavailable'),
      isAvailable,
      departmentMatch,
      subjectMatch,
      periodsToday: workload.scheduledPeriods.length,
      consecutivePeriodsIfAssigned: workload.maxConsecutive,
      wouldCause4Consecutive: workload.wouldCause4Consecutive,
      needsRestWarning: workload.wouldCause4Consecutive
        ? 'Exceeds 3 consecutive periods (Blocked for rest)'
        : workload.maxConsecutive === 3
        ? '3 consecutive periods (Give rest next)'
        : undefined
    });
  }

  // Sort available first, then highest score, then fewest periods today
  return recommendations.sort((a, b) => {
    if (a.isAvailable && !b.isAvailable) return -1;
    if (!a.isAvailable && b.isAvailable) return 1;
    if (b.score !== a.score) return b.score - a.score;
    return a.periodsToday - b.periodsToday;
  });
}

/**
 * Finds all classes taught by an absent teacher on a given day/date.
 * Filters by active frequency (e.g. 1st & 2nd Wednesday) and preserves batch groups.
 */
export function findAffectedPeriods(
  teacherId: string,
  day: DayOfWeek,
  timetables: TimetableEntry[],
  subjects: Subject[],
  date?: string
): AffectedPeriod[] {
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

  // Filter timetable for this teacher and day
  const teacherTimetable = timetables
    .filter((t) => {
      if (t.teacherId !== teacherId || t.day !== day) return false;
      if (date && !isScheduleActiveOnDate(t.frequency, date)) return false;
      return true;
    })
    .sort((a, b) => Number(a.period) - Number(b.period));

  const result: AffectedPeriod[] = [];
  const seenKey = new Set<string>();

  for (const entry of teacherTimetable) {
    const p = Number(entry.period);
    const key = `${p}_${entry.classId}_${entry.batch || ''}_${entry.subjectId}`;
    if (!seenKey.has(key)) {
      seenKey.add(key);
      result.push({
        period: p,
        classId: entry.classId,
        subjectId: entry.subjectId,
        subjectName: subjectMap.get(entry.subjectId) || entry.subjectId,
        day: entry.day,
        batch: entry.batch,
        frequency: entry.frequency
      });
    }
  }

  return result.sort((a, b) => a.period - b.period);
}

/**
 * Helper to determine day of week string from YYYY-MM-DD (Supports 6 working days: Monday to Saturday)
 */
export function getDayOfWeekFromDate(dateStr: string): DayOfWeek {
  const date = new Date(dateStr + 'T12:00:00Z');
  const dayIndex = date.getUTCDay(); // 0 is Sunday, 1 is Monday, ... 6 is Saturday
  const days: DayOfWeek[] = ['Monday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex] || 'Monday';
}

/**
 * Batch Intelligent Auto-Assign Algorithm across all 8 periods.
 * Enforces rest periods and ensures no teacher gets 4 periods in a row.
 */
export function autoAssignSubstitutions(
  pendingSubs: Substitution[],
  teachers: Teacher[],
  subjects: Subject[],
  timetables: TimetableEntry[],
  absences: Absence[],
  existingSubs: Substitution[]
): { updatedSubs: Substitution[]; assignedCount: number } {
  let currentSubs = [...existingSubs];
  let assignedCount = 0;

  // Sort pending substitutions by period ascending (1 to 8) to optimize sequence
  const sortedPending = [...pendingSubs].sort((a, b) => Number(a.period) - Number(b.period));

  for (const sub of sortedPending) {
    if (sub.status !== 'Pending') continue;

    const recs = getRecommendedSubstitutes(
      {
        date: sub.date,
        day: sub.day,
        period: sub.period,
        subjectId: sub.subjectId,
        originalTeacherId: sub.originalTeacherId
      },
      teachers,
      subjects,
      timetables,
      absences,
      currentSubs
    );

    // Pick best available teacher who is free and won't exceed consecutive period limit
    const bestMatch = recs.find((r) => r.isAvailable && !r.wouldCause4Consecutive);
    if (bestMatch) {
      currentSubs = currentSubs.map((s) => {
        if (s.id === sub.id) {
          return {
            ...s,
            status: 'Assigned',
            assignedSubstituteId: bestMatch.teacher.id,
            assignedSubstituteName: bestMatch.teacher.name,
            assignedAt: new Date().toISOString(),
            assignedReason: `Auto: ${bestMatch.reason}`
          };
        }
        return s;
      });
      assignedCount++;
    }
  }

  return { updatedSubs: currentSubs, assignedCount };
}
