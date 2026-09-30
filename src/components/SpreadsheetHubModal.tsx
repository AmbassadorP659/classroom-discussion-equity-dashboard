import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Network,
  X,
  FileSpreadsheet,
  CloudUpload,
  Info,
  Globe,
  Sliders,
  RotateCw,
  Upload,
  AlertCircle,
  Loader2,
  Download,
  Users,
  CheckCircle2,
  Layers,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Search,
  PlusCircle,
  ArrowDownAZ,
  Shuffle,
  Trash2,
  Check,
  Link as LinkIcon,
  ExternalLink,
} from 'lucide-react';
import { Student, PodConfig } from '../types';

export interface ParsedClassTab {
  tabName: string;
  students: Student[];
  pods: PodConfig[];
  hasEmptyDeskGroups: boolean;
}

interface SpreadsheetHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onSaveRoster: (updatedStudents: Student[]) => void;
  onApplyRoster: (students: Student[], mergeMode: 'keep' | 'replace', sourceLabel: string) => void;
  onBatchImportClasses?: (
    classes: Array<{ sessionName: string; students: Student[]; pods: PodConfig[] }>,
    activeClassIndex: number,
    syncSourceUrl?: string
  ) => void;
  onRestoreDefaults?: () => void;
  onExportBackup?: () => void;
  initialMultiClassUrl?: string | null;
}

type RosterActionType = 'current' | 'upload' | 'sheets' | 'multiclass';
type MultiClassSourceMode = 'link' | 'upload';

