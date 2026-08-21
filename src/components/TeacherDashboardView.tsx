import React from 'react';
import { Teacher, TimetableEntry, Subject, Absence, Substitution, DayOfWeek } from '../types';

interface TeacherDashboardViewProps {
  teacher: Teacher;
  timetables: TimetableEntry[];
  subjects: Subject[];
  absences: Absence[];
  substitutions: Substitution[];
  isAnonymous?: boolean;
  onMarkSelfAbsent: () => void;
}

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const TODAY_DAY: DayOfWeek = 'Monday';
const TODAY_DATE = '2026-08-17';

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  teacher,
  timetables,
  subjects,
  absences,
  substitutions,
  isAnonymous = false,
  onMarkSelfAbsent
}) => {
  const subjectMap = new Map(subjects.map(s => [s.id, s.name]));

  // Is teacher absent today?
  const isAbsentToday = absences.some(
    (a) => a.teacherId === teacher.id && a.date === TODAY_DATE
  );

  // Regular classes for today across the 8 periods
  const regularToday = timetables.filter(
    (t) => t.teacherId === teacher.id && t.day === TODAY_DAY
  );

  // Substitutions assigned to this teacher today
  const assignedSubsToday = substitutions.filter(
    (s) => s.assignedSubstituteId === teacher.id && s.date === TODAY_DATE
  );

  const displayName = isAnonymous ? (teacher.anonymousCode || teacher.id) : teacher.name;

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Welcome, {displayName}</h2>
          <p>
            Department: {teacher.department} | Employee ID: {teacher.id} | Schedule: Monday (8 Periods)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
            🖨️ Print My Daily Schedule
          </button>
          {!isAbsentToday ? (
            <button className="btn btn-danger btn-sm" onClick={onMarkSelfAbsent}>
              Report Absence for Today
            </button>
          ) : (
            <span className="badge badge-pending" style={{ padding: '6px 12px', fontSize: '13px' }}>
              Marked on Leave Today
            </span>
          )}
        </div>
      </div>

      {isAbsentToday && (
        <div className="alert alert-warning">
          <strong>Notice:</strong> You are currently marked on leave for today ({TODAY_DATE}). Your scheduled classes across the 8 periods have been queued for substitute cover.
        </div>
      )}

      {/* Today's Regular Timetable across all 8 periods */}
      <div className="page-section">
        <div className="section-header">
          <div>
            <h3>Today's Schedule ({TODAY_DAY} &bull; 8 Periods)</h3>
            <p>Your standard teaching and free periods for today</p>
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Period</th>
                <th>Subject</th>
                <th>Class</th>
                <th>Room</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((p) => {
                const entry = regularToday.find((t) => Number(t.period) === Number(p));
                const coverForPeriod = assignedSubsToday.find((s) => Number(s.period) === Number(p));

                if (!entry) {
                  if (coverForPeriod) {
                    return (
                      <tr key={p} style={{ backgroundColor: '#f0fdf4' }}>
                        <td>
                          <strong>Period {p}</strong>
                        </td>
                        <td>
                          <strong>{coverForPeriod.subjectName}</strong> (Cover Duty)
                        </td>
                        <td>Class {coverForPeriod.classId}</td>
                        <td>Room {coverForPeriod.roomId}</td>
                        <td>
                          <span className="badge badge-assigned">Assigned Cover</span>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={p}>
                      <td>
                        <strong>Period {p}</strong>
                      </td>
                      <td colSpan={3} className="free-period">
                        Free Period (Available for Cover)
                      </td>
                      <td>
                        <span style={{ color: '#81b29a', fontWeight: 600, fontSize: '13px' }}>Free</span>
                      </td>
                    </tr>
                  );
                }

                const subName = subjectMap.get(entry.subjectId) || entry.subjectId;
                return (
                  <tr key={p}>
                    <td>
                      <strong>Period {p}</strong>
                    </td>
                    <td>
                      <strong>{subName}</strong>
                      {entry.batch && (
                        <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: 600 }}>
                          🏷️ {entry.batch}
                        </div>
                      )}
                      {entry.frequency && entry.frequency !== 'all' && (
                        <div style={{ fontSize: '10.5px', color: '#701a75' }}>
                          📅 Specific Week Schedule
                        </div>
                      )}
                    </td>
                    <td>Class {entry.classId}</td>
                    <td>Room {entry.roomId}</td>
                    <td>
                      {isAbsentToday ? (
                        <span className="badge badge-pending">Cover Needed</span>
                      ) : (
                        <span className="badge badge-assigned">Regular Class</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Today's Substitutions Assigned */}
      <div className="page-section">
        <div className="section-header">
          <div>
            <h3>Today's Substitute Cover Duties Assigned to You</h3>
            <p>Cover duties distributed by the intelligent substitution engine</p>
          </div>
        </div>

        {assignedSubsToday.length === 0 ? (
          <div className="alert alert-info">
            You have no substitution duties assigned for today.
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Period</th>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Original Teacher</th>
                  <th>Room</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Duty Slip</th>
                </tr>
              </thead>
              <tbody>
                {assignedSubsToday.map((sub) => (
                  <tr key={sub.id} style={{ backgroundColor: '#f0fdf4' }}>
                    <td>
                      <strong>Period {sub.period}</strong>
                    </td>
                    <td>
                      <strong>Class {sub.classId}</strong>
                    </td>
                    <td>{sub.subjectName}</td>
                    <td>{sub.originalTeacherName}</td>
                    <td>Room {sub.roomId}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => window.print()}
                      >
                        Print Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
