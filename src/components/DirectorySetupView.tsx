import React, { useState } from 'react';
import { Teacher, ClassItem, Subject, Room, TimetableEntry } from '../types';
import { TeachersView } from './TeachersView';
import { ClassesView } from './ClassesView';
import { SubjectsView } from './SubjectsView';
import { RoomsView } from './RoomsView';
import { BulkDataUploadModal } from './BulkDataUploadModal';

interface DirectorySetupViewProps {
  teachers: Teacher[];
  classes: ClassItem[];
  subjects: Subject[];
  rooms: Room[];
  timetables: TimetableEntry[];
  isAnonymous: boolean;
  onSaveTeacher: (t: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
  onSaveClass: (c: ClassItem) => void;
  onDeleteClass: (id: string) => void;
  onSaveSubject: (s: Subject) => void;
  onDeleteSubject: (id: string) => void;
  onSaveRoom: (r: Room) => void;
  onDeleteRoom: (id: string) => void;
  onImportTeachers: (teachers: Teacher[], replace: boolean) => void;
  onImportTimetable: (entries: TimetableEntry[], replace: boolean) => void;
  onImportFullSetup: (data: any) => void;
  onResetData: () => void;
}

export const DirectorySetupView: React.FC<DirectorySetupViewProps> = ({
  teachers,
  classes,
  subjects,
  rooms,
  timetables,
  isAnonymous,
  onSaveTeacher,
  onDeleteTeacher,
  onSaveClass,
  onDeleteClass,
  onSaveSubject,
  onDeleteSubject,
  onSaveRoom,
  onDeleteRoom,
  onImportTeachers,
  onImportTimetable,
  onImportFullSetup,
  onResetData
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'teachers' | 'classes' | 'subjects' | 'rooms' | 'backup'>('teachers');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);

  const handleExportJson = () => {
    const data = {
      teachers,
      classes,
      subjects,
      rooms,
      timetables,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `school_timetable_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
            👥 School Directory & Master Setup
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Manage staff profiles, grade sections, subjects, classrooms, and data backups.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsBulkModalOpen(true)}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '9px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📥 Import CSV / Backup
          </button>

          <button
            onClick={handleExportJson}
            style={{
              backgroundColor: '#f8fafc',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '9px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📤 Export JSON
          </button>
        </div>
      </div>

      {/* Directory Tab Selector */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '20px',
          paddingBottom: '2px'
        }}
      >
        <button
          onClick={() => setActiveSubTab('teachers')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '14px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeSubTab === 'teachers' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeSubTab === 'teachers' ? '#2563eb' : '#64748b'
          }}
        >
          👨‍🏫 Faculty Staff ({teachers.length})
        </button>

        <button
          onClick={() => setActiveSubTab('classes')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '14px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeSubTab === 'classes' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeSubTab === 'classes' ? '#2563eb' : '#64748b'
          }}
        >
          🎓 Classes ({classes.length})
        </button>

        <button
          onClick={() => setActiveSubTab('subjects')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '14px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeSubTab === 'subjects' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeSubTab === 'subjects' ? '#2563eb' : '#64748b'
          }}
        >
          📚 Subjects ({subjects.length})
        </button>

        <button
          onClick={() => setActiveSubTab('rooms')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '14px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeSubTab === 'rooms' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeSubTab === 'rooms' ? '#2563eb' : '#64748b'
          }}
        >
          🚪 Rooms & Labs ({rooms.length})
        </button>

        <button
          onClick={() => setActiveSubTab('backup')}
          style={{
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: '14px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeSubTab === 'backup' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeSubTab === 'backup' ? '#2563eb' : '#64748b'
          }}
        >
          ⚙️ Storage & Reset
        </button>
      </div>

      {/* Tab Contents */}
      {activeSubTab === 'teachers' && (
        <TeachersView
          teachers={teachers}
          timetables={timetables}
          absences={[]}
          subjects={subjects}
          isAnonymous={isAnonymous}
          onSaveTeacher={onSaveTeacher}
          onDeleteTeacher={onDeleteTeacher}
          onQuickMarkAbsent={() => {}}
        />
      )}

      {activeSubTab === 'classes' && (
        <ClassesView
          classes={classes}
          rooms={rooms}
          onSaveClass={onSaveClass}
          onDeleteClass={onDeleteClass}
        />
      )}

      {activeSubTab === 'subjects' && (
        <SubjectsView
          subjects={subjects}
          onSaveSubject={onSaveSubject}
          onDeleteSubject={onDeleteSubject}
        />
      )}

      {activeSubTab === 'rooms' && (
        <RoomsView
          rooms={rooms}
          onSaveRoom={onSaveRoom}
          onDeleteRoom={onDeleteRoom}
        />
      )}

      {activeSubTab === 'backup' && (
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
            Data Persistence & System Control
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontWeight: 800, color: '#166534', marginBottom: '4px', fontSize: '15px' }}>
                🟢 Localhost & Vercel Backend Sync
              </div>
              <p style={{ color: '#15803d', fontSize: '13px', margin: '0 0 12px 0' }}>
                All timetable changes, absences, and teacher entries are automatically saved to your backend (Express / <code>./data/school_data.json</code>) and Vercel serverless storage.
              </p>
              <button
                onClick={handleExportJson}
                style={{
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Download School Database JSON
              </button>
            </div>

            <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontWeight: 800, color: '#991b1b', marginBottom: '4px', fontSize: '15px' }}>
                🔄 Restore 8-Period Default Demo Dataset
              </div>
              <p style={{ color: '#b91c1c', fontSize: '13px', margin: '0 0 12px 0' }}>
                Resets the database back to standard sample teachers, 6 days (Mon-Sat), and 8 periods per day.
              </p>
              <button
                onClick={onResetData}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Reset Database to Default
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isBulkModalOpen && (
        <BulkDataUploadModal
          teachers={teachers}
          timetables={timetables}
          classes={classes}
          subjects={subjects}
          rooms={rooms}
          onImportTeachers={onImportTeachers}
          onImportTimetable={onImportTimetable}
          onImportFullSetup={onImportFullSetup}
          onClose={() => setIsBulkModalOpen(false)}
        />
      )}
    </div>
  );
};
