import React from 'react';
import { Substitution } from '../types';

interface DutySlipModalProps {
  substitution: Substitution;
  onClose: () => void;
}

export const DutySlipModal: React.FC<DutySlipModalProps> = ({ substitution, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card print-duty-slip-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px' }}
      >
        <div className="modal-header">
          <h3>Official Substitution Duty Slip</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div
            style={{
              border: '2px dashed #3d405b',
              padding: '16px',
              backgroundColor: '#fafaf9',
              fontFamily: 'serif'
            }}
          >
            <div style={{ textAlign: 'center', borderBottom: '1px solid #3d405b', paddingBottom: '8px', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', color: '#3d405b', textTransform: 'uppercase' }}>
                Springfield High School
              </h2>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Academic Administration Office &bull; Teacher Cover Order
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', marginBottom: '12px' }}>
              <div><strong>Slip Ref:</strong> {substitution.id}</div>
              <div><strong>Date:</strong> {substitution.date} ({substitution.day})</div>
              <div><strong>Assigned To:</strong> {substitution.assignedSubstituteName || 'Pending'}</div>
              <div><strong>Period:</strong> Period {substitution.period} (of 8)</div>
              <div><strong>Class:</strong> Class {substitution.classId}</div>
              <div><strong>Room:</strong> Room {substitution.roomId}</div>
              <div><strong>Subject:</strong> {substitution.subjectName}</div>
              <div><strong>Absent Teacher:</strong> {substitution.originalTeacherName}</div>
            </div>

            <div style={{ fontSize: '12px', fontStyle: 'italic', borderTop: '1px dotted #ccc', paddingTop: '8px', color: '#555' }}>
              <strong>Instructions:</strong> Please proceed to Room {substitution.roomId} at the start of Period {substitution.period}. Ensure student attendance is marked and follow syllabus guidelines.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', fontSize: '12px' }}>
              <div>Authorized by: <strong>Academic Office</strong></div>
              <div>Staff Signature: __________________</div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={handlePrint}>
            🖨️ Print Duty Slip
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
