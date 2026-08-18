import React, { useState } from 'react';
import { Teacher, Subject, TimetableEntry, Absence } from '../types';

interface TeachersViewProps {
  teachers: Teacher[];
  subjects: Subject[];
  timetables?: TimetableEntry[];
  absences?: Absence[];
  isAnonymous?: boolean;
  onSaveTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
  onQuickMarkAbsent?: (teacherId: string) => void;
}

export const TeachersView: React.FC<TeachersViewProps> = ({
  teachers,
  subjects,
  timetables = [],
  absences = [],
  isAnonymous = false,
  onSaveTeacher,
  onDeleteTeacher,
  onQuickMarkAbsent
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [editingTeacher, setEditingTeacher] = useState<Partial<Teacher> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenAdd = () => {
    setEditingTeacher({
      id: `T0${(teachers.length + 1).toString().padStart(2, '0')}`,
      name: '',
      department: 'Physics',
      primarySubject: 'Physics',
      phone: '',
      email: '',
      anonymousCode: `T-${teachers.length + 1}`,
      maxPeriodsPerDay: 6
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher?.id || !editingTeacher?.name) return;

    onSaveTeacher(editingTeacher as Teacher);
    setIsModalOpen(false);
    setEditingTeacher(null);
  };

  const filteredTeachers = teachers.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.anonymousCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.primarySubject || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = deptFilter === 'all' || t.department === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Staff & Faculty Directory</h2>
          <p>Manage teachers, department specializations, and weekly workload</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
          + Add Teacher
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="filter-group" style={{ flex: 1 }}>
          <label htmlFor="t-search">Search Staff:</label>
          <input
            id="t-search"
            type="text"
            placeholder="Search by name, ID, code or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="t-filter-dept">Department:</label>
          <select
            id="t-filter-dept"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            <option value="Physics">Physics</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Computer Science">Computer Science</option>
            <option value="English">English</option>
            <option value="Science">Science (General)</option>
            <option value="Social Studies">Social Studies</option>
            <option value="Physical Education">Physical Education</option>
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th style={{ width: '100px' }}>Staff ID</th>
              <th style={{ width: '110px' }}>Anon Code</th>
              <th>Name</th>
              <th>Department</th>
              <th>Subject</th>
              <th>Phone</th>
              <th style={{ textAlign: 'center' }}>Weekly Load</th>
              <th style={{ textAlign: 'center' }}>Today's Status</th>
              <th style={{ width: '150px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.map((teacher) => {
              const teacherPeriodsCount = timetables.filter((tt) => tt.teacherId === teacher.id).length;
              const isAbsentToday = absences.some((a) => a.teacherId === teacher.id && a.date === '2026-08-17');

              return (
                <tr key={teacher.id}>
                  <td>
                    <strong>{teacher.id}</strong>
                  </td>
                  <td>
                    <span className="badge badge-score">{teacher.anonymousCode || `T-${teacher.id}`}</span>
                  </td>
                  <td>
                    <strong>{isAnonymous ? (teacher.anonymousCode || teacher.id) : teacher.name}</strong>
                    {!isAnonymous && (
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{teacher.email}</div>
                    )}
                  </td>
                  <td>{teacher.department}</td>
                  <td>{teacher.primarySubject}</td>
                  <td>{teacher.phone}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-score" title="Total teaching periods scheduled per week">
                      {teacherPeriodsCount} / 48 periods
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {isAbsentToday ? (
                      <span className="badge badge-pending">Absent Today</span>
                    ) : (
                      <span className="badge badge-assigned">On Duty</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ marginRight: '4px' }}
                      onClick={() => handleOpenEdit(teacher)}
                    >
                      Edit
                    </button>
                    {onQuickMarkAbsent && !isAbsentToday && (
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ marginRight: '4px', color: '#e07a5f' }}
                        onClick={() => onQuickMarkAbsent(teacher.id)}
                        title="Mark absent today"
                      >
                        Leave
                      </button>
                    )}
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => {
                        if (window.confirm(`Delete teacher record for ${teacher.name}?`)) {
                          onDeleteTeacher(teacher.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && editingTeacher && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px' }}
          >
            <div className="modal-header">
              <h3>{editingTeacher.id ? 'Edit Staff Member' : 'Add Staff Member'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleModalSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-col">
                    <div className="form-group">
                      <label htmlFor="t-id">Staff ID:</label>
                      <input
                        id="t-id"
                        type="text"
                        required
                        value={editingTeacher.id || ''}
                        onChange={(e) =>
                          setEditingTeacher({ ...editingTeacher, id: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="form-col">
                    <div className="form-group">
                      <label htmlFor="t-anon">Anonymous Code:</label>
                      <input
                        id="t-anon"
                        type="text"
                        placeholder="e.g. T-PHY-01"
                        value={editingTeacher.anonymousCode || ''}
                        onChange={(e) =>
                          setEditingTeacher({ ...editingTeacher, anonymousCode: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="t-name">Teacher Name:</label>
                  <input
                    id="t-name"
                    type="text"
                    required
                    value={editingTeacher.name || ''}
                    onChange={(e) =>
                      setEditingTeacher({ ...editingTeacher, name: e.target.value })
                    }
                  />
                </div>

                <div className="form-row">
                  <div className="form-col">
                    <div className="form-group">
                      <label htmlFor="t-dept">Department:</label>
                      <select
                        id="t-dept"
                        value={editingTeacher.department || ''}
                        onChange={(e) =>
                          setEditingTeacher({ ...editingTeacher, department: e.target.value })
                        }
                      >
                        <option value="Physics">Physics</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="English">English</option>
                        <option value="Science">Science</option>
                        <option value="Social Studies">Social Studies</option>
                        <option value="Physical Education">Physical Education</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-col">
                    <div className="form-group">
                      <label htmlFor="t-sub">Primary Subject:</label>
                      <select
                        id="t-sub"
                        value={editingTeacher.primarySubject || ''}
                        onChange={(e) =>
                          setEditingTeacher({ ...editingTeacher, primarySubject: e.target.value })
                        }
                      >
                        {subjects.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name} ({s.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-col">
                    <div className="form-group">
                      <label htmlFor="t-phone">Phone Number:</label>
                      <input
                        id="t-phone"
                        type="tel"
                        value={editingTeacher.phone || ''}
                        onChange={(e) =>
                          setEditingTeacher({ ...editingTeacher, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="form-col">
                    <div className="form-group">
                      <label htmlFor="t-email">Email:</label>
                      <input
                        id="t-email"
                        type="email"
                        value={editingTeacher.email || ''}
                        onChange={(e) =>
                          setEditingTeacher({ ...editingTeacher, email: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
