import React, { useState } from 'react';
import { Subject } from '../types';

interface SubjectsViewProps {
  subjects: Subject[];
  onSaveSubject: (subj: Subject) => void;
  onDeleteSubject: (id: string) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  subjects,
  onSaveSubject,
  onDeleteSubject
}) => {
  const [editingSubject, setEditingSubject] = useState<Partial<Subject> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenAdd = () => {
    setEditingSubject({
      id: '',
      name: '',
      department: 'Science'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Subject) => {
    setEditingSubject({ ...s });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !editingSubject.id || !editingSubject.name) return;
    onSaveSubject({
      id: editingSubject.id.toUpperCase(),
      name: editingSubject.name,
      department: editingSubject.department || 'General'
    });
    setIsModalOpen(false);
    setEditingSubject(null);
  };

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Subjects Management</h2>
          <p>Curriculum subjects, codes, and academic departments</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
          + Add Subject
        </button>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th style={{ width: '100px' }}>Code</th>
              <th>Subject</th>
              <th>Department</th>
              <th style={{ width: '130px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subj) => (
              <tr key={subj.id}>
                <td>
                  <strong>{subj.id}</strong>
                </td>
                <td>{subj.name}</td>
                <td>{subj.department}</td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ marginRight: '6px' }}
                    onClick={() => handleOpenEdit(subj)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      if (window.confirm(`Delete Subject ${subj.name} (${subj.id})?`)) {
                        onDeleteSubject(subj.id);
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

      {isModalOpen && editingSubject && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>{editingSubject.id ? 'Edit Subject' : 'Add Subject'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="subj-id">Subject Code (e.g. PHY, MAT, CHEM):</label>
                  <input
                    id="subj-id"
                    type="text"
                    required
                    value={editingSubject.id || ''}
                    onChange={(e) => setEditingSubject({ ...editingSubject, id: e.target.value })}
                    placeholder="e.g. PHY"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subj-name">Subject Name (e.g. Physics):</label>
                  <input
                    id="subj-name"
                    type="text"
                    required
                    value={editingSubject.name || ''}
                    onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                    placeholder="e.g. Physics"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subj-dept">Department:</label>
                  <input
                    id="subj-dept"
                    type="text"
                    required
                    value={editingSubject.department || ''}
                    onChange={(e) => setEditingSubject({ ...editingSubject, department: e.target.value })}
                    placeholder="e.g. Science, Mathematics, Languages"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
