import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Teacher,
  ClassItem,
  Subject,
  Room,
  TimetableEntry,
  Absence,
  Substitution
} from '../types';

export const INITIAL_TEACHERS: Teacher[] = [
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
];

export const INITIAL_CLASSES: ClassItem[] = [
  { id: '12-A', grade: '12', section: 'A', academicYear: '2026-27', roomDefault: '204' },
  { id: '12-B', grade: '12', section: 'B', academicYear: '2026-27', roomDefault: '301' },
  { id: '11-A', grade: '11', section: 'A', academicYear: '2026-27', roomDefault: '102' },
  { id: '11-B', grade: '11', section: 'B', academicYear: '2026-27', roomDefault: '205' },
  { id: '10-A', grade: '10', section: 'A', academicYear: '2026-27', roomDefault: '204' },
  { id: '10-C', grade: '10', section: 'C', academicYear: '2026-27', roomDefault: '301' }
];

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'PHY', name: 'Physics', department: 'Science' },
  { id: 'MAT', name: 'Mathematics', department: 'Mathematics' },
  { id: 'CHEM', name: 'Chemistry', department: 'Science' },
  { id: 'BIO', name: 'Biology', department: 'Science' },
  { id: 'CS', name: 'Computer Science', department: 'Science' },
  { id: 'ENG', name: 'English', department: 'Languages' },
  { id: 'SOC', name: 'Social Studies', department: 'Social Studies' },
  { id: 'PE', name: 'Physical Education', department: 'Sports' }
];

export const INITIAL_ROOMS: Room[] = [
  { id: '204', capacity: 40, type: 'Classroom' },
  { id: '205', capacity: 35, type: 'Laboratory' },
  { id: '301', capacity: 50, type: 'Classroom' },
  { id: '102', capacity: 40, type: 'Classroom' },
  { id: 'LAB-1', capacity: 30, type: 'Computer Lab' },
  { id: 'BIO-LAB', capacity: 35, type: 'Biology Lab' }
];

