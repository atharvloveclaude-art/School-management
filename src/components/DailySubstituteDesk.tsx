import React, { useState } from 'react';
import { Teacher, ClassItem, Subject, TimetableEntry, Absence, Substitution, AffectedPeriod } from '../types';
import { findAffectedPeriods, getDayOfWeekFromDate, autoAssignSubstitutions } from '../services/substitutionService';
import { DutySlipModal } from './DutySlipModal';

interface DailySubstituteDeskProps {
  teachers: Teacher[];
  classes: ClassItem[];
  subjects: Subject[];
  timetables: TimetableEntry[];
  absences: Absence[];
  substitutions: Substitution[];
  isAnonymous: boolean;
  onMarkAbsent: (teacherId: string, teacherName: string, date: string, reason: string, affectedPeriods: AffectedPeriod[]) => void;
  onRemoveAbsence: (absenceId: string) => void;
  onClearDateAbsences?: (date: string) => void;
  onDeleteSubstitution?: (subId: string) => void;
  onCleanDuplicates?: () => void;
  onAssignSubstitute: (sub: Substitution) => void;
  onUnassignSubstitute: (subId: string) => void;
  onAutoAssignAll: () => void;
  onOpenPrintModal: (date?: string) => void;
}

export const DailySubstituteDesk: React.FC<DailySubstituteDeskProps> = ({
  teachers,
  classes,
  subjects,
  timetables,
  absences,
  substitutions,
  isAnonymous,
  onMarkAbsent,
  onRemoveAbsence,
  onClearDateAbsences,
  onDeleteSubstitution,
  onCleanDuplicates,
  onAssignSubstitute,
  onUnassignSubstitute,
  onAutoAssignAll,
  onOpenPrintModal
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-17');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [reason, setReason] = useState<string>('Sick leave');
  const [customReason, setCustomReason] = useState<string>('');
  const [activeDutySlip, setActiveDutySlip] = useState<Substitution | null>(null);

  const dayOfWeek = getDayOfWeekFromDate(selectedDate);

  // Validate against current teacher directory: exclude mock/deleted teachers
  const validTeacherIdSet = new Set(teachers.map((t) => t.id));
  const todaysAbsences = absences.filter((a) => a.date === selectedDate && validTeacherIdSet.has(a.teacherId));
  const absentTeacherIds = new Set(todaysAbsences.map((a) => a.teacherId));

  // A substitution ONLY exists if the teacher is actively marked absent for today
  const todaysSubs = substitutions.filter(
    (s) => s.date === selectedDate && validTeacherIdSet.has(s.originalTeacherId) && absentTeacherIds.has(s.originalTeacherId)
  );

  const pendingSubs = todaysSubs.filter((s) => s.status === 'Pending');
  const assignedSubs = todaysSubs.filter((s) => s.status === 'Assigned');

  // Teachers not marked absent for today (eligible to cover)
  const availableTeachers = teachers.filter((t) => !absentTeacherIds.has(t.id));

  const handleAddAbsence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId) return;

    const teacher = teachers.find((t) => t.id === selectedTeacherId);
    if (!teacher) return;

    const affected = findAffectedPeriods(teacher.id, dayOfWeek, timetables, subjects);
    const finalReason = reason === 'Other' ? (customReason.trim() || 'Excused Leave') : reason;

    onMarkAbsent(
      teacher.id,
      isAnonymous ? (teacher.anonymousCode || teacher.id) : teacher.name,
      selectedDate,
      finalReason,
      affected
    );

    setSelectedTeacherId('');
    setCustomReason('');
  };

  const getPeriodTime = (p: number): string => {
    const times: Record<number, string> = {
      1: '08:00 - 08:50',
      2: '08:50 - 09:40',
      3: '09:55 - 10:45',
      4: '10:45 - 11:35',
      5: '12:15 - 01:05',
      6: '01:05 - 01:55',
      7: '02:05 - 02:55',
      8: '02:55 - 03:45'
    };
    return times[p] || `Period ${p}`;
  };

  return (
    <div className="daily-desk-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Banner: Date Selector & Quick Summary Stats */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          color: '#ffffff',
          marginBottom: '24px',
          boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.25)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              ⚡ Daily Substitute Center
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              Substitutions & Cover Roster
            </h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
              Mark absent teachers, generate automatic rest-safe covers in 1 click, and print official teacher rosters.
            </p>
          </div>

          {/* Date Picker & Print Trigger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ background: '#ffffff', padding: '6px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontWeight: 700,
                  color: '#1e293b',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              />
              <span style={{ fontSize: '12px', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                {dayOfWeek}
              </span>
            </div>

            <button
              onClick={() => onOpenPrintModal(selectedDate)}
              style={{
                backgroundColor: '#ffffff',
                color: '#1e3a8a',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              🖨️ Print Substituted List
            </button>
          </div>
        </div>

        {/* 4 Quick Stat Counters */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          <div style={{ background: 'rgba(255,255,255,0.12)', padding: '12px 16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '12px', opacity: 0.8, fontWeight: 600 }}>Absent Faculty</div>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>{todaysAbsences.length} <span style={{ fontSize: '13px', fontWeight: 400, opacity: 0.8 }}>/ {teachers.length} total</span></div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.12)', padding: '12px 16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '12px', opacity: 0.8, fontWeight: 600 }}>Periods Needing Cover</div>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>{todaysSubs.length}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.12)', padding: '12px 16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '12px', opacity: 0.8, fontWeight: 600 }}>Assigned Covers</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: assignedSubs.length === todaysSubs.length && todaysSubs.length > 0 ? '#4ade80' : '#ffffff' }}>
              {assignedSubs.length} <span style={{ fontSize: '13px', fontWeight: 400, opacity: 0.8 }}>({pendingSubs.length} pending)</span>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.12)', padding: '12px 16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '12px', opacity: 0.8, fontWeight: 600 }}>Rest Protection</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#86efac' }}>🛡️ 100% Safe</div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: 1. Mark Absent Faculty */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#fee2e2', color: '#dc2626', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>1</span>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Mark Absent Teacher</h2>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{dayOfWeek}</span>
          </div>

          <form onSubmit={handleAddAbsence}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Select Teacher:
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1e293b',
                  backgroundColor: '#f8fafc'
                }}
                required
              >
                <option value="">-- Choose Absent Teacher --</option>
                {availableTeachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {isAnonymous ? (t.anonymousCode || t.id) : `${t.name} (${t.department} - ${t.primarySubject})`}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Reason:
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1e293b',
                  backgroundColor: '#f8fafc'
                }}
              >
                <option value="Sick leave">🤒 Sick leave</option>
                <option value="Casual leave">🏖️ Casual / Personal leave</option>
                <option value="Official duty">🏛️ Official school duty / Training</option>
                <option value="Emergency">🚨 Family emergency</option>
                <option value="Other">✏️ Other</option>
              </select>

              {reason === 'Other' && (
                <input
                  type="text"
                  placeholder="Specify reason..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px'
                  }}
                />
              )}
            </div>

            <button
              type="submit"
              disabled={!selectedTeacherId}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: selectedTeacherId ? '#dc2626' : '#94a3b8',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '14px',
                cursor: selectedTeacherId ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'background 0.2s'
              }}
            >
              <span>+ Record Absence for {dayOfWeek}</span>
            </button>
          </form>

          {/* Currently Absent Teachers List */}
          <div style={{ marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Absent Today ({todaysAbsences.length})
              </div>
              {todaysAbsences.length > 0 && onClearDateAbsences && (
                <button
                  type="button"
                  onClick={() => onClearDateAbsences(selectedDate)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc2626',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Clear All Today
                </button>
              )}
            </div>

            {todaysAbsences.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', color: '#64748b', fontSize: '13px' }}>
                🎉 No teachers reported absent for this date.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {todaysAbsences.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      background: '#fff1f2',
                      border: '1px solid #fecdd3',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#991b1b' }}>
                        {a.teacherName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#b91c1c' }}>
                        {a.reason} &bull; <strong>{a.affectedPeriodsCount} periods affected</strong>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveAbsence(a.id)}
                      title="Remove absence and restore regular schedule"
                      style={{
                        background: '#fee2e2',
                        border: 'none',
                        color: '#b91c1c',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '12px'
                      }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: 2. Substituted Teachers & Live Cover Table */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#dbeafe', color: '#1d4ed8', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>2</span>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Substituted Classes & Teachers</h2>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {todaysSubs.length} total periods &bull; {assignedSubs.length} covered &bull; {pendingSubs.length} need cover
                </div>
              </div>
            </div>

            {/* Quick Action: 1-Click Auto Assign & Clean */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {onCleanDuplicates && (
                <button
                  onClick={onCleanDuplicates}
                  title="Purge duplicate cover entries"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🧹 Clean Duplicates
                </button>
              )}

              {pendingSubs.length > 0 && (
                <button
                  onClick={onAutoAssignAll}
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)'
                  }}
                >
                  🚀 Auto-Assign ({pendingSubs.length} pending)
                </button>
              )}

              <button
                onClick={() => onOpenPrintModal(selectedDate)}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                🖨️ Print Roster
              </button>
            </div>
          </div>

          {/* If No Absences or Substitutions */}
          {todaysSubs.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px' }}>
              <div style={{ fontSize: '42px', marginBottom: '12px' }}>🏫</div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: '0 0 6px 0' }}>
                All Classes Running on Normal Timetable
              </h3>
              <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '420px', margin: '0 auto 16px auto' }}>
                No teacher absences reported for {dayOfWeek}, {selectedDate}. To generate substitutions, use the "Mark Absent Teacher" panel on the left.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '10px 12px', fontWeight: 700 }}>Period & Time</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700 }}>Class & Room</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700 }}>Subject</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700 }}>Absent Teacher</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700 }}>Substituted Teacher (Cover)</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700 }}>Status</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {todaysSubs
                    .sort((a, b) => a.period - b.period)
                    .map((sub) => {
                      const isAssigned = sub.status === 'Assigned';
                      return (
                        <tr
                          key={sub.id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            backgroundColor: isAssigned ? '#ffffff' : '#fffbeb'
                          }}
                        >
                          {/* Period */}
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 800, fontSize: '13px', background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '4px' }}>
                                P{sub.period}
                              </span>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>
                                {getPeriodTime(sub.period)}
                              </span>
                            </div>
                          </td>

                          {/* Class & Room */}
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 700, color: '#1e293b' }}>Class {sub.classId}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>Room {sub.roomId}</div>
                          </td>

                          {/* Subject */}
                          <td style={{ padding: '12px' }}>
                            <span style={{ fontWeight: 600, color: '#0f172a', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
                              {sub.subjectName || sub.subjectId}
                            </span>
                          </td>

                          {/* Absent Teacher */}
                          <td style={{ padding: '12px', color: '#dc2626', fontWeight: 600 }}>
                            {sub.originalTeacherName}
                          </td>

                          {/* Substituted Teacher */}
                          <td style={{ padding: '12px' }}>
                            {isAssigned ? (
                              <div>
                                <div style={{ fontWeight: 800, color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span>👤 {sub.assignedSubstituteName}</span>
                                </div>
                                {sub.assignedReason && (
                                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                    {sub.assignedReason}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: '#d97706', fontWeight: 700, fontStyle: 'italic', fontSize: '12px' }}>
                                ⚠️ Needs Substitute
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td style={{ padding: '12px' }}>
                            {isAssigned ? (
                              <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                ✓ Assigned
                              </span>
                            ) : (
                              <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                                Pending
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                onClick={() => onAssignSubstitute(sub)}
                                style={{
                                  background: isAssigned ? '#eff6ff' : '#2563eb',
                                  color: isAssigned ? '#2563eb' : '#ffffff',
                                  border: isAssigned ? '1px solid #bfdbfe' : 'none',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                {isAssigned ? 'Change' : 'Assign'}
                              </button>

                              {isAssigned ? (
                                <>
                                  <button
                                    onClick={() => setActiveDutySlip(sub)}
                                    title="Print Teacher Duty Slip"
                                    style={{
                                      background: '#f8fafc',
                                      border: '1px solid #cbd5e1',
                                      color: '#475569',
                                      padding: '5px 8px',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    📄 Slip
                                  </button>
                                  <button
                                    onClick={() => onUnassignSubstitute(sub.id)}
                                    title="Unassign Cover (Set back to Pending)"
                                    style={{
                                      background: '#fee2e2',
                                      border: 'none',
                                      color: '#b91c1c',
                                      padding: '5px 8px',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    ✕
                                  </button>
                                </>
                              ) : (
                                onDeleteSubstitution && (
                                  <button
                                    onClick={() => onDeleteSubstitution(sub.id)}
                                    title="Remove this substitution requirement"
                                    style={{
                                      background: '#f1f5f9',
                                      border: '1px solid #e2e8f0',
                                      color: '#94a3b8',
                                      padding: '5px 8px',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    🗑️
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Duty Slip Modal */}
      {activeDutySlip && (
        <DutySlipModal
          substitution={activeDutySlip}
          onClose={() => setActiveDutySlip(null)}
        />
      )}
    </div>
  );
};
