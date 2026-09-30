/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { LayoutGrid, PieChart, Share2, History } from 'lucide-react';
import { Header } from './components/Header';
import { SeatingChart } from './components/SeatingChart';
import { EquityTable } from './components/EquityTable';
import { DialogueNetworkTab } from './components/DialogueNetworkTab';
import { LiveTrackerLog } from './components/LiveTrackerLog';
import { RecordModal } from './components/RecordModal';
import { RosterModal } from './components/RosterModal';
import { SpreadsheetHubModal } from './components/SpreadsheetHubModal';
import { ExportModal } from './components/ExportModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ThresholdSettingsModal, defaultThresholds } from './components/ThresholdSettingsModal';
import { SavePresetModal } from './components/SavePresetModal';
import { SessionsModal } from './components/SessionsModal';
import { Toast } from './components/Toast';
import { Footer } from './components/Footer';
import {
  Student,
  LogEntry,
  StudentMetrics,
  ContributionType,
  EquityTier,
  EquityThresholds,
  LayoutMode,
  CardDensity,
  PodConfig,
  LayoutPreset,
  SavedSession,
} from './types';
import { defaultRoster, initialLogs } from './initialData';

export default function App() {
  // State with LocalStorage persistence
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('equity_roster');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return defaultRoster;
  });

  const [logs, setLogs] = useState<LogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('equity_logs');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return initialLogs;
  });

  const [syncSourceText, setSyncSourceText] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('equity_sync_source');
      if (saved) return saved;
    } catch {
      // ignore
    }
    return 'Connected: English 10 Roster.csv';
  });

  // Persistent Equity Thresholds
  const [thresholds, setThresholds] = useState<EquityThresholds>(() => {
    try {
      const saved = localStorage.getItem('equity_thresholds');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return defaultThresholds;
  });

  // Persistent Layout Presets
  const [presets, setPresets] = useState<LayoutPreset[]>(() => {
    try {
      const saved = localStorage.getItem('equity_layout_presets');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Saved Sessions State
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>(() => {
    try {
      const saved = localStorage.getItem('equity_saved_sessions');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('equity_active_session_id');
    } catch {
      return null;
    }
  });

  const [activeSessionName, setActiveSessionName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('equity_active_session_name');
      if (saved !== null) return saved;
    } catch {
      // ignore
    }
    return '';
  });

  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'seating' | 'table' | 'network' | 'log'>('seating');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    try {
      const saved = localStorage.getItem('equity_layout_mode');
      if (saved === 'grid' || saved === 'pods') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'grid';
  });
  const [cardDensity, setCardDensity] = useState<CardDensity>(() => {
    try {
      const saved = localStorage.getItem('equity_card_density');
      if (saved === 'compact' || saved === 'spacious') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'spacious';
  });

  // Table Pods Configuration (Global default size & individual pod sizes)
  const [globalPodSize, setGlobalPodSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('equity_global_pod_size');
      if (saved) return Math.max(1, parseInt(saved) || 4);
    } catch {
      // ignore
    }
    return 4;
  });

  const [pods, setPods] = useState<PodConfig[]>(() => {
    try {
      const saved = localStorage.getItem('equity_pods_config');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      { id: 'pod_1', name: 'Table Pod 1', capacity: 4 },
      { id: 'pod_2', name: 'Table Pod 2', capacity: 4 },
      { id: 'pod_3', name: 'Table Pod 3', capacity: 4 },
    ];
  });

  // Modals state
  const [selectedStudentForRecord, setSelectedStudentForRecord] = useState<Student | null>(null);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [isSpreadsheetHubOpen, setIsSpreadsheetHubOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [isSavePresetModalOpen, setIsSavePresetModalOpen] = useState(false);
  const [multiClassSyncUrl, setMultiClassSyncUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem('equity_multiclass_sync_url') || null;
    } catch {
      return null;
    }
  });
  const [isResyncing, setIsResyncing] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    confirmVariant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    confirmVariant: 'danger',
    onConfirm: () => {},
  });

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'warning' | 'info' | 'delete'>('success');

  const showToast = useCallback(
    (msg: string, type: 'success' | 'warning' | 'info' | 'delete' = 'success') => {
      setToastMessage(msg);
      setToastType(type);
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 2800);
      return () => clearTimeout(timer);
    },
    []
  );

  // LocalStorage sync effects
  useEffect(() => {
    try {
      localStorage.setItem('equity_roster', JSON.stringify(students));
    } catch {
      // ignore
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem('equity_logs', JSON.stringify(logs));
    } catch {
      // ignore
    }
  }, [logs]);

  useEffect(() => {
    try {
      localStorage.setItem('equity_sync_source', syncSourceText);
    } catch {
      // ignore
    }
  }, [syncSourceText]);

  useEffect(() => {
    try {
      localStorage.setItem('equity_thresholds', JSON.stringify(thresholds));
    } catch {
      // ignore
    }
  }, [thresholds]);

  // Saved Sessions Auto-Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('equity_saved_sessions', JSON.stringify(savedSessions));
    } catch {
      // ignore
    }
  }, [savedSessions]);

  useEffect(() => {
    if (activeSessionId) {
      try {
        localStorage.setItem('equity_active_session_id', activeSessionId);
      } catch {
        // ignore
      }
    } else {
      localStorage.removeItem('equity_active_session_id');
    }
  }, [activeSessionId]);

  useEffect(() => {
    try {
      localStorage.setItem('equity_active_session_name', activeSessionName);
    } catch {
      // ignore
    }
  }, [activeSessionName]);

  // Continuous auto-save into activeSession in savedSessions array
  useEffect(() => {
    if (!activeSessionId) return;

    setSavedSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            updatedAt: new Date().toISOString(),
            students,
            logs,
            studentCount: students.length,
            logCount: logs.length,
            pods,
            layoutMode,
            cardDensity,
            thresholds,
            globalPodSize,
          };
        }
        return s;
      })
    );
  }, [students, logs, pods, layoutMode, cardDensity, thresholds, globalPodSize, activeSessionId]);

  useEffect(() => {
    try {
      localStorage.setItem('equity_layout_mode', layoutMode);
    } catch {
      // ignore
    }
  }, [layoutMode]);

  useEffect(() => {
    try {
      localStorage.setItem('equity_card_density', cardDensity);
    } catch {
      // ignore
    }
  }, [cardDensity]);

  useEffect(() => {
    try {
      localStorage.setItem('equity_global_pod_size', globalPodSize.toString());
    } catch {
      // ignore
    }
  }, [globalPodSize]);

  useEffect(() => {
    try {
      localStorage.setItem('equity_pods_config', JSON.stringify(pods));
    } catch {
      // ignore
    }
  }, [pods]);

  // Compute student metrics
  const metrics = useMemo<Record<string, StudentMetrics>>(() => {
    const stats: Record<string, StudentMetrics> = {};
    students.forEach((s) => {
      stats[s.id] = {
        student: s,
        insights: 0,
        questions: 0,
        builtOn: 0,
        total: 0,
      };
    });

    logs.forEach((log) => {
      if (stats[log.studentId]) {
        stats[log.studentId].total += 1;
        if (log.type === 'New Insight') stats[log.studentId].insights += 1;
        else if (log.type === 'Question Posed') stats[log.studentId].questions += 1;
        else if (log.type === 'Built on Peer') stats[log.studentId].builtOn += 1;
      }
    });

    return stats;
  }, [students, logs]);

  // Dynamic equity tier calculation honoring user thresholds
  const getEquityTier = useCallback(
    (metricValue: number): EquityTier => {
      if (metricValue <= thresholds.lowMax) {
        return {
          tier: 'Low Voice',
          color: 'rose',
          borderClass: 'border-rose-300 hover:border-rose-400 bg-rose-50/20',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
          dotClass: 'bg-rose-500',
          label: `Low Voice (≤ ${thresholds.lowMax})`,
        };
      } else if (metricValue <= thresholds.balancedMax) {
        return {
          tier: 'Balanced',
          color: 'amber',
          borderClass: 'border-amber-300 hover:border-amber-400 bg-amber-50/20',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
          dotClass: 'bg-amber-500',
          label: `Balanced (${thresholds.lowMax + 1}–${thresholds.balancedMax})`,
        };
      } else {
        return {
          tier: 'High Frequency',
          color: 'emerald',
          borderClass: 'border-emerald-400 hover:border-emerald-500 bg-emerald-50/20 shadow-emerald-500/5',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          dotClass: 'bg-emerald-500',
          label: `High Voice (> ${thresholds.balancedMax})`,
        };
      }
    },
    [thresholds]
  );

  // Drag and drop seating: insert moved student into target position
  const handleMoveStudent = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    let movedName = '';
    let targetSeatNum = 0;

    setStudents((prev) => {
      const sourceIndex = prev.findIndex((s) => s.id === sourceId);
      const targetIndex = prev.findIndex((s) => s.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;

      const next = [...prev];
      const [movedItem] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, movedItem);

      movedName = movedItem.name;
      targetSeatNum = targetIndex + 1;

      return next.map((s, idx) => ({ ...s, seat: idx + 1 }));
    });

    if (movedName) {
      showToast(`Moved ${movedName} to Seat #${targetSeatNum}`);
    }
  };

  const handleMoveStudentToSlot = (sourceId: string, targetStudentIndex: number) => {
    let movedName = '';
    let targetSeatNum = 0;

    setStudents((prev) => {
      const sourceIndex = prev.findIndex((s) => s.id === sourceId);
      if (sourceIndex === -1) return prev;

      const next = [...prev];
      const [movedItem] = next.splice(sourceIndex, 1);
      const clampedIndex = Math.max(0, Math.min(next.length, targetStudentIndex));
      next.splice(clampedIndex, 0, movedItem);

      movedName = movedItem.name;
      targetSeatNum = clampedIndex + 1;

      return next.map((s, idx) => ({ ...s, seat: idx + 1 }));
    });

    if (movedName) {
      showToast(`Moved ${movedName} to Seat #${targetSeatNum}`);
    }
  };

  // Pods Handlers
  const handleChangeGlobalPodSize = (newSize: number) => {
    setGlobalPodSize(newSize);
    setPods((prev) =>
      prev.map((p) => ({
        ...p,
        capacity: newSize,
      }))
    );
    showToast(`Default pod size set to ${newSize} students`);
  };

  const handleUpdatePod = (podId: string, updates: Partial<PodConfig>) => {
    setPods((prev) =>
      prev.map((p) => (p.id === podId ? { ...p, ...updates } : p))
    );
  };

  const handleAddPod = () => {
    const nextNum = pods.length + 1;
    const newPod: PodConfig = {
      id: 'pod_' + Date.now(),
      name: `Table Pod ${nextNum}`,
      capacity: globalPodSize,
    };
    setPods((prev) => [...prev, newPod]);
    showToast(`Added Table Pod ${nextNum}`);
  };

  const handleDeletePod = (podId: string) => {
    if (pods.length <= 1) return;
    setPods((prev) => prev.filter((p) => p.id !== podId));
    showToast('Table pod removed', 'delete');
  };

  // Preset Handlers
  const handleSavePreset = (name: string) => {
    const newPreset: LayoutPreset = {
      id: 'preset_' + Date.now(),
      name,
      layoutMode,
      cardDensity,
      globalPodSize,
      customPods: pods,
      studentOrder: students.map((s) => s.id),
    };
    setPresets((prev) => [...prev, newPreset]);
    setActivePresetId(newPreset.id);
    showToast(`Layout preset "${name}" saved!`);
  };

  const handleApplyPreset = (preset: LayoutPreset) => {
    setLayoutMode(preset.layoutMode);
    if (preset.cardDensity) {
      setCardDensity(preset.cardDensity);
    }
    if (preset.globalPodSize) {
      setGlobalPodSize(preset.globalPodSize);
    }
    if (preset.customPods && preset.customPods.length > 0) {
      setPods(preset.customPods);
    }
    setActivePresetId(preset.id);
    if (preset.studentOrder && preset.studentOrder.length > 0) {
      setStudents((prev) => {
        const map = new Map(prev.map((s) => [s.id, s]));
        const reordered: Student[] = [];
        preset.studentOrder!.forEach((id) => {
          const found = map.get(id);
          if (found) {
            reordered.push(found);
            map.delete(id);
          }
        });
        map.forEach((std) => reordered.push(std));
        return reordered.map((s, idx) => ({ ...s, seat: idx + 1 }));
      });
    }
    showToast(`Applied preset: ${preset.name}`);
  };

  const handleDeletePreset = (presetId: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== presetId));
    if (activePresetId === presetId) {
      setActivePresetId(null);
    }
    showToast('Preset deleted', 'delete');
  };

  // Threshold Handlers
  const handleSaveThresholds = (newThresholds: EquityThresholds) => {
    setThresholds(newThresholds);
    showToast('Equity thresholds updated and saved!');
  };

  const handleResetThresholds = () => {
    setThresholds(defaultThresholds);
    showToast('Thresholds reset to defaults (2 & 5)', 'info');
  };

  // Handlers for logging contributions
  const handleRecordContribution = (
    student: Student,
    type: ContributionType,
    target: string
  ) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const newEntry: LogEntry = {
      id: 'log_' + Date.now(),
      timestamp: timeStr,
      studentId: student.id,
      studentName: student.name,
      type,
      target,
    };

    setLogs((prev) => [...prev, newEntry]);
    setSelectedStudentForRecord(null);
    showToast(`Recorded "${type}" for ${student.name}`);
  };

  const handleDeleteLog = (id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
    showToast('Log entry removed', 'delete');
  };

  const handleClearLog = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Clear Live Tracker Log?',
      message:
        'Are you sure you want to clear the entire live tracker log? All recorded student contributions will be removed.',
      confirmText: 'Clear Entire Log',
      confirmVariant: 'danger',
      onConfirm: () => {
        setLogs([]);
        showToast('Audit log cleared', 'delete');
      },
    });
  };

  const handleResetSession = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Live Session?',
      message:
        'Are you sure you want to reset all recorded contributions for this session? Your seating roster will remain intact.',
      confirmText: 'Reset Session',
      confirmVariant: 'danger',
      onConfirm: () => {
        setLogs([]);
        showToast('All logs reset for fresh class discussion', 'info');
      },
    });
  };

  const handleApplyRoster = (
    newStudents: Student[],
    mergeMode: 'keep' | 'replace',
    sourceLabel: string
  ) => {
    setStudents(newStudents);
    if (mergeMode === 'replace') {
      setLogs([]);
    }
    setSyncSourceText(sourceLabel);

    const importDateStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    let newSessionName = '';
    if (sourceLabel.startsWith('File: ')) {
      const fileNameWithoutExt = sourceLabel.replace('File: ', '').replace(/\.[^/.]+$/, '');
      newSessionName = `${fileNameWithoutExt} (Imported ${importDateStr})`;
    } else if (sourceLabel.startsWith('Imported: ')) {
      newSessionName = `Imported Roster (Imported ${importDateStr})`;
    } else if (sourceLabel.startsWith('Linked: Google Sheet')) {
      newSessionName = `Google Sheet Roster (Imported ${importDateStr})`;
    }

    if (newSessionName) {
      setActiveSessionName(newSessionName);
      if (activeSessionId) {
        setSavedSessions((prev) =>
          prev.map((s) => (s.id === activeSessionId ? { ...s, name: newSessionName } : s))
        );
      }
    }

    showToast(`Roster updated: ${newStudents.length} students loaded!`);
  };

  const handleBatchImportClasses = (
    classes: Array<{ sessionName: string; students: Student[]; pods: PodConfig[] }>,
    activeClassIndex: number,
    syncSourceUrl?: string
  ) => {
    if (!classes || classes.length === 0) return;

    if (syncSourceUrl) {
      setMultiClassSyncUrl(syncSourceUrl);
      try {
        localStorage.setItem('equity_multiclass_sync_url', syncSourceUrl);
      } catch {
        // ignore
      }
    }

    const importDateStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const newSessions: SavedSession[] = classes.map((c, idx) => {
      const sessionTitle = `${c.sessionName} (Imported ${importDateStr})`;
      return {
        id: `session_${Date.now()}_${idx}`,
        name: sessionTitle,
        subjectOrPeriod: c.sessionName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        studentCount: c.students.length,
        logCount: 0,
        students: c.students,
        logs: [],
        pods: c.pods,
        layoutMode: 'pods',
        cardDensity: 'spacious',
        thresholds,
        globalPodSize: 3,
      };
    });

    setSavedSessions((prev) => [...newSessions, ...prev]);

    // Activate the chosen class tab
    const chosenIndex =
      activeClassIndex >= 0 && activeClassIndex < newSessions.length ? activeClassIndex : 0;
    const activeClass = newSessions[chosenIndex];

    setStudents(activeClass.students);
    setPods(activeClass.pods);
    setLogs([]);
    setLayoutMode('pods');
    setGlobalPodSize(3);
    setActiveSessionId(activeClass.id);
    setActiveSessionName(activeClass.name);
    setSyncSourceText(
      syncSourceUrl
        ? `Linked: Google Sheet (${classes.length} classes)`
        : `Multi-Class: ${activeClass.name}`
    );

    const totalStudents = classes.reduce((sum, c) => sum + c.students.length, 0);
    showToast(
      `Imported ${classes.length} class periods (${totalStudents} students)! "${activeClass.name}" is active.`
    );
  };

  const handleResyncMultiClass = async () => {
    if (!multiClassSyncUrl) return;
    setIsResyncing(true);

    try {
      const match = multiClassSyncUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) throw new Error('Invalid Google Sheet URL format.');

      const sheetId = match[1];
      const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;

      const response = await fetch(exportUrl);
      if (!response.ok) {
        throw new Error('Could not access Google Sheet. Check sharing permissions.');
      }

      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });

      if (workbook.SheetNames.length === 0) {
        throw new Error('Workbook contains no sheets.');
      }

      const updatedClasses: Array<{ sessionName: string; students: Student[]; pods: PodConfig[] }> = [];

      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (!rawJson || rawJson.length === 0) return;

        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(rawJson.length, 5); i++) {
          const rowStr = (rawJson[i] || []).join(' ').toLowerCase();
          if (rowStr.includes('name') || rowStr.includes('student')) {
            headerRowIndex = i;
            break;
          }
        }

        const headerRow: string[] = (rawJson[headerRowIndex] || []).map((h: any) =>
          String(h || '').trim().toLowerCase()
        );

        let nameCol = headerRow.findIndex((h) => h.includes('name') || h.includes('student'));
        let seatCol = headerRow.findIndex((h) => h.includes('seat') || h.includes('desk') || h.includes('#'));
        let groupCol = headerRow.findIndex((h) => h.includes('pod') || h.includes('group') || h.includes('table'));

        if (nameCol === -1) nameCol = 1;
        if (seatCol === -1) seatCol = 0;

        const studentsList: Student[] = [];
        const podMap: Record<string, string[]> = {};
        let seatCounter = 1;

        for (let r = headerRowIndex + 1; r < rawJson.length; r++) {
          const row = rawJson[r];
          if (!row || row.length === 0) continue;

          const rawName = row[nameCol];
          if (!rawName || String(rawName).trim() === '') continue;

          const name = String(rawName).trim();
          const seat = row[seatCol] ? parseInt(String(row[seatCol]), 10) || seatCounter : seatCounter;
          seatCounter++;

          const rawGroup = groupCol !== -1 && row[groupCol] ? String(row[groupCol]).trim() : '';
          const finalGroup = rawGroup || `Table ${Math.floor(studentsList.length / 3) + 1}`;

          const studentId = `std_${sheetName.replace(/\s+/g, '_')}_${studentsList.length + 1}`;
          studentsList.push({
            id: studentId,
            seat,
            name,
            deskGroup: finalGroup,
          });

          if (!podMap[finalGroup]) podMap[finalGroup] = [];
          podMap[finalGroup].push(studentId);
        }

        if (studentsList.length > 0) {
          const classPods: PodConfig[] = Object.keys(podMap).map((podName, idx) => ({
            id: `pod_${sheetName}_${idx + 1}`,
            name: podName,
            studentIds: podMap[podName],
            capacity: Math.max(podMap[podName].length, 4),
          }));

          updatedClasses.push({
            sessionName: sheetName,
            students: studentsList,
            pods: classPods,
          });
        }
      });

      if (updatedClasses.length === 0) {
        throw new Error('No student records found in Google Sheet.');
      }

      // Update current active students if matching
      const currentMatchingClass =
        updatedClasses.find(
          (c) =>
            activeSessionName.includes(c.sessionName) ||
            (activeSessionId && activeSessionId.includes(c.sessionName))
        ) || updatedClasses[0];

      if (currentMatchingClass) {
        setStudents(currentMatchingClass.students);
        setPods(currentMatchingClass.pods);
      }

      showToast(`Re-synced ${updatedClasses.length} class blocks from Google Sheet!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to re-sync from Google Sheet', 'delete');
    } finally {
      setIsResyncing(false);
    }
  };

  const handleRenameActiveSession = (newName: string) => {
    setActiveSessionName(newName);
    if (activeSessionId) {
      setSavedSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, name: newName } : s))
      );
    }
    showToast(`Session name updated: "${newName}"`);
  };

  const handleSaveRoster = (updatedStudents: Student[]) => {
    setStudents(updatedStudents);
    showToast(`Classroom updated with ${updatedStudents.length} seats!`);
  };

  const handleRestoreDefaults = () => {
    setStudents(defaultRoster);
    setSyncSourceText('Connected: English 10 Roster.csv');
    showToast('Reset to default 12-seat roster');
  };

  const handleClearContributionsOnly = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Clear Contributions Counter?',
      message:
        'Are you sure you want to clear all contribution counters for this roster? All log history will be reset to zero.',
      confirmText: 'Clear Contributions',
      confirmVariant: 'danger',
      onConfirm: () => {
        setLogs([]);
        showToast('Contributions reset to zero', 'info');
      },
    });
  };

  const handleExportBackup = () => {
    let csv = 'Seat,Student Name\n';
    students.forEach((s) => {
      csv += `${s.seat},"${s.name.replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Roster_Backup_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Roster backup exported');
  };

  const handleExportSummaryCSV = () => {
    let csv =
      'Seat,Student Name,Total Contributions,New Insights,Questions Posed,Built on Peer,Equity Status\n';
    students.forEach((std) => {
      const d = metrics[std.id] || { insights: 0, questions: 0, builtOn: 0, total: 0 };
      const evalVal = thresholds.basis === 'total' ? d.total : d.insights;
      const tier = getEquityTier(evalVal);
      csv += `"${std.seat}","${std.name.replace(/"/g, '""')}","${d.total}","${d.insights}","${
        d.questions
      }","${d.builtOn}","${tier.tier}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Classroom_Equity_Dashboard_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Equity Summary Table downloaded as CSV');
  };

  const generateLiveTrackerCSV = () => {
    let csv = 'Index,Timestamp,Student Name,Contribution Type,Interaction Target\n';
    logs.forEach((log, i) => {
      csv += `"${i + 1}","${log.timestamp}","${log.studentName.replace(/"/g, '""')}","${
        log.type
      }","${log.target.replace(/"/g, '""')}"\n`;
    });
    return csv;
  };

  const handleCopyRawLog = () => {
    const csv = generateLiveTrackerCSV();
    navigator.clipboard
      .writeText(csv)
      .then(() => {
        showToast('Audit log copied to clipboard! Ready to paste into Sheets.');
      })
      .catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = csv;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Audit log copied to clipboard!');
      });
  };

  const handleSaveCurrentSession = (name: string, subjectOrPeriod?: string) => {
    const newSession: SavedSession = {
      id: `session_${Date.now()}`,
      name,
      subjectOrPeriod: subjectOrPeriod || activeSessionName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      studentCount: students.length,
      logCount: logs.length,
      students,
      logs,
      pods,
      layoutMode,
      cardDensity,
      thresholds,
      globalPodSize,
    };
    setSavedSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setActiveSessionName(name);
    showToast(`Session checkpoint saved: "${name}"`);
  };

  const handleResumeSession = (session: SavedSession) => {
    if (session.students) setStudents(session.students);
    if (session.logs) setLogs(session.logs);
    if (session.pods) setPods(session.pods);
    if (session.layoutMode) setLayoutMode(session.layoutMode);
    if (session.cardDensity) setCardDensity(session.cardDensity);
    if (session.thresholds) setThresholds(session.thresholds);
    if (session.globalPodSize) setGlobalPodSize(session.globalPodSize);

    setActiveSessionId(session.id);
    setActiveSessionName(session.name);
    showToast(`Resumed session: "${session.name}"`);
  };

  const handleDeleteSession = (sessionId: string) => {
    setSavedSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
    showToast('Session removed from archive', 'delete');
  };

  const handleDuplicateSession = (session: SavedSession) => {
    const copy: SavedSession = {
      ...session,
      id: `session_${Date.now()}`,
      name: `${session.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSavedSessions((prev) => [copy, ...prev]);
    showToast(`Session duplicated: "${copy.name}"`);
  };

  const handleRenameSession = (sessionId: string, newName: string) => {
    setSavedSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, name: newName } : s))
    );
    if (activeSessionId === sessionId) {
      setActiveSessionName(newName);
    }
    showToast('Session renamed');
  };

  const handleStartNewSession = (options: { keepRoster: boolean; name: string }) => {
    const newId = `session_${Date.now()}`;
    const initialStudentList = options.keepRoster ? students : defaultRoster;
    const initialLogsList: LogEntry[] = [];

    setLogs([]);
    if (!options.keepRoster) {
      setStudents(defaultRoster);
    }

    const newSession: SavedSession = {
      id: newId,
      name: options.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      studentCount: initialStudentList.length,
      logCount: 0,
      students: initialStudentList,
      logs: initialLogsList,
      pods,
      layoutMode,
      cardDensity,
      thresholds,
      globalPodSize,
    };

    setSavedSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setActiveSessionName(options.name);
    showToast(`Started new session: "${options.name}"`);
  };

  const handleImportSession = (imported: SavedSession) => {
    setSavedSessions((prev) => [imported, ...prev]);
    handleResumeSession(imported);
    showToast(`Imported & resumed "${imported.name}"`);
  };

  const handleCopyCSV = () => {
    const csv = generateLiveTrackerCSV();
    navigator.clipboard
      .writeText(csv)
      .then(() => {
        showToast('Live Tracker CSV copied to clipboard!');
      })
      .catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = csv;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Live Tracker CSV copied to clipboard!');
      });
  };

  return (
    <div className="bg-slate-100 text-slate-800 font-sans min-h-screen flex flex-col antialiased select-none">
      {/* Top Header */}
      <Header
        syncSourceText={syncSourceText}
        activeSessionName={activeSessionName}
        onOpenSpreadsheetHub={() => setIsSpreadsheetHubOpen(true)}
        onOpenRosterModal={() => setIsRosterModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenSessionsModal={() => setIsSessionsModalOpen(true)}
        onResetSession={handleResetSession}
        onRenameActiveSession={handleRenameActiveSession}
        onResyncSource={multiClassSyncUrl ? handleResyncMultiClass : undefined}
        isResyncing={isResyncing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Primary View Navigation (Centered directly above active workspace view) */}
        <div className="flex justify-center items-center mb-6">
          <nav aria-label="Dashboard Views" className="inline-flex flex-wrap justify-center p-1.5 bg-white rounded-2xl border border-slate-200 shadow-xs gap-1 sm:gap-1.5">
            <button
              onClick={() => setActiveTab('seating')}
              className={`px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm md:text-base font-bold rounded-xl flex items-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'seating'
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutGrid className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'seating' ? 'text-white' : 'text-slate-500'}`} />
              <span>Seating Chart &amp; Live Tapper</span>
            </button>

            <button
              onClick={() => setActiveTab('table')}
              className={`px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm md:text-base font-bold rounded-xl flex items-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <PieChart className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'table' ? 'text-white' : 'text-slate-500'}`} />
              <span>Equity Dashboard Table</span>
            </button>

            <button
              onClick={() => setActiveTab('network')}
              className={`px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm md:text-base font-bold rounded-xl flex items-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'network'
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Share2 className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'network' ? 'text-white' : 'text-slate-500'}`} />
              <span>Dialogue Connections</span>
            </button>

            <button
              onClick={() => setActiveTab('log')}
              className={`px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm md:text-base font-bold rounded-xl flex items-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'log'
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <History className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'log' ? 'text-white' : 'text-slate-500'}`} />
              <span>Live Tracker Log</span>
              <span
                className={`ml-1.5 px-2 py-0.5 text-xs font-black rounded-full tabular-nums ${
                  activeTab === 'log'
                    ? 'bg-indigo-800 text-indigo-100'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {logs.length}
              </span>
            </button>
          </nav>
        </div>
        {activeTab === 'seating' && (
          <section className="space-y-6">
            <SeatingChart
              students={students}
              metrics={metrics}
              layoutMode={layoutMode}
              setLayoutMode={setLayoutMode}
              cardDensity={cardDensity}
              setCardDensity={setCardDensity}
              thresholds={thresholds}
              globalPodSize={globalPodSize}
              onChangeGlobalPodSize={handleChangeGlobalPodSize}
              pods={pods}
              onUpdatePod={handleUpdatePod}
              onAddPod={handleAddPod}
              onDeletePod={handleDeletePod}
              presets={presets}
              activePresetId={activePresetId}
              onApplyPreset={handleApplyPreset}
              onOpenSavePresetModal={() => setIsSavePresetModalOpen(true)}
              onDeletePreset={handleDeletePreset}
              onOpenThresholdModal={() => setIsThresholdModalOpen(true)}
              onSelectStudent={(std) => setSelectedStudentForRecord(std)}
              onMoveStudent={handleMoveStudent}
              onMoveStudentToSlot={handleMoveStudentToSlot}
              getEquityTier={getEquityTier}
            />
          </section>
        )}

        {activeTab === 'table' && (
          <section className="space-y-6">
            <EquityTable
              students={students}
              metrics={metrics}
              totalLogsCount={logs.length}
              thresholds={thresholds}
              getEquityTier={getEquityTier}
              onSelectStudent={(std) => setSelectedStudentForRecord(std)}
              onExportCSV={handleExportSummaryCSV}
            />
          </section>
        )}

        {activeTab === 'network' && (
          <section className="space-y-6">
            <DialogueNetworkTab
              students={students}
              logs={logs}
              pods={pods}
              thresholds={thresholds}
              getEquityTier={getEquityTier}
            />
          </section>
        )}

        {activeTab === 'log' && (
          <section className="space-y-5">
            <LiveTrackerLog
              logs={logs}
              onDeleteLog={handleDeleteLog}
              onClearLog={handleClearLog}
              onCopyRawLog={handleCopyRawLog}
            />
          </section>
        )}
      </main>

      {/* Minimalist Professional Footer */}
      <Footer />

      {/* MODAL 1: Record Contribution */}
      <RecordModal
        student={selectedStudentForRecord}
        allStudents={students}
        onClose={() => setSelectedStudentForRecord(null)}
        onSubmit={handleRecordContribution}
      />

      {/* MODAL 2: Enhanced Manage Seating Roster */}
      <RosterModal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        students={students}
        onSave={handleSaveRoster}
        onRestoreDefaults={handleRestoreDefaults}
        onClearContributions={handleClearContributionsOnly}
        onExportBackup={handleExportBackup}
      />

      {/* MODAL 3: Spreadsheet Connection Hub & Unified Roster Editor */}
      <SpreadsheetHubModal
        isOpen={isSpreadsheetHubOpen}
        onClose={() => setIsSpreadsheetHubOpen(false)}
        students={students}
        onSaveRoster={handleSaveRoster}
        onApplyRoster={handleApplyRoster}
        onBatchImportClasses={handleBatchImportClasses}
        onRestoreDefaults={handleRestoreDefaults}
        onExportBackup={handleExportBackup}
        initialMultiClassUrl={multiClassSyncUrl}
      />

      {/* MODAL 4: Export to Google Sheets */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onCopyCSV={handleCopyCSV}
      />

      {/* MODAL 5: Threshold Settings Modal */}
      <ThresholdSettingsModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        thresholds={thresholds}
        onSave={handleSaveThresholds}
        onReset={handleResetThresholds}
      />

      {/* MODAL 6: Save Preset Modal */}
      <SavePresetModal
        isOpen={isSavePresetModalOpen}
        onClose={() => setIsSavePresetModalOpen(false)}
        onSavePreset={handleSavePreset}
        existingNames={presets.map((p) => p.name)}
      />

      {/* MODAL 7: Saved Sessions Manager */}
      <SessionsModal
        isOpen={isSessionsModalOpen}
        onClose={() => setIsSessionsModalOpen(false)}
        savedSessions={savedSessions}
        activeSessionId={activeSessionId}
        activeSessionName={activeSessionName}
        onSaveCurrentSession={handleSaveCurrentSession}
        onResumeSession={handleResumeSession}
        onDeleteSession={handleDeleteSession}
        onDuplicateSession={handleDuplicateSession}
        onRenameSession={handleRenameSession}
        onStartNewSession={handleStartNewSession}
        onImportSession={handleImportSession}
        currentStudentsCount={students.length}
        currentLogsCount={logs.length}
      />

      {/* Confirm Dialog Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        confirmVariant={confirmDialog.confirmVariant}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Notification */}
      <Toast message={toastMessage} type={toastType} />
    </div>
  );
}
