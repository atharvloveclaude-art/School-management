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
  lastSaved?: number;
}

let autoSaveTimer: any = null;
type AutoSaveStatusListener = (status: 'idle' | 'saving' | 'saved' | 'error', lastSavedTime?: string) => void;
const autoSaveListeners: Set<AutoSaveStatusListener> = new Set();

export function subscribeToAutoSaveStatus(listener: AutoSaveStatusListener): () => void {
  autoSaveListeners.add(listener);
  return () => autoSaveListeners.delete(listener);
}

function notifyAutoSaveStatus(status: 'idle' | 'saving' | 'saved' | 'error', time?: string) {
  autoSaveListeners.forEach((fn) => fn(status, time));
}

export function getInitialLocalData(): AppDataState {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.teachers && parsed.classes && parsed.timetables && parsed.timetables.length > 0) {
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
    substitutions: INITIAL_SUBSTITUTIONS,
    lastSaved: Date.now()
  };
}

export function saveLocalData(data: AppDataState): void {
  try {
    const stateToSave = {
      ...data,
      lastSaved: Date.now()
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (e) {
    console.error('Error saving local data:', e);
  }

  // Sync to backend Express API
  syncToBackendAPI(data).catch(() => {});
}

/**
 * Triggers an automatic debounced background save to Firestore Cloud Database
 */
export function triggerAutoSaveToCloud(data: AppDataState): void {
  // 1. Immediately save to LocalStorage & Express backend
  saveLocalData(data);
  notifyAutoSaveStatus('saving');

  // 2. Debounced push to Firestore master snapshot & collections
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }

  autoSaveTimer = setTimeout(async () => {
    try {
      const ok = await pushFullStateToCloud(data);
      if (ok) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        notifyAutoSaveStatus('saved', timeStr);
      } else {
        notifyAutoSaveStatus('idle');
      }
    } catch (err) {
      console.warn('Auto-save background note:', err);
      notifyAutoSaveStatus('idle');
    }
  }, 600);
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

// Recursively strips undefined keys and nested undefined values for Firestore compatibility
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && data !== null) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned;
  }
  return data;
}

/**
 * Fetch full database by pulling all live individual documents from Firestore and merging with local cache.
 * This guarantees that entries added are NEVER lost on page reload!
 */
