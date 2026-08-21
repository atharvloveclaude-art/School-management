import React, { useState } from 'react';
import { Substitution, Teacher, Subject, TimetableEntry, Absence } from '../types';
import { getRecommendedSubstitutes, getTeacherWorkloadInfo, PERIOD_TIMINGS } from '../services/substitutionService';

interface AssignSubstituteModalProps {
  substitution: Substitution;
  teachers: Teacher[];
  subjects: Subject[];
  timetables: TimetableEntry[];
  absences: Absence[];
  substitutions: Substitution[];
  isAnonymous?: boolean;
  onAssign: (substitutionId: string, teacherId: string, teacherName: string, reason: string) => void;
  onClose: () => void;
}

export const AssignSubstituteModal: React.FC<AssignSubstituteModalProps> = ({
  substitution,
  teachers,
  subjects,
  timetables,
  absences,
  substitutions,
  isAnonymous = false,
  onAssign,
  onClose
}) => {
  const [selectedCustomTeacherId, setSelectedCustomTeacherId] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('Manual administrator assignment');
  const [showCustomPicker, setShowCustomPicker] = useState<boolean>(false);
  const [manualConflictError, setManualConflictError] = useState<string | null>(null);

  const recommendations = getRecommendedSubstitutes(
    {
      date: substitution.date,
      day: substitution.day,
      period: Number(substitution.period),
      subjectId: substitution.subjectId,
      originalTeacherId: substitution.originalTeacherId
    },
    teachers,
    subjects,
    timetables,
    absences,
    substitutions
  );

  const availableRecs = recommendations.filter((r) => r.isAvailable);
  const timing = PERIOD_TIMINGS[Number(substitution.period)] || '';

  // Calculate busy state for each teacher for manual picker
  const absentTeacherIds = new Set(
    absences.filter((a) => a.date === substitution.date).map((a) => a.teacherId)
  );

  const regularBusyMap = new Map<string, string>();
  timetables
    .filter((t) => t.day === substitution.day && Number(t.period) === Number(substitution.period))
    .forEach((t) => {
      regularBusyMap.set(t.teacherId, t.classId);
    });

  const subBusyMap = new Map<string, string>();
  substitutions
    .filter(
      (s) =>
        s.date === substitution.date &&
        Number(s.period) === Number(substitution.period) &&
        s.status === 'Assigned' &&
        s.id !== substitution.id &&
        s.assignedSubstituteId
    )
    .forEach((s) => {
      subBusyMap.set(s.assignedSubstituteId!, s.classId);
    });

  const getTeacherConflict = (tId: string): string | null => {
    const t = teachers.find((x) => x.id === tId);
    const name = t ? (isAnonymous ? (t.anonymousCode || t.id) : t.name) : tId;

    if (absentTeacherIds.has(tId)) {
      return `${name} is absent today and cannot be assigned.`;
    }
    if (regularBusyMap.has(tId)) {
      const cls = regularBusyMap.get(tId);
      return `Double-booking prevented: ${name} is already scheduled to teach Class ${cls} during Period ${substitution.period}.`;
    }
    if (subBusyMap.has(tId)) {
      const cls = subBusyMap.get(tId);
      return `Double-booking prevented: ${name} is already assigned as substitute for Class ${cls} during Period ${substitution.period}.`;
    }
    return null;
  };

  const handleManualAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomTeacherId) return;

    const conflict = getTeacherConflict(selectedCustomTeacherId);
    if (conflict) {
      setManualConflictError(conflict);
      return;
    }

    const teacher = teachers.find((t) => t.id === selectedCustomTeacherId);
    if (!teacher) return;

    setManualConflictError(null);
    onAssign(
      substitution.id,
      teacher.id,
      isAnonymous ? (teacher.anonymousCode || teacher.id) : teacher.name,
      customReason || 'Manual administrator assignment'
    );
  };

  const getTeacherDisplayName = (t: Teacher) => {
    if (isAnonymous) {
      return t.anonymousCode || `[Staff ${t.id}]`;
    }
    return `${t.name} (${t.department})`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>👤</span>
            <div>
              <h3 style={{ margin: 0 }}>Assign Substitute Teacher</h3>
              <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                Conflict-Free & Rest-Protected Allocation &bull; 8 Periods Schedule
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body" style={{ padding: '20px' }}>
          {/* Requirement Info Box */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '14px 18px',
              marginBottom: '18px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              fontSize: '13px'
            }}
          >
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Class</span>
              <strong style={{ fontSize: '15px', color: '#1e293b' }}>
                Class {substitution.classId}
              </strong>
              {substitution.batch && (
                <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700, marginTop: '2px' }}>
                  🏷️ {substitution.batch}
                </div>
              )}
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Period & Time</span>
              <strong style={{ fontSize: '15px', color: '#1e293b' }}>
                Period {substitution.period} ({timing})
              </strong>
              {substitution.frequency && substitution.frequency !== 'all' && (
                <div style={{ fontSize: '11px', color: '#701a75', fontWeight: 600, marginTop: '2px' }}>
                  📅 Fortnightly / Active Week
                </div>
              )}
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Subject</span>
              <strong style={{ fontSize: '15px', color: '#1e293b' }}>{substitution.subjectName}</strong>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Absent Teacher</span>
              <span style={{ color: '#dc2626', fontWeight: 600 }}>
                {isAnonymous ? `[Staff ${substitution.originalTeacherId}]` : substitution.originalTeacherName}
              </span>
            </div>
          </div>

          {/* Teacher Rest Policy Notice */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#1e40af',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>🛡️</span>
            <div>
              <strong>Double-Booking Prevention & Rest Protection:</strong> Teachers who are already teaching during Period {substitution.period} cannot be double-booked. Rest protection ensures teachers don't receive 4 consecutive periods.
            </div>
          </div>

          <h4 style={{ fontSize: '14px', color: '#1e293b', marginBottom: '10px', fontWeight: 700 }}>
            Recommended Cover Teachers (Free & Rest-Protected)
          </h4>

          {availableRecs.length === 0 ? (
            <div className="alert alert-warning" style={{ fontSize: '13px' }}>
              No available teachers match all criteria with rest preservation. You may select a teacher manually below.
            </div>
          ) : (
            <div className="table-responsive" style={{ maxHeight: '280px', overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Teacher</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Match</th>
                    <th>Reason & Rest Status</th>
                    <th style={{ width: '110px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {availableRecs.slice(0, 5).map((rec, index) => {
                    const workload = getTeacherWorkloadInfo(
                      rec.teacher.id,
                      substitution.day,
                      substitution.date,
                      timetables,
                      substitutions,
                      Number(substitution.period)
                    );

                    return (
                      <tr
                        key={rec.teacher.id}
                        style={{
                          backgroundColor: index === 0 ? '#f0fdf4' : '#ffffff'
                        }}
                      >
                        <td>
                          <strong style={{ color: '#0f172a' }}>{getTeacherDisplayName(rec.teacher)}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            Primary: {rec.teacher.primarySubject || rec.teacher.department}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              backgroundColor: rec.score >= 80 ? '#dcfce7' : '#e0f2fe',
                              color: rec.score >= 80 ? '#15803d' : '#0369a1',
                              fontWeight: 700,
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          >
                            {rec.score}%
                          </span>
                        </td>
                        <td style={{ fontSize: '12px' }}>
                          <div>{rec.reason}</div>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '3px' }}>
                            <span
                              style={{
                                fontSize: '10.5px',
                                padding: '1px 5px',
                                backgroundColor: '#f1f5f9',
                                color: '#475569',
                                borderRadius: '3px'
                              }}
                            >
                              Daily Load: {workload.totalPeriodsToday}/8
                            </span>
                            {workload.maxConsecutive <= 2 && (
                              <span
                                style={{
                                  fontSize: '10.5px',
                                  padding: '1px 5px',
                                  backgroundColor: '#dcfce7',
                                  color: '#166534',
                                  borderRadius: '3px'
                                }}
                              >
                                ✓ Rest Guaranteed
                              </span>
                            )}
                            {workload.maxConsecutive === 3 && (
                              <span
                                style={{
                                  fontSize: '10.5px',
                                  padding: '1px 5px',
                                  backgroundColor: '#fef3c7',
                                  color: '#92400e',
                                  borderRadius: '3px'
                                }}
                              >
                                ⚠️ 3 Consecutive (Next will rest)
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() =>
                              onAssign(
                                substitution.id,
                                rec.teacher.id,
                                isAnonymous ? (rec.teacher.anonymousCode || rec.teacher.id) : rec.teacher.name,
                                rec.reason
                              )
                            }
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                          >
                            Assign
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!showCustomPicker ? (
            <div style={{ marginTop: '14px' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setShowCustomPicker(true);
                  setManualConflictError(null);
                }}
              >
                + Choose Any Other Teacher Manually
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleManualAssign}
              style={{
                marginTop: '14px',
                padding: '16px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px'
              }}
            >
              <h5 style={{ fontSize: '13px', marginBottom: '8px', fontWeight: 700, color: '#1e293b' }}>
                Manual Teacher Selection
              </h5>

              {/* Conflict Error Alert */}
              {manualConflictError && (
                <div
                  style={{
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fca5a5',
                    color: '#991b1b',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '12px'
                  }}
                >
                  ⛔ {manualConflictError}
                </div>
              )}

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 700 }}>Select Teacher:</label>
                <select
                  value={selectedCustomTeacherId}
                  onChange={(e) => {
                    setSelectedCustomTeacherId(e.target.value);
                    setManualConflictError(null);
                  }}
                  required
                  style={{ fontSize: '13px' }}
                >
                  <option value="">-- Select Teacher --</option>
                  {teachers
                    .filter((t) => t.id !== substitution.originalTeacherId)
                    .map((t) => {
                      const isAbsent = absentTeacherIds.has(t.id);
                      const regClass = regularBusyMap.get(t.id);
                      const subClass = subBusyMap.get(t.id);
                      const wl = getTeacherWorkloadInfo(
                        t.id,
                        substitution.day,
                        substitution.date,
                        timetables,
                        substitutions,
                        Number(substitution.period)
                      );

                      let statusBadge = '';
                      if (isAbsent) statusBadge = '⛔ [Absent Today]';
                      else if (regClass) statusBadge = `⛔ [Teaching Class ${regClass}]`;
                      else if (subClass) statusBadge = `⛔ [Covering Class ${subClass}]`;
                      else if (wl.wouldCause4Consecutive) statusBadge = '⚠️ [Rest Block: 4 in a row]';
                      else statusBadge = '✓ [Available]';

                      return (
                        <option
                          key={t.id}
                          value={t.id}
                          style={{
                            color: isAbsent || regClass || subClass ? '#991b1b' : '#0f172a'
                          }}
                        >
                          {statusBadge} {getTeacherDisplayName(t)} ({wl.totalPeriodsToday}/8 periods)
                        </option>
                      );
                    })}
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 700 }}>Assignment Reason / Note:</label>
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="e.g. Special arrangement"
                  style={{ fontSize: '13px' }}
                />
              </div>
              <div className="btn-group" style={{ marginTop: '10px' }}>
                <button type="submit" className="btn btn-success btn-sm" disabled={!selectedCustomTeacherId}>
                  Confirm Manual Assignment
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setShowCustomPicker(false);
                    setManualConflictError(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
