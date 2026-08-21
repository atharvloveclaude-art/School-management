import {
  TimetableEntry,
  Teacher,
  ClassItem,
  Subject,
  ConflictCheckResult,
  Substitution,
  Absence,
  ScheduleFrequency
} from '../types';

/**
 * Checks if two schedule frequencies overlap in the same month.
 * e.g. 'week_1_2' and 'week_3_4' do NOT overlap and can share the same slot without conflict!
 */
export function doFrequenciesOverlap(
  freqA: ScheduleFrequency = 'all',
  freqB: ScheduleFrequency = 'all'
): boolean {
  if (freqA === 'all' || freqB === 'all') return true;
  if (freqA === freqB) return true;

  const weeksForFreq = (f: ScheduleFrequency): Set<number> => {
    switch (f) {
      case 'week_1_2':
        return new Set([1, 2]);
      case 'week_3_4':
        return new Set([3, 4]);
      case 'odd_weeks':
        return new Set([1, 3, 5]);
      case 'even_weeks':
        return new Set([2, 4]);
      case 'week_1':
        return new Set([1]);
      case 'week_2':
        return new Set([2]);
      case 'week_3':
        return new Set([3]);
      case 'week_4':
        return new Set([4]);
      default:
        return new Set([1, 2, 3, 4, 5]);
    }
  };

  const setA = weeksForFreq(freqA);
  const setB = weeksForFreq(freqB);
  for (const w of setA) {
    if (setB.has(w)) return true;
  }
  return false;
}

