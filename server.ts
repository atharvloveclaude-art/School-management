import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'school_data.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Seed Data
const INITIAL_DATA = {
  teachers: [
    { id: 'T001', name: 'Mr Sharma', department: 'Physics', phone: '9811234567', email: 'sharma@school.edu', primarySubject: 'Physics', maxPeriodsPerDay: 6, anonymousCode: 'T-PHY-01' },
    { id: 'T002', name: 'Mrs Gupta', department: 'Mathematics', phone: '9711234567', email: 'gupta@school.edu', primarySubject: 'Mathematics', maxPeriodsPerDay: 6, anonymousCode: 'T-MAT-01' },
    { id: 'T003', name: 'Mr Singh', department: 'Chemistry', phone: '9911234567', email: 'singh@school.edu', primarySubject: 'Chemistry', maxPeriodsPerDay: 6, anonymousCode: 'T-CHEM-01' },
    { id: 'T004', name: 'Mrs Verma', department: 'Physics', phone: '9822334455', email: 'verma@school.edu', primarySubject: 'Physics', maxPeriodsPerDay: 6, anonymousCode: 'T-PHY-02' },
    { id: 'T005', name: 'Mr Gupta', department: 'Science', phone: '9733445566', email: 'mr.gupta@school.edu', primarySubject: 'Biology', maxPeriodsPerDay: 6, anonymousCode: 'T-BIO-01' },
    { id: 'T006', name: 'Ms Patel', department: 'Computer Science', phone: '9844556677', email: 'patel@school.edu', primarySubject: 'Computer Science', maxPeriodsPerDay: 6, anonymousCode: 'T-CS-01' },
    { id: 'T007', name: 'Mr Kumar', department: 'English', phone: '9855667788', email: 'kumar@school.edu', primarySubject: 'English', maxPeriodsPerDay: 6, anonymousCode: 'T-ENG-01' },
    { id: 'T008', name: 'Coach Rawat', department: 'Physical Education', phone: '9866778899', email: 'rawat@school.edu', primarySubject: 'Physical Education', maxPeriodsPerDay: 6, anonymousCode: 'T-PE-01' },
    { id: 'T009', name: 'Mrs Iyer', department: 'Social Studies', phone: '9877889900', email: 'iyer@school.edu', primarySubject: 'Social Studies', maxPeriodsPerDay: 6, anonymousCode: 'T-SOC-01' },
    { id: 'T010', name: 'Mr Das', department: 'Mathematics', phone: '9888990011', email: 'das@school.edu', primarySubject: 'Mathematics', maxPeriodsPerDay: 6, anonymousCode: 'T-MAT-02' }
  ],
  classes: [
    { id: '12-A', grade: '12', section: 'A', academicYear: '2026-27', roomDefault: '204' },
    { id: '12-B', grade: '12', section: 'B', academicYear: '2026-27', roomDefault: '301' },
    { id: '11-A', grade: '11', section: 'A', academicYear: '2026-27', roomDefault: '102' },
    { id: '11-B', grade: '11', section: 'B', academicYear: '2026-27', roomDefault: '205' },
    { id: '10-A', grade: '10', section: 'A', academicYear: '2026-27', roomDefault: '204' },
    { id: '10-C', grade: '10', section: 'C', academicYear: '2026-27', roomDefault: '301' }
  ],
  subjects: [
    { id: 'PHY', name: 'Physics', department: 'Science' },
    { id: 'MAT', name: 'Mathematics', department: 'Mathematics' },
    { id: 'CHEM', name: 'Chemistry', department: 'Science' },
    { id: 'BIO', name: 'Biology', department: 'Science' },
    { id: 'CS', name: 'Computer Science', department: 'Science' },
    { id: 'ENG', name: 'English', department: 'Languages' },
    { id: 'SOC', name: 'Social Studies', department: 'Social Studies' },
    { id: 'PE', name: 'Physical Education', department: 'Sports' }
  ],
  rooms: [
    { id: '204', capacity: 40, type: 'Classroom' },
    { id: '205', capacity: 35, type: 'Laboratory' },
    { id: '301', capacity: 50, type: 'Classroom' },
    { id: '102', capacity: 40, type: 'Classroom' },
    { id: 'LAB-1', capacity: 30, type: 'Computer Lab' },
    { id: 'BIO-LAB', capacity: 35, type: 'Biology Lab' }
  ],
  timetables: [
    { id: 'tt-12a-mon-1', day: 'Monday', period: 1, classId: '12-A', subjectId: 'PHY', teacherId: 'T001', roomId: '204' },
    { id: 'tt-12a-mon-2', day: 'Monday', period: 2, classId: '12-A', subjectId: 'PHY', teacherId: 'T001', roomId: '204' },
    { id: 'tt-12a-mon-3', day: 'Monday', period: 3, classId: '12-A', subjectId: 'ENG', teacherId: 'T007', roomId: '204' },
    { id: 'tt-12a-mon-4', day: 'Monday', period: 4, classId: '12-A', subjectId: 'CHEM', teacherId: 'T003', roomId: '205' },
    { id: 'tt-12a-mon-5', day: 'Monday', period: 5, classId: '12-A', subjectId: 'CS', teacherId: 'T006', roomId: 'LAB-1' },
    { id: 'tt-12a-mon-6', day: 'Monday', period: 6, classId: '12-A', subjectId: 'MAT', teacherId: 'T002', roomId: '204' },
    { id: 'tt-12a-mon-7', day: 'Monday', period: 7, classId: '12-A', subjectId: 'BIO', teacherId: 'T005', roomId: 'BIO-LAB' },
    { id: 'tt-12a-mon-8', day: 'Monday', period: 8, classId: '12-A', subjectId: 'PE', teacherId: 'T008', roomId: '204' },

    { id: 'tt-12a-tue-1', day: 'Tuesday', period: 1, classId: '12-A', subjectId: 'MAT', teacherId: 'T002', roomId: '204' },
    { id: 'tt-12a-tue-2', day: 'Tuesday', period: 2, classId: '12-A', subjectId: 'PHY', teacherId: 'T001', roomId: '204' },
    { id: 'tt-12a-tue-3', day: 'Tuesday', period: 3, classId: '12-A', subjectId: 'CS', teacherId: 'T006', roomId: 'LAB-1' },
    { id: 'tt-12a-tue-4', day: 'Tuesday', period: 4, classId: '12-A', subjectId: 'ENG', teacherId: 'T007', roomId: '204' },
    { id: 'tt-12a-tue-5', day: 'Tuesday', period: 5, classId: '12-A', subjectId: 'PE', teacherId: 'T008', roomId: '204' },
    { id: 'tt-12a-tue-6', day: 'Tuesday', period: 6, classId: '12-A', subjectId: 'CHEM', teacherId: 'T003', roomId: '205' },
    { id: 'tt-12a-tue-7', day: 'Tuesday', period: 7, classId: '12-A', subjectId: 'SOC', teacherId: 'T009', roomId: '204' },
    { id: 'tt-12a-tue-8', day: 'Tuesday', period: 8, classId: '12-A', subjectId: 'MAT', teacherId: 'T010', roomId: '204' },

    { id: 'tt-12a-wed-1', day: 'Wednesday', period: 1, classId: '12-A', subjectId: 'CHEM', teacherId: 'T003', roomId: '205' },
    { id: 'tt-12a-wed-2', day: 'Wednesday', period: 2, classId: '12-A', subjectId: 'MAT', teacherId: 'T002', roomId: '204' },
    { id: 'tt-12a-wed-3', day: 'Wednesday', period: 3, classId: '12-A', subjectId: 'PHY', teacherId: 'T001', roomId: '204' },
    { id: 'tt-12a-wed-4', day: 'Wednesday', period: 4, classId: '12-A', subjectId: 'CS', teacherId: 'T006', roomId: 'LAB-1' },
    { id: 'tt-12a-wed-5', day: 'Wednesday', period: 5, classId: '12-A', subjectId: 'ENG', teacherId: 'T007', roomId: '204' },
    { id: 'tt-12a-wed-6', day: 'Wednesday', period: 6, classId: '12-A', subjectId: 'BIO', teacherId: 'T005', roomId: 'BIO-LAB' },
    { id: 'tt-12a-wed-7', day: 'Wednesday', period: 7, classId: '12-A', subjectId: 'PHY', teacherId: 'T004', roomId: '204' },
    { id: 'tt-12a-wed-8', day: 'Wednesday', period: 8, classId: '12-A', subjectId: 'PE', teacherId: 'T008', roomId: '204' },

    { id: 'tt-12a-thu-1', day: 'Thursday', period: 1, classId: '12-A', subjectId: 'CS', teacherId: 'T006', roomId: 'LAB-1' },
    { id: 'tt-12a-thu-2', day: 'Thursday', period: 2, classId: '12-A', subjectId: 'PHY', teacherId: 'T001', roomId: '204' },
    { id: 'tt-12a-thu-3', day: 'Thursday', period: 3, classId: '12-A', subjectId: 'MAT', teacherId: 'T002', roomId: '204' },
    { id: 'tt-12a-thu-4', day: 'Thursday', period: 4, classId: '12-A', subjectId: 'ENG', teacherId: 'T007', roomId: '204' },
    { id: 'tt-12a-thu-5', day: 'Thursday', period: 5, classId: '12-A', subjectId: 'CHEM', teacherId: 'T003', roomId: '205' },
    { id: 'tt-12a-thu-6', day: 'Thursday', period: 6, classId: '12-A', subjectId: 'SOC', teacherId: 'T009', roomId: '204' },
    { id: 'tt-12a-thu-7', day: 'Thursday', period: 7, classId: '12-A', subjectId: 'BIO', teacherId: 'T005', roomId: 'BIO-LAB' },
    { id: 'tt-12a-thu-8', day: 'Thursday', period: 8, classId: '12-A', subjectId: 'MAT', teacherId: 'T010', roomId: '204' },

    { id: 'tt-12a-fri-1', day: 'Friday', period: 1, classId: '12-A', subjectId: 'PHY', teacherId: 'T001', roomId: '204' },
    { id: 'tt-12a-fri-2', day: 'Friday', period: 2, classId: '12-A', subjectId: 'CS', teacherId: 'T006', roomId: 'LAB-1' },
    { id: 'tt-12a-fri-3', day: 'Friday', period: 3, classId: '12-A', subjectId: 'CHEM', teacherId: 'T003', roomId: '205' },
    { id: 'tt-12a-fri-4', day: 'Friday', period: 4, classId: '12-A', subjectId: 'MAT', teacherId: 'T002', roomId: '204' },
    { id: 'tt-12a-fri-5', day: 'Friday', period: 5, classId: '12-A', subjectId: 'ENG', teacherId: 'T007', roomId: '204' },
    { id: 'tt-12a-fri-6', day: 'Friday', period: 6, classId: '12-A', subjectId: 'PE', teacherId: 'T008', roomId: '204' },
    { id: 'tt-12a-fri-7', day: 'Friday', period: 7, classId: '12-A', subjectId: 'SOC', teacherId: 'T009', roomId: '204' },
    { id: 'tt-12a-fri-8', day: 'Friday', period: 8, classId: '12-A', subjectId: 'BIO', teacherId: 'T005', roomId: 'BIO-LAB' },

    { id: 'tt-12a-sat-1', day: 'Saturday', period: 1, classId: '12-A', subjectId: 'MAT', teacherId: 'T002', roomId: '204' },
    { id: 'tt-12a-sat-2', day: 'Saturday', period: 2, classId: '12-A', subjectId: 'PHY', teacherId: 'T001', roomId: '204' },
    { id: 'tt-12a-sat-3', day: 'Saturday', period: 3, classId: '12-A', subjectId: 'CHEM', teacherId: 'T003', roomId: '205' },
    { id: 'tt-12a-sat-4', day: 'Saturday', period: 4, classId: '12-A', subjectId: 'ENG', teacherId: 'T007', roomId: '204' },
    { id: 'tt-12a-sat-5', day: 'Saturday', period: 5, classId: '12-A', subjectId: 'CS', teacherId: 'T006', roomId: 'LAB-1' },
    { id: 'tt-12a-sat-6', day: 'Saturday', period: 6, classId: '12-A', subjectId: 'SOC', teacherId: 'T009', roomId: '204' },
    { id: 'tt-12a-sat-7', day: 'Saturday', period: 7, classId: '12-A', subjectId: 'BIO', teacherId: 'T005', roomId: 'BIO-LAB' },
    { id: 'tt-12a-sat-8', day: 'Saturday', period: 8, classId: '12-A', subjectId: 'PE', teacherId: 'T008', roomId: '204' },

    { id: 'tt-11b-mon-1', day: 'Monday', period: 1, classId: '11-B', subjectId: 'MAT', teacherId: 'T010', roomId: '205' },
    { id: 'tt-11b-mon-2', day: 'Monday', period: 2, classId: '11-B', subjectId: 'CS', teacherId: 'T006', roomId: 'LAB-1' },
    { id: 'tt-11b-mon-3', day: 'Monday', period: 3, classId: '11-B', subjectId: 'PHY', teacherId: 'T001', roomId: '205' },
    { id: 'tt-11b-mon-4', day: 'Monday', period: 4, classId: '11-B', subjectId: 'MAT', teacherId: 'T002', roomId: '205' },
    { id: 'tt-11b-mon-5', day: 'Monday', period: 5, classId: '11-B', subjectId: 'PE', teacherId: 'T008', roomId: '205' },
    { id: 'tt-11b-mon-6', day: 'Monday', period: 6, classId: '11-B', subjectId: 'CHEM', teacherId: 'T003', roomId: '205' },
    { id: 'tt-11b-mon-7', day: 'Monday', period: 7, classId: '11-B', subjectId: 'ENG', teacherId: 'T007', roomId: '205' },
    { id: 'tt-11b-mon-8', day: 'Monday', period: 8, classId: '11-B', subjectId: 'SOC', teacherId: 'T009', roomId: '205' }
  ],
  absences: [
    {
      id: 'abs-1',
      teacherId: 'T001',
      teacherName: 'Mr Sharma',
      date: '2026-08-17',
      dayOfWeek: 'Monday',
      reason: 'Sick leave',
      createdAt: '2026-08-17T07:00:00Z',
      affectedPeriodsCount: 3
    }
  ],
  substitutions: [
    {
      id: 'sub-1',
      absenceId: 'abs-1',
      date: '2026-08-17',
      day: 'Monday',
      period: 1,
      classId: '12-A',
      subjectId: 'PHY',
      subjectName: 'Physics',
      originalTeacherId: 'T001',
      originalTeacherName: 'Mr Sharma',
      roomId: '204',
      status: 'Assigned',
      assignedSubstituteId: 'T004',
      assignedSubstituteName: 'Mrs Verma',
      assignedReason: 'Same subject expert (Physics)',
      assignedAt: '2026-08-17T07:15:00Z'
    },
    {
      id: 'sub-2',
      absenceId: 'abs-1',
      date: '2026-08-17',
      day: 'Monday',
      period: 2,
      classId: '12-A',
      subjectId: 'PHY',
      subjectName: 'Physics',
      originalTeacherId: 'T001',
      originalTeacherName: 'Mr Sharma',
      roomId: '204',
      status: 'Assigned',
      assignedSubstituteId: 'T004',
      assignedSubstituteName: 'Mrs Verma',
      assignedReason: 'Same subject expert (Physics)',
      assignedAt: '2026-08-17T07:15:00Z'
    },
    {
      id: 'sub-3',
      absenceId: 'abs-1',
      date: '2026-08-17',
      day: 'Monday',
      period: 3,
      classId: '11-B',
      subjectId: 'PHY',
      subjectName: 'Physics',
      originalTeacherId: 'T001',
      originalTeacherName: 'Mr Sharma',
      roomId: '205',
      status: 'Assigned',
      assignedSubstituteId: 'T005',
      assignedSubstituteName: 'Mr Gupta',
      assignedReason: 'Science department cover with rest period protection',
      assignedAt: '2026-08-17T07:15:00Z'
    }
  ]
};

