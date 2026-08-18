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
    // Skip checking against itself when updating
    if (newEntry.id && entry.id === newEntry.id) {
      continue;
    }

    // Must be the same day and period for a time collision
    if (entry.day === newEntry.day && Number(entry.period) === Number(newEntry.period)) {
      // 1. Teacher Conflict: Is the same teacher assigned elsewhere in this period?
      if (entry.teacherId === newEntry.teacherId) {
        const assignedClass = entry.classId;
        return {
          hasConflict: true,
          errorMessage: `${teacherName} is already teaching ${assignedClass} during ${newEntry.day} Period ${newEntry.period}.`
        };
      }

      // 2. Class Conflict: Does this class already have another subject scheduled?
      if (entry.classId === newEntry.classId) {
        const existingSubject = subjectMap.get(entry.subjectId) || entry.subjectId;
        const existingTeacher = teacherMap.get(entry.teacherId) || entry.teacherId;
        return {
          hasConflict: true,
          errorMessage: `Class ${currentClassName} is already scheduled for ${existingSubject} with ${existingTeacher} during ${newEntry.day} Period ${newEntry.period}.`
        };
      }

      // 3. Room Conflict: Is this room already occupied by another class?
      if (entry.roomId === newEntry.roomId) {
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