export async function fetchFullAppData(): Promise<AppDataState> {
  const localCache = getInitialLocalData();

  // Layer 1: Master Snapshot from Firestore
  let cloudSnapshot: AppDataState | null = null;
  try {
    const snapshotDoc = await getDoc(doc(db, 'app_state', 'master_snapshot')).catch(() => null);
    if (snapshotDoc && snapshotDoc.exists()) {
      cloudSnapshot = snapshotDoc.data() as AppDataState;
    }
  } catch (e) {
    console.info('Master snapshot check note:', e);
  }

  // Layer 2: Pull live documents from all individual Firestore collections
  let collectionData: Partial<AppDataState> | null = null;
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
      collectionData = {
        teachers: tSnap && !tSnap.empty ? tSnap.docs.map((d) => ({ ...d.data(), id: d.id } as Teacher)) : undefined,
        classes: cSnap && !cSnap.empty ? cSnap.docs.map((d) => ({ ...d.data(), id: d.id } as ClassItem)) : undefined,
        subjects: sSnap && !sSnap.empty ? sSnap.docs.map((d) => ({ ...d.data(), id: d.id } as Subject)) : undefined,
        timetables: ttSnap && !ttSnap.empty ? ttSnap.docs.map((d) => ({ ...d.data(), id: d.id } as TimetableEntry)) : undefined,
        absences: abSnap && !abSnap.empty ? abSnap.docs.map((d) => ({ ...d.data(), id: d.id } as Absence)) : undefined,
        substitutions: subSnap && !subSnap.empty ? subSnap.docs.map((d) => ({ ...d.data(), id: d.id } as Substitution)) : undefined,
      };
    }
  } catch (e) {
    console.warn('Firestore live collections fetch note:', e);
  }

  // Layer 3: Backend REST API fallback check
  let backendData: AppDataState | null = null;
  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.timetables && json.data.timetables.length > 0) {
        backendData = json.data;
      }
    }
  } catch (e) {
    // ignore
  }

  // Determine primary candidate
  let candidate: AppDataState = localCache;
  if (cloudSnapshot && cloudSnapshot.timetables && cloudSnapshot.timetables.length > 0) {
    candidate = cloudSnapshot;
  } else if (collectionData && collectionData.timetables && collectionData.timetables.length > 0) {
    candidate = {
      teachers: collectionData.teachers || localCache.teachers,
      classes: collectionData.classes || localCache.classes,
      subjects: collectionData.subjects || localCache.subjects,
      timetables: collectionData.timetables || localCache.timetables,
      absences: collectionData.absences || localCache.absences,
      substitutions: collectionData.substitutions || localCache.substitutions,
    };
  } else if (backendData) {
    candidate = backendData;
  }

  // Merge candidate with localCache:
  // If localCache has entries created/edited by user, preserve them cleanly!
  const mergedTimetablesMap = new Map<string, TimetableEntry>();
  (candidate.timetables || []).forEach((t) => mergedTimetablesMap.set(t.id, t));
  (localCache.timetables || []).forEach((t) => {
    // If candidate doesn't have it or local is fresh, preserve local entry
    if (!mergedTimetablesMap.has(t.id)) {
      mergedTimetablesMap.set(t.id, t);
    }
  });

  // Merge teachers, classes, subjects
  const mergedTeachersMap = new Map<string, Teacher>();
  (candidate.teachers || []).forEach((t) => mergedTeachersMap.set(t.id, t));
  (localCache.teachers || []).forEach((t) => mergedTeachersMap.set(t.id, t));

  const mergedClassesMap = new Map<string, ClassItem>();
  (candidate.classes || []).forEach((c) => mergedClassesMap.set(c.id, c));
  (localCache.classes || []).forEach((c) => mergedClassesMap.set(c.id, c));

  const mergedSubjectsMap = new Map<string, Subject>();
  (candidate.subjects || []).forEach((s) => mergedSubjectsMap.set(s.id, s));
  (localCache.subjects || []).forEach((s) => mergedSubjectsMap.set(s.id, s));

  const finalState: AppDataState = {
    teachers: Array.from(mergedTeachersMap.values()),
    classes: Array.from(mergedClassesMap.values()),
    subjects: Array.from(mergedSubjectsMap.values()),
    timetables: Array.from(mergedTimetablesMap.values()),
    absences: candidate.absences && candidate.absences.length > 0 ? candidate.absences : (localCache.absences || []),
    substitutions: candidate.substitutions && candidate.substitutions.length > 0 ? candidate.substitutions : (localCache.substitutions || []),
    lastSaved: Date.now()
  };

  saveLocalData(finalState);
  return finalState;
}

/**
 * Pushes the full current in-memory dataset directly into Firestore document collections.
 * Use this when recovering data or synchronizing an active working tab.
 */
export async function pushFullStateToCloud(data: AppDataState): Promise<boolean> {
  try {
    saveLocalData(data);

    // Sanitize state data so Firestore never receives undefined properties
    const sanitized = sanitizeForFirestore(data);

    // 1. Update master snapshot doc first
    try {
      await setDoc(doc(db, 'app_state', 'master_snapshot'), sanitized);
    } catch (snapErr) {
      console.warn('Master snapshot update note:', snapErr);
    }

    // 2. Queue all individual document operations
    const operations: { coll: string; id: string; docData: any }[] = [];

    sanitized.teachers.forEach((t) => operations.push({ coll: 'teachers', id: t.id, docData: t }));
    sanitized.classes.forEach((c) => operations.push({ coll: 'classes', id: c.id, docData: c }));
    sanitized.subjects.forEach((s) => operations.push({ coll: 'subjects', id: s.id, docData: s }));
    sanitized.timetables.forEach((tt) => operations.push({ coll: 'timetables', id: tt.id, docData: tt }));
    sanitized.absences.forEach((ab) => operations.push({ coll: 'absences', id: ab.id, docData: ab }));
    sanitized.substitutions.forEach((sub) => operations.push({ coll: 'substitutions', id: sub.id, docData: sub }));

    // Chunk into batches of up to 400 operations (under the 500 Firestore limit)
    const CHUNK_SIZE = 400;
    for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
      const chunk = operations.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((op) => {
        batch.set(doc(db, op.coll, op.id), op.docData);
      });
      await batch.commit();
    }

    await syncToBackendAPI(sanitized);
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
    const sanitized = sanitizeForFirestore(data);
    await setDoc(doc(db, collName, id), sanitized);
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
