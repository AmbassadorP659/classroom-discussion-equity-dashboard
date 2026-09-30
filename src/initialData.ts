import { Student, LogEntry } from './types';

export const defaultRoster: Student[] = [
  { id: 'std_1', seat: 1, name: 'Elena Rostova', deskGroup: 'Table 1' },
  { id: 'std_2', seat: 2, name: 'Marcus Chen', deskGroup: 'Table 1' },
  { id: 'std_3', seat: 3, name: 'Aaliyah Patel', deskGroup: 'Table 2' },
  { id: 'std_4', seat: 4, name: 'Devon Washington', deskGroup: 'Table 2' },
  { id: 'std_5', seat: 5, name: 'Sophia Ramirez', deskGroup: 'Table 3' },
  { id: 'std_6', seat: 6, name: "Liam O'Connor", deskGroup: 'Table 3' },
  { id: 'std_7', seat: 7, name: 'Zara Al-Mansoor', deskGroup: 'Table 4' },
  { id: 'std_8', seat: 8, name: 'Kaito Tanaka', deskGroup: 'Table 4' },
  { id: 'std_9', seat: 9, name: 'Chloe Dubois', deskGroup: 'Table 5' },
  { id: 'std_10', seat: 10, name: 'Mateo Morales', deskGroup: 'Table 5' },
  { id: 'std_11', seat: 11, name: 'Amara Okafor', deskGroup: 'Table 6' },
  { id: 'std_12', seat: 12, name: 'Julian Vance', deskGroup: 'Table 6' },
];

export const initialLogs: LogEntry[] = [
  { id: 'log_1', timestamp: '09:05:14 AM', studentId: 'std_2', studentName: 'Marcus Chen', type: 'New Insight', target: 'Whole Class' },
  { id: 'log_2', timestamp: '09:07:30 AM', studentId: 'std_3', studentName: 'Aaliyah Patel', type: 'Question Posed', target: 'Peer: Devon Washington (Seat #4)' },
  { id: 'log_3', timestamp: '09:09:12 AM', studentId: 'std_5', studentName: 'Sophia Ramirez', type: 'New Insight', target: 'Whole Class' },
  { id: 'log_4', timestamp: '09:11:05 AM', studentId: 'std_5', studentName: 'Sophia Ramirez', type: 'Built on Peer', target: 'Peer: Marcus Chen (Seat #2)' },
  { id: 'log_5', timestamp: '09:12:44 AM', studentId: 'std_4', studentName: 'Devon Washington', type: 'Built on Peer', target: 'Peer: Aaliyah Patel (Seat #3)' },
  { id: 'log_6', timestamp: '09:14:18 AM', studentId: 'std_1', studentName: 'Elena Rostova', type: 'Built on Peer', target: 'Peer: Marcus Chen (Seat #2)' },
  { id: 'log_7', timestamp: '09:16:50 AM', studentId: 'std_7', studentName: 'Zara Al-Mansoor', type: 'Question Posed', target: 'Peer: Sophia Ramirez (Seat #5)' },
  { id: 'log_8', timestamp: '09:18:22 AM', studentId: 'std_8', studentName: 'Kaito Tanaka', type: 'Built on Peer', target: 'Peer: Sophia Ramirez (Seat #5)' },
  { id: 'log_9', timestamp: '09:21:40 AM', studentId: 'std_2', studentName: 'Marcus Chen', type: 'Built on Peer', target: 'Peer: Elena Rostova (Seat #1)' },
  { id: 'log_10', timestamp: '09:24:10 AM', studentId: 'std_6', studentName: "Liam O'Connor", type: 'Question Posed', target: 'Peer: Sophia Ramirez (Seat #5)' },
  { id: 'log_11', timestamp: '09:25:55 AM', studentId: 'std_9', studentName: 'Chloe Dubois', type: 'Built on Peer', target: 'Peer: Mateo Morales (Seat #10)' },
  { id: 'log_12', timestamp: '09:28:15 AM', studentId: 'std_10', studentName: 'Mateo Morales', type: 'Built on Peer', target: 'Peer: Chloe Dubois (Seat #9)' },
  { id: 'log_13', timestamp: '09:30:00 AM', studentId: 'std_4', studentName: 'Devon Washington', type: 'Built on Peer', target: 'Peer: Elena Rostova (Seat #1)' },
  { id: 'log_14', timestamp: '09:32:41 AM', studentId: 'std_2', studentName: 'Marcus Chen', type: 'New Insight', target: 'Whole Class' },
];
