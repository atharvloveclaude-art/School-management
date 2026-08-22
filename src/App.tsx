import React, { useState, useEffect } from 'react';
import {
  UserRole,
  Teacher,
  ClassItem,
  Subject,
  TimetableEntry,
  Absence,
  Substitution,
  AffectedPeriod
} from './types';
import {
  fetchFullAppData,
  seedDatabase,
  saveLocalData,
  getInitialLocalData,
  pushFullStateToCloud,
  triggerAutoSaveToCloud,
  subscribeToAutoSaveStatus,
  subscribeToRealtimeCloud,
  syncDocToFirestore,
  deleteDocFromFirestore,
  AppDataState
} from './services/dataService';
import {
  findAffectedPeriods,
  getDayOfWeekFromDate,
  autoAssignSubstitutions
} from './services/substitutionService';
import {
  deduplicateTimetable,
  deduplicateSubstitutions,
  deduplicateAbsences
} from './services/conflictService';
import { HeaderNav } from './components/HeaderNav';
import { DailySubstituteDesk } from './components/DailySubstituteDesk';
import { TimetableGrid } from './components/TimetableGrid';
import { TimetableModal } from './components/TimetableModal';
import { DirectorySetupView } from './components/DirectorySetupView';
import { AssignSubstituteModal } from './components/AssignSubstituteModal';
import { TeacherDashboardView } from './components/TeacherDashboardView';
import { StudentDashboardView } from './components/StudentDashboardView';
import { PrintSubstitutedTeachersModal } from './components/PrintSubstitutedTeachersModal';

