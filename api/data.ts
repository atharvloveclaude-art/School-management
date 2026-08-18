import type { IncomingMessage, ServerResponse } from 'http';

interface VercelReq extends IncomingMessage {
  query?: Record<string, string | string[]>;
  body?: any;
  method?: string;
}

interface VercelRes extends ServerResponse {
  status: (statusCode: number) => VercelRes;
  json: (data: any) => void;
  send: (data: any) => void;
}

// In-Memory cache for Vercel serverless environment
let serverlessDbData: any = null;

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
    { id: 'tt-12a-mon-8', day: 'Monday', period: 8, classId: '12-A', subjectId: 'PE', teacherId: 'T008', roomId: '204' }
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
      affectedPeriodsCount: 2
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
      assignedReason: 'Same subject specialist (Physics)',
      assignedAt: '2026-08-17T07:15:00Z'
    }
  ]
};

export default function handler(req: VercelReq, res: VercelRes) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (!serverlessDbData) {
    serverlessDbData = JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  if (req.method === 'GET') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, data: serverlessDbData }));
    return;
  }

  if (req.method === 'POST') {
    const incoming = req.body;
    if (incoming && incoming.teachers) {
      serverlessDbData = incoming;
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, message: 'Updated on Vercel', data: serverlessDbData }));
      return;
    }
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Invalid payload' }));
    return;
  }

  res.statusCode = 405;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success: false, error: 'Method not allowed' }));
}
