import React, { useState } from 'react';
import { Teacher, TimetableEntry, ClassItem, Subject, Room, DayOfWeek } from '../types';

interface BulkDataUploadModalProps {
  teachers: Teacher[];
  timetables: TimetableEntry[];
  classes: ClassItem[];
  subjects: Subject[];
  rooms: Room[];
  onImportTeachers: (newTeachers: Teacher[], replace: boolean) => void;
  onImportTimetable: (newEntries: TimetableEntry[], replace: boolean) => void;
  onImportFullSetup: (fullData: {
    teachers: Teacher[];
    classes: ClassItem[];
    subjects: Subject[];
    rooms: Room[];
    timetables: TimetableEntry[];
  }) => void;
  onClose: () => void;
}

const SAMPLE_TEACHERS_CSV = `ID,Name,Department,PrimarySubject,Phone,Email,AnonymousCode
T001,Mr Sharma,Physics,Physics,9811234567,sharma@school.edu,T-PHY-01
T002,Mrs Gupta,Mathematics,Mathematics,9711234567,gupta@school.edu,T-MAT-01
T003,Mr Singh,Chemistry,Chemistry,9911234567,singh@school.edu,T-CHEM-01
T004,Mrs Verma,Physics,Physics,9822334455,verma@school.edu,T-PHY-02
T005,Mr Gupta,Science,Biology,9733445566,mr.gupta@school.edu,T-BIO-01
T006,Ms Patel,Computer Science,Computer Science,9844556677,patel@school.edu,T-CS-01
T007,Mr Kumar,English,English,9855667788,kumar@school.edu,T-ENG-01
T008,Coach Rawat,Physical Education,Physical Education,9866778899,rawat@school.edu,T-PE-01
T009,Mrs Iyer,Social Studies,Social Studies,9877889900,iyer@school.edu,T-SOC-01
T010,Mr Das,Mathematics,Mathematics,9888990011,das@school.edu,T-MAT-02`;

const SAMPLE_TIMETABLE_CSV = `Day,Period,ClassID,SubjectID,TeacherID,RoomID
Monday,1,12-A,PHY,T001,204
Monday,2,12-A,PHY,T001,204
Monday,3,12-A,ENG,T007,204
Monday,4,12-A,CHEM,T003,205
Monday,5,12-A,CS,T006,LAB-1
Monday,6,12-A,MAT,T002,204
Monday,7,12-A,BIO,T005,BIO-LAB
Monday,8,12-A,PE,T008,204
Tuesday,1,12-A,MAT,T002,204
Tuesday,2,12-A,PHY,T001,204
Tuesday,3,12-A,CS,T006,LAB-1
Tuesday,4,12-A,ENG,T007,204
Tuesday,5,12-A,PE,T008,204
Tuesday,6,12-A,CHEM,T003,205
Tuesday,7,12-A,SOC,T009,204
Tuesday,8,12-A,MAT,T010,204
Wednesday,1,12-A,CHEM,T003,205
Wednesday,2,12-A,MAT,T002,204
Wednesday,3,12-A,PHY,T001,204
Wednesday,4,12-A,CS,T006,LAB-1
Wednesday,5,12-A,ENG,T007,204
Wednesday,6,12-A,BIO,T005,BIO-LAB
Wednesday,7,12-A,PHY,T004,204
Wednesday,8,12-A,PE,T008,204
Thursday,1,12-A,CS,T006,LAB-1
Thursday,2,12-A,PHY,T001,204
Thursday,3,12-A,MAT,T002,204
Thursday,4,12-A,ENG,T007,204
Thursday,5,12-A,CHEM,T003,205
Thursday,6,12-A,SOC,T009,204
Thursday,7,12-A,BIO,T005,BIO-LAB
Thursday,8,12-A,MAT,T010,204
Friday,1,12-A,PHY,T001,204
Friday,2,12-A,CS,T006,LAB-1
Friday,3,12-A,CHEM,T003,205
Friday,4,12-A,MAT,T002,204
Friday,5,12-A,ENG,T007,204
Friday,6,12-A,PE,T008,204
Friday,7,12-A,SOC,T009,204
Friday,8,12-A,BIO,T005,BIO-LAB
Saturday,1,12-A,MAT,T002,204
Saturday,2,12-A,PHY,T001,204
Saturday,3,12-A,CHEM,T003,205
Saturday,4,12-A,ENG,T007,204
Saturday,5,12-A,CS,T006,LAB-1
Saturday,6,12-A,SOC,T009,204
Saturday,7,12-A,BIO,T005,BIO-LAB
Saturday,8,12-A,PE,T008,204`;

