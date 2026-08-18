import React from 'react';
import { Teacher, ClassItem, Absence, Substitution } from '../types';
import { PERIOD_TIMINGS } from '../services/substitutionService';

interface DashboardViewProps {
  teachers: Teacher[];
  classes: ClassItem[];
  absences: Absence[];
  substitutions: Substitution[];
  isAnonymous?: boolean;
  onOpenAssignModal: (sub: Substitution) => void;
  onOpenDailyDispatcher?: () => void;
  onOpenPrintModal?: () => void;
  onAutoAssignAll?: () => void;
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  teachers,
  classes,
  absences,
  substitutions,
  isAnonymous = false,
  onOpenAssignModal,
  onOpenDailyDispatcher,
  onOpenPrintModal,
  onAutoAssignAll,
  onNavigate
}) => {
  const today = '2026-08-17';
  const todayAbsences = absences.filter((a) => a.date === today);
  const pendingSubstitutions = substitutions.filter(
    (s) => s.date === today && s.status === 'Pending'
  );
  const assignedSubstitutions = substitutions.filter(
    (s) => s.date === today && s.status === 'Assigned'
  );

  return (
    <div>
      {/* Clean Quick Actions Hero Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '16px 20px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', color: '#1e293b', fontWeight: 700 }}>
            Daily Timetable & Intelligent Substitute Management
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            8 Periods / Day &bull; 6 Working Days &bull; Rest-protected automatic assignment (No 4 periods in a row)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {onOpenDailyDispatcher && (
            <button
              className="btn btn-primary"
              onClick={onOpenDailyDispatcher}
              style={{ fontWeight: 700 }}
            >
              ⚡ Fast Daily Dispatcher
            </button>
          )}

          {onOpenPrintModal && (
            <button
              className="btn btn-outline"
              onClick={onOpenPrintModal}
              title="Print list of substituted teachers with their classes"
            >
              🖨️ Print Substituted List
            </button>
          )}

          {pendingSubstitutions.length > 0 && onAutoAssignAll && (
            <button
              className="btn btn-success"
              onClick={onAutoAssignAll}
              title="Automatically match best free teachers"
            >
              🚀 Auto-Assign All ({pendingSubstitutions.length})
            </button>
          )}
        </div>
      </div>

      {/* Summary Statistics Bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-label">Total Faculty</div>
          <div className="stat-value">{teachers.length}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Total Classes</div>
          <div className="stat-value">{classes.length}</div>
        </div>
        <div className="stat-item" style={{ borderLeft: '4px solid #f97316' }}>
          <div className="stat-label" style={{ color: '#ea580c' }}>Today's Absences</div>
          <div className="stat-value" style={{ color: '#ea580c' }}>{todayAbsences.length}</div>
        </div>
        <div className="stat-item" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-label" style={{ color: '#d97706' }}>Pending Substitutions</div>
          <div className="stat-value" style={{ color: '#d97706' }}>{pendingSubstitutions.length}</div>
        </div>
        <div className="stat-item" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-label" style={{ color: '#15803d' }}>Assigned Covers</div>
          <div className="stat-value" style={{ color: '#15803d' }}>{assignedSubstitutions.length}</div>
        </div>
      </div>

      {/* Substituted Teachers & Assigned Covers Section */}
      {assignedSubstitutions.length > 0 && (
        <div className="page-section">
          <div className="section-header">
            <div>
              <h3>Assigned Substituted Teachers (Today)</h3>
              <p>Teachers covering classes today with rest-protected distribution</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {onOpenPrintModal && (
                <button className="btn btn-primary btn-sm" onClick={onOpenPrintModal}>
                  🖨️ Print Substituted Teachers List
                </button>
              )}
              <button className="btn btn-outline btn-sm" onClick={() => onNavigate('substitutions')}>
                Manage All
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '85px' }}>Period</th>
                  <th style={{ width: '90px' }}>Class</th>
                  <th>Subject</th>
                  <th>Substituted Teacher</th>
                  <th>Covering For</th>
                  <th>Room</th>
                </tr>
              </thead>
              <tbody>
                {assignedSubstitutions.map((sub) => {
                  const timing = PERIOD_TIMINGS[Number(sub.period)] || '';

                  return (
                    <tr key={sub.id}>
                      <td>
                        <strong>Period {sub.period}</strong>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>{timing}</div>
                      </td>
                      <td>
                        <strong style={{ color: '#3730a3' }}>Class {sub.classId}</strong>
                      </td>
                      <td>
                        <strong>{sub.subjectName}</strong>
                      </td>
                      <td>
                        <strong style={{ color: '#15803d', fontSize: '14px' }}>
                          {sub.assignedSubstituteName}
                        </strong>
                        {sub.assignedReason && (
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {sub.assignedReason}
                          </div>
                        )}
                      </td>
                      <td style={{ color: '#dc2626' }}>{sub.originalTeacherName}</td>
                      <td>Room {sub.roomId}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Substitutions Section */}
      <div className="page-section">
        <div className="section-header">
          <div>
            <h3>Pending Substitutions Needing Cover</h3>
            <p>Classes currently waiting for a substitute teacher</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {pendingSubstitutions.length > 0 && onAutoAssignAll && (
              <button
                className="btn btn-success btn-sm"
                onClick={onAutoAssignAll}
                title="Auto cover all pending with highest recommendation score"
              >
                Auto-Assign Best Matches
              </button>
            )}
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('substitutions')}>
              View All
            </button>
          </div>
        </div>

        {pendingSubstitutions.length === 0 ? (
          <div className="alert alert-success">
            ✓ All substitution requirements for today have been assigned and verified with rest protection!
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '85px' }}>Period</th>
                  <th style={{ width: '90px' }}>Class</th>
                  <th>Subject</th>
                  <th>Original Teacher</th>
                  <th>Room</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingSubstitutions.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <strong>Period {sub.period}</strong>
                    </td>
                    <td>
                      <strong style={{ color: '#3730a3' }}>Class {sub.classId}</strong>
                    </td>
                    <td>{sub.subjectName}</td>
                    <td style={{ color: '#dc2626' }}>{sub.originalTeacherName}</td>
                    <td>Room {sub.roomId}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => onOpenAssignModal(sub)}
                      >
                        Assign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Today's Absences Section */}
      <div className="page-section">
        <div className="section-header">
          <div>
            <h3>Staff Absences (Today)</h3>
            <p>Teachers logged on approved leave</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('absences')}>
              + Record Absence
            </button>
          </div>
        </div>

        {todayAbsences.length === 0 ? (
          <div className="alert alert-success">No staff absences recorded for today.</div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Department</th>
                  <th>Reason</th>
                  <th>Affected Periods</th>
                </tr>
              </thead>
              <tbody>
                {todayAbsences.map((abs) => {
                  const teacher = teachers.find((t) => t.id === abs.teacherId);
                  const displayName = isAnonymous
                    ? (teacher?.anonymousCode || abs.teacherId)
                    : abs.teacherName;

                  return (
                    <tr key={abs.id}>
                      <td>
                        <strong>{displayName}</strong>
                      </td>
                      <td>{teacher?.department || 'General'}</td>
                      <td>{abs.reason}</td>
                      <td>
                        <span className="badge badge-pending">
                          {abs.affectedPeriodsCount || 1} Period(s)
                        </span>
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
  );
};
