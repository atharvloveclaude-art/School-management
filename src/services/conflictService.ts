import { TimetableEntry, Teacher, ClassItem, Room, Subject, ConflictCheckResult } from '../types';

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