// Rich 8-period, 6-day timetable schedule across Monday to Saturday
export const INITIAL_TIMETABLE: TimetableEntry[] = [
  // 12-A (Monday to Saturday, Periods 1 to 8)
  { id: 'tt-12a-mon-1', day: 'Monday', period: 1, classId: '12-A', subjectId: 'PHY', teacherId: 'T001', roomId: '204' },
  { id: 'tt-12a-mon-2', day: 'Monday', period: 2, classId: '12-A', subjectId: 'PHY', teacherId: 'T001', roomId: '204' },
  { id: 'tt-12a-mon-3', day: 'Monday', period: 3, classId: '12-A', subjectId: 'ENG', teacherId: 'T007', roomId: '204' },
  { id: 'tt-12a-mon-4', day: 'Monday', period: 4, classId: '12-A', subjectId: 'CHEM', teacherId: 'T003', roomId: '205' },
  { id: 'tt-12a-mon-5', day: 'Monday', period: 5, classId: '12-A', subjectId: 'CS', teacherId: 'T006', roomId: 'LAB-1' },
  { id: 'tt-12a-mon-6', day: 'Monday', period: 6, classId: '12-A', subjectId: 'MAT', teacherId: 'T002', roomId: '204' },
  { id: 'tt-12a-mon-7', day: 'Monday', period: 7, classId: '12-A', subjectId: 'BIO', teacherId: 'T005', roomId: 'BIO-LAB' },
  { id: 'tt-12a-mon-8', day: 'Monday', period: 8, classId: '12-A', subjectId: 'PE', teacherId: 'T008', roomId: '204' },

  // 12-A (Tuesday)
  { id: 'tt-12a-tue-1', day: 'Tuesday', period: 1, classId: '12-A', subjectId: 'MAT', teacherId: 'T002', roomId: '204' },
  { id: 'tt-12a-tue-2', day: 'Tuesday', period: 2, classId: '12-A', subjectId: 'PHY', teacherId: 'T001', roomId: '204' },
  { id: 'tt-12a-tue-3', day: 'Tuesday', period: 3, classId: '12-A', subjectId: 'CS', teacherId: 'T006', roomId: 'LAB-1' },
  { id: 'tt-12a-tue-4', day: 'Tuesday', period: 4, classId: '12-A', subjectId: 'ENG', teacherId: 'T007', roomId: '204' },
  { id: 'tt-12a-tue-5', day: 'Tuesday', period: 5, classId: '12-A', subjectId: 'PE', teacherId: 'T008', roomId: '204' },
  { id: 'tt-12a-tue-6', day: 'Tuesday', period: 6, classId: '12-A', subjectId: 'CHEM', teacherId: 'T003', roomId: '205' },
  { id: 'tt-12a-tue-7', day: 'Tuesday', period: 7, classId: '12-A', subjectId: 'SOC', teacherId: 'T009', roomId: '204' },
  { id: 'tt-12a-tue-8', day: 'Tuesday', period: 8, classId: '12-A', subjectId: 'MAT', teacherId: 'T010', roomId: '204' },

  // 12-A (Wednesday)
  { id: 'tt-12a-wed-1', day: 'Wednesday', period: 1, classId: '12-A', subjectId: 'CHEM', teacherId: 'T003', roomId: '205' },
  { id: 'tt-12a-wed-2', day: 'Wednesday', period: 2, classId: '12-A', subjectId: 'MAT', teacherId: 'T002', roomId: '204' },
  { id: 'tt-12a-wed-3', day: 'Wednesday', period: 3, classId: '12-A', subjectId: 'PHY', teacherId: 'T001', roomId: '204' },
  { id: 'tt-12a-wed-4', day: 'Wednesday', period: 4, classId: '12-A', subjectId: 'CS', teacherId: 'T006', roomId: 'LAB-1' },
  { id: 'tt-12a-wed-5', day: 'Wednesday', period: 5, classId: '12-A', subjectId: 'ENG', teacherId: 'T007', roomId: '204' },
  { id: 'tt-12a-wed-6', day: 'Wednesday', period: 6, classId: '12-A', subjectId: 'BIO', teacherId: 'T005', roomId: 'BIO-LAB' },
  { id: 'tt-12a-wed-7', day: 'Wednesday', period: 7, classId: '12-A', subjectId: 'PHY', teacherId: 'T004', roomId: '204' },
  { id: 'tt-12a-wed-8', day: 'Wednesday', period: 8, classId: '12-A', subjectId: 'PE', teacherId: 'T008', roomId: '204' },

  // 12-A (Thursday)
  { id: 'tt-12a-thu-1', day: 'Thursday', period: 1, classId: '12-A', subjectId: 'CS', teacherId: 'T006', roomId: 'LAB-1' },
  { id: 'tt-12a-thu-2', day: 'Thursday', period: 2, classId: '12-A', subjectId: 'PHY', teacherId: 'T001', roomId: '204' },
  { id: 'tt-12a-thu-3', day: 'Thursday', period: 3, classId: '12-A', subjectId: 'MAT', teacherId: 'T002', roomId: '204' },
  { id: 'tt-12a-thu-4', day: 'Thursday', period: 4, classId: '12-A', subjectId: 'ENG', teacherId: 'T007', roomId: '204' },
  { id: 'tt-12a-thu-5', day: 'Thursday', period: 5, classId: '12-A', subjectId: 'CHEM', teacherId: 'T003', roomId: '205' },
  { id: 'tt-12a-thu-6', day: 'Thursday', period: 6, classId: '12-A', subjectId: 'SOC', teacherId: 'T009', roomId: '204' },
  { id: 'tt-12a-thu-7', day: 'Thursday', period: 7, classId: '12-A', subjectId: 'BIO', teacherId: 'T005', roomId: 'BIO-LAB' },
  { id: 'tt-12a-thu-8', day: 'Thursday', period: 8, classId: '12-A', subjectId: 'MAT', teacherId: 'T010', roomId: '204' },

  // 12-A (Friday)
  { id: 'tt-12a-fri-1', day: 'Friday', period: 1, classId: '12-A', subjectId: 'PHY', teacherId: 'T001', roomId: '204' },
  { id: 'tt-12a-fri-2', day: 'Friday', period: 2, classId: '12-A', subjectId: 'CS', teacherId: 'T006', roomId: 'LAB-1' },
  { id: 'tt-12a-fri-3', day: 'Friday', period: 3, classId: '12-A', subjectId: 'CHEM', teacherId: 'T003', roomId: '205' },
  { id: 'tt-12a-fri-4', day: 'Friday', period: 4, classId: '12-A', subjectId: 'MAT', teacherId: 'T002', roomId: '204' },
  { id: 'tt-12a-fri-5', day: 'Friday', period: 5, classId: '12-A', subjectId: 'ENG', teacherId: 'T007', roomId: '204' },
  { id: 'tt-12a-fri-6', day: 'Friday', period: 6, classId: '12-A', subjectId: 'PE', teacherId: 'T008', roomId: '204' },
  { id: 'tt-12a-fri-7', day: 'Friday', period: 7, classId: '12-A', subjectId: 'SOC', teacherId: 'T009', roomId: '204' },
  { id: 'tt-12a-fri-8', day: 'Friday', period: 8, classId: '12-A', subjectId: 'BIO', teacherId: 'T005', roomId: 'BIO-LAB' },

  // 12-A (Saturday)
  { id: 'tt-12a-sat-1', day: 'Saturday', period: 1, classId: '12-A', subjectId: 'MAT', teacherId: 'T002', roomId: '204' },
  { id: 'tt-12a-sat-2', day: 'Saturday', period: 2, classId: '12-A', subjectId: 'PHY', teacherId: 'T001', roomId: '204' },
  { id: 'tt-12a-sat-3', day: 'Saturday', period: 3, classId: '12-A', subjectId: 'CHEM', teacherId: 'T003', roomId: '205' },
  { id: 'tt-12a-sat-4', day: 'Saturday', period: 4, classId: '12-A', subjectId: 'ENG', teacherId: 'T007', roomId: '204' },
  { id: 'tt-12a-sat-5', day: 'Saturday', period: 5, classId: '12-A', subjectId: 'CS', teacherId: 'T006', roomId: 'LAB-1' },
  { id: 'tt-12a-sat-6', day: 'Saturday', period: 6, classId: '12-A', subjectId: 'SOC', teacherId: 'T009', roomId: '204' },
  { id: 'tt-12a-sat-7', day: 'Saturday', period: 7, classId: '12-A', subjectId: 'BIO', teacherId: 'T005', roomId: 'BIO-LAB' },
  { id: 'tt-12a-sat-8', day: 'Saturday', period: 8, classId: '12-A', subjectId: 'PE', teacherId: 'T008', roomId: '204' },

  // 11-B (Monday)
  { id: 'tt-11b-mon-1', day: 'Monday', period: 1, classId: '11-B', subjectId: 'MAT', teacherId: 'T010', roomId: '205' },
  { id: 'tt-11b-mon-2', day: 'Monday', period: 2, classId: '11-B', subjectId: 'CS', teacherId: 'T006', roomId: 'LAB-1' },
  { id: 'tt-11b-mon-3', day: 'Monday', period: 3, classId: '11-B', subjectId: 'PHY', teacherId: 'T001', roomId: '205' },
  { id: 'tt-11b-mon-4', day: 'Monday', period: 4, classId: '11-B', subjectId: 'MAT', teacherId: 'T002', roomId: '205' },
  { id: 'tt-11b-mon-5', day: 'Monday', period: 5, classId: '11-B', subjectId: 'PE', teacherId: 'T008', roomId: '205' },
  { id: 'tt-11b-mon-6', day: 'Monday', period: 6, classId: '11-B', subjectId: 'CHEM', teacherId: 'T003', roomId: '205' },
  { id: 'tt-11b-mon-7', day: 'Monday', period: 7, classId: '11-B', subjectId: 'ENG', teacherId: 'T007', roomId: '205' },
  { id: 'tt-11b-mon-8', day: 'Monday', period: 8, classId: '11-B', subjectId: 'SOC', teacherId: 'T009', roomId: '205' },

  // 10-A (Monday)
  { id: 'tt-10a-mon-1', day: 'Monday', period: 1, classId: '10-A', subjectId: 'ENG', teacherId: 'T007', roomId: '102' },
  { id: 'tt-10a-mon-2', day: 'Monday', period: 2, classId: '10-A', subjectId: 'MAT', teacherId: 'T002', roomId: '102' },
  { id: 'tt-10a-mon-3', day: 'Monday', period: 3, classId: '10-A', subjectId: 'CHEM', teacherId: 'T003', roomId: '102' },
  { id: 'tt-10a-mon-4', day: 'Monday', period: 4, classId: '10-A', subjectId: 'CS', teacherId: 'T006', roomId: 'LAB-1' },
  { id: 'tt-10a-mon-5', day: 'Monday', period: 5, classId: '10-A', subjectId: 'SOC', teacherId: 'T009', roomId: '102' },
  { id: 'tt-10a-mon-6', day: 'Monday', period: 6, classId: '10-A', subjectId: 'PHY', teacherId: 'T001', roomId: '102' },
  { id: 'tt-10a-mon-7', day: 'Monday', period: 7, classId: '10-A', subjectId: 'BIO', teacherId: 'T005', roomId: 'BIO-LAB' },
  { id: 'tt-10a-mon-8', day: 'Monday', period: 8, classId: '10-A', subjectId: 'PE', teacherId: 'T008', roomId: '102' }
];

