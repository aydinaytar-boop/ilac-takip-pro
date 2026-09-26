import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Medication, DoseLog, HealthNote, AppView } from '../types';
import { toDateStr } from '../utils/date';
import { AlarmService } from '../services/AlarmService';

interface MedStore {
  view: AppView;
  medications: Medication[];
  doseLogs: DoseLog[];
  healthNotes: HealthNote[];
  selectedDate: string;

  // Navigation
  setView: (view: AppView) => void;
  setSelectedDate: (date: string) => void;

  // Medications (profile-aware)
  addMedication: (med: Omit<Medication, 'id' | 'createdAt'>) => void;
  updateMedication: (id: string, updates: Partial<Medication>) => void;
  deleteMedication: (id: string) => void;
  getMedicationsForProfile: (profileId: string) => Medication[];

  // Stok
  refillMedication: (id: string, amount: number) => void;
  lowStockMedications: (profileId: string) => Medication[];

  // Doses
  takeDose: (medicationId: string, scheduledTime: string) => void;
  skipDose: (medicationId: string, scheduledTime: string) => void;
  undoDose: (medicationId: string, scheduledTime: string) => void;

  // Notes
  addNote: (profileId: string, content: string) => void;
  deleteNote: (id: string) => void;

  // Computed
  todayLogs: (profileId: string) => DoseLog[];
  adherenceRate: (profileId: string) => number;
}

// Yerel tarih: toISOString() UTC döndürdüğü için gece 00:00-03:00 arası
// dozları yanlış güne yazıyordu, bu yüzden yerel tarihe geçildi.
const today = () => toDateStr();

