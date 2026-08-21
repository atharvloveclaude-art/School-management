import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Teacher,
  ClassItem,
  Subject,
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
  { id: '9-A', grade: '9', section: 'A', academicYear: '2026-27' },
  { id: '9-B', grade: '9', section: 'B', academicYear: '2026-27' },
  { id: '10-A', grade: '10', section: 'A', academicYear: '2026-27' },
  { id: '10-C', grade: '10', section: 'C', academicYear: '2026-27' },
  { id: '11-A', grade: '11', section: 'A', academicYear: '2026-27' },
  { id: '11-B', grade: '11', section: 'B', academicYear: '2026-27' },
  { id: '12-A', grade: '12', section: 'A', academicYear: '2026-27' },
  { id: '12-B', grade: '12', section: 'B', academicYear: '2026-27' }
];

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'PHY', name: 'Physics', department: 'Science' },
  { id: 'MAT', name: 'Mathematics', department: 'Mathematics' },
  { id: 'CHEM', name: 'Chemistry', department: 'Science' },
  { id: 'BIO', name: 'Biology', department: 'Science' },
  { id: 'CS', name: 'Computer Science', department: 'Science' },
  { id: 'ENG', name: 'English', department: 'Languages' },
  { id: 'SOC', name: 'Social Studies', department: 'Arts' },
  { id: 'PE', name: 'Physical Education', department: 'Sports' },
  { id: 'HIN', name: 'Hindi', department: 'Languages' },
  { id: 'SAN', name: 'Sanskrit', department: 'Languages' },
  { id: 'FRE', name: 'French', department: 'Languages' },
  { id: 'AI', name: 'Artificial Intelligence', department: 'Computer Science' },
  { id: 'ART', name: 'Art Education', department: 'Arts' },
  { id: 'KV', name: 'Kaushal Vikas', department: 'Vocational' },
  { id: 'NEEV', name: 'NEEV', department: 'Foundation' }
];

export const INITIAL_TIMETABLE: TimetableEntry[] = [
  { id: 'tt-12a-mon-1', day: 'Monday', period: 1, classId: '12-A', subjectId: 'PHY', teacherId: 'T001' },
  { id: 'tt-12a-mon-2', day: 'Monday', period: 2, classId: '12-A', subjectId: 'PHY', teacherId: 'T001' },
  { id: 'tt-12a-mon-3', day: 'Monday', period: 3, classId: '12-A', subjectId: 'ENG', teacherId: 'T007' },
  { id: 'tt-12a-mon-4', day: 'Monday', period: 4, classId: '12-A', subjectId: 'CHEM', teacherId: 'T003' },
  { id: 'tt-12a-mon-5', day: 'Monday', period: 5, classId: '12-A', subjectId: 'CS', teacherId: 'T006' },
  { id: 'tt-12a-mon-6', day: 'Monday', period: 6, classId: '12-A', subjectId: 'MAT', teacherId: 'T002' },
  { id: 'tt-12a-mon-7', day: 'Monday', period: 7, classId: '12-A', subjectId: 'BIO', teacherId: 'T005' },
  { id: 'tt-12a-mon-8', day: 'Monday', period: 8, classId: '12-A', subjectId: 'PE', teacherId: 'T008' }
];

export const INITIAL_ABSENCES: Absence[] = [];

export const INITIAL_SUBSTITUTIONS: Substitution[] = [];

const LOCAL_STORAGE_KEY = 'school_mgmt_data_8p_v4';

export interface AppDataState {
  teachers: Teacher[];
  classes: ClassItem[];
  subjects: Subject[];
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

  // Sync to backend API
  syncToBackendAPI(data).catch(() => {});
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
    return false;
  }
}

/**
 * Fetch full database by pulling all live individual documents from Firestore.
 * This guarantees that entries added by Laptop A, Laptop B, and Laptop C are ALL combined!
 */
export async function fetchFullAppData(): Promise<AppDataState> {
  // Layer 1: Pull live documents from all individual Firestore collections
  try {
    const [tSnap, cSnap, sSnap, ttSnap, abSnap, subSnap] = await Promise.all([
      getDocs(collection(db, 'teachers')).catch(() => null),
      getDocs(collection(db, 'classes')).catch(() => null),
      getDocs(collection(db, 'subjects')).catch(() => null),
      getDocs(collection(db, 'timetables')).catch(() => null),
      getDocs(collection(db, 'absences')).catch(() => null),
      getDocs(collection(db, 'substitutions')).catch(() => null),
    ]);

    const hasAnyDocs =
      (tSnap && !tSnap.empty) ||
      (ttSnap && !ttSnap.empty) ||
      (cSnap && !cSnap.empty) ||
      (sSnap && !sSnap.empty);

    if (hasAnyDocs) {
      const teachers = (tSnap && !tSnap.empty)
        ? tSnap.docs.map(d => ({ ...d.data(), id: d.id } as Teacher))
        : INITIAL_TEACHERS;

      const classes = (cSnap && !cSnap.empty)
        ? cSnap.docs.map(d => ({ ...d.data(), id: d.id } as ClassItem))
        : INITIAL_CLASSES;

      const subjects = (sSnap && !sSnap.empty)
        ? sSnap.docs.map(d => ({ ...d.data(), id: d.id } as Subject))
        : INITIAL_SUBJECTS;

      const timetables = (ttSnap && !ttSnap.empty)
        ? ttSnap.docs.map(d => ({ ...d.data(), id: d.id } as TimetableEntry))
        : INITIAL_TIMETABLE;

      const absences = (abSnap && !abSnap.empty)
        ? abSnap.docs.map(d => ({ ...d.data(), id: d.id } as Absence))
        : INITIAL_ABSENCES;

      const substitutions = (subSnap && !subSnap.empty)
        ? subSnap.docs.map(d => ({ ...d.data(), id: d.id } as Substitution))
        : INITIAL_SUBSTITUTIONS;

      const combined: AppDataState = {
        teachers,
        classes,
        subjects,
        timetables,
        absences,
        substitutions
      };

      saveLocalData(combined);
      return combined;
    }
  } catch (e) {
    console.warn('Firestore live collections fetch note:', e);
  }

  // Layer 2: Master Snapshot fallback
  try {
    const snapshotDoc = await getDoc(doc(db, 'app_state', 'master_snapshot'));
    if (snapshotDoc.exists()) {
      const cloudData = snapshotDoc.data() as AppDataState;
      if (cloudData && cloudData.teachers && cloudData.timetables && cloudData.timetables.length > 0) {
        saveLocalData(cloudData);
        return cloudData;
      }
    }
  } catch (e) {
    console.info('Master snapshot check note:', e);
  }

  // Layer 3: Backend REST API
  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.timetables && json.data.timetables.length > 0) {
        saveLocalData(json.data);
        return json.data;
      }
    }
  } catch (e) {
    // ignore
  }

  // Layer 4: LocalStorage Cache or Default Seed
  const fallback = getInitialLocalData();
  saveLocalData(fallback);
  return fallback;
}

