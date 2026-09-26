export type AppView =
  | 'dashboard'
  | 'medications'
  | 'history'
  | 'stats'
  | 'health'
  | 'appointments'
  | 'notes'
  | 'settings';

export type DoseStatus = 'taken' | 'skipped' | 'missed' | 'upcoming';

export interface Medication {
  id: string;
  profileId: string;
  name: string;
  dosage: string;
  times: string[];
  color: string;
  notes?: string;
  active: boolean;
  createdAt: string;

  // --- Stok takibi (opsiyonel) ---
  stockTracking?: boolean;   // stok takibi açık mı
  stockCount?: number;       // kalan adet
  stockThreshold?: number;   // bu adedin altına inince uyar (varsayılan 5)
}

export interface DoseLog {
  id: string;
  profileId: string;
  medicationId: string;
  scheduledTime: string;
  date: string;
  status: DoseStatus;
  takenAt?: string;
  stockDecremented?: boolean; // bu kayıt alınırken stoktan düşüldü mü (geri al için)
}

export interface HealthNote {
  id: string;
  profileId: string;
  content: string;
  date: string;
  createdAt: string;
}

export const MED_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444',
  '#F97316', '#EAB308', '#22C55E', '#14B8A6',
  '#06B6D4', '#6366F1', '#F43F5E', '#84CC16',
];

export const PROFILE_EMOJIS = [
  '👤', '👨', '👩', '👦', '👧', '👴', '👵',
  '🧑', '👨‍⚕️', '👩‍⚕️', '🐱', '🌟',
];

export const DEFAULT_STOCK_THRESHOLD = 5;
