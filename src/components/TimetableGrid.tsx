import React, { useState, useMemo } from 'react';
import {
  TimetableEntry,
  Teacher,
  ClassItem,
  Subject,
  DayOfWeek
} from '../types';
import { getFrequencyLabel } from '../services/substitutionService';
import { doFrequenciesOverlap } from '../services/conflictService';

interface TimetableGridProps {
  entries: TimetableEntry[];
  teachers: Teacher[];
  classes: ClassItem[];
  subjects: Subject[];
  isAnonymous?: boolean;
  onCellClick: (entry: Partial<TimetableEntry>) => void;
  onAddNew: () => void;
  onCleanDuplicates?: () => void;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  entries,
  teachers,
  classes,
  subjects,
  isAnonymous = false,
  onCellClick,
  onAddNew,
  onCleanDuplicates
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');

  const teacherMap = new Map(
    teachers.map((t) => [
      t.id,
      isAnonymous ? (t.anonymousCode || t.id) : t.name
    ])
  );
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

  // Teacher double-booking audit:
  // Flags a conflict ONLY if a teacher is double-booked across DIFFERENT classes with overlapping frequency!
  const teacherConflicts = useMemo(() => {
    const tConflicts: TimetableEntry[] = [];

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i];
        const b = entries[j];

        if (a.day === b.day && Number(a.period) === Number(b.period)) {
          const overlaps = doFrequenciesOverlap(a.frequency || 'all', b.frequency || 'all');
          if (!overlaps) continue;

          // Teacher conflict: Same teacher in two different classes
          if (a.teacherId === b.teacherId && a.classId !== b.classId) {
            tConflicts.push(a, b);
          }
        }
      }
    }

    return tConflicts;
  }, [entries]);

  const conflictingEntryIds = useMemo(() => {
    const set = new Set<string>();
    teacherConflicts.forEach((e) => set.add(e.id));
    return set;
  }, [teacherConflicts]);

  // Filter entries
  const filteredEntries = entries.filter((e) => {
    if (selectedClass !== 'all' && e.classId !== selectedClass) return false;
    if (selectedTeacher !== 'all' && e.teacherId !== selectedTeacher) return false;
    if (selectedDay !== 'all' && e.day !== selectedDay) return false;
    return true;
  });

  const displayDays = selectedDay === 'all' ? DAYS : [selectedDay as DayOfWeek];

  const getEntriesFor = (day: DayOfWeek, period: number): TimetableEntry[] => {
    return filteredEntries.filter((e) => e.day === day && Number(e.period) === Number(period));
  };

  const totalIssueCount = conflictingEntryIds.size;

  return (
    <div className="page-section" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      {/* Section Header with Live Double-Booking Health Check */}
      <div className="section-header" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Master School Timetable
            </h2>
            {totalIssueCount === 0 ? (
              <span style={{ fontSize: '12px', background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                🛡️ 0 Double-Bookings (Conflict-Free & Parallel-Ready)
              </span>
            ) : (
              <span style={{ fontSize: '12px', background: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '20px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                ⚠️ {totalIssueCount} Double-Booking Conflicts Detected
              </span>
            )}
          </div>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
            Supports Split Electives (e.g. CS / Bio in same period) &bull; Specific-Week Frequencies &bull; 8 Periods / Day &bull; 6 Working Days
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {totalIssueCount > 0 && onCleanDuplicates && (
            <button
              className="btn btn-sm"
              onClick={onCleanDuplicates}
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                fontWeight: 700,
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                boxShadow: '0 2px 6px rgba(220,38,38,0.3)',
                cursor: 'pointer'
              }}
            >
              🧹 Clean Duplicate Conflicts (1-Click Fix)
            </button>
          )}
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

        {(selectedClass !== 'all' || selectedTeacher !== 'all' || selectedDay !== 'all') && (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              setSelectedClass('all');
              setSelectedTeacher('all');
              setSelectedDay('all');
            }}
            style={{ fontSize: '12px', padding: '5px 10px' }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Timetable Table with Split Elective & Frequency Badge Support */}
      <div className="table-responsive" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
              <th style={{ width: '110px', padding: '12px 14px', textAlign: 'left', fontWeight: 800 }}>Day</th>
              {PERIODS.map((p) => (
                <th key={p} style={{ textAlign: 'center', minWidth: '130px', padding: '12px 8px', fontWeight: 800 }}>
                  <div>Period {p}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayDays.map((day) => (
              <tr key={day} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 800, color: '#1e293b', background: '#f8fafc', verticalAlign: 'top' }}>
                  {day}
                </td>
                {PERIODS.map((period) => {
                  const cellEntries = getEntriesFor(day, period);

                  if (cellEntries.length > 0) {
                    const hasConflict = cellEntries.some((e) => conflictingEntryIds.has(e.id));
                    const isSplit = cellEntries.length > 1;

                    return (
                      <td
                        key={period}
                        style={{
                          padding: '6px',
                          textAlign: 'center',
                          backgroundColor: hasConflict ? '#fff1f2' : isSplit ? '#f0fdfa' : '#ffffff',
                          border: hasConflict ? '2px solid #f87171' : isSplit ? '1.5px solid #99f6e4' : '1px solid #e2e8f0',
                          borderRadius: '6px',
                          verticalAlign: 'top'
                        }}
                      >
                        {hasConflict && (
                          <div style={{ fontSize: '10px', color: '#dc2626', fontWeight: 800, marginBottom: '4px' }}>
                            ⚠️ DOUBLE-BOOKED
                          </div>
                        )}

                        {isSplit && (
                          <div style={{ fontSize: '10px', color: '#0f766e', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                            <span>🔀</span> Split Class ({cellEntries.length} Batches)
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {cellEntries.map((entry) => {
                            const subjectName = subjectMap.get(entry.subjectId) || entry.subjectId;
                            const teacherName = teacherMap.get(entry.teacherId) || entry.teacherId;
                            const isEntryConflicted = conflictingEntryIds.has(entry.id);

                            return (
                              <div
                                key={entry.id}
                                onClick={() => onCellClick(entry)}
                                title={`Click to edit ${day} Period ${period} (${entry.batch || subjectName})`}
                                style={{
                                  padding: '6px 8px',
                                  backgroundColor: isEntryConflicted ? '#fee2e2' : '#ffffff',
                                  border: isEntryConflicted ? '1px solid #ef4444' : '1px solid #e2e8f0',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                  transition: 'transform 0.1s, box-shadow 0.1s'
                                }}
                              >
                                {entry.batch && (
                                  <div
                                    style={{
                                      fontSize: '9.5px',
                                      fontWeight: 800,
                                      color: '#0369a1',
                                      backgroundColor: '#e0f2fe',
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                      display: 'inline-block',
                                      marginBottom: '2px'
                                    }}
                                  >
                                    🏷️ {entry.batch}
                                  </div>
                                )}

                                {entry.frequency && entry.frequency !== 'all' && (
                                  <div
                                    style={{
                                      fontSize: '9.5px',
                                      fontWeight: 700,
                                      color: '#701a75',
                                      backgroundColor: '#fdf4ff',
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                      display: 'inline-block',
                                      marginBottom: '2px',
                                      marginLeft: '3px'
                                    }}
                                    title={getFrequencyLabel(entry.frequency)}
                                  >
                                    📅 {getFrequencyLabel(entry.frequency).split(' ')[0]} {getFrequencyLabel(entry.frequency).split(' ')[1] || ''}
                                  </div>
                                )}

                                <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '12.5px' }}>
                                  {subjectName}
                                </div>
                                <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', marginTop: '1px' }}>
                                  {teacherName}
                                </div>
                                {selectedClass === 'all' && (
                                  <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '1px' }}>
                                    Class {entry.classId}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Quick Action: Add parallel batch for this class */}
                        {selectedClass !== 'all' && (
                          <div style={{ marginTop: '4px' }}>
                            <button
                              type="button"
                              onClick={() =>
                                onCellClick({
                                  day,
                                  period,
                                  classId: selectedClass,
                                  batch: `Batch ${cellEntries.length + 1}`
                                })
                              }
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#0284c7',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: '2px 4px'
                              }}
                            >
                              + Split Batch
                            </button>
                          </div>
                        )}
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
                          classId: selectedClass !== 'all' ? selectedClass : (classes[0]?.id || '9-A'),
                          teacherId: selectedTeacher !== 'all' ? selectedTeacher : (teachers[0]?.id || 'T001')
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