export const useMedStore = create<MedStore>()(
  persist(
    (set, get) => ({
      view: 'dashboard',
      medications: [],
      doseLogs: [],
      healthNotes: [],
      selectedDate: today(),

      setView: (view) => set({ view }),
      setSelectedDate: (date) => set({ selectedDate: date }),

      getMedicationsForProfile: (profileId) =>
        get().medications.filter((m) => m.profileId === profileId && m.active),

      addMedication: (med) => {
        const newMed: Medication = {
          ...med,
          id: `med_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ medications: [...state.medications, newMed] }));
        // Alarmı kur (yalnızca native uygulamada gerçek bir etkisi olur)
        void AlarmService.scheduleForMedication(newMed);
      },

      updateMedication: (id, updates) => {
        let updated: Medication | undefined;
        set((state) => ({
          medications: state.medications.map((m) => {
            if (m.id !== id) return m;
            updated = { ...m, ...updates };
            return updated;
          }),
        }));
        // Saat, aktiflik ya da isim değiştiyse alarmları yeniden kur
        if (updated) void AlarmService.scheduleForMedication(updated);
      },

      deleteMedication: (id) => {
        set((state) => ({
          medications: state.medications.map((m) =>
            m.id === id ? { ...m, active: false } : m
          ),
        }));
        void AlarmService.cancelForMedication(id);
      },

      refillMedication: (id, amount) =>
        set((state) => ({
          medications: state.medications.map((m) =>
            m.id === id
              ? { ...m, stockCount: Math.max(0, (m.stockCount ?? 0) + amount) }
              : m
          ),
        })),

      lowStockMedications: (profileId) =>
        get().medications.filter(
          (m) =>
            m.profileId === profileId &&
            m.active &&
            m.stockTracking &&
            typeof m.stockCount === 'number' &&
            m.stockCount <= (m.stockThreshold ?? 5)
        ),

      takeDose: (medicationId, scheduledTime) => {
        const dateStr = today();
        const existingIdx = get().doseLogs.findIndex(
          (l) =>
            l.medicationId === medicationId &&
            l.scheduledTime === scheduledTime &&
            l.date === dateStr
        );
        const med = get().medications.find((m) => m.id === medicationId);
        if (!med) return;

        // Zaten "alındı" değilse ve stok takibi açıksa stoktan düş
        const prev = existingIdx >= 0 ? get().doseLogs[existingIdx] : undefined;
        const shouldDecrement =
          med.stockTracking &&
          typeof med.stockCount === 'number' &&
          prev?.status !== 'taken';

        const log: DoseLog = {
          id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          profileId: med.profileId,
          medicationId,
          scheduledTime,
          date: dateStr,
          status: 'taken',
          takenAt: new Date().toISOString(),
          stockDecremented: shouldDecrement,
        };

        set((state) => {
          const logs = [...state.doseLogs];
          if (existingIdx >= 0) logs[existingIdx] = log;
          else logs.push(log);

          const medications = shouldDecrement
            ? state.medications.map((m) =>
                m.id === medicationId
                  ? { ...m, stockCount: Math.max(0, (m.stockCount ?? 0) - 1) }
                  : m
              )
            : state.medications;

          return { doseLogs: logs, medications };
        });
      },

      skipDose: (medicationId, scheduledTime) => {
        const dateStr = today();
        const med = get().medications.find((m) => m.id === medicationId);
        if (!med) return;

        const prev = get().doseLogs.find(
          (l) =>
            l.medicationId === medicationId &&
            l.scheduledTime === scheduledTime &&
            l.date === dateStr
        );

        const log: DoseLog = {
          id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          profileId: med.profileId,
          medicationId,
          scheduledTime,
          date: dateStr,
          status: 'skipped',
        };

        set((state) => {
          const logs = state.doseLogs.filter(
            (l) =>
              !(
                l.medicationId === medicationId &&
                l.scheduledTime === scheduledTime &&
                l.date === dateStr
              )
          );
          // Daha önce "alındı" olarak stoktan düşülmüşse, şimdi atlanınca geri ver
          const medications =
            prev?.status === 'taken' && prev.stockDecremented
              ? state.medications.map((m) =>
                  m.id === medicationId
                    ? { ...m, stockCount: (m.stockCount ?? 0) + 1 }
                    : m
                )
              : state.medications;
          return { doseLogs: [...logs, log], medications };
        });
      },

      undoDose: (medicationId, scheduledTime) => {
        const dateStr = today();
        const prev = get().doseLogs.find(
          (l) =>
            l.medicationId === medicationId &&
            l.scheduledTime === scheduledTime &&
            l.date === dateStr
        );

        set((state) => {
          const doseLogs = state.doseLogs.filter(
            (l) =>
              !(
                l.medicationId === medicationId &&
                l.scheduledTime === scheduledTime &&
                l.date === dateStr
              )
          );
          // "Alındı" geri alınıyorsa ve stoktan düşülmüştü, stoğu iade et
          const medications =
            prev?.status === 'taken' && prev.stockDecremented
              ? state.medications.map((m) =>
                  m.id === medicationId
                    ? { ...m, stockCount: (m.stockCount ?? 0) + 1 }
                    : m
                )
              : state.medications;
          return { doseLogs, medications };
        });
      },

      todayLogs: (profileId) => {
        const dateStr = today();
        return get().doseLogs.filter(
          (l) => l.date === dateStr && l.profileId === profileId
        );
      },

      adherenceRate: (profileId) => {
        const logs = get().doseLogs.filter((l) => l.profileId === profileId);
        if (logs.length === 0) return 100;
        const taken = logs.filter((l) => l.status === 'taken').length;
        return Math.round((taken / logs.length) * 100);
      },

      addNote: (profileId, content) => {
        const note: HealthNote = {
          id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          profileId,
          content,
          date: today(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ healthNotes: [...state.healthNotes, note] }));
      },

      deleteNote: (id) =>
        set((state) => ({
          healthNotes: state.healthNotes.filter((n) => n.id !== id),
        })),
    }),
    {
      name: 'med-store-v2',
      partialize: (state) => ({
        medications: state.medications,
        doseLogs: state.doseLogs,
        healthNotes: state.healthNotes,
        // view ve selectedDate kasıtlı olarak kaydedilmiyor
      }),
    }
  )
);
