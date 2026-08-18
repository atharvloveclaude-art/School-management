import React, { useState } from 'react';
import { Substitution } from '../types';
import { PERIOD_TIMINGS } from '../services/substitutionService';

interface SubstitutionViewProps {
  substitutions: Substitution[];
  onOpenAssignModal: (sub: Substitution) => void;
  onAutoAssignAll?: () => void;
  onOpenPrintModal?: () => void;
  onUnassign: (substitutionId: string) => void;
}

export const SubstitutionView: React.FC<SubstitutionViewProps> = ({
  substitutions,
  onOpenAssignModal,
  onAutoAssignAll,
  onOpenPrintModal,
  onUnassign
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('2026-08-17');

  const filtered = substitutions.filter((s) => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (filterDate && s.date !== filterDate) return false;
    return true;
  }).sort((a, b) => Number(a.period) - Number(b.period));

  const pendingCount = filtered.filter((s) => s.status === 'Pending').length;
  const assignedCount = filtered.filter((s) => s.status === 'Assigned').length;

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Substituted Teachers & Class Allocation</h2>
          <p>Assigned cover teachers, classes, and periods with rest protection</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {onOpenPrintModal && (
            <button className="btn btn-primary" onClick={onOpenPrintModal}>
              🖨️ Print Substituted Teachers List
            </button>
          )}

          {pendingCount > 0 && onAutoAssignAll && (
            <button className="btn btn-success" onClick={onAutoAssignAll}>
              🚀 Auto-Assign All ({pendingCount})
            </button>
          )}
        </div>
      </div>

      {/* Clean Filter Controls */}
      <div className="filter-bar">
        <div className="filter-group">
          <label htmlFor="sub-filter-date">Date:</label>
          <input
            id="sub-filter-date"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="sub-filter-status">Status:</label>
          <select
            id="sub-filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All ({filtered.length})</option>
            <option value="Assigned">Assigned Cover ({assignedCount})</option>
            <option value="Pending">Pending Assignment ({pendingCount})</option>
          </select>
        </div>

        {(filterStatus !== 'all' || filterDate !== '2026-08-17') && (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              setFilterStatus('all');
              setFilterDate('2026-08-17');
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="alert alert-info">
          No substitution records found for the selected date and criteria.
        </div>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th style={{ width: '85px' }}>Period</th>
                <th style={{ width: '100px' }}>Class</th>
                <th>Subject</th>
                <th>Absent Teacher</th>
                <th>Room</th>
                <th>Assigned Substitute Teacher</th>
                <th style={{ width: '110px' }}>Status</th>
                <th style={{ width: '140px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => {
                const timing = PERIOD_TIMINGS[Number(sub.period)] || '';

                return (
                  <tr key={sub.id} style={{ backgroundColor: sub.status === 'Assigned' ? '#fcfdfd' : '#fffdfa' }}>
                    <td>
                      <strong>Period {sub.period}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{timing}</div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          padding: '2px 6px',
                          backgroundColor: '#e0e7ff',
                          color: '#3730a3',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                      >
                        Class {sub.classId}
                      </span>
                    </td>
                    <td>
                      <strong>{sub.subjectName}</strong>
                    </td>
                    <td style={{ color: '#dc2626', fontWeight: 500 }}>
                      {sub.originalTeacherName}
                    </td>
                    <td>Room {sub.roomId}</td>
                    <td>
                      {sub.assignedSubstituteName ? (
                        <div>
                          <strong style={{ color: '#15803d', fontSize: '14px' }}>
                            {sub.assignedSubstituteName}
                          </strong>
                          {sub.assignedReason && (
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              {sub.assignedReason}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#d97706', fontStyle: 'italic', fontWeight: 600 }}>
                          Pending Assignment
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          sub.status === 'Assigned' ? 'badge-assigned' : 'badge-pending'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {sub.status === 'Pending' ? (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => onOpenAssignModal(sub)}
                        >
                          Assign Cover
                        </button>
                      ) : (
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => onOpenAssignModal(sub)}
                          >
                            Reassign
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              if (window.confirm('Clear this substitute assignment?')) {
                                onUnassign(sub.id);
                              }
                            }}
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
