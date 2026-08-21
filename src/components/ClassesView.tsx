import React, { useState } from 'react';
import { ClassItem } from '../types';

interface ClassesViewProps {
  classes: ClassItem[];
  onSaveClass: (cls: ClassItem) => void;
  onDeleteClass: (id: string) => void;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  classes,
  onSaveClass,
  onDeleteClass
}) => {
  const [editingClass, setEditingClass] = useState<Partial<ClassItem> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenAdd = () => {
    setEditingClass({
      id: '',
      grade: '12',
      section: 'A',
      academicYear: '2026-27'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: ClassItem) => {
    setEditingClass({ ...c });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !editingClass.grade || !editingClass.section) return;
    const finalId = editingClass.id || `${editingClass.grade}-${editingClass.section.toUpperCase()}`;
    onSaveClass({
      id: finalId,
      grade: editingClass.grade,
      section: editingClass.section.toUpperCase(),
      academicYear: editingClass.academicYear || '2026-27'
    });
    setIsModalOpen(false);
    setEditingClass(null);
  };

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Classes Management</h2>
          <p>Grade sections and academic divisions</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
          + Add Class
        </button>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th style={{ width: '120px' }}>Class</th>
              <th>Section</th>
              <th>Grade</th>
              <th>Academic Year</th>
              <th style={{ width: '130px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((cls) => (
              <tr key={cls.id}>
                <td>
                  <strong>Class {cls.id}</strong>
                </td>
                <td>{cls.section}</td>
                <td>Grade {cls.grade}</td>
                <td>{cls.academicYear}</td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ marginRight: '6px' }}
                    onClick={() => handleOpenEdit(cls)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      if (window.confirm(`Delete Class ${cls.id}?`)) {
                        onDeleteClass(cls.id);
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

      {isModalOpen && editingClass && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>{editingClass.id ? 'Edit Class' : 'Add Class'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-col">
                    <div className="form-group">
                      <label htmlFor="cls-grade">Grade Level:</label>
                      <input
                        id="cls-grade"
                        type="text"
                        required
                        value={editingClass.grade || ''}
                        onChange={(e) => setEditingClass({ ...editingClass, grade: e.target.value })}
                        placeholder="e.g. 12, 11, 10"
                      />
                    </div>
                  </div>
                  <div className="form-col">
                    <div className="form-group">
                      <label htmlFor="cls-section">Section:</label>
                      <input
                        id="cls-section"
                        type="text"
                        required
                        value={editingClass.section || ''}
                        onChange={(e) => setEditingClass({ ...editingClass, section: e.target.value })}
                        placeholder="e.g. A, B, C"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="cls-year">Academic Year:</label>
                  <input
                    id="cls-year"
                    type="text"
                    required
                    value={editingClass.academicYear || '2026-27'}
                    onChange={(e) => setEditingClass({ ...editingClass, academicYear: e.target.value })}
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