export const INITIAL_ABSENCES: Absence[] = [
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
];

export const INITIAL_SUBSTITUTIONS: Substitution[] = [
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
    assignedReason: 'Same subject specialist (Physics)',
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
];

const LOCAL_STORAGE_KEY = 'school_mgmt_data_8p_v3';

export interface AppDataState {
  teachers: Teacher[];
  classes: ClassItem[];
  subjects: Subject[];
  rooms: Room[];
  timetables: TimetableEntry[];
  absences: Absence[];
  substitutions: Substitution[];
}

export function getInitialLocalData(): AppDataState {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.teachers && parsed.classes && parsed.timetables) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read local cache, using defaults', e);
  }

  return {
    teachers: INITIAL_TEACHERS,
    classes: INITIAL_CLASSES,
    subjects: INITIAL_SUBJECTS,
    rooms: INITIAL_ROOMS,
    timetables: INITIAL_TIMETABLE,
    absences: INITIAL_ABSENCES,
    substitutions: INITIAL_SUBSTITUTIONS
  };
}

export function saveLocalData(data: AppDataState): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving local data:', e);
  }

  // 1. Sync to backend API (works on localhost, dev server, node server, and vercel)
  syncToBackendAPI(data).catch(() => {
    // silent catch
  });

  // 2. Sync to Cloud Firestore master snapshot (ensures persistence across Vercel reloads & school computers)
  try {
    setDoc(doc(db, 'app_state', 'master_snapshot'), data).catch(() => {});
  } catch (e) {
    // silent catch
  }
}