export const BulkDataUploadModal: React.FC<BulkDataUploadModalProps> = ({
  teachers,
  timetables,
  classes,
  subjects,
  rooms,
  onImportTeachers,
  onImportTimetable,
  onImportFullSetup,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'teachers' | 'timetable' | 'backup'>('teachers');
  const [inputText, setInputText] = useState<string>('');
  const [replaceExisting, setReplaceExisting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLoadSampleTeachers = () => {
    setInputText(SAMPLE_TEACHERS_CSV);
    setStatusMessage(null);
  };

  const handleLoadSampleTimetable = () => {
    setInputText(SAMPLE_TIMETABLE_CSV);
    setStatusMessage(null);
  };

  const parseTeachersCSV = (csv: string): Teacher[] => {
    const lines = csv.trim().split('\n');
    const parsed: Teacher[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      // Skip header if present
      if (i === 0 && line.toLowerCase().includes('id') && line.toLowerCase().includes('name')) {
        continue;
      }

      const cols = line.split(',').map(c => c.trim());
      if (cols.length >= 2) {
        const id = cols[0] || `T${Date.now().toString().slice(-4)}`;
        const name = cols[1] || `Teacher ${id}`;
        const department = cols[2] || 'General';
        const primarySubject = cols[3] || department;
        const phone = cols[4] || '';
        const email = cols[5] || '';
        const anonymousCode = cols[6] || `T-${id}`;

        parsed.push({
          id,
          name,
          department,
          primarySubject,
          phone,
          email,
          anonymousCode,
          maxPeriodsPerDay: 6
        });
      }
    }

    return parsed;
  };

  const parseTimetableCSV = (csv: string): TimetableEntry[] => {
    const lines = csv.trim().split('\n');
    const parsedMap = new Map<string, TimetableEntry>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (i === 0 && line.toLowerCase().includes('day') && line.toLowerCase().includes('period')) {
        continue;
      }

      const cols = line.split(',').map(c => c.trim());
      if (cols.length >= 6) {
        const day = (cols[0] as DayOfWeek) || 'Monday';
        const period = Number(cols[1]) || 1;
        const classId = cols[2] || '9-A';
        const subjectId = cols[3] || 'GEN';
        const teacherId = cols[4] || 'T001';
        const roomId = cols[5] || '204';

        const cleanClass = classId.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanDay = day.toLowerCase().slice(0, 3);
        const standardId = `tt-${cleanClass}-${cleanDay}-${period}`;

        parsedMap.set(standardId, {
          id: standardId,
          day,
          period,
          classId,
          subjectId,
          teacherId,
          roomId
        });
      }
    }

    return Array.from(parsedMap.values());
  };

  const handleProcessImport = () => {
    try {
      if (!inputText.trim()) {
        setStatusMessage({ type: 'error', text: 'Please paste CSV/data content before importing.' });
        return;
      }

      if (activeTab === 'teachers') {
        const parsed = parseTeachersCSV(inputText);
        if (parsed.length === 0) {
          setStatusMessage({ type: 'error', text: 'Could not parse any valid teacher rows. Please check format.' });
          return;
        }
        onImportTeachers(parsed, replaceExisting);
        setStatusMessage({ type: 'success', text: `Successfully imported ${parsed.length} teacher(s)!` });
      } else if (activeTab === 'timetable') {
        const parsed = parseTimetableCSV(inputText);
        if (parsed.length === 0) {
          setStatusMessage({ type: 'error', text: 'Could not parse any valid timetable rows. Please check format.' });
          return;
        }
        onImportTimetable(parsed, replaceExisting);
        setStatusMessage({ type: 'success', text: `Successfully imported ${parsed.length} timetable periods across the 6 days!` });
      } else if (activeTab === 'backup') {
        const full = JSON.parse(inputText);
        if (full.teachers && full.timetables) {
          onImportFullSetup(full);
          setStatusMessage({ type: 'success', text: 'Full system configuration restored successfully!' });
        } else {
          setStatusMessage({ type: 'error', text: 'Invalid JSON configuration format.' });
        }
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Import error: ${err?.message || 'Invalid syntax'}` });
    }
  };

  const handleExportAllJSON = () => {
    const backup = {
      teachers,
      classes,
      subjects,
      rooms,
      timetables
    };
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `school-timetable-setup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '780px', maxHeight: '90vh' }}
      >
        <div className="modal-header">
          <div>
            <h3>Bulk Data Upload & Master School Setup</h3>
            <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
              Upload complete 8-period, 6-day timetable and faculty directory in one go
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {/* Tab Selection */}
          <div style={{ display: 'flex', borderBottom: '2px solid #e0e0e0', marginBottom: '16px' }}>
            <button
              className={`nav-item ${activeTab === 'teachers' ? 'active' : ''}`}
              onClick={() => { setActiveTab('teachers'); setStatusMessage(null); }}
            >
              1. Upload Teachers List (CSV)
            </button>
            <button
              className={`nav-item ${activeTab === 'timetable' ? 'active' : ''}`}
              onClick={() => { setActiveTab('timetable'); setStatusMessage(null); }}
            >
              2. Upload Master Timetable (CSV)
            </button>
            <button
              className={`nav-item ${activeTab === 'backup' ? 'active' : ''}`}
              onClick={() => { setActiveTab('backup'); setStatusMessage(null); }}
            >
              3. Backup & JSON Restore
            </button>
          </div>

          {statusMessage && (
            <div className={`alert alert-${statusMessage.type}`}>
              {statusMessage.text}
            </div>
          )}

          {activeTab === 'teachers' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <p style={{ fontSize: '13px', color: '#4b5563' }}>
                  Paste CSV lines in format: <code>ID,Name,Department,PrimarySubject,Phone,Email,AnonymousCode</code>
                </p>
                <button className="btn btn-outline btn-sm" onClick={handleLoadSampleTeachers}>
                  Load Sample Teachers CSV
                </button>
              </div>

              <textarea
                rows={10}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste Teachers CSV here..."
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
              />

              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                  />
                  Replace all existing teachers with this list
                </label>
              </div>
            </div>
          )}

          {activeTab === 'timetable' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <p style={{ fontSize: '13px', color: '#4b5563' }}>
                  Paste CSV lines in format: <code>Day,Period(1-8),ClassID,SubjectID,TeacherID,RoomID</code>
                </p>
                <button className="btn btn-outline btn-sm" onClick={handleLoadSampleTimetable}>
                  Load Sample 8-Period Timetable CSV
                </button>
              </div>

              <textarea
                rows={10}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste Timetable CSV here..."
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
              />

              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                  />
                  Replace all existing timetable entries with this list
                </label>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div>
              <p style={{ fontSize: '13px', color: '#4b5563', marginBottom: '12px' }}>
                Export current school setup or paste a full JSON backup to restore everything at once.
              </p>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button className="btn btn-primary btn-sm" onClick={handleExportAllJSON}>
                  📥 Download Full System Backup (JSON)
                </button>
              </div>

              <textarea
                rows={8}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Or paste full JSON configuration here to restore..."
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleProcessImport}>
            Process & Import Data
          </button>
        </div>
      </div>
    </div>
  );
};
