import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BloodPressureReading, GlucoseReading, GlucoseContext } from '../types/vitals';
import { toDateStr } from '../utils/date';

interface VitalsStore {
  bpReadings: BloodPressureReading[];
  glucoseReadings: GlucoseReading[];

  addBPReading: (
    profileId: string,
    systolic: number,
    diastolic: number,
    pulse?: number,
    note?: string
  ) => void;
  deleteBPReading: (id: string) => void;
  bpReadingsForProfile: (profileId: string) => BloodPressureReading[];

  addGlucoseReading: (
    profileId: string,
    value: number,
    context: GlucoseContext,
    note?: string
  ) => void;
  deleteGlucoseReading: (id: string) => void;
  glucoseReadingsForProfile: (profileId: string) => GlucoseReading[];
}

const uid = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const useVitalsStore = create<VitalsStore>()(
  persist(
    (set, get) => ({
      bpReadings: [],
      glucoseReadings: [],

      addBPReading: (profileId, systolic, diastolic, pulse, note) => {
        const reading: BloodPressureReading = {
          id: uid('bp'),
          profileId,
          systolic,
          diastolic,
          pulse,
          date: toDateStr(),
          takenAt: new Date().toISOString(),
          note: note?.trim() || undefined,
        };
        set((state) => ({ bpReadings: [...state.bpReadings, reading] }));
      },

      deleteBPReading: (id) =>
        set((state) => ({ bpReadings: state.bpReadings.filter((r) => r.id !== id) })),

      bpReadingsForProfile: (profileId) =>
        get()
          .bpReadings.filter((r) => r.profileId === profileId)
          .sort((a, b) => b.takenAt.localeCompare(a.takenAt)),

      addGlucoseReading: (profileId, value, context, note) => {
        const reading: GlucoseReading = {
          id: uid('glu'),
          profileId,
          value,
          context,
          date: toDateStr(),
          takenAt: new Date().toISOString(),
          note: note?.trim() || undefined,
        };
        set((state) => ({ glucoseReadings: [...state.glucoseReadings, reading] }));
      },

      deleteGlucoseReading: (id) =>
        set((state) => ({
          glucoseReadings: state.glucoseReadings.filter((r) => r.id !== id),
        })),

      glucoseReadingsForProfile: (profileId) =>
        get()
          .glucoseReadings.filter((r) => r.profileId === profileId)
          .sort((a, b) => b.takenAt.localeCompare(a.takenAt)),
    }),
    { name: 'vitals-store-v1' }
  )
);
