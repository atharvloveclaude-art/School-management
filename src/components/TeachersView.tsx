import React, { useState, useMemo } from 'react';
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
  const [isCustomDept, setIsCustomDept] = useState(false);

  // Dynamically compute all unique departments from both subjects and existing teachers
  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    subjects.forEach((s) => {
      if (s.department && s.department.trim()) {
        set.add(s.department.trim());
      }
    });
    teachers.forEach((t) => {
      if (t.department && t.department.trim()) {
        set.add(t.department.trim());
      }
    });
    // Fallback default list if no subjects or teachers exist yet
    if (set.size === 0) {
      ['Science', 'Mathematics', 'Languages', 'Arts', 'Sports'].forEach((d) => set.add(d));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [subjects, teachers]);

  const handleOpenAdd = () => {
    const defaultSubject = subjects[0];
    const defaultDept = defaultSubject?.department || uniqueDepartments[0] || 'General';
    const defaultSubjName = defaultSubject?.name || 'General';

    setEditingTeacher({
      id: `T${(teachers.length + 1).toString().padStart(3, '0')}`,
      name: '',
      department: defaultDept,
      primarySubject: defaultSubjName,
      phone: '',
      email: '',
      anonymousCode: `T-${(teachers.length + 1).toString().padStart(2, '0')}`,
      maxPeriodsPerDay: 6
    });
    setIsCustomDept(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setEditingTeacher({ ...teacher });
    setIsCustomDept(!uniqueDepartments.includes(teacher.department));
    setIsModalOpen(true);
  };

  const handleSubjectChange = (subjectName: string) => {
    const matchedSubject = subjects.find((s) => s.name === subjectName);
    if (matchedSubject && matchedSubject.department) {
      setEditingTeacher((prev) => ({
        ...prev,
        primarySubject: subjectName,
        department: matchedSubject.department
      }));
    } else {
      setEditingTeacher((prev) => ({
        ...prev,
        primarySubject: subjectName
      }));
    }
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
      (t.primarySubject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.department || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = deptFilter === 'all' || t.department === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div className="page-section" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
            Staff & Faculty Directory
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
            Manage faculty profiles, department specializations ({uniqueDepartments.length} active departments), and schedules
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleOpenAdd}
          style={{ backgroundColor: '#2563eb', fontWeight: 700, padding: '8px 16px', borderRadius: '8px' }}
        >
          + Add Teacher
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="filter-bar"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#f8fafc',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
          alignItems: 'center'
        }}
      >
        <div className="filter-group" style={{ flex: 1, minWidth: '240px' }}>
          <label htmlFor="t-search" style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginRight: '6px' }}>
            Search Staff:
          </label>
          <input
            id="t-search"
            type="text"
            placeholder="Search by name, ID, code, subject, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
          />
        </div>

        {/* Dynamic Department Filter */}
        <div className="filter-group">
          <label htmlFor="t-filter-dept" style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginRight: '6px' }}>
            Department:
          </label>
          <select
            id="t-filter-dept"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600 }}
          >
            <option value="all">All Departments ({uniqueDepartments.length})</option>
            {uniqueDepartments.map((dept) => {
              const count = teachers.filter((t) => t.department === dept).length;
              return (
                <option key={dept} value={dept}>
                  {dept} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {(searchTerm || deptFilter !== 'all') && (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              setSearchTerm('');
              setDeptFilter('all');
            }}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Teachers Table */}
      <div className="table-responsive" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
              <th style={{ width: '90px', padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Staff ID</th>
              <th style={{ width: '110px', padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Anon Code</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Teacher Name</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Department</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Primary Subject</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Contact Phone</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>Weekly Load</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>Today's Status</th>
              <th style={{ width: '140px', padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  No teachers found matching the criteria. Click "+ Add Teacher" above to register faculty.
                </td>
              </tr>
            ) : (
              filteredTeachers.map((teacher) => {
                const teacherPeriodsCount = timetables.filter((tt) => tt.teacherId === teacher.id).length;
                const isAbsentToday = absences.some((a) => a.teacherId === teacher.id && a.date === '2026-08-17');

                return (
                  <tr key={teacher.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>
                      <strong style={{ color: '#1e293b' }}>{teacher.id}</strong>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                        {teacher.anonymousCode || `T-${teacher.id}`}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <strong style={{ color: '#0f172a', fontSize: '13.5px' }}>
                        {isAnonymous ? (teacher.anonymousCode || teacher.id) : teacher.name}
                      </strong>
                      {!isAnonymous && teacher.email && (
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>{teacher.email}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 600 }}>
                        {teacher.department}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <strong style={{ color: '#334155' }}>{teacher.primarySubject}</strong>
                    </td>
                    <td style={{ padding: '12px', color: '#64748b' }}>
                      {teacher.phone || '—'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span
                        style={{
                          background: teacherPeriodsCount > 30 ? '#fef3c7' : '#f1f5f9',
                          color: teacherPeriodsCount > 30 ? '#92400e' : '#475569',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700
                        }}
                        title="Total scheduled teaching periods per week"
                      >
                        {teacherPeriodsCount} / 48 periods
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {isAbsentToday ? (
                        <span style={{ background: '#fee2e2', color: '#991b1b', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                          Absent Today
                        </span>
                      ) : (
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                          On Duty
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          onClick={() => handleOpenEdit(teacher)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          onClick={() => {
                            if (window.confirm(`Delete teacher record for ${teacher.name}?`)) {
                              onDeleteTeacher(teacher.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Teacher Modal with Dynamic Departments & Subjects */}
      {isModalOpen && editingTeacher && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '540px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>👨‍🏫</span>
                <h3 style={{ margin: 0 }}>{editingTeacher.id ? 'Edit Staff Profile' : 'Add New Teacher'}</h3>
              </div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleModalSubmit}>
              <div className="modal-body" style={{ padding: '20px' }}>
                <div className="form-row">
                  <div className="form-col">
                    <div className="form-group">
                      <label htmlFor="t-id" style={{ fontWeight: 700, fontSize: '13px' }}>Staff ID / Code:</label>
                      <input
                        id="t-id"
                        type="text"
                        required
                        value={editingTeacher.id || ''}
                        onChange={(e) =>
                          setEditingTeacher({ ...editingTeacher, id: e.target.value })
                        }
                        placeholder="e.g. T011"
                        style={{ fontWeight: 600 }}
                      />
                    </div>
                  </div>
                  <div className="form-col">
                    <div className="form-group">
                      <label htmlFor="t-anon" style={{ fontWeight: 700, fontSize: '13px' }}>Anonymous Code:</label>
                      <input
                        id="t-anon"
                        type="text"
                        placeholder="e.g. T-LANG-01"
                        value={editingTeacher.anonymousCode || ''}
                        onChange={(e) =>
                          setEditingTeacher({ ...editingTeacher, anonymousCode: e.target.value })
                        }
                        style={{ fontWeight: 600 }}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="t-name" style={{ fontWeight: 700, fontSize: '13px' }}>Teacher Full Name:</label>
                  <input
                    id="t-name"
                    type="text"
                    required
                    value={editingTeacher.name || ''}
                    onChange={(e) =>
                      setEditingTeacher({ ...editingTeacher, name: e.target.value })
                    }
                    placeholder="e.g. Mrs Sharma, Dr Smith"
                    style={{ fontWeight: 600 }}
                  />
                </div>

                {/* Primary Subject & Dynamic Department Selection */}
                <div className="form-row">
                  <div className="form-col">
                    <div className="form-group">
                      <label htmlFor="t-sub" style={{ fontWeight: 700, fontSize: '13px' }}>
                        Primary Subject ({subjects.length} available):
                      </label>
                      <select
                        id="t-sub"
                        value={editingTeacher.primarySubject || ''}
                        onChange={(e) => handleSubjectChange(e.target.value)}
                        style={{ fontWeight: 600 }}
                      >
                        {subjects.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name} ({s.id}) &bull; {s.department}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-col">
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label htmlFor="t-dept" style={{ fontWeight: 700, fontSize: '13px', margin: 0 }}>
                          Department:
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsCustomDept(!isCustomDept)}
                          style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                        >
                          {isCustomDept ? 'Choose from list' : '+ Type Custom'}
                        </button>
                      </div>

                      {isCustomDept ? (
                        <input
                          id="t-dept"
                          type="text"
                          required
                          value={editingTeacher.department || ''}
                          onChange={(e) =>
                            setEditingTeacher({ ...editingTeacher, department: e.target.value })
                          }
                          placeholder="e.g. Languages, Arts, Vocational"
                          style={{ fontWeight: 600 }}
                        />
                      ) : (
                        <select
                          id="t-dept"
                          value={editingTeacher.department || ''}
                          onChange={(e) =>
                            setEditingTeacher({ ...editingTeacher, department: e.target.value })
                          }
                          style={{ fontWeight: 600 }}
                        >
                          {uniqueDepartments.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-col">
                    <div className="form-group">
                      <label htmlFor="t-phone" style={{ fontWeight: 700, fontSize: '13px' }}>Phone Number:</label>
                      <input
                        id="t-phone"
                        type="tel"
                        value={editingTeacher.phone || ''}
                        onChange={(e) =>
                          setEditingTeacher({ ...editingTeacher, phone: e.target.value })
                        }
                        placeholder="e.g. 9811234567"
                      />
                    </div>
                  </div>
                  <div className="form-col">
                    <div className="form-group">
                      <label htmlFor="t-email" style={{ fontWeight: 700, fontSize: '13px' }}>Email Address:</label>
                      <input
                        id="t-email"
                        type="email"
                        value={editingTeacher.email || ''}
                        onChange={(e) =>
                          setEditingTeacher({ ...editingTeacher, email: e.target.value })
                        }
                        placeholder="e.g. teacher@school.edu"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '16px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ backgroundColor: '#2563eb', fontWeight: 700, padding: '8px 18px', borderRadius: '8px' }}
                >
                  Save Teacher Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
