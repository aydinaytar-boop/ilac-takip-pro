import type { BPCategoryKey, GlucoseCategoryKey, GlucoseContext } from '../types/vitals';

// Tansiyon kategorileri (AHA aralıklarına yakın, mevcut ekrandaki değerlerle aynı)
export function categorizeBP(systolic: number, diastolic: number): BPCategoryKey {
  if (systolic >= 180 || diastolic >= 120) return 'crisis';
  if (systolic >= 140 || diastolic >= 90) return 'stage2';
  if (systolic >= 130 || diastolic >= 80) return 'stage1';
  if (systolic >= 120 && diastolic < 80) return 'elevated';
  return 'normal';
}

export const BP_COLORS: Record<BPCategoryKey, string> = {
  normal: 'bg-green-500',
  elevated: 'bg-lime-500',
  stage1: 'bg-amber-500',
  stage2: 'bg-orange-500',
  crisis: 'bg-red-600',
};

// Kan şekeri kategorileri: açlık ve tokluk için farklı sınırlar.
// "random" (rastgele) ölçüm için tokluk sınırları kullanılır.
export function categorizeGlucose(value: number, context: GlucoseContext): GlucoseCategoryKey {
  if (value < 70) return 'low';
  if (context === 'fasting') {
    if (value < 100) return 'normal';
    if (value < 126) return 'prediabetes';
    return 'diabetes';
  }
  // postprandial / random
  if (value < 140) return 'normal';
  if (value < 200) return 'prediabetes';
  return 'diabetes';
}

export const GLUCOSE_COLORS: Record<GlucoseCategoryKey, string> = {
  low: 'bg-blue-500',
  normal: 'bg-green-500',
  prediabetes: 'bg-amber-500',
  diabetes: 'bg-red-600',
};
