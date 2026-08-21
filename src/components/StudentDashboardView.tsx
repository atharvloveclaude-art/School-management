import React, { useState } from 'react';
import {
  TimetableEntry,
  Teacher,
  ClassItem,
  Subject,
  Substitution,
  Absence,
  DayOfWeek
} from '../types';
import { isScheduleActiveOnDate } from '../services/substitutionService';

interface StudentDashboardViewProps {
  timetables: TimetableEntry[];
  classes: ClassItem[];
  teachers: Teacher[];
  subjects: Subject[];
  substitutions: Substitution[];
  absences: Absence[];
  isAnonymous?: boolean;
}

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const TODAY_DAY: DayOfWeek = 'Monday';
const TODAY_DATE = '2026-08-17';

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  timetables,
  classes,
  teachers,
  subjects,
  substitutions,
  absences,
  isAnonymous = false
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(
    classes[0]?.id || '9-A'
  );

  const teacherMap = new Map(
    teachers.map((t) => [
      t.id,
      isAnonymous ? (t.anonymousCode || t.id) : t.name
    ])
  );
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

  // Filter timetable for this class and today, checking active schedule frequency for today
  const classSchedule = timetables.filter(
    (t) =>
      t.classId === selectedClassId &&
      t.day === TODAY_DAY &&
      isScheduleActiveOnDate(t.frequency, TODAY_DATE)
  );

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Student Timetable & Live Daily Schedule</h2>
          <p>
            Check your class schedule for {TODAY_DAY}, including parallel elective batches & live substitute cover updates.
          </p>
        </div>

        <div className="filter-group">
          <label htmlFor="student-class-select">Select Your Class:</label>
          <select
            id="student-class-select"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Class {c.id} (Grade {c.grade})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th style={{ width: '90px' }}>Period</th>
              <th>Subject & Batch</th>
              <th>Teacher / Substitute</th>
              <th>Room</th>
              <th style={{ width: '140px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period) => {
              const entries = classSchedule.filter((t) => Number(t.period) === Number(period));

              if (entries.length === 0) {
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

              return entries.map((entry, idx) => {
                const subjectName = subjectMap.get(entry.subjectId) || entry.subjectId;
                const originalTeacherName = teacherMap.get(entry.teacherId) || entry.teacherId;

                // Check if teacher is absent today
                const isTeacherAbsent = absences.some(
                  (a) => a.teacherId === entry.teacherId && a.date === TODAY_DATE
                );

                // Check if a substitute has been assigned for this specific class, period, and teacher
                const substitution = substitutions.find(
                  (s) =>
                    s.date === TODAY_DATE &&
                    s.classId === selectedClassId &&
                    Number(s.period) === Number(period) &&
                    s.originalTeacherId === entry.teacherId
                );

                return (
                  <tr
                    key={`${period}-${entry.id || idx}`}
                    className={isTeacherAbsent ? 'timetable-cell has-substitution' : ''}
                    style={{
                      backgroundColor: entries.length > 1 ? '#f0fdfa' : undefined
                    }}
                  >
                    <td>
                      <strong>Period {period}</strong>
                      {entries.length > 1 && (
                        <div style={{ fontSize: '10px', color: '#0f766e', fontWeight: 700 }}>
                          Split Elective
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{subjectName}</strong>
                      {entry.batch && (
                        <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700, marginTop: '2px' }}>
                          🏷️ {entry.batch}
                        </div>
                      )}
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
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
