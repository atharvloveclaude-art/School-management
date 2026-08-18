import React, { useState } from 'react';
import {
  Teacher,
  TimetableEntry,
  Subject,
  Absence,
  Substitution,
  DayOfWeek
} from '../types';
import {
  findAffectedPeriods,
  getDayOfWeekFromDate,
  PERIOD_TIMINGS
} from '../services/substitutionService';
import { DutySlipModal } from './DutySlipModal';

interface DailyDispatcherModalProps {
  teachers: Teacher[];
  subjects: Subject[];
  timetables: TimetableEntry[];
  absences: Absence[];
  substitutions: Substitution[];
  isAnonymous: boolean;
  onApplyAbsencesAndAutoAssign: (
    newAbsences: { teacherId: string; teacherName: string; reason: string }[],
    date: string,
    autoAssignAll: boolean
  ) => void;
  onOpenPrintRosterModal: (date: string) => void;
  onClose: () => void;
}

export const DailyDispatcherModal: React.FC<DailyDispatcherModalProps> = ({
  teachers,
  subjects,
  timetables,
  absences,
  substitutions,
  isAnonymous,
  onApplyAbsencesAndAutoAssign,
  onOpenPrintRosterModal,
  onClose
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-17');
  const [defaultReason, setDefaultReason] = useState<string>('Personal Leave');
  const [selectedAbsentTeacherIds, setSelectedAbsentTeacherIds] = useState<Set<string>>(() => {
    const currentAbsent = absences.filter((a) => a.date === '2026-08-17').map((a) => a.teacherId);
    return new Set(currentAbsent);
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeDutySlip, setActiveDutySlip] = useState<Substitution | null>(null);

  const dayOfWeek = getDayOfWeekFromDate(selectedDate);

  const toggleTeacher = (id: string) => {
    const next = new Set(selectedAbsentTeacherIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedAbsentTeacherIds(next);
  };

  const getTeacherDisplayName = (t: Teacher) => {
    if (isAnonymous) {
      return t.anonymousCode || `[Staff ${t.id} - ${t.primarySubject || t.department}]`;
    }
    return `${t.name} (${t.department})`;
  };

  const selectedTeachersList = teachers.filter((t) => selectedAbsentTeacherIds.has(t.id));
  const totalAffectedPeriods = selectedTeachersList.reduce((acc, t) => {
    const affected = findAffectedPeriods(t.id, dayOfWeek, timetables, subjects);
    return acc + affected.length;
  }, 0);

  const handleGenerateAndAssign = () => {
    const newAbsencesList = selectedTeachersList.map((t) => ({
      teacherId: t.id,
      teacherName: isAnonymous ? (t.anonymousCode || t.id) : t.name,
      reason: defaultReason
    }));

    onApplyAbsencesAndAutoAssign(newAbsencesList, selectedDate, true);
  };

  const todaySubstitutions = substitutions.filter((s) => s.date === selectedDate);
  const pendingCount = todaySubstitutions.filter((s) => s.status === 'Pending').length;
  const assignedCount = todaySubstitutions.filter((s) => s.status === 'Assigned').length;

  const filteredTeachers = teachers.filter((t) => {
    const term = searchTerm.toLowerCase();
    return (
      t.name.toLowerCase().includes(term) ||
      t.id.toLowerCase().includes(term) ||
      (t.department || '').toLowerCase().includes(term) ||
      (t.primarySubject || '').toLowerCase().includes(term) ||
      (t.anonymousCode || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '880px', width: '95vw', maxHeight: '92vh' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <div>
              <h3 style={{ margin: 0 }}>Daily Fast Absence & Substitute Dispatcher</h3>
              <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                Select absent teachers &bull; 1-Click intelligent assignment &bull; Rest protection (no 4 periods in a row)
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body" style={{ padding: '20px' }}>
          {/* Quick Date and Reason Setup */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              padding: '12px 16px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              marginBottom: '16px'
            }}
          >
            <div style={{ flex: '1', minWidth: '180px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                Operational Date:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  const curr = absences.filter((a) => a.date === e.target.value).map((a) => a.teacherId);
                  setSelectedAbsentTeacherIds(new Set(curr));
                }}
                style={{ padding: '6px 10px', fontSize: '13px', borderRadius: '4px' }}
              />
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Schedule Day: <strong>{dayOfWeek}</strong> (8 Periods)
              </div>
            </div>

            <div style={{ flex: '2', minWidth: '220px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                Default Absence Reason:
              </label>
              <input
                type="text"
                value={defaultReason}
                onChange={(e) => setDefaultReason(e.target.value)}
                placeholder="e.g. Leave / Official Duty"
                style={{ padding: '6px 10px', fontSize: '13px', borderRadius: '4px' }}
              />
            </div>
          </div>

          {/* Teacher Selection Checklist */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <strong style={{ color: '#1e293b', fontSize: '14px' }}>
                  1. Check Absent Teachers Today:
                </strong>
                <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>
                  ({selectedAbsentTeacherIds.size} absent, {totalAffectedPeriods} class periods affected)
                </span>
              </div>

              <input
                type="text"
                placeholder="Search teacher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '190px', padding: '4px 8px', fontSize: '12px', borderRadius: '4px' }}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '8px',
                maxHeight: '170px',
                overflowY: 'auto',
                padding: '8px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                backgroundColor: '#ffffff'
              }}
            >
              {filteredTeachers.map((t) => {
                const isSelected = selectedAbsentTeacherIds.has(t.id);
                const teacherPeriodsToday = timetables.filter(
                  (tt) => tt.teacherId === t.id && tt.day === dayOfWeek
                ).length;

                return (
                  <label
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      border: isSelected ? '1px solid #f97316' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#fff7ed' : '#ffffff',
                      borderRadius: '4px',
                      fontSize: '13px'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTeacher(t.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? '#c2410c' : '#1e293b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {getTeacherDisplayName(t)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {teacherPeriodsToday} teaching periods on {dayOfWeek}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Action Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              backgroundColor: '#1e293b',
              color: '#ffffff',
              borderRadius: '6px',
              marginBottom: '16px'
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>
                🚀 Intelligent Rest-Protected Assignment
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Matches subject expertise & guarantees teachers never get 4 consecutive periods
              </div>
            </div>

            <button
              className="btn btn-success"
              onClick={handleGenerateAndAssign}
              style={{ padding: '8px 18px', fontSize: '13.5px', fontWeight: 700 }}
            >
              Assign All Substitutes Now
            </button>
          </div>

          {/* Today's Substitution Roster Table with Print Button */}
          {todaySubstitutions.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ color: '#1e293b', fontSize: '14px' }}>
                  Today's Substituted Teachers & Classes List ({selectedDate} &bull; {dayOfWeek}):
                </strong>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onOpenPrintRosterModal(selectedDate)}
                    title="Open Print View for Substituted Teachers and Classes"
                  >
                    🖨️ Print Substituted Teachers List
                  </button>
                </div>
              </div>

              <div className="table-responsive" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>Period</th>
                      <th style={{ width: '85px' }}>Class</th>
                      <th>Subject</th>
                      <th>Absent Teacher</th>
                      <th>Substituted Teacher</th>
                      <th>Room</th>
                      <th style={{ width: '90px', textAlign: 'center' }}>Slip</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todaySubstitutions.map((sub) => {
                      const timing = PERIOD_TIMINGS[Number(sub.period)] || '';

                      return (
                        <tr
                          key={sub.id}
                          style={{
                            backgroundColor: sub.status === 'Assigned' ? '#f0fdf4' : '#fffbeb'
                          }}
                        >
                          <td>
                            <strong>Period {sub.period}</strong>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>{timing}</div>
                          </td>
                          <td>
                            <strong style={{ color: '#3730a3' }}>Class {sub.classId}</strong>
                          </td>
                          <td>{sub.subjectName}</td>
                          <td style={{ color: '#dc2626', fontWeight: 500 }}>
                            {sub.originalTeacherName}
                          </td>
                          <td>
                            {sub.status === 'Assigned' ? (
                              <div>
                                <strong style={{ color: '#15803d' }}>
                                  {sub.assignedSubstituteName}
                                </strong>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  {sub.assignedReason}
                                </div>
                              </div>
                            ) : (
                              <span className="badge badge-pending">Pending Cover</span>
                            )}
                          </td>
                          <td>Room {sub.roomId}</td>
                          <td style={{ textAlign: 'center' }}>
                            {sub.status === 'Assigned' && (
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => setActiveDutySlip(sub)}
                                title="Print Duty Slip"
                                style={{ padding: '2px 6px', fontSize: '11px' }}
                              >
                                Duty Slip
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {todaySubstitutions.length > 0 && (
            <button
              className="btn btn-primary"
              onClick={() => onOpenPrintRosterModal(selectedDate)}
            >
              🖨️ Print Substituted Teachers List
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {activeDutySlip && (
        <DutySlipModal
          substitution={activeDutySlip}
          onClose={() => setActiveDutySlip(null)}
        />
      )}
    </div>
  );
};
