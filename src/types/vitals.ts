export interface BloodPressureReading {
  id: string;
  profileId: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  date: string;       // YYYY-MM-DD (yerel)
  takenAt: string;    // ISO zaman damgası
  note?: string;
}

export type GlucoseContext = 'fasting' | 'postprandial' | 'random';

export interface GlucoseReading {
  id: string;
  profileId: string;
  value: number;       // mg/dL
  context: GlucoseContext;
  date: string;
  takenAt: string;
  note?: string;
}

export type BPCategoryKey = 'normal' | 'elevated' | 'stage1' | 'stage2' | 'crisis';
export type GlucoseCategoryKey = 'low' | 'normal' | 'prediabetes' | 'diabetes';

export interface CategoryInfo {
  key: string;
  color: string; // tailwind arka plan rengi (nokta için)
}