export default function App() {
  const [role, setRole] = useState<UserRole>('admin');
  const [currentTab, setCurrentTab] = useState<string>('substitutions');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(() => {
    return localStorage.getItem('school_anon_mode') === 'true';
  });

  // Modal States
  const [isPrintRosterOpen, setIsPrintRosterOpen] = useState<boolean>(false);
  const [printRosterDate, setPrintRosterDate] = useState<string>('2026-08-17');
  const [activeTimetableEntry, setActiveTimetableEntry] = useState<Partial<TimetableEntry> | null>(null);
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState<boolean>(false);
  const [activeAssignSub, setActiveAssignSub] = useState<Substitution | null>(null);

  // Core App Data (instant local cache initialization)
  const initialData = getInitialLocalData();
  const [teachers, setTeachers] = useState<Teacher[]>(() => initialData.teachers || []);
  const [classes, setClasses] = useState<ClassItem[]>(() => initialData.classes || []);
  const [subjects, setSubjects] = useState<Subject[]>(() => initialData.subjects || []);
  const [timetables, setTimetables] = useState<TimetableEntry[]>(() => initialData.timetables || []);
  const [absences, setAbsences] = useState<Absence[]>(() => initialData.absences || []);
  const [substitutions, setSubstitutions] = useState<Substitution[]>(() => initialData.substitutions || []);

  // Selected for teacher/student portals
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('T001');
  const [selectedClassId, setSelectedClassId] = useState<string>('12-A');

  // Notifications & Auto-Save State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('success');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  useEffect(() => {
    const unsub = subscribeToAutoSaveStatus((status, time) => {
      setAutoSaveStatus(status);
      if (time) setLastSavedTime(time);
    });
    return unsub;
  }, []);

  // Initialize data on mount & subscribe to real-time updates across multiple laptops
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setIsSyncing(true);
      try {
        const fullData = await fetchFullAppData();
        if (mounted) {
          const { cleaned: cleanTimetables, removedIds: removedTTIds } = deduplicateTimetable(fullData.timetables);
          if (removedTTIds.length > 0) {
            removedTTIds.forEach((id) => deleteDocFromFirestore('timetables', id));
          }

          const currentTeachers = fullData.teachers;

          // Deduplicate and purge orphan/duplicate absences
          const { cleaned: cleanAbsences, removedIds: removedAbsIds } = deduplicateAbsences(
            fullData.absences || [],
            currentTeachers
          );
          if (removedAbsIds.length > 0) {
            removedAbsIds.forEach((id) => deleteDocFromFirestore('absences', id));
          }

          // Deduplicate and purge orphan/duplicate substitutions (must match an active absence)
          const { cleaned: cleanSubs, removedIds: removedSubIds } = deduplicateSubstitutions(
            fullData.substitutions || [],
            currentTeachers,
            cleanAbsences
          );
          if (removedSubIds.length > 0) {
            removedSubIds.forEach((id) => deleteDocFromFirestore('substitutions', id));
          }

          setTeachers(currentTeachers);
          setClasses(fullData.classes);
          setSubjects(fullData.subjects);
          setTimetables(cleanTimetables);
          setAbsences(cleanAbsences);
          setSubstitutions(cleanSubs);
          if (currentTeachers[0]) setSelectedTeacherId(currentTeachers[0].id);
          if (fullData.classes[0]) setSelectedClassId(fullData.classes[0].id);
        }
      } catch (e) {
        console.error('Data initialization error:', e);
      } finally {
        if (mounted) setIsSyncing(false);
      }
    }
    loadData();

    // Real-time synchronization across multiple devices/laptops
    const unsubscribe = subscribeToRealtimeCloud((changes) => {
      if (!mounted) return;
      if (changes.timetables && changes.timetables.length > 0) {
        const { cleaned } = deduplicateTimetable(changes.timetables);
        setTimetables(cleaned);
      }
      if (changes.teachers && changes.teachers.length > 0) setTeachers(changes.teachers);
      if (changes.classes && changes.classes.length > 0) setClasses(changes.classes);
      if (changes.subjects && changes.subjects.length > 0) setSubjects(changes.subjects);
      if (changes.absences) {
        setTeachers((latestTeachers) => {
          const { cleaned } = deduplicateAbsences(changes.absences || [], latestTeachers);
          setAbsences(cleaned);
          return latestTeachers;
        });
      }
      if (changes.substitutions) {
        setTeachers((latestTeachers) => {
          const { cleaned } = deduplicateSubstitutions(changes.substitutions || [], latestTeachers);
          setSubstitutions(cleaned);
          return latestTeachers;
        });
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const showToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Push whatever is in the current open tab directly into Cloud Firestore
  const handlePushActiveTabToCloud = async () => {
    setIsSyncing(true);
    const currentData: AppDataState = {
      teachers,
      classes,
      subjects,
      timetables,
      absences,
      substitutions
    };

    const success = await pushFullStateToCloud(currentData);
    setIsSyncing(false);

    if (success) {
      showToast(
        `☁️ Success! Synced ${timetables.length} timetable periods and ${teachers.length} teachers to Cloud. All other laptops will now see this instantly!`
      );
    } else {
      showToast('Cloud database sync warning, data saved in local cache.', 'info');
    }
  };

  const handleRefreshFromCloud = async () => {
    setIsSyncing(true);
    const freshData = await fetchFullAppData();
    setTeachers(freshData.teachers);
    setClasses(freshData.classes);
    setSubjects(freshData.subjects);
    setTimetables(freshData.timetables);
    setAbsences(freshData.absences);
    setSubstitutions(freshData.substitutions);
    setIsSyncing(false);
    showToast(`🔄 Refreshed ${freshData.timetables.length} timetable entries from cloud database.`);
  };

  const handleToggleAnonymous = () => {
    const next = !isAnonymous;
    setIsAnonymous(next);
    localStorage.setItem('school_anon_mode', String(next));
    showToast(next ? 'Anonymous mode enabled (Staff codes active).' : 'Standard mode enabled (Staff names active).');
  };

  const updateAppData = (changes: Partial<AppDataState>) => {
    const nextState: AppDataState = {
      teachers: changes.teachers || teachers,
      classes: changes.classes || classes,
      subjects: changes.subjects || subjects,
      timetables: changes.timetables || timetables,
      absences: changes.absences || absences,
      substitutions: changes.substitutions || substitutions,
      lastSaved: Date.now()
    };

    if (changes.teachers) setTeachers(changes.teachers);
    if (changes.classes) setClasses(changes.classes);
    if (changes.subjects) setSubjects(changes.subjects);
    if (changes.timetables) setTimetables(changes.timetables);
    if (changes.absences) setAbsences(changes.absences);
    if (changes.substitutions) setSubstitutions(changes.substitutions);

    triggerAutoSaveToCloud(nextState);
  };

  // Reset to default 8-period seed dataset
  const handleResetData = async () => {
    if (window.confirm('Reset application to default 8-period, 6-day timetable dataset? This will restore sample faculty and schedule.')) {
      setIsSyncing(true);
      await seedDatabase();
      const freshData = await fetchFullAppData();
      setTeachers(freshData.teachers);
      setClasses(freshData.classes);
      setSubjects(freshData.subjects);
      setTimetables(freshData.timetables);
      setAbsences(freshData.absences);
      setSubstitutions(freshData.substitutions);
      setIsSyncing(false);
      showToast('Successfully restored default 8-period school data.');
    }
  };

  // Timetable CRUD
  const handleSaveTimetableEntry = (entry: TimetableEntry) => {
    // Find if an entry already exists for this exact same slot (class + day + period + batch/subject + frequency)
    const existingSlotIndex = timetables.findIndex(
      (t) =>
        t.id === entry.id ||
        (t.classId === entry.classId &&
          t.day === entry.day &&
          Number(t.period) === Number(entry.period) &&
          (t.batch || t.subjectId) === (entry.batch || entry.subjectId) &&
          t.teacherId === entry.teacherId &&
          (t.frequency || 'all') === (entry.frequency || 'all'))
    );

    let updated: TimetableEntry[];
    if (existingSlotIndex >= 0) {
      const oldEntry = timetables[existingSlotIndex];
      if (oldEntry.id !== entry.id) {
        deleteDocFromFirestore('timetables', oldEntry.id);
      }
      updated = [...timetables];
      updated[existingSlotIndex] = entry;
    } else {
      updated = [...timetables, entry];
    }

    const { cleaned, removedIds } = deduplicateTimetable(updated);
    removedIds.forEach((id) => deleteDocFromFirestore('timetables', id));

    updateAppData({ timetables: cleaned });
    syncDocToFirestore('timetables', entry.id, entry);
    setIsTimetableModalOpen(false);
    setActiveTimetableEntry(null);
    showToast(`Timetable period for Class ${entry.classId} (${entry.day} Period ${entry.period}) saved.`);
  };

  const handleDeleteTimetableEntry = (id: string) => {
    const updated = timetables.filter((t) => t.id !== id);
    updateAppData({ timetables: updated });
    deleteDocFromFirestore('timetables', id);
    setIsTimetableModalOpen(false);
    setActiveTimetableEntry(null);
    showToast('Timetable entry deleted.');
  };

  const handleCleanDuplicateConflicts = () => {
    const { cleaned, removedIds } = deduplicateTimetable(timetables);
    removedIds.forEach((id) => deleteDocFromFirestore('timetables', id));
    updateAppData({ timetables: cleaned });
    pushFullStateToCloud({
      teachers,
      classes,
      subjects,
      timetables: cleaned,
      absences,
      substitutions
    });
    showToast(`🧹 Cleaned ${removedIds.length} duplicate entries! Timetable is now conflict-free.`);
  };

  // Bulk Import Handlers
  const handleImportTeachers = (newTeachers: Teacher[], replace: boolean) => {
    const finalTeachers = replace ? newTeachers : [...teachers.filter((t) => !newTeachers.some((nt) => nt.id === t.id)), ...newTeachers];
    updateAppData({ teachers: finalTeachers });
    newTeachers.forEach((t) => syncDocToFirestore('teachers', t.id, t));
    showToast(`Imported ${newTeachers.length} teachers successfully!`);
  };

  const handleImportTimetable = (newEntries: TimetableEntry[], replace: boolean) => {
    const combined = replace ? newEntries : [...timetables, ...newEntries];
    const { cleaned, removedIds } = deduplicateTimetable(combined);
    removedIds.forEach((id) => deleteDocFromFirestore('timetables', id));

    updateAppData({ timetables: cleaned });
    cleaned.forEach((tt) => syncDocToFirestore('timetables', tt.id, tt));
    showToast(`Imported ${newEntries.length} timetable periods successfully!`);
  };

  const handleImportFullSetup = (fullData: any) => {
    updateAppData({
      teachers: fullData.teachers || teachers,
      classes: fullData.classes || classes,
      subjects: fullData.subjects || subjects,
      timetables: fullData.timetables || timetables
    });
    seedDatabase(fullData);
    showToast('Full system configuration restored!');
  };

  // Teacher CRUD
  const handleSaveTeacher = (teacher: Teacher) => {
    const existing = teachers.findIndex((t) => t.id === teacher.id);
    let updated: Teacher[];
    if (existing >= 0) {
      updated = [...teachers];
      updated[existing] = teacher;
    } else {
      updated = [...teachers, teacher];
    }
    updateAppData({ teachers: updated });
    syncDocToFirestore('teachers', teacher.id, teacher);
    showToast(`Teacher ${teacher.name} saved.`);
  };

  const handleDeleteTeacher = (id: string) => {
    const updated = teachers.filter((t) => t.id !== id);
    updateAppData({ teachers: updated });
    deleteDocFromFirestore('teachers', id);
    showToast('Teacher record deleted.');
  };

  // Class CRUD
  const handleSaveClass = (cls: ClassItem) => {
    const existing = classes.findIndex((c) => c.id === cls.id);
    let updated: ClassItem[];
    if (existing >= 0) {
      updated = [...classes];
      updated[existing] = cls;
    } else {
      updated = [...classes, cls];
    }
    updateAppData({ classes: updated });
    syncDocToFirestore('classes', cls.id, cls);
    showToast(`Class ${cls.id} saved.`);
  };

  const handleDeleteClass = (id: string) => {
    const updated = classes.filter((c) => c.id !== id);
    updateAppData({ classes: updated });
    deleteDocFromFirestore('classes', id);
    showToast('Class deleted.');
  };

  // Subject CRUD
  const handleSaveSubject = (subj: Subject) => {
    const existing = subjects.findIndex((s) => s.id === subj.id);
    let updated: Subject[];
    if (existing >= 0) {
      updated = [...subjects];
      updated[existing] = subj;
    } else {
      updated = [...subjects, subj];
    }
    updateAppData({ subjects: updated });
    syncDocToFirestore('subjects', subj.id, subj);
    showToast(`Subject ${subj.name} saved.`);
  };

  const handleDeleteSubject = (id: string) => {
    const updated = subjects.filter((s) => s.id !== id);
    updateAppData({ subjects: updated });
    deleteDocFromFirestore('subjects', id);
    showToast('Subject deleted.');
  };

  // Single Absence & Substitute Creation
  const handleMarkAbsent = (
    teacherId: string,
    teacherName: string,
    date: string,
    reason: string,
    affectedPeriods: AffectedPeriod[]
  ) => {
    const dayOfWeek = getDayOfWeekFromDate(date);
    const cleanDate = date.replace(/[^0-9]/g, '');
    const newAbsenceId = `abs-${cleanDate}-${teacherId.toLowerCase()}`;

    // Remove any previous absence record for this teacher on this same date
    const prevAbsence = absences.find((a) => a.teacherId === teacherId && a.date === date);
    let baseAbsences = absences;
    let baseSubs = substitutions;
    if (prevAbsence) {
      baseAbsences = baseAbsences.filter((a) => a.id !== prevAbsence.id);
      const oldSubs = baseSubs.filter((s) => s.absenceId === prevAbsence.id);
      baseSubs = baseSubs.filter((s) => s.absenceId !== prevAbsence.id);
      deleteDocFromFirestore('absences', prevAbsence.id);
      oldSubs.forEach((s) => deleteDocFromFirestore('substitutions', s.id));
    }

    const newAbsence: Absence = {
      id: newAbsenceId,
      teacherId,
      teacherName,
      date,
      dayOfWeek,
      reason,
      createdAt: new Date().toISOString(),
      affectedPeriodsCount: affectedPeriods.length
    };

    const newSubstitutions: Substitution[] = affectedPeriods.map((ap) => {
      const cleanClass = ap.classId.toLowerCase().replace(/[^a-z0-9]/g, '');
      const batchSlug = (ap.batch || ap.subjectId).toLowerCase().replace(/[^a-z0-9]/g, '');
      const teacherSlug = teacherId.toLowerCase().replace(/[^a-z0-9]/g, '');
      const subId = `sub-${cleanDate}-p${ap.period}-${cleanClass}-${batchSlug}-${teacherSlug}`;
      return {
        id: subId,
        absenceId: newAbsenceId,
        date,
        day: dayOfWeek,
        period: ap.period,
        classId: ap.classId,
        subjectId: ap.subjectId,
        subjectName: ap.subjectName,
        originalTeacherId: teacherId,
        originalTeacherName: teacherName,
        batch: ap.batch,
        frequency: ap.frequency,
        status: 'Pending'
      };
    });

    const combinedAbsences = [newAbsence, ...baseAbsences];
    const combinedSubs = [...newSubstitutions, ...baseSubs];

    const { cleaned: cleanAbs, removedIds: removedAbsIds } = deduplicateAbsences(combinedAbsences, teachers);
    removedAbsIds.forEach((id) => deleteDocFromFirestore('absences', id));

    const { cleaned: cleanSubs, removedIds: removedSubIds } = deduplicateSubstitutions(combinedSubs, teachers);
    removedSubIds.forEach((id) => deleteDocFromFirestore('substitutions', id));

    updateAppData({
      absences: cleanAbs,
      substitutions: cleanSubs
    });

    syncDocToFirestore('absences', newAbsence.id, newAbsence);
    newSubstitutions.forEach((sub) => {
      syncDocToFirestore('substitutions', sub.id, sub);
    });

    showToast(
      `Absence recorded for ${teacherName}. ${affectedPeriods.length} period(s) queued for substitute assignment.`
    );
  };

  const handleRemoveAbsence = (absenceId: string) => {
    const targetAbsence = absences.find((a) => a.id === absenceId);
    const updatedAbsences = absences.filter((a) => a.id !== absenceId);
    const targetSubs = substitutions.filter((s) => s.absenceId === absenceId || (targetAbsence && s.originalTeacherId === targetAbsence.teacherId && s.date === targetAbsence.date));
    const updatedSubs = substitutions.filter((s) => !targetSubs.some((ts) => ts.id === s.id));

    updateAppData({
      absences: updatedAbsences,
      substitutions: updatedSubs
    });

    deleteDocFromFirestore('absences', absenceId);
    targetSubs.forEach((s) => deleteDocFromFirestore('substitutions', s.id));
    showToast(`Absence record for ${targetAbsence?.teacherName || 'teacher'} removed.`);
  };

  const handleClearDateAbsences = (date: string) => {
    const removingAbsences = absences.filter((a) => a.date === date);
    const removingSubs = substitutions.filter((s) => s.date === date);
    const updatedAbsences = absences.filter((a) => a.date !== date);
    const updatedSubs = substitutions.filter((s) => s.date !== date);

    updateAppData({
      absences: updatedAbsences,
      substitutions: updatedSubs
    });

    removingAbsences.forEach((a) => deleteDocFromFirestore('absences', a.id));
    removingSubs.forEach((s) => deleteDocFromFirestore('substitutions', s.id));
    showToast(`Cleared all recorded absences and substitutions for ${date}.`);
  };

  const handleDeleteSubstitution = (subId: string) => {
    const updated = substitutions.filter((s) => s.id !== subId);
    updateAppData({ substitutions: updated });
    deleteDocFromFirestore('substitutions', subId);
    showToast('Substitution cover requirement removed.');
  };

  const handleCleanDuplicateSubstitutions = () => {
    const { cleaned: cleanAbs, removedIds: remAbs } = deduplicateAbsences(absences, teachers);
    remAbs.forEach((id) => deleteDocFromFirestore('absences', id));

    const { cleaned: cleanSubs, removedIds: remSubs } = deduplicateSubstitutions(substitutions, teachers, cleanAbs);
    remSubs.forEach((id) => deleteDocFromFirestore('substitutions', id));

    updateAppData({
      substitutions: cleanSubs,
      absences: cleanAbs
    });

    showToast(`Cleaned ${remSubs.length + remAbs.length} duplicate/orphan cover records!`);
  };

  // Single Substitution Assignment
  const handleAssignSubstitute = (
    substitutionId: string,
    teacherId: string,
    teacherName: string,
    reason: string
  ) => {
    const updated = substitutions.map((sub) => {
      if (sub.id === substitutionId) {
        return {
          ...sub,
          status: 'Assigned' as const,
          assignedSubstituteId: teacherId,
          assignedSubstituteName: isAnonymous ? (teachers.find((t) => t.id === teacherId)?.anonymousCode || teacherId) : teacherName,
          assignedAt: new Date().toISOString(),
          assignedReason: reason
        };
      }
      return sub;
    });

    updateAppData({ substitutions: updated });
    const targetSub = updated.find((s) => s.id === substitutionId);
    if (targetSub) {
      syncDocToFirestore('substitutions', targetSub.id, targetSub);
    }

    setActiveAssignSub(null);
    showToast(`Substitute assigned to Class ${targetSub?.classId} Period ${targetSub?.period}.`);
  };

  const handleUnassignSubstitute = (substitutionId: string) => {
    const updated = substitutions.map((sub) => {
      if (sub.id === substitutionId) {
        return {
          ...sub,
          status: 'Pending' as const,
          assignedSubstituteId: undefined,
          assignedSubstituteName: undefined,
          assignedAt: undefined,
          assignedReason: undefined
        };
      }
      return sub;
    });

    updateAppData({ substitutions: updated });
    const targetSub = updated.find((s) => s.id === substitutionId);
    if (targetSub) {
      syncDocToFirestore('substitutions', targetSub.id, targetSub);
    }
    showToast('Substitute assignment reset to Pending.');
  };

  // Batch Auto-Assign
  const handleAutoAssignAll = () => {
    const pendingSubs = substitutions.filter((s) => s.status === 'Pending' && s.date === printRosterDate);
    if (pendingSubs.length === 0) {
      showToast('No pending substitutions to assign for this date.', 'info');
      return;
    }

    const { updatedSubs, assignedCount } = autoAssignSubstitutions(
      pendingSubs,
      teachers,
      subjects,
      timetables,
      absences,
      substitutions
    );

    updateAppData({ substitutions: updatedSubs });
    updatedSubs.forEach((s) => syncDocToFirestore('substitutions', s.id, s));
    showToast(`Successfully auto-assigned ${assignedCount} substitution(s) with rest protection.`);
  };

  const activeTeacher = teachers.find((t) => t.id === selectedTeacherId) || teachers[0];

  const handleOpenPrintRoster = (date?: string) => {
    if (date) setPrintRosterDate(date);
    setIsPrintRosterOpen(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`alert alert-${toastType}`}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            minWidth: '280px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            borderLeft: '4px solid #2563eb'
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Main Clean Header Navigation */}
      <HeaderNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        role={role}
        onChangeRole={(newRole) => setRole(newRole)}
        selectedTeacherId={selectedTeacherId}
        onChangeSelectedTeacherId={(id) => setSelectedTeacherId(id)}
        selectedClassId={selectedClassId}
        onChangeSelectedClassId={(id) => setSelectedClassId(id)}
        teachers={teachers}
        classes={classes}
        isAnonymous={isAnonymous}
        onToggleAnonymous={handleToggleAnonymous}
        onOpenPrintModal={() => handleOpenPrintRoster('2026-08-17')}
        isSyncing={isSyncing}
        autoSaveStatus={autoSaveStatus}
        lastSavedTime={lastSavedTime}
        onPushToCloud={handlePushActiveTabToCloud}
        onRefreshFromCloud={handleRefreshFromCloud}
      />

      {/* Admin View */}
      {role === 'admin' && (
        <main style={{ flex: 1 }}>
          {/* Tab 1: Daily Substitute Desk */}
          {(currentTab === 'substitutions' || currentTab === 'dashboard') && (
            <DailySubstituteDesk
              teachers={teachers}
              classes={classes}
              subjects={subjects}
              timetables={timetables}
              absences={absences}
              substitutions={substitutions}
              isAnonymous={isAnonymous}
              onMarkAbsent={handleMarkAbsent}
              onRemoveAbsence={handleRemoveAbsence}
              onClearDateAbsences={handleClearDateAbsences}
              onDeleteSubstitution={handleDeleteSubstitution}
              onCleanDuplicates={handleCleanDuplicateSubstitutions}
              onAssignSubstitute={(sub) => setActiveAssignSub(sub)}
              onUnassignSubstitute={handleUnassignSubstitute}
              onAutoAssignAll={handleAutoAssignAll}
              onOpenPrintModal={(date) => handleOpenPrintRoster(date)}
            />
          )}

          {/* Tab 2: Master Timetable */}
          {currentTab === 'timetable' && (
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
              <TimetableGrid
                entries={timetables}
                teachers={teachers}
                classes={classes}
                subjects={subjects}
                isAnonymous={isAnonymous}
                onCleanDuplicates={handleCleanDuplicateConflicts}
                onCellClick={(entry) => {
                  setActiveTimetableEntry(entry);
                  setIsTimetableModalOpen(true);
                }}
                onAddNew={() => {
                  setActiveTimetableEntry({});
                  setIsTimetableModalOpen(true);
                }}
              />
            </div>
          )}

          {/* Tab 3: Directory & Setup */}
          {currentTab === 'directory' && (
            <DirectorySetupView
              teachers={teachers}
              classes={classes}
              subjects={subjects}
              timetables={timetables}
              isAnonymous={isAnonymous}
              onSaveTeacher={handleSaveTeacher}
              onDeleteTeacher={handleDeleteTeacher}
              onSaveClass={handleSaveClass}
              onDeleteClass={handleDeleteClass}
              onSaveSubject={handleSaveSubject}
              onDeleteSubject={handleDeleteSubject}
              onImportTeachers={handleImportTeachers}
              onImportTimetable={handleImportTimetable}
              onImportFullSetup={handleImportFullSetup}
              onResetData={handleResetData}
              onPushToCloud={handlePushActiveTabToCloud}
            />
          )}
        </main>
      )}

      {/* Teacher Portal */}
      {role === 'teacher' && activeTeacher && (
        <main style={{ flex: 1 }}>
          <TeacherDashboardView
            teacher={activeTeacher}
            timetables={timetables}
            subjects={subjects}
            absences={absences}
            substitutions={substitutions}
            isAnonymous={isAnonymous}
            onMarkSelfAbsent={() => {
              const affected = findAffectedPeriods(activeTeacher.id, 'Monday', timetables, subjects);
              handleMarkAbsent(
                activeTeacher.id,
                isAnonymous ? (activeTeacher.anonymousCode || activeTeacher.id) : activeTeacher.name,
                '2026-08-17',
                'Sick leave',
                affected
              );
            }}
          />
        </main>
      )}

      {/* Student Portal */}
      {role === 'student' && (
        <main style={{ flex: 1 }}>
          <StudentDashboardView
            selectedClassId={selectedClassId}
            classes={classes}
            timetables={timetables}
            subjects={subjects}
            teachers={teachers}
            absences={absences}
            substitutions={substitutions}
            isAnonymous={isAnonymous}
          />
        </main>
      )}

      {/* Timetable Add/Edit Modal */}
      {isTimetableModalOpen && activeTimetableEntry && (
        <TimetableModal
          entry={activeTimetableEntry}
          allEntries={timetables}
          teachers={teachers}
          classes={classes}
          subjects={subjects}
          isAnonymous={isAnonymous}
          onSave={handleSaveTimetableEntry}
          onDelete={handleDeleteTimetableEntry}
          onClose={() => {
            setIsTimetableModalOpen(false);
            setActiveTimetableEntry(null);
          }}
        />
      )}

      {/* Assign Substitute Modal */}
      {activeAssignSub && (
        <AssignSubstituteModal
          substitution={activeAssignSub}
          teachers={teachers}
          subjects={subjects}
          timetables={timetables}
          absences={absences}
          substitutions={substitutions}
          isAnonymous={isAnonymous}
          onAssign={handleAssignSubstitute}
          onClose={() => setActiveAssignSub(null)}
        />
      )}

      {/* Print Substituted Teachers & Classes Roster Modal */}
      {isPrintRosterOpen && (
        <PrintSubstitutedTeachersModal
          substitutions={substitutions}
          teachers={teachers}
          classes={classes}
          isAnonymous={isAnonymous}
          defaultDate={printRosterDate}
          onClose={() => setIsPrintRosterOpen(false)}
        />
      )}

      {/* Clean Footer */}
      <footer style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '16px 24px', textAlign: 'center', marginTop: 'auto' }}>
        <div style={{ fontWeight: 600, color: '#334155', fontSize: '13px' }}>
          CM Shri, Yamuna Vihar Timetable & Substitution Desk &bull; 8 Periods &bull; 6 Working Days (Mon–Sat)
        </div>
        <div style={{ marginTop: '4px', fontSize: '12px', color: '#64748b' }}>
          {isAnonymous ? 'ANONYMOUS MODE ACTIVE' : 'STANDARD MODE'} &bull; Rest-Safe Algorithm Guaranteed &bull; Persistent Backend & Vercel Ready
        </div>
      </footer>
    </div>
  );
}
