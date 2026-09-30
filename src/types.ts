export type ContributionType = 'New Insight' | 'Question Posed' | 'Built on Peer';

export interface Student {
  id: string;
  seat: number;
  name: string;
  deskGroup?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  studentId: string;
  studentName: string;
  type: ContributionType;
  target: string;
}

export interface StudentMetrics {
  student: Student;
  insights: number;
  questions: number;
  builtOn: number;
  total: number;
}

export interface EquityTier {
  tier: string;
  color: string;
  borderClass: string;
  badgeClass: string;
  dotClass: string;
  label: string;
}

export interface EquityThresholds {
  basis: 'insights' | 'total';
  lowMax: number;
  balancedMax: number;
}

export type LayoutMode = 'grid' | 'pods';
export type CardDensity = 'compact' | 'spacious';

export interface PodConfig {
  id: string;
  name: string;
  capacity: number;
}

export interface LayoutPreset {
  id: string;
  name: string;
  isBuiltIn?: boolean;
  layoutMode: LayoutMode;
  cardDensity?: CardDensity;
  globalPodSize?: number;
  customPods?: PodConfig[];
  studentOrder?: string[];
}

export interface SavedSession {
  id: string;
  name: string;
  subjectOrPeriod?: string;
  createdAt: string;
  updatedAt: string;
  studentCount: number;
  logCount: number;
  students: Student[];
  logs: LogEntry[];
  pods: PodConfig[];
  layoutMode: LayoutMode;
  cardDensity: CardDensity;
  thresholds: EquityThresholds;
  globalPodSize: number;
  notes?: string;
}

