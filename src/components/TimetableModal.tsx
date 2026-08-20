import React, { useState, useMemo } from 'react';
import {
  TimetableEntry,
  Teacher,
  ClassItem,
  Subject,
  Room,
  DayOfWeek
} from '../types';
import { detectTimetableConflict } from '../services/conflictService';
import { getTeacherWorkloadInfo } from '../services/substitutionService';

interface TimetableModalProps {
  entry: Partial<TimetableEntry>;
  allEntries: TimetableEntry[];
  teachers: Teacher[];
  classes: ClassItem[];
  subjects: Subject[];
  rooms: Room[];
  isAnonymous?: boolean;
  onSave: (entry: TimetableEntry) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export const TimetableModal: React.FC<TimetableModalProps> = ({
  entry,
  allEntries,
  teachers,
  classes,
  subjects,
  rooms,
  isAnonymous = false,
  onSave,
  onDelete,
  onClose
}) => {
  const [day, setDay] = useState<DayOfWeek>((entry.day as DayOfWeek) || 'Monday');
  const [period, setPeriod] = useState<number>(entry.period ? Number(entry.period) : 1);
  const [classId, setClassId] = useState<string>(entry.classId || (classes[0]?.id || '9-A'));
  const [subjectId, setSubjectId] = useState<string>(entry.subjectId || (subjects[0]?.id || 'PHY'));
  const [teacherId, setTeacherId] = useState<string>(entry.teacherId || (teachers[0]?.id || 'T001'));
  const [roomId, setRoomId] = useState<string>(entry.roomId || (rooms[0]?.id || '204'));

  // Live conflict evaluation on every form state change
  const conflictResult = useMemo(() => {
    return detectTimetableConflict(
      {
        id: entry.id,
        day,
        period: Number(period),
        classId,
        subjectId,
        teacherId,
        roomId
      },
      allEntries,
      teachers,
      classes,
      rooms,
      subjects
    );
  }, [entry.id, day, period, classId, subjectId, teacherId, roomId, allEntries, teachers, classes, rooms, subjects]);

  // Live teacher busy map: only if teaching in a DIFFERENT class
  const teacherBusyMap = useMemo(() => {
    const map = new Map<string, string>();
    allEntries.forEach((e) => {
      if (entry.id && e.id === entry.id) return;
      if (e.day === day && Number(e.period) === Number(period) && e.classId !== classId) {
        map.set(e.teacherId, e.classId);
      }
    });
    return map;
  }, [allEntries, entry.id, day, period, classId]);

  // Live room busy map: only if occupied by a DIFFERENT class
  const roomBusyMap = useMemo(() => {
    const map = new Map<string, string>();
    allEntries.forEach((e) => {
      if (entry.id && e.id === entry.id) return;
      if (e.day === day && Number(e.period) === Number(period) && e.classId !== classId) {
        map.set(e.roomId, e.classId);
      }
    });
    return map;
  }, [allEntries, entry.id, day, period, classId]);

  // Teacher workload & rest status check
  const teacherWorkload = useMemo(() => {
    return getTeacherWorkloadInfo(
      teacherId,
      day,
      '2026-08-17',
      allEntries,
      [],
      period
    );
  }, [teacherId, day, allEntries, period]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (conflictResult.hasConflict) {
      return;
    }

    const cleanClass = classId.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanDay = day.toLowerCase().slice(0, 3);
    const standardId = `tt-${cleanClass}-${cleanDay}-${period}`;

    const newEntry: TimetableEntry = {
      id: entry.id || standardId,
      day,
      period: Number(period),
      classId,
      subjectId,
      teacherId,
      roomId
    };

    onSave(newEntry);
  };

  const getTeacherDisplayName = (t: Teacher) => {
    if (isAnonymous) {
      return t.anonymousCode || `[Staff ${t.id}]`;
    }
    return `${t.name} (${t.department})`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>📅</span>
            <div>
              <h3 style={{ margin: 0 }}>{entry.id ? 'Edit Timetable Period' : 'Add Timetable Period'}</h3>
              <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                Conflict-Protected Master Scheduling (Mon–Sat &bull; 8 Periods)
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body" style={{ padding: '20px' }}>
          {/* Active Conflict Blocking Alert */}
          {conflictResult.hasConflict ? (
            <div
              style={{
                backgroundColor: '#fee2e2',
                border: '2px solid #ef4444',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                color: '#991b1b'
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⛔</span> DOUBLE-BOOKING CONFLICT PREVENTED
              </div>
              <div style={{ fontSize: '13px', marginTop: '4px', fontWeight: 600 }}>
                {conflictResult.errorMessage}
              </div>
              <div style={{ fontSize: '11.5px', marginTop: '6px', color: '#b91c1c' }}>
                Please select an available teacher or free room to resolve this collision.
              </div>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                color: '#166534',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>🛡️</span>
              <div>
                <strong>Conflict-Free Slot:</strong> Teacher and Room are 100% available for {day} Period {period}.
              </div>
            </div>
          )}

          {/* Consecutive Periods Rest Warning */}
          {teacherWorkload.wouldCause4Consecutive && (
            <div
              style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fcd34d',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                color: '#92400e',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>⚠️</span>
              <div>
                <strong>Rest Protection Warning:</strong> Assigning this period results in 4 consecutive teaching periods for this teacher without a break.
              </div>
            </div>
          )}

          <form onSubmit={handleSave}>
            {/* Day and Period Selection */}
            <div className="form-row">
              <div className="form-col">
                <div className="form-group">
                  <label htmlFor="modal-day" style={{ fontWeight: 700, fontSize: '13px' }}>Day (Mon-Sat):</label>
                  <select
                    id="modal-day"
                    value={day}
                    onChange={(e) => setDay(e.target.value as DayOfWeek)}
                    style={{ fontWeight: 600 }}
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-col">
                <div className="form-group">
                  <label htmlFor="modal-period" style={{ fontWeight: 700, fontSize: '13px' }}>Period (1 to 8):</label>
                  <select
                    id="modal-period"
                    value={period}
                    onChange={(e) => setPeriod(Number(e.target.value))}
                    style={{ fontWeight: 600 }}
                  >
                    {PERIODS.map((p) => (
                      <option key={p} value={p}>Period {p}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Class Selection */}
            <div className="form-group">
              <label htmlFor="modal-class" style={{ fontWeight: 700, fontSize: '13px' }}>Class:</label>
              <select
                id="modal-class"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                style={{ fontWeight: 600 }}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Class {c.id} (Grade {c.grade})
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Selection */}
            <div className="form-group">
              <label htmlFor="modal-subject" style={{ fontWeight: 700, fontSize: '13px' }}>Subject:</label>
              <select
                id="modal-subject"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                style={{ fontWeight: 600 }}
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id}) &bull; {s.department}
                  </option>
                ))}
              </select>
            </div>

