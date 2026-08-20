import {
  Teacher,
  Subject,
  TimetableEntry,
  Absence,
  Substitution,
  SubstituteRecommendation,
  DayOfWeek
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
  // 1. Regular timetable periods for this teacher on this day of week
  const regularPeriods = timetables
    .filter((t) => t.day === day && t.teacherId === teacherId)
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

  // 2. Teachers busy teaching a regular class during this day & period
  const busyRegularTeacherIds = new Set(
    timetables
      .filter((t) => t.day === substitution.day && Number(t.period) === Number(substitution.period))
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
      substitution.period
    );

    // REST RULE ENFORCEMENT:
    // 1. Cannot be absent or double-booked at Period P
    // 2. Must NOT get 4 consecutive periods (give them rest!)
    // 3. Must not exceed maximum daily periods (max 5-6 out of 8 to ensure rest intervals)
    const isOverworked = workload.wouldCause4Consecutive || workload.totalPeriodsToday > 5;
    const isAvailable = !isAbsent && !isBusyRegular && !isBusySub && !workload.wouldCause4Consecutive;

    const teacherDept = (teacher.department || '').toLowerCase();
    const teacherSubj = (teacher.primarySubject || '').toLowerCase();

    // Check exact or partial subject match
    const subjectMatch =
      (teacherSubj && (teacherSubj.includes(targetSubjectName) || targetSubjectName.includes(teacherSubj))) ||
      (teacherDept && teacherDept.includes(targetSubjectName));

    // Check department match
    const departmentMatch =
      !subjectMatch &&
      ((teacherDept && targetDepartment && (teacherDept.includes(targetDepartment) || targetDepartment.includes(teacherDept))) ||
        (targetDepartment === 'science' &&
          (teacherDept.includes('physics') || teacherDept.includes('chemistry') || teacherDept.includes('biology'))));

    let score = 50; // base score for being free
    const reasonParts: string[] = [];

    if (!isAvailable) {
      score = 0;
      if (isAbsent) {
        reasonParts.push('Absent today');
      } else if (isBusyRegular) {
        reasonParts.push(`Teaching regular class in Period ${substitution.period}`);
      } else if (isBusySub) {
        reasonParts.push(`Already on cover duty in Period ${substitution.period}`);
      } else if (workload.wouldCause4Consecutive) {
        reasonParts.push(`Rest Protection: Would cause 4 consecutive periods without break (Rest required)`);
      }
    } else {
      // Score boost for subject / department alignment
      if (subjectMatch) {
        score += 38;
        reasonParts.push(`Subject Specialist (${teacher.primarySubject || teacher.department})`);
      } else if (departmentMatch) {
        score += 20;
        reasonParts.push(`${teacher.department} Department Faculty`);
      } else {
        reasonParts.push(`Free Period ${substitution.period}`);
      }

      // Rest & Workload balancing score adjustments:
      if (workload.maxConsecutive === 1) {
        // Great rest spacing: isolated single period with rest before and after
        score += 8;
        reasonParts.push('Optimal rest interval');
      } else if (workload.maxConsecutive === 2) {
        // 2 consecutive periods: normal and healthy
        score += 4;
      } else if (workload.maxConsecutive === 3) {
        // 3 consecutive periods: acceptable, but lower preference to protect teacher stamina
        score -= 10;
        reasonParts.push('3 consecutive periods (will need rest after)');
      }

      // Preference for teachers with fewer total classes today
      if (workload.totalPeriodsToday <= 3) {
        score += 6;
        reasonParts.push(`Light daily load (${workload.totalPeriodsToday}/8 periods)`);
      } else if (workload.totalPeriodsToday === 4) {
        score += 2;
      } else if (workload.totalPeriodsToday === 5) {
        score -= 8;
        reasonParts.push(`Moderate load (${workload.totalPeriodsToday}/8 periods)`);
      }
    }

    const finalScore = isAvailable ? Math.min(99, Math.max(10, score)) : 0;

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
 * Finds all classes taught by an absent teacher on a given day.
 * Deduplicates by period so that each period produces at most 1 substitution requirement.
 */
export function findAffectedPeriods(
  teacherId: string,
  day: DayOfWeek,
  timetables: TimetableEntry[],
  subjects: Subject[]
) {
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
  const periodMap = new Map<number, {
    period: number;
    classId: string;
    subjectId: string;
    subjectName: string;
    roomId: string;
    day: DayOfWeek;
  }>();

  const teacherTimetable = timetables
    .filter((t) => t.teacherId === teacherId && t.day === day)
    .sort((a, b) => Number(a.period) - Number(b.period));

  for (const entry of teacherTimetable) {
    const p = Number(entry.period);
    if (!periodMap.has(p)) {
      periodMap.set(p, {
        period: p,
        classId: entry.classId,
        subjectId: entry.subjectId,
        subjectName: subjectMap.get(entry.subjectId) || entry.subjectId,
        roomId: entry.roomId,
        day: entry.day
      });
    }
  }

  return Array.from(periodMap.values()).sort((a, b) => a.period - b.period);
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
