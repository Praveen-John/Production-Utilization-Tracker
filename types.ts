export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface User {
  id: string;
  username: string;
  password?: string; // stored plainly for demo simplicity
  role: UserRole;
  name: string;
  isDisabled?: boolean;
}

export interface ProductionRecord {
  id: string;
  userId: string;
  userName: string; // denormalized for easier charting
  processName: string;
  team: string;
  task: string;
  frequency: string;
  totalUtilization: number; // in minutes
  completedDate: string; // ISO date string
  count: number;
  remarks: string;
  actualUtilization: number; // Count X Duration in minutes
  actualOverallPerDayUtilization?: number; // Calculated as actualUtilization / 60 in hours
  actualVolume?: number; // Calculated as Duration Meter × Number Of Count
  actualUtilizationUserInput?: number; // User-enterable Count X Duration in minutes
}

export type ChatMessage = {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
};