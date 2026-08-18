import React from 'react';
import { ClassItem, TimetableEntry, Subject, Teacher, Absence, Substitution, DayOfWeek } from '../types';

interface StudentDashboardViewProps {
  selectedClassId: string;
  classes: ClassItem[];
  timetables: TimetableEntry[];
  subjects: Subject[];
  teachers: Teacher[];
  absences: Absence[];
  substitutions: Substitution[];
  isAnonymous?: boolean;
}

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const TODAY_DAY: DayOfWeek = 'Monday';
const TODAY_DATE = '2026-08-17';

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  selectedClassId,
  timetables,
  subjects,
  teachers,
  absences,
  substitutions,
  isAnonymous = false
}) => {
  const teacherMap = new Map(
    teachers.map((t) => [
      t.id,
      isAnonymous ? (t.anonymousCode || t.id) : t.name
    ])
  );
  const subjectMap = new Map(subjects.map(s => [s.id, s.name]));

  // Entries for this class today
  const classSchedule = timetables.filter(
    (t) => t.classId === selectedClassId && t.day === TODAY_DAY
  );

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Class {selectedClassId} Daily Timetable (8 Periods)</h2>
          <p>Schedule and live cover status for Monday, 17/08/2026 (Periods 1 to 8)</p>
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => window.print()}
          title="Print Class Timetable"
        >
          🖨️ Print Daily Schedule
        </button>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th style={{ width: '90px' }}>Period</th>
              <th>Subject</th>
              <th>Teacher / Substitute</th>
              <th>Room</th>
              <th style={{ width: '140px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period) => {
              const entry = classSchedule.find((t) => Number(t.period) === Number(period));
              if (!entry) {
                return (
                  <tr key={period}>
                    <td>
                      <strong>Period {period}</strong>
                    </td>
                    <td colSpan={4} className="free-period">
                      Break / Self Study Period
                    </td>
                  </tr>
                );
              }

              const subjectName = subjectMap.get(entry.subjectId) || entry.subjectId;
              const originalTeacherName = teacherMap.get(entry.teacherId) || entry.teacherId;

              // Check if teacher is absent today
              const isTeacherAbsent = absences.some(
                (a) => a.teacherId === entry.teacherId && a.date === TODAY_DATE
              );

              // Check if a substitute has been assigned for this class and period
              const substitution = substitutions.find(
                (s) =>
                  s.date === TODAY_DATE &&
                  s.classId === selectedClassId &&
                  Number(s.period) === Number(period)
              );

              return (
                <tr
                  key={period}
                  className={isTeacherAbsent ? 'timetable-cell has-substitution' : ''}
                >
                  <td>
                    <strong>Period {period}</strong>
                  </td>
                  <td>
                    <strong>{subjectName}</strong>
                  </td>
                  <td>
                    {!isTeacherAbsent ? (
                      <span>{originalTeacherName}</span>
                    ) : substitution?.status === 'Assigned' ? (
                      <div>
                        <div>
                          <strong style={{ color: '#15803d' }}>
                            Substitute: {substitution.assignedSubstituteName}
                          </strong>
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          Original: {originalTeacherName} (On Leave)
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ color: '#e07a5f', fontWeight: 600 }}>
                          {originalTeacherName} (On Leave)
                        </div>
                        <div style={{ fontSize: '12px', color: '#c2410c' }}>
                          Substitute being assigned
                        </div>
                      </div>
                    )}
                  </td>
                  <td>Room {entry.roomId}</td>
                  <td>
                    {!isTeacherAbsent ? (
                      <span className="badge badge-assigned">Regular Class</span>
                    ) : substitution?.status === 'Assigned' ? (
                      <span className="badge badge-assigned">Covered</span>
                    ) : (
                      <span className="badge badge-pending">Cover Pending</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
