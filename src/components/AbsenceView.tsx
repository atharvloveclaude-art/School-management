import React, { useState } from 'react';
import { Teacher, TimetableEntry, Subject, Absence, AffectedPeriod, DayOfWeek } from '../types';
import { findAffectedPeriods, getDayOfWeekFromDate } from '../services/substitutionService';

interface AbsenceViewProps {
  teachers: Teacher[];
  subjects: Subject[];
  timetables: TimetableEntry[];
  absences: Absence[];
  onMarkAbsent: (
    teacherId: string,
    teacherName: string,
    date: string,
    reason: string,
    affectedPeriods: AffectedPeriod[]
  ) => void;
  onRemoveAbsence: (id: string) => void;
}

export const AbsenceView: React.FC<AbsenceViewProps> = ({
  teachers,
  subjects,
  timetables,
  absences,
  onMarkAbsent,
  onRemoveAbsence
}) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || 'T001');
  const [absenceDate, setAbsenceDate] = useState<string>('2026-08-17');
  const [reason, setReason] = useState<string>('Sick leave');
  const [lastAffectedInfo, setLastAffectedInfo] = useState<{
    teacherName: string;
    day: DayOfWeek;
    periods: AffectedPeriod[];
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const teacher = teachers.find((t) => t.id === selectedTeacherId);
    if (!teacher) return;

    const dayOfWeek = getDayOfWeekFromDate(absenceDate);
    const affected = findAffectedPeriods(teacher.id, dayOfWeek, timetables, subjects);

    onMarkAbsent(teacher.id, teacher.name, absenceDate, reason, affected);

    setLastAffectedInfo({
      teacherName: teacher.name,
      day: dayOfWeek,
      periods: affected
    });
  };

  const handleInspectAbsence = (abs: Absence) => {
    const affected = findAffectedPeriods(abs.teacherId, abs.dayOfWeek, timetables, subjects);
    setLastAffectedInfo({
      teacherName: abs.teacherName,
      day: abs.dayOfWeek,
      periods: affected
    });
  };

  return (
    <div>
      {/* Teacher Absence Form */}
      <div className="page-section" style={{ maxWidth: '600px' }}>
        <div className="section-header">
          <div>
            <h2>Record Teacher Absence</h2>
            <p>Log faculty leave and calculate affected classes</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="abs-teacher">Teacher:</label>
            <select
              id="abs-teacher"
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              required
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.department})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="abs-date">Date (YYYY-MM-DD):</label>
            <input
              id="abs-date"
              type="date"
              required
              value={absenceDate}
              onChange={(e) => setAbsenceDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="abs-reason">Reason:</label>
            <input
              id="abs-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Sick leave, Medical appointment, Training"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
            Mark Absent
          </button>
        </form>
      </div>

      {/* Affected Periods Table (if recently logged or selected) */}
      {lastAffectedInfo && (
        <div className="page-section" style={{ borderLeft: '4px solid #b91c1c' }}>
          <div className="section-header">
            <div>
              <h3 style={{ color: '#b91c1c' }}>
                {lastAffectedInfo.teacherName} is absent on {lastAffectedInfo.day}.
              </h3>
              <p>The following scheduled periods require substitute teachers:</p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setLastAffectedInfo(null)}
            >
              Dismiss
            </button>
          </div>

          {lastAffectedInfo.periods.length === 0 ? (
            <div className="alert alert-info">
              No regular teaching periods are scheduled for {lastAffectedInfo.teacherName} on {lastAffectedInfo.day}.
            </div>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '90px' }}>Period</th>
                    <th style={{ width: '120px' }}>Class</th>
                    <th>Subject</th>
                    <th>Room</th>
                  </tr>
                </thead>
                <tbody>
                  {lastAffectedInfo.periods.map((p, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>Period {p.period}</strong>
                      </td>
                      <td>Class {p.classId}</td>
                      <td>{p.subjectName}</td>
                      <td>Room {p.roomId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Current Absences List */}
      <div className="page-section">
        <div className="section-header">
          <div>
            <h2>Current Absences</h2>
            <p>List of all logged staff absences</p>
          </div>
        </div>

        {absences.length === 0 ? (
          <div className="alert alert-success">No staff absences logged.</div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Reason</th>
                  <th style={{ textAlign: 'center' }}>Affected Classes</th>
                  <th style={{ width: '160px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {absences.map((abs) => (
                  <tr key={abs.id}>
                    <td>
                      <strong>{abs.teacherName}</strong>
                    </td>
                    <td>{abs.date}</td>
                    <td>{abs.dayOfWeek}</td>
                    <td>{abs.reason}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-pending">
                        {abs.affectedPeriodsCount || 0} Periods
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ marginRight: '6px' }}
                        onClick={() => handleInspectAbsence(abs)}
                      >
                        View Periods
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          if (window.confirm(`Delete absence record for ${abs.teacherName}?`)) {
                            onRemoveAbsence(abs.id);
                          }
                        }}
                      >
                        Delete
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
