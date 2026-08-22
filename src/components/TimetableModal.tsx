import React, { useState, useMemo } from 'react';
import {
  TimetableEntry,
  Teacher,
  ClassItem,
  Subject,
  DayOfWeek,
  ScheduleFrequency
} from '../types';
import { detectTimetableConflict } from '../services/conflictService';
import { getTeacherWorkloadInfo, getFrequencyLabel } from '../services/substitutionService';

interface TimetableModalProps {
  entry: Partial<TimetableEntry>;
  allEntries: TimetableEntry[];
  teachers: Teacher[];
  classes: ClassItem[];
  subjects: Subject[];
  isAnonymous?: boolean;
  onSave: (entry: TimetableEntry) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const FREQUENCY_OPTIONS: { value: ScheduleFrequency; label: string; desc: string }[] = [
  { value: 'all', label: '🔄 Every Week (Standard Schedule)', desc: 'Runs every week without exception' },
  { value: 'week_1_2', label: '📅 1st & 2nd Week of Month', desc: 'Runs only during the first two weeks of each month' },
  { value: 'week_3_4', label: '📅 3rd & 4th Week of Month', desc: 'Runs only during the 3rd and 4th weeks of each month' },
  { value: 'odd_weeks', label: '📅 1st & 3rd Week (Odd Weeks)', desc: 'Alternating fortnightly (Weeks 1, 3, 5)' },
  { value: 'even_weeks', label: '📅 2nd & 4th Week (Even Weeks)', desc: 'Alternating fortnightly (Weeks 2, 4)' },
  { value: 'week_1', label: '📅 1st Week of Month Only', desc: 'Once a month on the 1st occurrence' },
  { value: 'week_2', label: '📅 2nd Week of Month Only', desc: 'Once a month on the 2nd occurrence' },
  { value: 'week_3', label: '📅 3rd Week of Month Only', desc: 'Once a month on the 3rd occurrence' },
  { value: 'week_4', label: '📅 4th Week of Month Only', desc: 'Once a month on the 4th occurrence' }
];

export const TimetableModal: React.FC<TimetableModalProps> = ({
  entry,
  allEntries,
  teachers,
  classes,
  subjects,
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

  // Split Elective Batch state
  const [batchPreset, setBatchPreset] = useState<string>(
    entry.batch ? (['', 'Batch 1 (Group A)', 'Batch 2 (Group B)', 'Batch 3 (Group C)'].includes(entry.batch) ? entry.batch : 'custom') : ''
  );
  const [customBatch, setCustomBatch] = useState<string>(
    entry.batch && !['', 'Batch 1 (Group A)', 'Batch 2 (Group B)', 'Batch 3 (Group C)'].includes(entry.batch) ? entry.batch : ''
  );

  // Schedule Frequency state (Every week, 1st & 2nd week, Odd/Even weeks, etc.)
  const [frequency, setFrequency] = useState<ScheduleFrequency>(entry.frequency || 'all');

  const finalBatch = batchPreset === 'custom' ? customBatch.trim() : batchPreset;

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
        batch: finalBatch || undefined,
        frequency
      },
      allEntries,
      teachers,
      classes,
      subjects
    );
  }, [entry.id, day, period, classId, subjectId, teacherId, finalBatch, frequency, allEntries, teachers, classes, subjects]);

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
    const batchSlug = (finalBatch || subjectId).toLowerCase().replace(/[^a-z0-9]/g, '');
    const teacherSlug = teacherId.toLowerCase().replace(/[^a-z0-9]/g, '');
    const standardId = `tt-${cleanClass}-${cleanDay}-p${period}-${batchSlug}-${teacherSlug}`;

    const newEntry: TimetableEntry = {
      id: entry.id || standardId,
      day,
      period: Number(period),
      classId,
      subjectId,
      teacherId,
      batch: finalBatch || undefined,
      frequency: frequency !== 'all' ? frequency : undefined
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
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>📅</span>
            <div>
              <h3 style={{ margin: 0 }}>{entry.id ? 'Edit Timetable Period' : 'Add Timetable Period'}</h3>
              <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                Parallel Electives, Fortnightly Schedules & Double-Booking Protection
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
                Please select an available teacher to resolve this collision.
              </div>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '14px',
                color: '#166534',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>🛡️</span>
              <div>
                <strong>Conflict-Free Slot:</strong> Teacher is available for {day} Period {period}.
              </div>
            </div>
          )}

          {/* Split Elective / Parallel Batch Notice */}
          {conflictResult.isSplitElectiveNotice && (
            <div
              style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #93c5fd',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '14px',
                color: '#1e40af',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>🔀</span>
              <div>
                <strong>Split Elective Batch:</strong> {conflictResult.isSplitElectiveNotice}
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
                marginBottom: '14px',
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

            {/* Split Class Batch / Elective Group Selection */}
            <div className="form-group" style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontWeight: 700, fontSize: '13px', margin: 0, color: '#1e293b' }}>
                  🔀 Student Batch / Elective Group (Optional):
                </label>
                <span style={{ fontSize: '11px', color: '#64748b' }}>For split classes (e.g. CS / Bio in same period)</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: batchPreset === 'custom' ? '1fr 1fr' : '1fr', gap: '8px' }}>
                <select
                  value={batchPreset}
                  onChange={(e) => setBatchPreset(e.target.value)}
                  style={{ fontWeight: 600, fontSize: '13px' }}
                >
                  <option value="">Whole Class (All Students)</option>
                  <option value="Batch 1 (CS / Group A)">Batch 1 (Group A / e.g. CS)</option>
                  <option value="Batch 2 (Bio / Group B)">Batch 2 (Group B / e.g. Bio)</option>
                  <option value="Batch 3 (Elective C)">Batch 3 (Group C / Elective C)</option>
                  <option value="custom">Custom Batch Name / Elective Tag...</option>
                </select>
                {batchPreset === 'custom' && (
                  <input
                    type="text"
                    value={customBatch}
                    onChange={(e) => setCustomBatch(e.target.value)}
                    placeholder="e.g. CS Lab Batch, Bio Group, Sanskrit"
                    style={{ fontSize: '13px', fontWeight: 600 }}
                    autoFocus
                  />
                )}
              </div>
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

            {/* Frequency / Occurrence Cadence (Twice a month / 1st & 2nd Wednesday / Odd-Even Weeks) */}
            <div className="form-group" style={{ backgroundColor: '#fdf4ff', padding: '12px', borderRadius: '8px', border: '1px solid #f0abfc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontWeight: 700, fontSize: '13px', margin: 0, color: '#701a75' }}>
                  🗓️ Schedule Frequency / Occurrence:
                </label>
                <span style={{ fontSize: '11px', color: '#86198f' }}>Weekly, Fortnightly, or Specific Weeks</span>
              </div>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as ScheduleFrequency)}
                style={{ fontWeight: 600, fontSize: '13px', color: '#4a044e' }}
              >
                {FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '11.5px', color: '#86198f', marginTop: '4px' }}>
                {FREQUENCY_OPTIONS.find((o) => o.value === frequency)?.desc}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '11.5px', color: '#166534', background: '#dcfce7', padding: '4px 10px', borderRadius: '6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span>⚡</span> Auto-saves directly to Cloud & Local Storage
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                {entry.id && onDelete && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
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
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {conflictResult.hasConflict ? '⛔ Double-Booking Blocked' : '💾 Save & Auto-Sync Entry'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
