import React, { useState, useMemo } from 'react';
import {
  Share2,
  Users,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Download,
  Filter,
  Eye,
  Info,
  Layers,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { Student, LogEntry, PodConfig, EquityTier, EquityThresholds } from '../types';

interface DialogueNetworkTabProps {
  students: Student[];
  logs: LogEntry[];
  pods: PodConfig[];
  thresholds: EquityThresholds;
  getEquityTier: (metricVal: number) => EquityTier;
}

interface PeerEdge {
  id: string;
  sourceId: string;
  targetId: string;
  count: number;
  types: Record<string, number>;
}

export const DialogueNetworkTab: React.FC<DialogueNetworkTabProps> = ({
  students,
  logs,
  pods,
  thresholds,
  getEquityTier,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [hoveredStudentId, setHoveredStudentId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'Built on Peer' | 'Question Posed'>('all');

  const activeFocusId = hoveredStudentId || selectedStudentId;

  // Build map of student by ID, and lookup by name/seat for log parsing
  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  const studentByNameOrSeat = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((s) => {
      map.set(s.name.toLowerCase().trim(), s);
      map.set(`seat #${s.seat}`, s);
      map.set(`seat ${s.seat}`, s);
      map.set(`#${s.seat}`, s);
    });
    return map;
  }, [students]);

  // Helper to resolve target student ID from log target text
  const resolveTargetStudent = (target: string): Student | null => {
    if (!target) return null;
    const clean = target.trim();
    if (clean === 'Whole Class' || clean === 'Teacher' || clean === 'Table Group') {
      return null;
    }

    // Try format: "Peer: [Name] (Seat #[Seat])"
    const peerMatch = clean.match(/^Peer:\s*(.+?)(?:\s*\(Seat\s*#?(\d+)\))?$/i);
    if (peerMatch) {
      const namePart = peerMatch[1].trim().toLowerCase();
      const seatPart = peerMatch[2];
      if (seatPart && studentByNameOrSeat.has(`seat #${seatPart}`)) {
        return studentByNameOrSeat.get(`seat #${seatPart}`)!;
      }
      if (studentByNameOrSeat.has(namePart)) {
        return studentByNameOrSeat.get(namePart)!;
      }
    }

    // Fallback: direct name match
    if (studentByNameOrSeat.has(clean.toLowerCase())) {
      return studentByNameOrSeat.get(clean.toLowerCase())!;
    }

    return null;
  };

  // Map students to their Table Pod
  const studentPodMap = useMemo(() => {
    const map = new Map<string, string>();
    let currentIndex = 0;
    pods.forEach((pod) => {
      const cap = Math.max(1, pod.capacity || 4);
      const podStudents = students.slice(currentIndex, currentIndex + cap);
      podStudents.forEach((s) => map.set(s.id, pod.name));
      currentIndex += podStudents.length;
    });
    return map;
  }, [students, pods]);

  // Parse logs into directional edges: sourceId -> targetId
  const { edges, pairCounts, matrix, totalPeerInteractions, crossTableInteractions } = useMemo(() => {
    const edgeMap = new Map<string, PeerEdge>();
    const pairMap = new Map<string, { studentA: Student; studentB: Student; count: number }>();
    const mat: Record<string, Record<string, number>> = {};

    // Initialize empty matrix
    students.forEach((s1) => {
      mat[s1.id] = {};
      students.forEach((s2) => {
        mat[s1.id][s2.id] = 0;
      });
    });

    let totalPeer = 0;
    let crossTable = 0;

    logs.forEach((log) => {
      // Filter by type if user selected a specific filter
      if (filterType !== 'all' && log.type !== filterType) {
        return;
      }

      const targetStudent = resolveTargetStudent(log.target);
      if (!targetStudent) return;
      if (targetStudent.id === log.studentId) return; // avoid self loops

      totalPeer += 1;

      // Check cross-table
      const sourcePod = studentPodMap.get(log.studentId);
      const targetPod = studentPodMap.get(targetStudent.id);
      if (sourcePod && targetPod && sourcePod !== targetPod) {
        crossTable += 1;
      }

      // Record in matrix
      if (mat[log.studentId] && mat[log.studentId][targetStudent.id] !== undefined) {
        mat[log.studentId][targetStudent.id] += 1;
      }

      // Directed Edge: source -> target
      const edgeKey = `${log.studentId}->${targetStudent.id}`;
      const existing = edgeMap.get(edgeKey);
      if (existing) {
        existing.count += 1;
        existing.types[log.type] = (existing.types[log.type] || 0) + 1;
      } else {
        edgeMap.set(edgeKey, {
          id: edgeKey,
          sourceId: log.studentId,
          targetId: targetStudent.id,
          count: 1,
          types: { [log.type]: 1 },
        });
      }

      // Undirected Pair aggregation for Top Pairs
      const pairKey = [log.studentId, targetStudent.id].sort().join(':::');
      const existingPair = pairMap.get(pairKey);
      const sourceStudent = studentMap.get(log.studentId);
      if (sourceStudent) {
        if (existingPair) {
          existingPair.count += 1;
        } else {
          pairMap.set(pairKey, {
            studentA: sourceStudent,
            studentB: targetStudent,
            count: 1,
          });
        }
      }
    });

    const sortedPairs = Array.from(pairMap.values()).sort((a, b) => b.count - a.count);

    return {
      edges: Array.from(edgeMap.values()),
      pairCounts: sortedPairs,
      matrix: mat,
      totalPeerInteractions: totalPeer,
      crossTableInteractions: crossTable,
    };
  }, [logs, students, filterType, studentMap, studentByNameOrSeat, studentPodMap]);

  // Identify connected vs unconnected students
  const { connectedStudentIds, unconnectedStudents } = useMemo(() => {
    const connected = new Set<string>();
    edges.forEach((e) => {
      connected.add(e.sourceId);
      connected.add(e.targetId);
    });
    const unconnected = students.filter((s) => !connected.has(s.id));
    return {
      connectedStudentIds: connected,
      unconnectedStudents: unconnected,
    };
  }, [edges, students]);

  // Polar coordinates calculation for circular sociogram
  const graphDimensions = { width: 760, height: 640, cx: 380, cy: 310, radius: 240 };
  const studentNodePositions = useMemo(() => {
    const pos = new Map<string, { x: number; y: number; angle: number }>();
    const n = students.length;
    if (n === 0) return pos;

    students.forEach((s, idx) => {
      const angle = (2 * Math.PI * idx) / n - Math.PI / 2;
      const x = graphDimensions.cx + graphDimensions.radius * Math.cos(angle);
      const y = graphDimensions.cy + graphDimensions.radius * Math.sin(angle);
      pos.set(s.id, { x, y, angle });
    });
    return pos;
  }, [students, graphDimensions.cx, graphDimensions.cy, graphDimensions.radius]);

  // Outgoing & Incoming lists for focused student
  const focusedDetails = useMemo(() => {
    if (!activeFocusId) return null;
    const student = studentMap.get(activeFocusId);
    if (!student) return null;

    const outgoing = edges.filter((e) => e.sourceId === activeFocusId);
    const incoming = edges.filter((e) => e.targetId === activeFocusId);

    return {
      student,
      outgoing,
      incoming,
      totalOut: outgoing.reduce((sum, e) => sum + e.count, 0),
      totalIn: incoming.reduce((sum, e) => sum + e.count, 0),
    };
  }, [activeFocusId, edges, studentMap]);

  // CSV Export for Matrix
  const handleExportMatrixCSV = () => {
    const headers = ['Speaker / Target', ...students.map((s) => `"${s.name} (#${s.seat})"`) , 'Total Outgoing'];
    const rows = students.map((speaker) => {
      const counts: number[] = students.map((target) => (speaker.id === target.id ? 0 : matrix[speaker.id]?.[target.id] || 0));
      const totalOut = counts.reduce((acc: number, c: number) => acc + c, 0);
      return [`"${speaker.name} (#${speaker.seat})"`, ...counts, totalOut];
    });

    // Column totals row (Total Incoming)
    const incomingTotals = students.map((target) => {
      return students.reduce((sum, speaker) => sum + (matrix[speaker.id]?.[target.id] || 0), 0);
    });
    const grandTotal = incomingTotals.reduce((a, b) => a + b, 0);
    rows.push(['"Total Incoming (Addressed)"', ...incomingTotals, grandTotal]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `peer_dialogue_matrix_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const crossTableRate =
    totalPeerInteractions > 0
      ? Math.round((crossTableInteractions / totalPeerInteractions) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* SECTION 1: HEADER & FILTER BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center">
                <span>Student Dialogue Network & Interaction Matrix</span>
                <span className="ml-2.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {totalPeerInteractions} Peer Connections
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Visualize conversational flow, bilateral exchanges, and cross-table collaboration in Socratic dialogue.
              </p>
            </div>
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-[11px] font-bold text-slate-500 px-2 flex items-center">
              <Filter className="w-3 h-3 mr-1 text-blue-600" />
              Filter:
            </span>
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Connections
            </button>
            <button
              type="button"
              onClick={() => setFilterType('Built on Peer')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterType === 'Built on Peer'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Built on Peer Only
            </button>
            <button
              type="button"
              onClick={() => setFilterType('Question Posed')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterType === 'Question Posed'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Questions to Peer
            </button>
          </div>
        </div>

        {/* SECTION 2: 4 SUMMARY ANALYTICS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {/* Card 1: Total Peer Exchanges */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Peer Exchanges
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {totalPeerInteractions}
              </span>
              <span className="text-xs text-slate-500">recorded dialogue events</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Student-to-student direct responses
            </p>
          </div>

          {/* Card 2: Cross-Table Dialogue Rate */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
              Cross-Table Exchange Rate
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-blue-900 font-mono">
                {crossTableRate}%
              </span>
              <span className="text-xs text-blue-700 font-semibold">
                ({crossTableInteractions} of {totalPeerInteractions})
              </span>
            </div>
            <p className="text-[11px] text-blue-600/80 mt-1">
              Bridges across different table groups
            </p>
          </div>

          {/* Card 3: Top Dialogue Pair */}
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">
              Top Conversational Pair
            </span>
            {pairCounts.length > 0 ? (
              <div className="mt-1">
                <span className="text-sm font-extrabold text-indigo-950 truncate block">
                  {pairCounts[0].studentA.name.split(' ')[0]} ⇄ {pairCounts[0].studentB.name.split(' ')[0]}
                </span>
                <span className="text-xs text-indigo-700 font-bold font-mono">
                  {pairCounts[0].count} exchanges
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-400 mt-2 block">No peer pairs yet</span>
            )}
            <p className="text-[11px] text-indigo-600/80 mt-1">
              Highest bilateral conversational flow
            </p>
          </div>

          {/* Card 4: Unconnected Students */}
          <div
            className={`p-4 rounded-xl border ${
              unconnectedStudents.length > 0
                ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            }`}
          >
            <span
              className={`text-[11px] font-bold uppercase tracking-wider block ${
                unconnectedStudents.length > 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              Unconnected Students
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black font-mono">
                {unconnectedStudents.length}
              </span>
              <span className="text-xs font-semibold">
                of {students.length} students
              </span>
            </div>
            <p className="text-[11px] truncate mt-1">
              {unconnectedStudents.length > 0
                ? `Needs scaffolding: ${unconnectedStudents.map((s) => s.name.split(' ')[0]).slice(0, 3).join(', ')}${
                    unconnectedStudents.length > 3 ? '...' : ''
                  }`
                : '100% of students engaged in dialogue!'}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: INTERACTIVE DISCUSSION NETWORK SOCIOGRAM (SVG) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-7 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
              <span>Interactive Discussion Web (Sociogram)</span>
              <span className="ml-2 text-xs font-normal text-slate-400">
                — Click or hover any student to spotlight their conversation lines
              </span>
            </h3>
          </div>

          {activeFocusId && (
            <button
              type="button"
              onClick={() => {
                setSelectedStudentId(null);
                setHoveredStudentId(null);
              }}
              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset Spotlight
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Main SVG Graph Container */}
          <div className="lg:col-span-8 flex justify-center bg-slate-50/50 rounded-2xl border border-slate-200/70 p-2 sm:p-4">
            <svg
              viewBox={`0 0 ${graphDimensions.width} ${graphDimensions.height}`}
              className="w-full max-w-[700px] h-auto select-none"
            >
              <defs>
                {/* Arrowhead marker: Default Blue */}
                <marker
                  id="arrow-default"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#3b82f6" />
                </marker>

                {/* Arrowhead marker: Spotlight Outgoing (Deep Indigo) */}
                <marker
                  id="arrow-outgoing"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#2563eb" />
                </marker>

                {/* Arrowhead marker: Spotlight Incoming (Emerald Green) */}
                <marker
                  id="arrow-incoming"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#059669" />
                </marker>
              </defs>

              {/* Ambient Center Circle */}
              <circle
                cx={graphDimensions.cx}
                cy={graphDimensions.cy}
                r={graphDimensions.radius}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              <circle
                cx={graphDimensions.cx}
                cy={graphDimensions.cy}
                r="65"
                fill="#f8fafc"
                stroke="#cbd5e1"
                strokeWidth="1"
              />
              <text
                x={graphDimensions.cx}
                y={graphDimensions.cy - 6}
                textAnchor="middle"
                className="text-[11px] font-extrabold fill-slate-700 tracking-wider uppercase font-sans"
              >
                Dialogue
              </text>
              <text
                x={graphDimensions.cx}
                y={graphDimensions.cy + 12}
                textAnchor="middle"
                className="text-[10px] font-bold fill-slate-400 font-sans"
              >
                {totalPeerInteractions} exchanges
              </text>

              {/* Directional Curved Edge Arcs */}
              {edges.map((edge) => {
                const sourcePos = studentNodePositions.get(edge.sourceId);
                const targetPos = studentNodePositions.get(edge.targetId);
                if (!sourcePos || !targetPos) return null;

                const isOutgoingFromFocus = activeFocusId === edge.sourceId;
                const isIncomingToFocus = activeFocusId === edge.targetId;
                const isIncidental = isOutgoingFromFocus || isIncomingToFocus;

                // Subtle curved path pulled gently towards center
                const midX = (sourcePos.x + targetPos.x) / 2;
                const midY = (sourcePos.y + targetPos.y) / 2;
                const ctrlX = graphDimensions.cx + (midX - graphDimensions.cx) * 0.45;
                const ctrlY = graphDimensions.cy + (midY - graphDimensions.cy) * 0.45;
                const pathData = `M ${sourcePos.x} ${sourcePos.y} Q ${ctrlX} ${ctrlY} ${targetPos.x} ${targetPos.y}`;

                let strokeColor = '#93c5fd';
                let strokeWidth = Math.min(6, 1.5 + edge.count * 0.8);
                let strokeOpacity = 0.55;
                let marker = 'url(#arrow-default)';

                if (activeFocusId) {
                  if (isOutgoingFromFocus) {
                    strokeColor = '#2563eb'; // vivid blue
                    strokeWidth = Math.min(8, 2.5 + edge.count * 1.2);
                    strokeOpacity = 1;
                    marker = 'url(#arrow-outgoing)';
                  } else if (isIncomingToFocus) {
                    strokeColor = '#059669'; // emerald
                    strokeWidth = Math.min(8, 2.5 + edge.count * 1.2);
                    strokeOpacity = 1;
                    marker = 'url(#arrow-incoming)';
                  } else {
                    strokeOpacity = 0.08;
                    strokeColor = '#cbd5e1';
                  }
                }

                return (
                  <path
                    key={edge.id}
                    d={pathData}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeOpacity={strokeOpacity}
                    markerEnd={activeFocusId && !isIncidental ? undefined : marker}
                    className="transition-all duration-200"
                  />
                );
              })}

              {/* Student Circular Nodes */}
              {students.map((student) => {
                const pos = studentNodePositions.get(student.id);
                if (!pos) return null;

                const isFocused = activeFocusId === student.id;
                const isConnectedToFocus =
                  activeFocusId &&
                  edges.some(
                    (e) =>
                      (e.sourceId === activeFocusId && e.targetId === student.id) ||
                      (e.targetId === activeFocusId && e.sourceId === student.id)
                  );

                let nodeOpacity = 1;
                if (activeFocusId && !isFocused && !isConnectedToFocus) {
                  nodeOpacity = 0.3;
                }

                const initials = student.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('');

                return (
                  <g
                    key={student.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    opacity={nodeOpacity}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredStudentId(student.id)}
                    onMouseLeave={() => setHoveredStudentId(null)}
                    onClick={() =>
                      setSelectedStudentId(selectedStudentId === student.id ? null : student.id)
                    }
                  >
                    {/* Ring highlight when focused */}
                    {isFocused && (
                      <circle
                        r="28"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        className="animate-pulse"
                      />
                    )}

                    {/* Node circle */}
                    <circle
                      r="20"
                      fill={isFocused ? '#1e40af' : '#ffffff'}
                      stroke={isFocused ? '#1d4ed8' : '#3b82f6'}
                      strokeWidth="2.5"
                      className="shadow-md"
                    />

                    {/* Initials */}
                    <text
                      textAnchor="middle"
                      dy="4"
                      className={`text-[11px] font-extrabold font-mono pointer-events-none ${
                        isFocused ? 'fill-white' : 'fill-slate-800'
                      }`}
                    >
                      {initials}
                    </text>

                    {/* Student Name Label outside circle */}
                    {(() => {
                      const cos = Math.cos(pos.angle);
                      const labelRadius = 34;
                      const lx = labelRadius * Math.cos(pos.angle);
                      const ly = labelRadius * Math.sin(pos.angle);
                      const textAnchor = Math.abs(cos) < 0.25 ? 'middle' : cos > 0 ? 'start' : 'end';

                      return (
                        <g transform={`translate(${lx}, ${ly})`}>
                          <text
                            textAnchor={textAnchor}
                            dy="3"
                            className={`text-[11px] font-bold font-sans pointer-events-none ${
                              isFocused ? 'fill-blue-900 font-black' : 'fill-slate-700'
                            }`}
                          >
                            {student.name}
                          </text>
                          <text
                            textAnchor={textAnchor}
                            dy="15"
                            className="text-[9px] font-mono fill-slate-400 pointer-events-none"
                          >
                            Seat #{student.seat}
                          </text>
                        </g>
                      );
                    })()}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Spotlight Inspector Panel */}
          <div className="lg:col-span-4 space-y-4">
            {focusedDetails ? (
              <div className="bg-slate-50 rounded-2xl border-2 border-blue-300 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-blue-700">
                      Spotlight Inspector
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900">
                      {focusedDetails.student.name}
                    </h4>
                    <span className="text-xs text-slate-500 font-mono">
                      Seat #{focusedDetails.student.seat} • {studentPodMap.get(focusedDetails.student.id) || 'Unassigned'}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-mono font-bold flex items-center justify-center text-sm shadow-xs">
                    {focusedDetails.student.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 my-3 text-center">
                  <div className="p-2.5 rounded-xl bg-blue-100/70 border border-blue-200">
                    <span className="text-[10px] font-bold text-blue-800 uppercase block">
                      Spoke To (Outgoing)
                    </span>
                    <span className="text-lg font-black text-blue-950 font-mono">
                      {focusedDetails.totalOut}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                      Addressed By (Incoming)
                    </span>
                    <span className="text-lg font-black text-emerald-950 font-mono">
                      {focusedDetails.totalIn}
                    </span>
                  </div>
                </div>

                {/* List of Outgoing interactions */}
                <div className="space-y-2 mt-4">
                  <span className="text-[11px] font-bold text-slate-700 block flex items-center">
                    <ArrowRight className="w-3 h-3 mr-1 text-blue-600" />
                    Built on / Addressed these peers:
                  </span>
                  {focusedDetails.outgoing.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {focusedDetails.outgoing.map((e) => {
                        const target = studentMap.get(e.targetId);
                        return (
                          <div
                            key={e.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs"
                          >
                            <span className="font-semibold text-slate-800 truncate">
                              {target?.name || 'Classmate'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-blue-50 text-blue-700">
                              {e.count}x
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No outgoing peer contributions yet.</p>
                  )}
                </div>

                {/* List of Incoming interactions */}
                <div className="space-y-2 mt-4 pt-3 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700 block flex items-center">
                    <ArrowRight className="w-3 h-3 mr-1 text-emerald-600 rotate-180" />
                    Addressed by these peers:
                  </span>
                  {focusedDetails.incoming.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {focusedDetails.incoming.map((e) => {
                        const source = studentMap.get(e.sourceId);
                        return (
                          <div
                            key={e.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs"
                          >
                            <span className="font-semibold text-slate-800 truncate">
                              {source?.name || 'Classmate'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-50 text-emerald-700">
                              {e.count}x
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No classmates built on this student yet.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50/70 rounded-2xl border border-dashed border-slate-300 p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Eye className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Spotlight Any Student</h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Hover or click on any student node in the network web to isolate their conversational partners and dialogue flow.
                </p>
              </div>
            )}

            {/* Quick Legend */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 text-xs space-y-2">
              <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                Connection Color Legend
              </span>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-1 rounded-full bg-blue-600"></span>
                <span className="text-slate-600">Outgoing: Student initiates or builds on peer</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-1 rounded-full bg-emerald-600"></span>
                <span className="text-slate-600">Incoming: Peer built on or addressed this student</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-1 rounded-full bg-slate-300"></span>
                <span className="text-slate-400">Unrelated paths dimmed during focus</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: PEER INTERACTION MATRIX (HEATMAP GRID) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center">
              <span>Peer-to-Peer Interaction Matrix (Heatmap)</span>
              <span className="ml-2.5 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                Rows: Speaker ➔ Columns: Target Peer
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies dialogue intensity, frequent conversational loops, and conversational reciprocity across all student pairs.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportMatrixCSV}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
            Export Matrix CSV
          </button>
        </div>

        {/* Heatmap Grid Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
          <table className="min-w-full text-xs text-center border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3 text-left sticky left-0 bg-slate-100 z-10 min-w-[130px] border-r border-slate-200">
                  Speaker \ Receiver
                </th>
                {students.map((target) => (
                  <th
                    key={target.id}
                    className="py-2 px-2 min-w-[65px] font-mono text-[11px] border-r border-slate-200/80"
                    title={target.name}
                  >
                    <span className="block truncate max-w-[60px]">{target.name.split(' ')[0]}</span>
                    <span className="text-[9px] text-slate-400 font-normal">#{target.seat}</span>
                  </th>
                ))}
                <th className="py-2.5 px-3 min-w-[90px] font-mono font-bold bg-slate-200/70 border-l-2 border-slate-300">
                  Total Out
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((speaker, sIdx) => {
                const rowCounts = students.map((t) => (speaker.id === t.id ? 0 : matrix[speaker.id]?.[t.id] || 0));
                const totalOut = rowCounts.reduce((acc, c) => acc + c, 0);

                return (
                  <tr
                    key={speaker.id}
                    className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${
                      sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                    }`}
                  >
                    {/* Speaker Header Cell */}
                    <td className="py-2 px-3 text-left font-semibold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-200 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-[10px] text-slate-400 font-bold">
                          #{speaker.seat}
                        </span>
                        <span className="truncate max-w-[110px]" title={speaker.name}>
                          {speaker.name}
                        </span>
                      </div>
                    </td>

                    {/* Matrix Cells */}
                    {students.map((target) => {
                      const isSelf = speaker.id === target.id;
                      const count = isSelf ? 0 : matrix[speaker.id]?.[target.id] || 0;

                      let cellBg = '';
                      let cellText = 'text-slate-400';

                      if (isSelf) {
                        cellBg = 'bg-slate-100/60';
                      } else if (count >= 3) {
                        cellBg = 'bg-indigo-600 font-black';
                        cellText = 'text-white';
                      } else if (count === 2) {
                        cellBg = 'bg-blue-200 font-extrabold';
                        cellText = 'text-blue-950';
                      } else if (count === 1) {
                        cellBg = 'bg-blue-50 font-bold';
                        cellText = 'text-blue-800';
                      }

                      return (
                        <td
                          key={target.id}
                          className={`py-2 px-2 font-mono text-xs border-r border-slate-100 transition-colors ${cellBg} ${cellText}`}
                          title={
                            isSelf
                              ? 'Self'
                              : `${speaker.name} built on / addressed ${target.name}: ${count} time(s)`
                          }
                        >
                          {isSelf ? <span className="text-slate-300">—</span> : count > 0 ? count : '·'}
                        </td>
                      );
                    })}

                    {/* Row Total (Outgoing) */}
                    <td className="py-2 px-3 font-mono font-black text-slate-900 bg-slate-50 border-l-2 border-slate-300">
                      {totalOut}
                    </td>
                  </tr>
                );
              })}

              {/* Column Totals Row (Total Incoming) */}
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                <td className="py-2.5 px-3 text-left sticky left-0 bg-slate-100 z-10 border-r border-slate-200">
                  Total In (Addressed)
                </td>
                {students.map((target) => {
                  const incomingTotal = students.reduce(
                    (sum, speaker) => sum + (matrix[speaker.id]?.[target.id] || 0),
                    0
                  );
                  return (
                    <td key={target.id} className="py-2.5 px-2 font-mono border-r border-slate-200/80">
                      {incomingTotal}
                    </td>
                  );
                })}
                <td className="py-2.5 px-3 font-mono font-black bg-blue-100 text-blue-900 border-l-2 border-slate-300">
                  {totalPeerInteractions}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Matrix Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">Interaction Heatmap Scale:</span>
            <div className="flex items-center space-x-1.5 font-mono text-[10px]">
              <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-400">
                0
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 font-bold">
                1
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-200 border border-blue-300 text-blue-950 font-bold">
                2
              </span>
              <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-black">
                3+
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Click any student in the Sociogram above to cross-reference outgoing & incoming connections.
          </div>
        </div>
      </div>
    </div>
  );
};