export function detectTimetableConflict(
  newEntry: {
    id?: string;
    day: string;
    period: number;
    classId: string;
    subjectId: string;
    teacherId: string;
    batch?: string;
    frequency?: ScheduleFrequency;
  },
  existingEntries: TimetableEntry[],
  teachers: Teacher[],
  classes: ClassItem[],
  subjects: Subject[]
): ConflictCheckResult {
  const teacherMap = new Map(teachers.map((t) => [t.id, t.name]));
  const classMap = new Map(classes.map((c) => [c.id, c.id]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

  const teacherName = teacherMap.get(newEntry.teacherId) || newEntry.teacherId;
  const currentClassName = classMap.get(newEntry.classId) || newEntry.classId;
  const currentSubjectName = subjectMap.get(newEntry.subjectId) || newEntry.subjectId;

  let splitElectiveNotice: string | null = null;

  for (const entry of existingEntries) {
    // 1. Skip exact ID match (editing self)
    if (newEntry.id && entry.id === newEntry.id) {
      continue;
    }

    // Must match day and period to evaluate collision
    if (entry.day === newEntry.day && Number(entry.period) === Number(newEntry.period)) {
      // Check if frequencies overlap (e.g. 1st & 2nd Wed vs 3rd & 4th Wed never collide!)
      const overlaps = doFrequenciesOverlap(newEntry.frequency || 'all', entry.frequency || 'all');
      if (!overlaps) {
        continue;
      }

      // 1. Teacher Conflict: Is the same teacher assigned in a DIFFERENT class OR duplicate in same class?
      if (entry.teacherId === newEntry.teacherId) {
        if (entry.classId !== newEntry.classId) {
          return {
            hasConflict: true,
            errorMessage: `${teacherName} is already teaching Class ${entry.classId} during ${newEntry.day} Period ${newEntry.period}.`,
            isSplitElectiveNotice: null
          };
        } else if (entry.subjectId === newEntry.subjectId && (entry.batch || '') === (newEntry.batch || '')) {
          // Exactly identical teacher + class + subject + batch
          return {
            hasConflict: true,
            errorMessage: `${teacherName} is already scheduled for ${currentSubjectName} in Class ${currentClassName} Period ${newEntry.period}.`,
            isSplitElectiveNotice: null
          };
        }
      }

      // 2. Same Class & Period: Parallel / Split Elective Batch detection
      if (entry.classId === newEntry.classId) {
        const otherSubject = subjectMap.get(entry.subjectId) || entry.subjectId;
        const otherTeacher = teacherMap.get(entry.teacherId) || entry.teacherId;
        const otherBatch = entry.batch ? `[${entry.batch}] ` : '';

        splitElectiveNotice = `Parallel Elective / Split Class: Class ${currentClassName} also runs ${otherBatch}${otherSubject} (${otherTeacher}) during Period ${newEntry.period}. Both batches will take place in parallel.`;
      }
    }
  }

  return {
    hasConflict: false,
    errorMessage: null,
    isSplitElectiveNotice: splitElectiveNotice
  };
}

/**
 * Deduplicate timetable entries:
 * Unique key includes classId + day + period + (batch || subjectId) + teacherId + frequency.
 * This guarantees split electives (e.g. 11-A CS and 11-A Bio) or alternating week sessions are preserved!
 */
export function deduplicateTimetable(entries: TimetableEntry[]): {
  cleaned: TimetableEntry[];
  removedIds: string[];
} {
  const map = new Map<string, TimetableEntry>();
  const removedIds: string[] = [];

  for (const e of entries) {
    const classKey = e.classId.trim().toLowerCase();
    const dayKey = e.day.trim().toLowerCase();
    const periodKey = Number(e.period);
    const batchKey = (e.batch || e.subjectId).trim().toLowerCase();
    const teacherKey = e.teacherId.trim().toLowerCase();
    const freqKey = (e.frequency || 'all').toLowerCase();

    const key = `${classKey}_${dayKey}_${periodKey}_${batchKey}_${teacherKey}_${freqKey}`;

    if (map.has(key)) {
      const existing = map.get(key)!;
      // Mark older one for removal
      removedIds.push(existing.id);
      map.set(key, e);
    } else {
      map.set(key, e);
    }
  }

  return {
    cleaned: Array.from(map.values()),
    removedIds
  };
}

/**
 * Deduplicate and sanitize substitutions:
 * 1. Removes any substitutions for teachers no longer in directory
 * 2. Removes any orphan substitutions where the teacher is not marked absent on that date
 * 3. Deduplicates per (date + period + classId + (batch || subjectId) + originalTeacherId)
 * 4. Sanitizes substitute assignments if the assigned substitute was deleted
 */
export function deduplicateSubstitutions(
  subs: Substitution[],
  teachers: Teacher[],
  absences?: Absence[]
): {
  cleaned: Substitution[];
  removedIds: string[];
} {
  const teacherIdSet = new Set(teachers.map((t) => t.id));
  const teacherNameMap = new Map(teachers.map((t) => [t.id, t.name]));

  // Valid absent (date + teacherId) set
  const absenceKeySet = absences
    ? new Set(absences.map((a) => `${a.date}_${a.teacherId}`))
    : null;

  const map = new Map<string, Substitution>();
  const removedIds: string[] = [];

  for (const s of subs) {
    // If original teacher is no longer in staff directory, mark for removal
    if (!teacherIdSet.has(s.originalTeacherId)) {
      removedIds.push(s.id);
      continue;
    }

    // If absences list is provided and teacher is not marked absent on this date, it's an orphan substitution
    if (absenceKeySet && !absenceKeySet.has(`${s.date}_${s.originalTeacherId}`)) {
      removedIds.push(s.id);
      continue;
    }

    // Key by (date + period + classId + batchOrSubject + originalTeacherId)
    const batchOrSub = (s.batch || s.subjectId).trim().toLowerCase();
    const slotKey = `${s.date}_P${Number(s.period)}_${s.classId.trim().toLowerCase()}_${batchOrSub}_${s.originalTeacherId.trim().toLowerCase()}`;

    // Ensure teacher names are up-to-date with directory
    const currentOrigName = teacherNameMap.get(s.originalTeacherId) || s.originalTeacherName;
    const hasValidSub = s.assignedSubstituteId && teacherIdSet.has(s.assignedSubstituteId);
    const currentSubName = hasValidSub
      ? (teacherNameMap.get(s.assignedSubstituteId!) || s.assignedSubstituteName)
      : undefined;

    const validatedSub: Substitution = {
      ...s,
      originalTeacherName: currentOrigName,
      status: hasValidSub && s.status === 'Assigned' ? 'Assigned' : 'Pending',
      assignedSubstituteId: hasValidSub ? s.assignedSubstituteId : undefined,
      assignedSubstituteName: hasValidSub ? currentSubName : undefined,
      assignedReason: hasValidSub ? s.assignedReason : undefined,
      assignedAt: hasValidSub ? s.assignedAt : undefined
    };

    if (map.has(slotKey)) {
      const existing = map.get(slotKey)!;
      // If one is Assigned and one is Pending, keep the Assigned one
      if (existing.status === 'Pending' && validatedSub.status === 'Assigned') {
        removedIds.push(existing.id);
        map.set(slotKey, validatedSub);
      } else {
        removedIds.push(validatedSub.id);
      }
    } else {
      map.set(slotKey, validatedSub);
    }
  }

  return {
    cleaned: Array.from(map.values()),
    removedIds
  };
}

/**
 * Deduplicates absences: exactly 1 absence record per (date + teacherId).
 */
export function deduplicateAbsences(
  absences: Absence[],
  teachers: Teacher[]
): {
  cleaned: Absence[];
  removedIds: string[];
} {
  const teacherIdSet = new Set(teachers.map((t) => t.id));
  const teacherNameMap = new Map(teachers.map((t) => [t.id, t.name]));

  const map = new Map<string, Absence>();
  const removedIds: string[] = [];

  for (const a of absences) {
    if (!teacherIdSet.has(a.teacherId)) {
      removedIds.push(a.id);
      continue;
    }

    const key = `${a.date}_${a.teacherId}`;
    const validatedAbsence: Absence = {
      ...a,
      teacherName: teacherNameMap.get(a.teacherId) || a.teacherName
    };

    if (map.has(key)) {
      const existing = map.get(key)!;
      removedIds.push(existing.id);
      map.set(key, validatedAbsence);
    } else {
      map.set(key, validatedAbsence);
    }
  }

  return {
    cleaned: Array.from(map.values()),
    removedIds
  };
}