// In-Memory cache with JSON file persistence
let currentDbData: typeof INITIAL_DATA = JSON.parse(JSON.stringify(INITIAL_DATA));

function loadFromDisk(): typeof INITIAL_DATA {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.teachers && parsed.classes) {
        currentDbData = parsed;
        return currentDbData;
      }
    }
  } catch (err) {
    console.warn('Could not read from data file, using in-memory store:', err);
  }
  saveToDisk(currentDbData);
  return currentDbData;
}

function saveToDisk(data: typeof INITIAL_DATA): void {
  currentDbData = data;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write to disk (e.g. read-only serverless filesystem):', err);
  }
}

// Initialize on boot
loadFromDisk();

// ==================== REST API ENDPOINTS ====================

// 1. Get complete app data
app.get('/api/data', (_req: Request, res: Response) => {
  const data = loadFromDisk();
  res.json({ success: true, data });
});

// 2. Overwrite / update complete data
app.post('/api/data', (req: Request, res: Response) => {
  const incoming = req.body;
  if (!incoming || !incoming.teachers) {
    return res.status(400).json({ success: false, error: 'Invalid data format' });
  }
  saveToDisk(incoming);
  res.json({ success: true, message: 'Data saved successfully', data: incoming });
});

// 3. Reset to defaults
app.post('/api/reset', (_req: Request, res: Response) => {
  const fresh = JSON.parse(JSON.stringify(INITIAL_DATA));
  saveToDisk(fresh);
  res.json({ success: true, message: 'Database reset to default 8-period seed dataset', data: fresh });
});

