import React from 'react';
import { UserRole, Teacher, ClassItem } from '../types';

interface HeaderNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  role: UserRole;
  onChangeRole: (role: UserRole) => void;
  selectedTeacherId: string;
  onChangeSelectedTeacherId: (id: string) => void;
  selectedClassId: string;
  onChangeSelectedClassId: (id: string) => void;
  teachers: Teacher[];
  classes: ClassItem[];
  isAnonymous: boolean;
  onToggleAnonymous: () => void;
  onOpenPrintModal: () => void;
  isSyncing: boolean;
  onPushToCloud?: () => void;
  onRefreshFromCloud?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentTab,
  onSelectTab,
  role,
  onChangeRole,
  selectedTeacherId,
  onChangeSelectedTeacherId,
  selectedClassId,
  onChangeSelectedClassId,
  teachers,
  classes,
  isAnonymous,
  onToggleAnonymous,
  onOpenPrintModal,
  isSyncing,
  onPushToCloud,
  onRefreshFromCloud
}) => {
  return (
    <>
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Logo & School Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '20px',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)'
              }}
            >
              🏫
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                CM Shri, Yamuna Vihar Timetable & Substitute Desk
                <span style={{ fontSize: '11px', background: isSyncing ? '#fef3c7' : '#dcfce7', color: isSyncing ? '#92400e' : '#166534', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                  {isSyncing ? '⏳ Cloud Syncing...' : '🟢 Live Multi-Device Sync'}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                8 Periods/Day &bull; 6 Working Days &bull; Real-time Multi-User Cloud Connected
              </div>
            </div>
          </div>

          {/* Quick Actions & Role Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Sync Tab to Cloud Button (Lifesaver for multiple laptops) */}
            {onPushToCloud && (
              <button
                onClick={onPushToCloud}
                title="Immediately push whatever is currently in this open tab to the Cloud database"
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(37,99,235,0.3)'
                }}
              >
                ☁️ Save This Tab to Cloud
              </button>
            )}

            {/* Direct Print Button */}
            <button
              onClick={onOpenPrintModal}
              title="Print official list of substituted teachers"
              style={{
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🖨️ Print Substituted List
            </button>

            {/* Anonymous Mode Toggle */}
            <button
              onClick={onToggleAnonymous}
              title="Toggle Staff Anonymous Codes for Public Display"
              style={{
                backgroundColor: isAnonymous ? '#f97316' : '#f8fafc',
                color: isAnonymous ? '#ffffff' : '#475569',
                border: '1px solid',
                borderColor: isAnonymous ? '#f97316' : '#cbd5e1',
                padding: '8px 12px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {isAnonymous ? '🕶️ Anon ON' : '👤 Anon OFF'}
            </button>

            {/* Portal Role Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', padding: '4px 8px', borderRadius: '8px', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>View As:</span>
              <select
                value={role}
                onChange={(e) => onChangeRole(e.target.value as UserRole)}
                style={{
                  border: 'none',
                  background: '#ffffff',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '12px',
                  color: '#1e293b',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="admin">Administrator</option>
                <option value="teacher">Teacher Portal</option>
                <option value="student">Student Portal</option>
              </select>

              {role === 'teacher' && (
                <select
                  value={selectedTeacherId}
                  onChange={(e) => onChangeSelectedTeacherId(e.target.value)}
                  style={{
                    border: 'none',
                    background: '#ffffff',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '12px',
                    color: '#1e293b',
                    outline: 'none'
                  }}
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {isAnonymous ? (t.anonymousCode || t.id) : t.name}
                    </option>
                  ))}
                </select>
              )}

              {role === 'student' && (
                <select
                  value={selectedClassId}
                  onChange={(e) => onChangeSelectedClassId(e.target.value)}
                  style={{
                    border: 'none',
                    background: '#ffffff',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '12px',
                    color: '#1e293b',
                    outline: 'none'
                  }}
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      Class {c.id}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* 3 Main Navigation Tabs (Super clean and obvious!) */}
        {role === 'admin' && (
          <div style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => onSelectTab('substitutions')}
                style={{
                  padding: '12px 20px',
                  fontWeight: 800,
                  fontSize: '14px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderBottom: currentTab === 'substitutions' || currentTab === 'dashboard' ? '3px solid #2563eb' : '3px solid transparent',
                  color: currentTab === 'substitutions' || currentTab === 'dashboard' ? '#2563eb' : '#64748b'
                }}
              >
                <span>⚡ Daily Substitutions</span>
              </button>

              <button
                onClick={() => onSelectTab('timetable')}
                style={{
                  padding: '12px 20px',
                  fontWeight: 800,
                  fontSize: '14px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderBottom: currentTab === 'timetable' ? '3px solid #2563eb' : '3px solid transparent',
                  color: currentTab === 'timetable' ? '#2563eb' : '#64748b'
                }}
              >
                <span>📅 Master Timetable (8 Periods)</span>
              </button>

              <button
                onClick={() => onSelectTab('directory')}
                style={{
                  padding: '12px 20px',
                  fontWeight: 800,
                  fontSize: '14px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderBottom: currentTab === 'directory' ? '3px solid #2563eb' : '3px solid transparent',
                  color: currentTab === 'directory' ? '#2563eb' : '#64748b'
                }}
              >
                <span>👥 Staff & Classes Directory</span>
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
