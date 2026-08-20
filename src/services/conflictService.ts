import { TimetableEntry, Teacher, ClassItem, Room, Subject, ConflictCheckResult, Substitution, Absence } from '../types';

export function detectTimetableConflict(
  newEntry: {
    id?: string;
    day: string;
    period: number;
    classId: string;
    subjectId: string;
    teacherId: string;
    roomId: string;
  },
  existingEntries: TimetableEntry[],
  teachers: Teacher[],
  classes: ClassItem[],
  rooms: Room[],
  subjects: Subject[]
): ConflictCheckResult {
  const teacherMap = new Map(teachers.map(t => [t.id, t.name]));
  const classMap = new Map(classes.map(c => [c.id, c.id]));
  const roomMap = new Map(rooms.map(r => [r.id, r.id]));
  const subjectMap = new Map(subjects.map(s => [s.id, s.name]));

  const teacherName = teacherMap.get(newEntry.teacherId) || newEntry.teacherId;
  const currentClassName = classMap.get(newEntry.classId) || newEntry.classId;
  const currentRoomName = roomMap.get(newEntry.roomId) || newEntry.roomId;

  for (const entry of existingEntries) {
    // 1. Skip exact ID match
    if (newEntry.id && entry.id === newEntry.id) {
      continue;
    }

    // 2. Skip if this is the exact same class slot being updated/replaced (prevent self-conflict)
    if (
      entry.classId === newEntry.classId &&
      entry.day === newEntry.day &&
      Number(entry.period) === Number(newEntry.period)
    ) {
      continue;
    }

    // Must be the same day and period for a collision
    if (entry.day === newEntry.day && Number(entry.period) === Number(newEntry.period)) {
      // 1. Teacher Conflict: Is the same teacher assigned in a DIFFERENT class during this period?
      if (entry.teacherId === newEntry.teacherId && entry.classId !== newEntry.classId) {
        const assignedClass = entry.classId;
        return {
          hasConflict: true,
          errorMessage: `${teacherName} is already teaching Class ${assignedClass} during ${newEntry.day} Period ${newEntry.period}.`
        };
      }

      // 2. Room Conflict: Is this room already occupied by a DIFFERENT class?
      if (entry.roomId === newEntry.roomId && entry.classId !== newEntry.classId) {
        const occupyingClass = entry.classId;
        return {
          hasConflict: true,
          errorMessage: `Room ${currentRoomName} is already occupied by Class ${occupyingClass} during ${newEntry.day} Period ${newEntry.period}.`
        };
      }
    }
  }

  return {
    hasConflict: false,
    errorMessage: null
  };
}

/**
 * Deduplicate timetable entries: ensures exactly one entry exists per (classId + day + period).
 * Returns the cleaned array and the list of deleted duplicate IDs so they can be purged from Firestore.
 */
export function deduplicateTimetable(entries: TimetableEntry[]): {
  cleaned: TimetableEntry[];
  removedIds: string[];
} {
  const map = new Map<string, TimetableEntry>();
  const removedIds: string[] = [];

  for (const e of entries) {
    const key = `${e.classId.trim().toLowerCase()}_${e.day.trim().toLowerCase()}_${Number(e.period)}`;
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
 * 3. Deduplicates per (date + period + classId) so each period slot only appears once
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

    // Key by (date + period + classId)
    const slotKey = `${s.date}_P${Number(s.period)}_${s.classId.trim().toLowerCase()}`;

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