// 4. Save single teacher
app.post('/api/teachers', (req: Request, res: Response) => {
  const teacher = req.body;
  if (!teacher || !teacher.id) {
    return res.status(400).json({ success: false, error: 'Missing teacher id' });
  }
  const data = loadFromDisk();
  const index = data.teachers.findIndex((t: any) => t.id === teacher.id);
  if (index >= 0) {
    data.teachers[index] = teacher;
  } else {
    data.teachers.push(teacher);
  }
  saveToDisk(data);
  res.json({ success: true, teacher });
});

// 5. Delete teacher
app.delete('/api/teachers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = loadFromDisk();
  data.teachers = data.teachers.filter((t: any) => t.id !== id);
  saveToDisk(data);
  res.json({ success: true, message: `Teacher ${id} deleted` });
});

// 6. Update substitutions
app.post('/api/substitutions', (req: Request, res: Response) => {
  const { substitutions } = req.body;
  if (!Array.isArray(substitutions)) {
    return res.status(400).json({ success: false, error: 'Substitutions array required' });
  }
  const data = loadFromDisk();
  data.substitutions = substitutions;
  saveToDisk(data);
  res.json({ success: true, substitutions });
});

// 7. Record / update absences
app.post('/api/absences', (req: Request, res: Response) => {
  const { absence, substitutions } = req.body;
  if (!absence || !absence.id) {
    return res.status(400).json({ success: false, error: 'Absence object required' });
  }
  const data = loadFromDisk();
  const absIndex = data.absences.findIndex((a: any) => a.id === absence.id);
  if (absIndex >= 0) {
    data.absences[absIndex] = absence;
  } else {
    data.absences.unshift(absence);
  }

  if (Array.isArray(substitutions)) {
    // Merge substitutions
    const subIds = new Set(substitutions.map((s: any) => s.id));
    data.substitutions = [...data.substitutions.filter((s: any) => !subIds.has(s.id)), ...substitutions];
  }

  saveToDisk(data);
  res.json({ success: true, absence, substitutions });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 School Timetable & Substitute Server running on port ${PORT}`);
});

export { currentDbData, loadFromDisk, saveToDisk, INITIAL_DATA };
export default app;