            {/* Teacher Selection with Dynamic Double-Booking Indicator */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label htmlFor="modal-teacher" style={{ fontWeight: 700, fontSize: '13px', margin: 0 }}>
                  Assigned Teacher:
                </label>
                {teacherBusyMap.has(teacherId) && (
                  <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700 }}>
                    ⛔ Occupied in Class {teacherBusyMap.get(teacherId)}
                  </span>
                )}
              </div>
              <select
                id="modal-teacher"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                style={{
                  fontWeight: 600,
                  borderColor: teacherBusyMap.has(teacherId) ? '#ef4444' : '#cbd5e1',
                  backgroundColor: teacherBusyMap.has(teacherId) ? '#fff1f2' : '#ffffff'
                }}
              >
                {teachers.map((t) => {
                  const busyClass = teacherBusyMap.get(t.id);
                  return (
                    <option
                      key={t.id}
                      value={t.id}
                      style={{
                        color: busyClass ? '#991b1b' : '#0f172a',
                        fontWeight: busyClass ? 700 : 500
                      }}
                    >
                      {busyClass ? `⛔ [Busy in Class ${busyClass}] ` : `✓ [Free] `}
                      {getTeacherDisplayName(t)}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Room Selection with Conflict Awareness */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label htmlFor="modal-room" style={{ fontWeight: 700, fontSize: '13px', margin: 0 }}>
                  Classroom / Laboratory:
                </label>
                {roomBusyMap.has(roomId) && (
                  <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700 }}>
                    ⛔ Occupied by Class {roomBusyMap.get(roomId)}
                  </span>
                )}
              </div>
              <select
                id="modal-room"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                style={{
                  fontWeight: 600,
                  borderColor: roomBusyMap.has(roomId) ? '#ef4444' : '#cbd5e1',
                  backgroundColor: roomBusyMap.has(roomId) ? '#fff1f2' : '#ffffff'
                }}
              >
                {rooms.map((r) => {
                  const occupiedClass = roomBusyMap.get(r.id);
                  return (
                    <option
                      key={r.id}
                      value={r.id}
                      style={{
                        color: occupiedClass ? '#991b1b' : '#0f172a'
                      }}
                    >
                      {occupiedClass ? `⛔ [Occupied by Class ${occupiedClass}] ` : `✓ [Free] `}
                      Room {r.id} ({r.type})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Modal Actions */}
            <div className="modal-footer" style={{ paddingLeft: 0, paddingRight: 0, paddingBottom: 0, marginTop: '20px' }}>
              {entry.id && onDelete && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  style={{ marginRight: 'auto' }}
                  onClick={() => onDelete(entry.id!)}
                >
                  Delete Entry
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={conflictResult.hasConflict}
                style={{
                  backgroundColor: conflictResult.hasConflict ? '#94a3b8' : '#2563eb',
                  cursor: conflictResult.hasConflict ? 'not-allowed' : 'pointer',
                  fontWeight: 700
                }}
              >
                {conflictResult.hasConflict ? '⛔ Double-Booking Blocked' : 'Save Timetable Entry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