export const SpreadsheetHubModal: React.FC<SpreadsheetHubModalProps> = ({
  isOpen,
  onClose,
  students: initialStudents,
  onSaveRoster,
  onApplyRoster,
  onBatchImportClasses,
  onRestoreDefaults,
  onExportBackup,
  initialMultiClassUrl,
}) => {
  // Action selection: Current Roster is default/first
  const [activeAction, setActiveAction] = useState<RosterActionType>('current');

  // Current Roster Tab States
  const [localStudents, setLocalStudents] = useState<Student[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Multi-Class Tab States
  const [multiClassMode, setMultiClassMode] = useState<MultiClassSourceMode>('link');
  const [multiClassSheetUrl, setMultiClassSheetUrl] = useState<string>('');
  const [multiClassLoading, setMultiClassLoading] = useState<boolean>(false);
  const [parsedWorkbookTabs, setParsedWorkbookTabs] = useState<ParsedClassTab[]>([]);
  const [selectedActiveIndex, setSelectedActiveIndex] = useState<number>(0);
  const [workbookFileName, setWorkbookFileName] = useState<string>('');
  const [multiClassError, setMultiClassError] = useState<string | null>(null);

  // Google Sheets Link States (Single Tab)
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [sheetTab, setSheetTab] = useState('Roster!A1:C35');
  const [autoSync, setAutoSync] = useState(true);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);

  // Single CSV / Paste States
  const [rawText, setRawText] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mergeMode, setMergeMode] = useState<'keep' | 'replace'>('keep');

  // Sync local students state whenever modal opens or parent students change
  useEffect(() => {
    if (isOpen) {
      setLocalStudents(JSON.parse(JSON.stringify(initialStudents || [])));
      setSearchFilter('');
      setSaveMessage(null);
      if (initialMultiClassUrl && !multiClassSheetUrl) {
        setMultiClassSheetUrl(initialMultiClassUrl);
      }
    }
  }, [isOpen, initialStudents, initialMultiClassUrl]);

  if (!isOpen) return null;

  // ----------------------------------------------------
  // Current Roster Helpers (Reindex, Reorder, Add, Delete)
  // ----------------------------------------------------
  const reindex = (list: Student[]) => {
    return list.map((item, idx) => ({
      ...item,
      seat: idx + 1,
    }));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...localStudents];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setLocalStudents(reindex(updated));
  };

  const handleMoveDown = (index: number) => {
    if (index === localStudents.length - 1) return;
    const updated = [...localStudents];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setLocalStudents(reindex(updated));
  };

  const handleNameChange = (id: string, name: string) => {
    setLocalStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name } : s))
    );
  };

  const handleDeleteStudent = (id: string) => {
    setLocalStudents((prev) => reindex(prev.filter((s) => s.id !== id)));
  };

  const handleAddStudent = () => {
    const nextSeat = localStudents.length + 1;
    const newStudent: Student = {
      id: 'std_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      seat: nextSeat,
      name: `Student ${nextSeat}`,
      deskGroup: `Table ${Math.floor((nextSeat - 1) / 3) + 1}`,
    };
    setLocalStudents([...localStudents, newStudent]);
  };

  const handleSortAlpha = () => {
    const sorted = [...localStudents].sort((a, b) => a.name.localeCompare(b.name));
    setLocalStudents(reindex(sorted));
  };

  const handleShuffle = () => {
    const shuffled = [...localStudents];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setLocalStudents(reindex(shuffled));
  };

  const handleSaveCurrentRoster = () => {
    if (onSaveRoster) {
      onSaveRoster(localStudents);
    }
    setSaveMessage('Roster updated successfully!');
    setTimeout(() => {
      onClose();
    }, 400);
  };

  // Filter students based on search string
  const filteredStudents = localStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.seat.toString().includes(searchFilter) ||
      (s.deskGroup && s.deskGroup.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  // ----------------------------------------------------
  // Robust Workbook Parser (Used for both Excel & Multi-Tab Google Sheets)
  // ----------------------------------------------------
  const parseWorkbookBuffer = (data: Uint8Array, sourceName: string): ParsedClassTab[] => {
    const workbook = XLSX.read(data, { type: 'array' });

    if (workbook.SheetNames.length === 0) {
      throw new Error('The workbook contains no sheets.');
    }

    const parsedTabs: ParsedClassTab[] = [];

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

      const students: Student[] = [];
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
        const finalGroup = rawGroup || `Table ${Math.floor(students.length / 3) + 1}`;

        const studentId = `std_${sheetName.replace(/\s+/g, '_')}_${students.length + 1}_${Date.now()}`;
        const studentObj: Student = {
          id: studentId,
          seat,
          name,
          deskGroup: finalGroup,
        };

        students.push(studentObj);

        if (!podMap[finalGroup]) {
          podMap[finalGroup] = [];
        }
        podMap[finalGroup].push(studentId);
      }

      if (students.length > 0) {
        const pods: PodConfig[] = Object.keys(podMap).map((podName, idx) => ({
          id: `pod_${sheetName}_${idx + 1}`,
          name: podName,
          studentIds: podMap[podName],
          capacity: Math.max(podMap[podName].length, 4),
        }));

        parsedTabs.push({
          tabName: sheetName,
          students,
          pods,
          hasEmptyDeskGroups: false,
        });
      }
    });

    return parsedTabs;
  };

  // ----------------------------------------------------
  // Import & Multi-Class Helpers
  // ----------------------------------------------------
  const handleDownloadMultiClassTemplate = () => {
    const wb = XLSX.utils.book_new();
    const headers = [
      'Seat Number',
      'Student Name',
      'Pod / Table Group (Optional)',
    ];

    const block1Data = [
      headers,
      [1, 'Alex Rivera', 'Table 1'],
      [2, 'Jordan Lee', 'Table 1'],
      [3, 'Taylor Swift', 'Table 1'],
      [4, 'Morgan Freeman', 'Table 2'],
      [5, 'Casey Jones', 'Table 2'],
      [6, 'Sam Washington', 'Table 2'],
    ];

    const block2Data = [
      headers,
      [1, 'Liam Smith', 'Pod Alpha'],
      [2, 'Emma Watson', 'Pod Alpha'],
      [3, 'Noah Brown', 'Pod Beta'],
      [4, 'Olivia Rodrigo', 'Pod Beta'],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(block1Data);
    const ws2 = XLSX.utils.aoa_to_sheet(block2Data);

    XLSX.utils.book_append_sheet(wb, ws1, 'Block 1 - English');
    XLSX.utils.book_append_sheet(wb, ws2, 'Block 2 - Honors');

    XLSX.writeFile(wb, 'Classroom_MultiClass_Roster_Template.xlsx');
  };

  // 1. Multi-Class File Upload (.xlsx)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMultiClassError(null);
    setWorkbookFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const parsedTabs = parseWorkbookBuffer(data, file.name);

        if (parsedTabs.length === 0) {
          setMultiClassError('No valid student rows found in any sheet. Please ensure columns have "Student Name".');
          return;
        }

        setParsedWorkbookTabs(parsedTabs);
        setSelectedActiveIndex(0);
      } catch (err: any) {
        setMultiClassError(err.message || 'Failed to parse workbook file. Please ensure it is a valid .xlsx or .xls file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 2. Multi-Class Google Sheet Link (Public Link Mode)
  const handleSyncMultiClassGoogleSheet = async () => {
    if (!multiClassSheetUrl.trim()) {
      setMultiClassError('Please enter a valid Google Sheets URL.');
      return;
    }

    setMultiClassLoading(true);
    setMultiClassError(null);

    try {
      const rawUrl = multiClassSheetUrl.trim();
      const match = rawUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        throw new Error('Could not parse Google Sheet ID from URL. Make sure it is a valid Google Docs/Sheets link.');
      }

      const sheetId = match[1];
      // Google Sheets endpoint for exporting all sheets in workbook as XLSX
      const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;

      const response = await fetch(exportUrl);
      if (!response.ok) {
        throw new Error(
          'Could not download workbook from Google Sheets. Please ensure the sharing setting is set to "Anyone with the link can view".'
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const parsedTabs = parseWorkbookBuffer(data, 'Google Sheet');

      if (parsedTabs.length === 0) {
        throw new Error('Google Sheet was downloaded, but no student records were found in any tab.');
      }

      setParsedWorkbookTabs(parsedTabs);
      setSelectedActiveIndex(0);
      setWorkbookFileName(`Google Sheet (${parsedTabs.length} tabs)`);
    } catch (err: any) {
      setMultiClassError(err.message || 'Failed to fetch Google Sheet tabs.');
    } finally {
      setMultiClassLoading(false);
    }
  };

  const handleConfirmBatchImport = () => {
    if (parsedWorkbookTabs.length === 0) return;

    if (onBatchImportClasses) {
      const classes = parsedWorkbookTabs.map((t) => ({
        sessionName: t.tabName,
        students: t.students,
        pods: t.pods,
      }));
      const syncSource = multiClassMode === 'link' ? multiClassSheetUrl.trim() : undefined;
      onBatchImportClasses(classes, selectedActiveIndex, syncSource);
      onClose();
    } else {
      const chosen = parsedWorkbookTabs[selectedActiveIndex] || parsedWorkbookTabs[0];
      onApplyRoster(chosen.students, 'replace', `Imported: ${chosen.tabName}`);
      onClose();
    }
  };

  const parseTextToStudents = (text: string): Student[] => {
    if (!text.trim()) return [];
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const parsed: Student[] = [];

    lines.forEach((line, idx) => {
      if (
        idx === 0 &&
        (line.toLowerCase().includes('name') ||
          line.toLowerCase().includes('student') ||
          line.toLowerCase().includes('seat'))
      ) {
        return;
      }

      let name = line;
      let group = '';

      if (line.includes(',') || line.includes('\t')) {
        const parts = line.split(/[,\t]+/).map((p) => p.trim().replace(/^["']|["']$/g, ''));
        if (/^\d+$/.test(parts[0]) && parts.length > 1) {
          name = parts[1];
          group = parts[2] || '';
        } else if (parts[0]) {
          name = parts[0];
          group = parts[1] || '';
        }
      }

      const cleanName = name.replace(/^["']|["']$/g, '').trim();
      if (cleanName) {
        const finalGroup = group || `Table ${Math.floor(parsed.length / 3) + 1}`;
        parsed.push({
          id: 'std_imp_' + (parsed.length + 1) + '_' + Math.random().toString(36).substring(2, 6),
          seat: parsed.length + 1,
          name: cleanName,
          deskGroup: finalGroup,
        });
      }
    });

    return parsed;
  };

  const handleSyncGoogleSheet = async () => {
    if (!sheetsUrl.trim()) {
      setSheetError('Please enter a Google Sheet share link or published CSV URL.');
      return;
    }

    setSheetLoading(true);
    setSheetError(null);

    try {
      let fetchUrl = sheetsUrl.trim();
      const match = fetchUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && !fetchUrl.includes('export?format=csv') && !fetchUrl.includes('pub?output=csv')) {
        const sheetId = match[1];
        const gidMatch = fetchUrl.match(/gid=([0-9]+)/);
        const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
        fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`;
      }

      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(
          'Could not access Google Sheet. Please ensure the link is shared as "Anyone with the link can view".'
        );
      }

      const csvText = await response.text();
      const parsed = parseTextToStudents(csvText);

      if (parsed.length === 0) {
        throw new Error('Google Sheet accessed, but no student names were found.');
      }

      onApplyRoster(parsed, 'replace', `Linked: Google Sheet (${parsed.length} students)`);
      onClose();
    } catch (err: any) {
      setSheetError(err.message || 'Failed to sync with Google Sheet. Please check the URL.');
    } finally {
      setSheetLoading(false);
    }
  };

  const handlePasteSubmit = () => {
    setUploadError(null);
    const parsed = parseTextToStudents(rawText);

    if (parsed.length === 0) {
      setUploadError('Please enter at least one student name (one per line or CSV formatted).');
      return;
    }

    onApplyRoster(parsed, mergeMode, `Pasted List (${parsed.length} students)`);
    onClose();
  };

  const handleSingleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseTextToStudents(text);

        if (parsed.length === 0) {
          setUploadError('No valid student rows found in the CSV file.');
          return;
        }

        onApplyRoster(parsed, mergeMode, `File: ${file.name}`);
        onClose();
      } catch {
        setUploadError('Failed to read CSV file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs transition-all p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Hub Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 border border-white/20">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold flex items-center">
                <span>Roster &amp; Data Sources</span>
                <span className="ml-2.5 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono font-bold">
                  Active Hub
                </span>
              </h3>
              <p className="text-xs text-blue-200">
                View &amp; edit current students, or import rosters via CSV, Google Sheets, or multi-class workbooks.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Bar - Fast & Visual */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 gap-2 pt-2 overflow-x-auto">
          {/* Tab 1: Current Roster */}
          <button
            onClick={() => setActiveAction('current')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 flex items-center space-x-2 transition-all cursor-pointer shrink-0 ${
              activeAction === 'current'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Current Roster</span>
            <span className="ml-1 px-2 py-0.5 text-[11px] font-bold rounded-full bg-indigo-100 text-indigo-800">
              {localStudents.length}
            </span>
          </button>

          {/* Tab 2: Single CSV / Paste */}
          <button
            onClick={() => setActiveAction('upload')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 flex items-center space-x-2 transition-all cursor-pointer shrink-0 ${
              activeAction === 'upload'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CloudUpload className="w-4 h-4" />
            <span>Single CSV / Paste</span>
          </button>

          {/* Tab 3: Google Sheets Live URL */}
          <button
            onClick={() => setActiveAction('sheets')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 flex items-center space-x-2 transition-all cursor-pointer shrink-0 ${
              activeAction === 'sheets'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Google Sheets</span>
          </button>

          {/* Tab 4: Multi-Class Tabs */}
          <button
            onClick={() => setActiveAction('multiclass')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 flex items-center space-x-2 transition-all cursor-pointer shrink-0 ${
              activeAction === 'multiclass'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Multi-Class Tabs</span>
          </button>
        </div>

        {/* Hub Body Container */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          {/* ACTION 0: CURRENT ROSTER EDITOR (DEFAULT) */}
          {activeAction === 'current' && (
            <div className="space-y-4">
              {saveMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs text-emerald-800 font-semibold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveMessage}</span>
                </div>
              )}

              {/* Roster Controls: Search & Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {/* Search / Filter Input */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search student or seat..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {searchFilter && (
                    <button
                      onClick={() => setSearchFilter('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Quick Roster Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleAddStudent}
                    className="inline-flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                    Add Student
                  </button>

                  <button
                    type="button"
                    onClick={handleSortAlpha}
                    className="inline-flex items-center px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                    title="Sort names alphabetically from A to Z"
                  >
                    <ArrowDownAZ className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    Sort A–Z
                  </button>

                  <button
                    type="button"
                    onClick={handleShuffle}
                    className="inline-flex items-center px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                    title="Randomly shuffle seat order"
                  >
                    <Shuffle className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    Shuffle
                  </button>

                  {onExportBackup && (
                    <button
                      type="button"
                      onClick={onExportBackup}
                      className="hidden sm:inline-flex items-center px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                      title="Download current roster backup CSV"
                    >
                      <Download className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      Backup
                    </button>
                  )}
                </div>
              </div>

              {/* Student Rows List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[360px] overflow-y-auto custom-scrollbar">
                {filteredStudents.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    {searchFilter ? 'No students match your search.' : 'No students in roster. Click "Add Student" to start.'}
                  </div>
                ) : (
                  filteredStudents.map((student) => {
                    const originalIndex = localStudents.findIndex((s) => s.id === student.id);
                    return (
                      <div
                        key={student.id}
                        className="px-4 py-2.5 bg-white hover:bg-slate-50/80 flex items-center justify-between gap-3 transition-colors"
                      >
                        {/* Left: Seat badge & Name input */}
                        <div className="flex items-center space-x-3 flex-1">
                          <span className="w-16 px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-mono font-bold text-xs text-center border border-slate-200 shrink-0">
                            Seat #{student.seat}
                          </span>

                          <input
                            type="text"
                            value={student.name}
                            onChange={(e) => handleNameChange(student.id, e.target.value)}
                            className="flex-1 bg-white hover:bg-slate-50/50 focus:bg-white text-slate-800 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            placeholder="Student name"
                          />

                          {student.deskGroup && (
                            <span className="hidden md:inline-block text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {student.deskGroup}
                            </span>
                          )}
                        </div>

                        {/* Right: Reorder Arrows & Delete Button */}
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            disabled={originalIndex === 0}
                            onClick={() => handleMoveUp(originalIndex)}
                            className={`p-1.5 rounded-md transition-colors ${
                              originalIndex === 0
                                ? 'text-slate-200 cursor-not-allowed'
                                : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer'
                            }`}
                            title="Move seat up"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            disabled={originalIndex === localStudents.length - 1}
                            onClick={() => handleMoveDown(originalIndex)}
                            className={`p-1.5 rounded-md transition-colors ${
                              originalIndex === localStudents.length - 1
                                ? 'text-slate-200 cursor-not-allowed'
                                : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer'
                            }`}
                            title="Move seat down"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(student.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer ml-1"
                            title="Delete student from roster"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Roster Footer / Save Controls */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <div className="text-xs text-slate-500">
                  <span className="font-bold text-slate-700">{localStudents.length}</span> students in active roster
                  {onRestoreDefaults && (
                    <button
                      type="button"
                      onClick={onRestoreDefaults}
                      className="ml-3 text-[11px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
                    >
                      Reset to defaults
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCurrentRoster}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Roster Changes</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ACTION 1: SINGLE CSV / PASTE */}
          {activeAction === 'upload' && (
            <div className="space-y-4">
              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Drag & Drop Zone */}
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 rounded-2xl p-6 text-center transition-all cursor-pointer block">
                <input
                  type="file"
                  accept=".csv, .tsv, .txt"
                  onChange={handleSingleCSVUpload}
                  className="hidden"
                />
                <CloudUpload className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                <span className="text-sm font-bold text-slate-700 block">
                  Click to upload CSV or drag and drop
                </span>
                <span className="text-xs text-slate-400 mt-1 block">
                  Accepts standard comma/tab-separated roster files
                </span>
              </label>

              {/* Paste Text Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Or paste names directly (one student per line):
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">Format: [Seat], [Name], [Group]</span>
                </div>
                <textarea
                  rows={6}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="1, Alex Rivera, Table 1&#10;2, Jordan Lee, Table 1&#10;3, Taylor Swift, Table 2..."
                  className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Merge Options */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Import Mode:</span>
                <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="mergeMode"
                      value="keep"
                      checked={mergeMode === 'keep'}
                      onChange={() => setMergeMode('keep')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-1.5 text-slate-700">Keep current participation counts</span>
                  </label>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="mergeMode"
                      value="replace"
                      checked={mergeMode === 'replace'}
                      onChange={() => setMergeMode('replace')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-1.5 text-slate-700">Reset counts to zero</span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handlePasteSubmit}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center cursor-pointer"
                >
                  <Upload className="w-4 h-4 mr-1.5" />
                  Load Pasted Students
                </button>
              </div>
            </div>
          )}

          {/* ACTION 2: GOOGLE SHEETS LIVE URL */}
          {activeAction === 'sheets' && (
            <div className="space-y-4">
              {sheetError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{sheetError}</span>
                </div>
              )}

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start space-x-3">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-1">Live Sync Instructions:</span>
                  <p className="text-emerald-800 leading-relaxed">
                    Paste the link to your Google Sheet. Make sure the document permissions are set to{' '}
                    <strong>"Anyone with the link can view"</strong>. The dashboard automatically syncs changes every 30 seconds.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Google Sheet Shareable URL:
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={sheetsUrl}
                    onChange={(e) => setSheetsUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Sheet Tab Range (Optional):
                  </label>
                  <input
                    type="text"
                    value={sheetTab}
                    onChange={(e) => setSheetTab(e.target.value)}
                    placeholder="Roster!A1:C35"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => setAutoSync(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-xs font-semibold text-slate-700">
                      Enable Auto-Sync during class
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={sheetLoading}
                  onClick={handleSyncGoogleSheet}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center cursor-pointer"
                >
                  {sheetLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <RotateCw className="w-4 h-4 mr-1.5" />
                      Connect &amp; Sync Roster
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ACTION 3: MULTI-CLASS TABS (.XLSX OR GOOGLE SHEETS) */}
          {activeAction === 'multiclass' && (
            <div className="space-y-4">
              {multiClassError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{multiClassError}</span>
                </div>
              )}

              {/* Sub-Mode Toggle: Link Public Google Sheet vs Upload Excel */}
              <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 max-w-md">
                <button
                  type="button"
                  onClick={() => setMultiClassMode('link')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    multiClassMode === 'link'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Link Public Google Sheet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMultiClassMode('upload')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    multiClassMode === 'upload'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Excel File (.xlsx)</span>
                </button>
              </div>

              {/* MODE A: Link Public Google Sheet with Multiple Tabs */}
              {multiClassMode === 'link' && (
                <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-start space-x-3 text-xs text-slate-600">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block mb-0.5">
                        Multi-Tab Google Sheet Linking:
                      </span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Provide a shareable Google Sheet link set to{' '}
                        <strong className="text-blue-900">"Anyone with the link can view"</strong>. All tabs in your sheet (e.g. Block 1, Period 2, AP English) will be automatically imported as distinct class sessions and can be re-synced anytime with a single click.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Google Sheet URL:
                    </label>
                    <div className="relative">
                      <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={multiClassSheetUrl}
                        onChange={(e) => setMultiClassSheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono transition-all text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      Standard columns: "Seat Number", "Student Name", "Table / Pod"
                    </span>

                    <button
                      type="button"
                      disabled={multiClassLoading || !multiClassSheetUrl.trim()}
                      onClick={handleSyncMultiClassGoogleSheet}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center cursor-pointer"
                    >
                      {multiClassLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          <span>Fetching Tabs...</span>
                        </>
                      ) : (
                        <>
                          <RotateCw className="w-3.5 h-3.5 mr-1.5" />
                          <span>Fetch &amp; Preview Tabs</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* MODE B: Upload Excel File (.xlsx) */}
              {multiClassMode === 'upload' && (
                <div className="space-y-3">
                  {/* Template Download Prompt */}
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <FileSpreadsheet className="w-4 h-4 text-blue-700 shrink-0" />
                      <div>
                        <span className="font-bold text-blue-900 block">
                          Starter Workbook Template:
                        </span>
                        <span className="text-blue-800 text-[11px]">
                          Each sheet in your workbook becomes a distinct class session (Block 1, Block 2...).
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownloadMultiClassTemplate}
                      className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 hover:bg-blue-100/50 rounded-lg font-bold text-xs shadow-2xs transition-all flex items-center shrink-0 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 mr-1 text-blue-700" />
                      Starter Template (.xlsx)
                    </button>
                  </div>

                  {/* Workbook File Upload */}
                  <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 rounded-2xl p-6 text-center transition-all cursor-pointer block">
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Layers className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                    <span className="text-sm font-bold text-slate-700 block">
                      {workbookFileName ? `Selected: ${workbookFileName}` : 'Click to select multi-tab Excel workbook'}
                    </span>
                    <span className="text-xs text-slate-400 mt-1 block">
                      Each worksheet tab will be parsed into a separate class session
                    </span>
                  </label>
                </div>
              )}

              {/* Parsed Blocks Preview (Works for both Google Sheet & Uploaded File) */}
              {parsedWorkbookTabs.length > 0 && (
                <div className="space-y-3 mt-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Detected Class Blocks ({parsedWorkbookTabs.length}):
                      </span>
                      {workbookFileName && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {workbookFileName}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-emerald-700 font-semibold flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Ready to batch import
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto custom-scrollbar p-1">
                    {parsedWorkbookTabs.map((tab, idx) => {
                      const isSelected = selectedActiveIndex === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedActiveIndex(idx)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <div>
                              <span className="font-bold text-xs text-slate-800 block">
                                {tab.tabName}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {tab.students.length} students • {tab.pods.length} pods
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block">
                              Block #{idx + 1}
                            </span>
                            <span className="text-xs text-blue-700 font-bold">
                              {tab.students.slice(0, 2).map((s) => s.name.split(' ')[0]).join(', ')}...
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Batch Action Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-500">
                      Total: {parsedWorkbookTabs.reduce((sum, t) => sum + t.students.length, 0)} students across {parsedWorkbookTabs.length} blocks
                    </span>

                    <button
                      type="button"
                      onClick={handleConfirmBatchImport}
                      className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Import All {parsedWorkbookTabs.length} Blocks &amp; Launch
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
