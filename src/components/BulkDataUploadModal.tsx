import React, { useState } from 'react';
import { Teacher, TimetableEntry, ClassItem, Subject, DayOfWeek } from '../types';

interface BulkDataUploadModalProps {
  teachers: Teacher[];
  timetables: TimetableEntry[];
  classes: ClassItem[];
  subjects: Subject[];
  onImportTeachers: (newTeachers: Teacher[], replace: boolean) => void;
  onImportTimetable: (newEntries: TimetableEntry[], replace: boolean) => void;
  onImportFullSetup: (fullData: {
    teachers: Teacher[];
    classes: ClassItem[];
    subjects: Subject[];
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

const SAMPLE_TIMETABLE_CSV = `Day,Period,ClassID,SubjectID,TeacherID,Batch,Frequency
Monday,1,11-A,CS,T006,CS Batch,all
Monday,1,11-A,BIO,T005,Bio Batch,all
Monday,2,11-A,PHY,T001,,all
Monday,3,11-A,ENG,T007,,all
Monday,4,11-A,CHEM,T003,,all
Monday,5,11-A,MAT,T002,,all
Monday,6,11-A,PE,T008,,1st_2nd
Monday,7,11-A,SOC,T009,,all
Monday,8,11-A,MAT,T010,,all`;

export const BulkDataUploadModal: React.FC<BulkDataUploadModalProps> = ({
  teachers,
  timetables,
  classes,
  subjects,
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
      if (cols.length >= 5) {
        const day = (cols[0] as DayOfWeek) || 'Monday';
        const period = Number(cols[1]) || 1;
        const classId = cols[2] || '9-A';
        const subjectId = cols[3] || 'GEN';
        const teacherId = cols[4] || 'T001';
        const batch = cols[5] ? cols[5].trim() : undefined;
        const frequency = cols[6] ? (cols[6].trim() as any) : undefined;

        const cleanClass = classId.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanDay = day.toLowerCase().slice(0, 3);
        const batchSlug = (batch || subjectId).toLowerCase().replace(/[^a-z0-9]/g, '');
        const teacherSlug = teacherId.toLowerCase().replace(/[^a-z0-9]/g, '');
        const standardId = `tt-${cleanClass}-${cleanDay}-p${period}-${batchSlug}-${teacherSlug}`;

        parsedMap.set(standardId, {
          id: standardId,
          day,
          period,
          classId,
          subjectId,
          teacherId,
          batch,
          frequency
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
        setStatusMessage({ type: 'success', text: `Successfully imported ${parsed.length} timetable periods!` });
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
                  Paste CSV lines in format: <code>Day,Period(1-8),ClassID,SubjectID,TeacherID,Batch(optional),Frequency(optional)</code>
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