// Sync full state to backend REST endpoint (/api/data)
export async function syncToBackendAPI(data: AppDataState): Promise<boolean> {
  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch (e) {
    // Expected if backend server is unreachable
    return false;
  }
}

// Load data with multi-layer priority: Firestore Snapshot -> Backend API -> Individual Collections -> LocalStorage -> Seed Defaults
export async function fetchFullAppData(): Promise<AppDataState> {
  // Layer 1: Firestore Cloud Database (Primary source of truth for Vercel & multi-device sync)
  try {
    const snapshotDoc = await getDoc(doc(db, 'app_state', 'master_snapshot'));
    if (snapshotDoc.exists()) {
      const cloudData = snapshotDoc.data() as AppDataState;
      if (cloudData && cloudData.teachers && cloudData.timetables) {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cloudData));
        } catch (e) {}
        syncToBackendAPI(cloudData).catch(() => {});
        return cloudData;
      }
    }
  } catch (e) {
    console.info('Direct firestore snapshot check note:', e);
  }

  // Layer 2: Check Backend REST API (Localhost / Express / Vercel API)
  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.teachers && json.data.classes && json.data.timetables) {
        saveLocalData(json.data);
        return json.data;
      }
    }
  } catch (e) {
    console.info('Backend API not responding yet, checking database collections');
  }

  // Layer 3: Firestore Collections fallback
  try {
    const [tSnap, cSnap, sSnap, rSnap, ttSnap, abSnap, subSnap] = await Promise.all([
      getDocs(collection(db, 'teachers')).catch(() => null),
      getDocs(collection(db, 'classes')).catch(() => null),
      getDocs(collection(db, 'subjects')).catch(() => null),
      getDocs(collection(db, 'rooms')).catch(() => null),
      getDocs(collection(db, 'timetables')).catch(() => null),
      getDocs(collection(db, 'absences')).catch(() => null),
      getDocs(collection(db, 'substitutions')).catch(() => null),
    ]);

    if (tSnap && !tSnap.empty && cSnap && !cSnap.empty && ttSnap && !ttSnap.empty) {
      const data: AppDataState = {
        teachers: tSnap.docs.map(d => ({ ...d.data(), id: d.id } as Teacher)),
        classes: (cSnap?.docs.map(d => ({ ...d.data(), id: d.id } as ClassItem))) || INITIAL_CLASSES,
        subjects: (sSnap?.docs.map(d => ({ ...d.data(), id: d.id } as Subject))) || INITIAL_SUBJECTS,
        rooms: (rSnap?.docs.map(d => ({ ...d.data(), id: d.id } as Room))) || INITIAL_ROOMS,
        timetables: (ttSnap?.docs.map(d => ({ ...d.data(), id: d.id } as TimetableEntry))) || INITIAL_TIMETABLE,
        absences: (abSnap?.docs.map(d => ({ ...d.data(), id: d.id } as Absence))) || INITIAL_ABSENCES,
        substitutions: (subSnap?.docs.map(d => ({ ...d.data(), id: d.id } as Substitution))) || INITIAL_SUBSTITUTIONS
      };
      saveLocalData(data);
      return data;
    }
  } catch (e) {
    console.warn('Firestore load failed, falling back to local storage', e);
  }

  // Layer 4: LocalStorage or Default Seed
  const fallback = getInitialLocalData();
  saveLocalData(fallback);
  return fallback;
}