/**
 * Pushes the full current in-memory dataset directly into Firestore document collections.
 * Use this when recovering data or synchronizing an active working tab.
 */
export async function pushFullStateToCloud(data: AppDataState): Promise<boolean> {
  try {
    saveLocalData(data);

    // 1. Write batch for collections (up to 500 ops per batch)
    const batch = writeBatch(db);

    data.teachers.forEach((t) => {
      batch.set(doc(db, 'teachers', t.id), t);
    });
    data.classes.forEach((c) => {
      batch.set(doc(db, 'classes', c.id), c);
    });
    data.subjects.forEach((s) => {
      batch.set(doc(db, 'subjects', s.id), s);
    });
    data.timetables.forEach((tt) => {
      batch.set(doc(db, 'timetables', tt.id), tt);
    });
    data.absences.forEach((ab) => {
      batch.set(doc(db, 'absences', ab.id), ab);
    });
    data.substitutions.forEach((sub) => {
      batch.set(doc(db, 'substitutions', sub.id), sub);
    });

    // Also update snapshot
    batch.set(doc(db, 'app_state', 'master_snapshot'), data);

    await batch.commit();
    await syncToBackendAPI(data);
    return true;
  } catch (e) {
    console.error('Error pushing full state to cloud:', e);
    return false;
  }
}

/**
 * Subscribes to Real-Time Timetable changes from Firestore.
 * When Laptop A adds an entry, Laptop B and Laptop C automatically receive it in real-time!
 */
export function subscribeToRealtimeCloud(
  onUpdate: (data: Partial<AppDataState>) => void
): Unsubscribe {
  const unsubTimetables = onSnapshot(collection(db, 'timetables'), (snap) => {
    if (!snap.empty) {
      const timetables = snap.docs.map((d) => ({ ...d.data(), id: d.id } as TimetableEntry));
      onUpdate({ timetables });
    }
  }, (err) => console.warn('Timetable realtime sub note:', err));

  const unsubTeachers = onSnapshot(collection(db, 'teachers'), (snap) => {
    if (!snap.empty) {
      const teachers = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Teacher));
      onUpdate({ teachers });
    }
  }, (err) => console.warn('Teacher realtime sub note:', err));

  const unsubClasses = onSnapshot(collection(db, 'classes'), (snap) => {
    if (!snap.empty) {
      const classes = snap.docs.map((d) => ({ ...d.data(), id: d.id } as ClassItem));
      onUpdate({ classes });
    }
  }, (err) => console.warn('Classes realtime sub note:', err));

  const unsubSubjects = onSnapshot(collection(db, 'subjects'), (snap) => {
    if (!snap.empty) {
      const subjects = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Subject));
      onUpdate({ subjects });
    }
  }, (err) => console.warn('Subjects realtime sub note:', err));

  const unsubAbsences = onSnapshot(collection(db, 'absences'), (snap) => {
    const absences = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Absence));
    onUpdate({ absences });
  }, (err) => console.warn('Absences realtime sub note:', err));

  const unsubSubstitutions = onSnapshot(collection(db, 'substitutions'), (snap) => {
    const substitutions = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Substitution));
    onUpdate({ substitutions });
  }, (err) => console.warn('Substitutions realtime sub note:', err));

  return () => {
    unsubTimetables();
    unsubTeachers();
    unsubClasses();
    unsubSubjects();
    unsubAbsences();
    unsubSubstitutions();
  };
}

export async function seedDatabase(dataToSeed?: AppDataState): Promise<void> {
  const data = dataToSeed || {
    teachers: INITIAL_TEACHERS,
    classes: INITIAL_CLASSES,
    subjects: INITIAL_SUBJECTS,
    timetables: INITIAL_TIMETABLE,
    absences: INITIAL_ABSENCES,
    substitutions: INITIAL_SUBSTITUTIONS
  };

  await pushFullStateToCloud(data);
}

export async function syncDocToFirestore(collName: string, id: string, data: any): Promise<void> {
  try {
    await setDoc(doc(db, collName, id), data);
  } catch (e) {
    console.warn(`Firestore sync note for ${collName}/${id}:`, e);
  }
}

export async function deleteDocFromFirestore(collName: string, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, collName, id));
  } catch (e) {
    console.warn(`Firestore delete note for ${collName}/${id}:`, e);
  }
}
