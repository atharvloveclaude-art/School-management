import React, { useState, useMemo } from 'react';
import {
  TimetableEntry,
  Teacher,
  ClassItem,
  Subject,
  Room,
  DayOfWeek
} from '../types';

interface TimetableGridProps {
  entries: TimetableEntry[];
  teachers: Teacher[];
  classes: ClassItem[];
  subjects: Subject[];
  rooms: Room[];
  isAnonymous?: boolean;
  onCellClick: (entry: Partial<TimetableEntry>) => void;
  onAddNew: () => void;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  entries,
  teachers,
  classes,
  subjects,
  rooms,
  isAnonymous = false,
  onCellClick,
  onAddNew
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('12-A');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');

  const teacherMap = new Map(
    teachers.map((t) => [
      t.id,
      isAnonymous ? (t.anonymousCode || t.id) : t.name
    ])
  );
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

  // Global double-booking audit across all entries in the entire system
  const { teacherConflicts, roomConflicts } = useMemo(() => {
    const teacherSlots = new Map<string, TimetableEntry[]>();
    const roomSlots = new Map<string, TimetableEntry[]>();

    entries.forEach((e) => {
      const tKey = `${e.day}-P${e.period}-${e.teacherId}`;
      const rKey = `${e.day}-P${e.period}-${e.roomId}`;

      if (!teacherSlots.has(tKey)) teacherSlots.set(tKey, []);
      teacherSlots.get(tKey)!.push(e);

      if (!roomSlots.has(rKey)) roomSlots.set(rKey, []);
      roomSlots.get(rKey)!.push(e);
    });

    const tConflicts: TimetableEntry[] = [];
    teacherSlots.forEach((group) => {
      if (group.length > 1) {
        tConflicts.push(...group);
      }
    });

    const rConflicts: TimetableEntry[] = [];
    roomSlots.forEach((group) => {
      if (group.length > 1) {
        rConflicts.push(...group);
      }
    });

    return {
      teacherConflicts: tConflicts,
      roomConflicts: rConflicts
    };
  }, [entries]);

  const conflictingEntryIds = useMemo(() => {
    const set = new Set<string>();
    teacherConflicts.forEach((e) => set.add(e.id));
    roomConflicts.forEach((e) => set.add(e.id));
    return set;
  }, [teacherConflicts, roomConflicts]);

  // Filter entries
  const filteredEntries = entries.filter((e) => {
    if (selectedClass !== 'all' && e.classId !== selectedClass) return false;
    if (selectedTeacher !== 'all' && e.teacherId !== selectedTeacher) return false;
    if (selectedRoom !== 'all' && e.roomId !== selectedRoom) return false;
    if (selectedDay !== 'all' && e.day !== selectedDay) return false;
    return true;
  });

  const displayDays = selectedDay === 'all' ? DAYS : [selectedDay as DayOfWeek];

  const getEntryFor = (day: DayOfWeek, period: number) => {
    return filteredEntries.find((e) => e.day === day && Number(e.period) === Number(period));
  };

  return (
    <div className="page-section" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      {/* Section Header with Live Double-Booking Health Check */}
      <div className="section-header" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Master School Timetable
            </h2>
            {teacherConflicts.length === 0 ? (
              <span style={{ fontSize: '12px', background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                🛡️ 0 Teacher Double-Bookings (Conflict-Free)
              </span>
            ) : (
              <span style={{ fontSize: '12px', background: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '20px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                ⚠️ {teacherConflicts.length} Double-Booking Conflicts Detected
              </span>
            )}
          </div>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
            8 Periods / Day &bull; 6 Working Days (Mon–Sat) &bull; Click any cell to edit schedule
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => window.print()}
            title="Print Timetable"
            style={{ backgroundColor: '#ffffff', color: '#334155', borderColor: '#cbd5e1' }}
          >
            🖨️ Print Timetable
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={onAddNew}
            style={{ backgroundColor: '#2563eb', fontWeight: 700 }}
          >
            + Add Timetable Entry
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="filter-bar"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px'
        }}
      >
        <div className="filter-group">
          <label htmlFor="filter-class" style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginRight: '6px' }}>
            Class:
          </label>
          <select
            id="filter-class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600 }}
          >
            <option value="all">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Class {c.id}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-teacher" style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginRight: '6px' }}>
            Teacher:
          </label>
          <select
            id="filter-teacher"
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600 }}
          >
            <option value="all">All Teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {isAnonymous ? (t.anonymousCode || t.id) : `${t.name} (${t.department})`}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-room" style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginRight: '6px' }}>
            Room:
          </label>
          <select
            id="filter-room"
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600 }}
          >
            <option value="all">All Rooms</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                Room {r.id}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-day" style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginRight: '6px' }}>
            Day:
          </label>
          <select
            id="filter-day"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600 }}
          >
            <option value="all">All 6 Days</option>
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {(selectedClass !== '12-A' || selectedTeacher !== 'all' || selectedRoom !== 'all' || selectedDay !== 'all') && (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              setSelectedClass('12-A');
              setSelectedTeacher('all');
              setSelectedRoom('all');
              setSelectedDay('all');
            }}
            style={{ fontSize: '12px', padding: '5px 10px' }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Timetable Table */}
      <div className="table-responsive" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
              <th style={{ width: '110px', padding: '12px 14px', textAlign: 'left', fontWeight: 800 }}>Day</th>
              {PERIODS.map((p) => (
                <th key={p} style={{ textAlign: 'center', minWidth: '115px', padding: '12px 8px', fontWeight: 800 }}>
                  <div>Period {p}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayDays.map((day) => (
              <tr key={day} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 800, color: '#1e293b', background: '#f8fafc' }}>
                  {day}
                </td>
                {PERIODS.map((period) => {
                  const entry = getEntryFor(day, period);
                  if (entry) {
                    const subjectName = subjectMap.get(entry.subjectId) || entry.subjectId;
                    const teacherName = teacherMap.get(entry.teacherId) || entry.teacherId;
                    const isConflicted = conflictingEntryIds.has(entry.id);

                    return (
                      <td
                        key={period}
                        onClick={() => onCellClick(entry)}
                        title={`Click to edit ${day} Period ${period}`}
                        style={{
                          padding: '10px 8px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          backgroundColor: isConflicted ? '#fff1f2' : '#ffffff',
                          border: isConflicted ? '2px solid #f87171' : '1px solid #e2e8f0',
                          borderRadius: '6px',
                          transition: 'background 0.15s'
                        }}
                      >
                        {isConflicted && (
                          <div style={{ fontSize: '10px', color: '#dc2626', fontWeight: 800, marginBottom: '2px' }}>
                            ⚠️ DOUBLE-BOOKED
                          </div>
                        )}
                        <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '13px' }}>
                          {subjectName}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginTop: '2px' }}>
                          {teacherName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          {selectedClass === 'all' ? `[${entry.classId}] ` : ''}Rm {entry.roomId}
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={period}
                      onClick={() =>
                        onCellClick({
                          day,
                          period,
                          classId: selectedClass !== 'all' ? selectedClass : '12-A',
                          teacherId: selectedTeacher !== 'all' ? selectedTeacher : 'T001',
                          roomId: selectedRoom !== 'all' ? selectedRoom : '204'
                        })
                      }
                      title={`Click to schedule ${day} Period ${period}`}
                      style={{
                        padding: '12px 8px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        color: '#94a3b8',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: '1px dashed #cbd5e1',
                        borderRadius: '6px',
                        backgroundColor: '#fbfcfd'
                      }}
                    >
                      + Assign
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