export async function seedDatabase(dataToSeed?: AppDataState): Promise<void> {
  const data = dataToSeed || {
    teachers: INITIAL_TEACHERS,
    classes: INITIAL_CLASSES,
    subjects: INITIAL_SUBJECTS,
    rooms: INITIAL_ROOMS,
    timetables: INITIAL_TIMETABLE,
    absences: INITIAL_ABSENCES,
    substitutions: INITIAL_SUBSTITUTIONS
  };

  saveLocalData(data);

  // Sync to backend reset endpoint
  try {
    await fetch('/api/reset', { method: 'POST' });
  } catch (e) {
    // Ignore
  }

  // Sync to Firestore
  try {
    const batch = writeBatch(db);
    for (const t of data.teachers) {
      batch.set(doc(db, 'teachers', t.id), t);
    }
    for (const c of data.classes) {
      batch.set(doc(db, 'classes', c.id), c);
    }
    for (const s of data.subjects) {
      batch.set(doc(db, 'subjects', s.id), s);
    }
    for (const r of data.rooms) {
      batch.set(doc(db, 'rooms', r.id), r);
    }
    for (const tt of data.timetables) {
      batch.set(doc(db, 'timetables', tt.id), tt);
    }
    for (const ab of data.absences) {
      batch.set(doc(db, 'absences', ab.id), ab);
    }
    for (const sub of data.substitutions) {
      batch.set(doc(db, 'substitutions', sub.id), sub);
    }
    await batch.commit();
  } catch (e) {
    console.warn('Seed Firestore note:', e);
  }
}

export async function syncDocToFirestore(collName: string, id: string, data: any): Promise<void> {
  try {
    await setDoc(doc(db, collName, id), data);
  } catch (e) {
    // silent fallback
  }
}

export async function deleteDocFromFirestore(collName: string, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, collName, id));
  } catch (e) {
    // silent fallback
  }
}
