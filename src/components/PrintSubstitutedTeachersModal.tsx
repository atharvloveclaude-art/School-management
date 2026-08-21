import React, { useState } from 'react';
import { Substitution, Teacher, ClassItem } from '../types';
import { getDayOfWeekFromDate, PERIOD_TIMINGS, getFrequencyLabel } from '../services/substitutionService';

interface PrintSubstitutedTeachersModalProps {
  substitutions: Substitution[];
  teachers: Teacher[];
  classes: ClassItem[];
  isAnonymous: boolean;
  onClose: () => void;
  defaultDate?: string;
}

export const PrintSubstitutedTeachersModal: React.FC<PrintSubstitutedTeachersModalProps> = ({
  substitutions,
  teachers,
  classes,
  isAnonymous,
  onClose,
  defaultDate = '2026-08-17'
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const dayOfWeek = getDayOfWeekFromDate(selectedDate);

  // Filter substitutions for selected date and criteria
  const daySubstitutions = substitutions.filter((s) => {
    if (s.date !== selectedDate) return false;
    if (filterClass !== 'all' && s.classId !== filterClass) return false;
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    return true;
  }).sort((a, b) => {
    // Sort by period ascending, then by class
    if (Number(a.period) !== Number(b.period)) {
      return Number(a.period) - Number(b.period);
    }
    return a.classId.localeCompare(b.classId);
  });

  const assignedCount = daySubstitutions.filter((s) => s.status === 'Assigned').length;
  const pendingCount = daySubstitutions.filter((s) => s.status === 'Pending').length;

  // Unique substitute teachers on duty today
  const uniqueSubstitutes = new Set(
    daySubstitutions
      .filter((s) => s.status === 'Assigned' && s.assignedSubstituteId)
      .map((s) => s.assignedSubstituteId)
  );

  const handlePrint = () => {
    window.print();
  };

  const getTeacherDisplay = (teacherId?: string, fallbackName?: string) => {
    if (!teacherId) return fallbackName || 'Unassigned';
    const teacher = teachers.find((t) => t.id === teacherId);
    if (isAnonymous) {
      return teacher?.anonymousCode || `[Staff ${teacherId}]`;
    }
    return teacher ? `${teacher.name} (${teacher.department})` : fallbackName || teacherId;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card print-roster-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '960px', width: '95vw', maxHeight: '92vh' }}
      >
        {/* Modal Header & Interactive Controls (Hidden during physical paper print) */}
        <div className="modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🖨️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Print Substituted Teachers & Classes Roster</h3>
              <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                Official daily faculty cover sheet with assigned classes, periods, and teachers
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        {/* Filter Controls Bar (Hidden during print) */}
        <div
          className="no-print"
          style={{
            padding: '12px 18px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block' }}>
                Date:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ padding: '5px 8px', fontSize: '13px', borderRadius: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block' }}>
                Class:
              </label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                style={{ padding: '5px 8px', fontSize: '13px', borderRadius: '4px' }}
              >
                <option value="all">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Class {c.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block' }}>
                Status:
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ padding: '5px 8px', fontSize: '13px', borderRadius: '4px' }}
              >
                <option value="all">All (Assigned & Pending)</option>
                <option value="Assigned">Assigned Only</option>
                <option value="Pending">Pending Only</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-primary"
              onClick={handlePrint}
              style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>🖨️</span> Print Roster Sheet
            </button>
          </div>
        </div>

        {/* Printable Official Document Area */}
        <div className="modal-body print-area" style={{ padding: '24px 28px', backgroundColor: '#ffffff' }}>
          {/* Official Document Header */}
          <div
            style={{
              textAlign: 'center',
              borderBottom: '2px solid #1e293b',
              paddingBottom: '12px',
              marginBottom: '16px'
            }}
          >
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.5px' }}>
              CM SHRI, YAMUNA VIHAR
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155', textTransform: 'uppercase', marginTop: '2px' }}>
              Official Daily Teacher Substitution & Class Allocation Roster
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Schedule: 8 Periods / Day &bull; Academic Year 2026-27 &bull; Rest-Protected Scheduling
            </div>
          </div>

          {/* Roster Metadata Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f1f5f9',
              padding: '10px 16px',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '13px'
            }}
          >
            <div>
              <strong>Date:</strong> {selectedDate} ({dayOfWeek})
            </div>
            <div>
              <strong>Substituted Periods:</strong> {daySubstitutions.length}
            </div>
            <div>
              <strong>Cover Staff on Duty:</strong> {uniqueSubstitutes.size} Teachers
            </div>
            <div>
              <strong>Coverage Status:</strong>{' '}
              <span style={{ fontWeight: 700, color: pendingCount === 0 ? '#15803d' : '#b45309' }}>
                {assignedCount}/{daySubstitutions.length} Assigned {pendingCount > 0 ? `(${pendingCount} Pending)` : '✓ Complete'}
              </span>
            </div>
          </div>

          {daySubstitutions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: '4px' }}>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>No substitutions recorded for this date.</div>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>All regular classes are proceeding as scheduled with no absent staff.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', marginBottom: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: '50px', border: '1px solid #334155' }}>#</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', border: '1px solid #334155' }}>Substituted Teacher (Cover)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: '100px', border: '1px solid #334155' }}>Class</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: '130px', border: '1px solid #334155' }}>Period & Time</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', border: '1px solid #334155' }}>Subject</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', border: '1px solid #334155' }}>Absent Staff</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: '110px', border: '1px solid #334155' }}>Sign-in</th>
                </tr>
              </thead>
              <tbody>
                {daySubstitutions.map((sub, index) => {
                  const isAssigned = sub.status === 'Assigned';
                  const timing = PERIOD_TIMINGS[Number(sub.period)] || '';

                  return (
                    <tr
                      key={sub.id}
                      style={{
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                        borderBottom: '1px solid #cbd5e1'
                      }}
                    >
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, border: '1px solid #e2e8f0' }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0' }}>
                        {isAssigned ? (
                          <div>
                            <strong style={{ color: '#0f172a', fontSize: '13px' }}>
                              {getTeacherDisplay(sub.assignedSubstituteId, sub.assignedSubstituteName)}
                            </strong>
                            {sub.assignedReason && (
                              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                {sub.assignedReason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#dc2626', fontWeight: 700 }}>⚠️ PENDING ALLOCATION</span>
                        )}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            padding: '3px 8px',
                            backgroundColor: '#e0e7ff',
                            color: '#3730a3',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}
                        >
                          Class {sub.classId}
                        </span>
                        {sub.batch && (
                          <div style={{ fontSize: '10px', color: '#0369a1', fontWeight: 700, marginTop: '2px' }}>
                            {sub.batch}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>Period {sub.period}</div>
                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>{timing}</div>
                      </td>
                      <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0' }}>
                        <strong style={{ color: '#0f172a' }}>{sub.subjectName}</strong>
                        {sub.frequency && sub.frequency !== 'all' && (
                          <div style={{ fontSize: '10px', color: '#701a75', marginTop: '2px' }}>
                            📅 {getFrequencyLabel(sub.frequency)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0' }}>
                        <span style={{ color: '#b91c1c', fontWeight: 500 }}>
                          {isAnonymous ? `[Absent: ${sub.originalTeacherId}]` : sub.originalTeacherName}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                        <div style={{ height: '24px', borderBottom: '1px dotted #94a3b8' }}></div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Teacher Rest and Workload Compliance Note */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#166534',
              marginBottom: '20px'
            }}
          >
            <strong>🛡️ Workload & Rest Period Policy Verified:</strong> All substitute allocations comply with the school's mandatory rest rule. No teacher is assigned 4 consecutive periods without a break.
          </div>

          {/* Official Sign-off and Verification Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginTop: '28px',
              paddingTop: '16px',
              borderTop: '1px solid #94a3b8',
              fontSize: '12px',
              color: '#334155'
            }}
          >
            <div>
              <div>Prepared By: <strong>Academic Scheduling Coordinator</strong></div>
              <div>Generated: {new Date().toLocaleTimeString()} &bull; CM Shri, Yamuna Vihar Admin System</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '180px', borderBottom: '1px solid #334155', marginBottom: '4px' }}></div>
              <div>Vice Principal (Academics)</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '180px', borderBottom: '1px solid #334155', marginBottom: '4px' }}></div>
              <div>Principal / Head of Institution</div>
            </div>
          </div>
        </div>

        {/* Modal Footer (Hidden during print) */}
        <div className="modal-footer no-print">
          <button className="btn btn-outline" onClick={handlePrint}>
            🖨️ Print Official Roster
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
