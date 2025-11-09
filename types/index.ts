// Core Types for AI Life Management App

export type NoteType = "text" | "audio" | "image" | "video";
export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type RecurrenceFrequency = "daily" | "weekly" | "monthly";
export type Sentiment = "positive" | "neutral" | "negative";
export type Trend = "improving" | "stable" | "declining";
export type ThemeMode = "light" | "dark" | "system";

// 8 Pillars of Life
export type LifePillar =
  | "health"
  | "finance"
  | "career"
  | "relationships"
  | "mental"
  | "learning"
  | "recreation"
  | "contribution";

// User Profile
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  preferences: UserPreferences;
  googleConnections: GoogleConnections;
}

export interface UserPreferences {
  theme: ThemeMode;
  notifications: boolean;
  pillarsEnabled: LifePillar[];
  aiAssistant: {
    enabled: boolean;
    autoSuggest: boolean;
  };
}

export interface GoogleConnections {
  calendar: { connected: boolean; lastSync?: Date };
  gmail: { connected: boolean; lastSync?: Date };
  drive: { connected: boolean; lastSync?: Date };
  contacts: { connected: boolean; lastSync?: Date };
}

// Notes
export interface Note {
  id: string;
  userId: string;
  type: NoteType;
  title: string;
  content: string;
  transcription?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  tags: string[];
  categories: string[];
  pillar?: LifePillar;
  aiMetadata?: AIMetadata;
  location?: Location;
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface AIMetadata {
  summary?: string;
  topics: string[];
  entities: {
    people: string[];
    dates: string[];
    places: string[];
    tasks: string[];
  };
  sentiment?: Sentiment;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

// Tasks
export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  pillar?: LifePillar;
  dueDate?: Date;
  reminder?: Reminder;
  recurring?: RecurringPattern;
  relatedNotes: string[];
  createdAt: Date;
  completedAt?: Date;
}

export interface Reminder {
  enabled: boolean;
  time: Date;
  notified: boolean;
}

export interface RecurringPattern {
  frequency: RecurrenceFrequency;
  interval: number;
  endDate?: Date;
}

// Events/Calendar
export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  pillar?: LifePillar;
  source: "manual" | "google-calendar";
  googleEventId?: string;
  attendees?: string[];
  reminder?: Date;
  createdAt: Date;
  synced: boolean;
}

// Pillar Progress
export interface PillarProgress {
  id: string;
  userId: string;
  pillar: LifePillar;
  date: Date;
  metrics: Record<string, number>;
  notes: string[];
  goals: Goal;
  aiInsights: PillarInsights;
}

export interface Goal {
  target: number;
  current: number;
  unit: string;
}

export interface PillarInsights {
  trend: Trend;
  suggestions: string[];
  achievements: string[];
}

// AI Conversations
export interface Conversation {
  id: string;
  userId: string;
  messages: Message[];
  context?: ConversationContext;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  relatedNotes?: string[];
}

export interface ConversationContext {
  pillar?: LifePillar;
  noteIds?: string[];
}

// Offline Sync
export interface PendingOperation {
  id?: number;
  type: "create" | "update" | "delete";
  collection: string;
  docId: string;
  data: unknown;
  timestamp: number;
}

// API Responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Form Types
export interface NoteFormData {
  type: NoteType;
  title: string;
  content: string;
  tags: string[];
  pillar?: LifePillar;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  pillar?: LifePillar;
  dueDate?: Date;
  reminderEnabled: boolean;
  reminderTime?: Date;
}

// Pillar Metrics (specific to each pillar)
export interface HealthMetrics {
  exerciseMinutes?: number;
  sleepHours?: number;
  waterIntake?: number;
  calories?: number;
  weight?: number;
}

export interface FinanceMetrics {
  income?: number;
  expenses?: number;
  savings?: number;
  investments?: number;
}

export interface CareerMetrics {
  projectsCompleted?: number;
  skillsLearned?: number;
  hoursWorked?: number;
  meetingsAttended?: number;
}

export interface RelationshipMetrics {
  interactions?: number;
  qualityTime?: number;
  newConnections?: number;
}

export interface MentalMetrics {
  moodScore?: number;
  stressLevel?: number;
  meditationMinutes?: number;
  journalEntries?: number;
}

export interface LearningMetrics {
  studyHours?: number;
  coursesCompleted?: number;
  booksRead?: number;
  practiceHours?: number;
}

export interface RecreationMetrics {
  hobbyHours?: number;
  creativeSessions?: number;
  entertainmentHours?: number;
}

export interface ContributionMetrics {
  volunteerHours?: number;
  donationsAmount?: number;
  mentoringHours?: number;
  communityEvents?: number;
}
