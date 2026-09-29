import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Appointment } from '../types/appointment';
import { AlarmService } from '../services/AlarmService';

type AppointmentInput = Omit<Appointment, 'id' | 'createdAt'>;

interface AppointmentStore {
  appointments: Appointment[];
  addAppointment: (a: AppointmentInput) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  appointmentsForProfile: (profileId: string) => Appointment[];
}

const uid = () => `appt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const useAppointmentStore = create<AppointmentStore>()(
  persist(
    (set, get) => ({
      appointments: [],

      addAppointment: (a) => {
        const appt: Appointment = { ...a, id: uid(), createdAt: new Date().toISOString() };
        set((state) => ({ appointments: [...state.appointments, appt] }));
        void AlarmService.scheduleAppointmentReminder(appt);
      },

      updateAppointment: (id, updates) => {
        let updated: Appointment | undefined;
        set((state) => ({
          appointments: state.appointments.map((a) => {
            if (a.id !== id) return a;
            updated = { ...a, ...updates };
            return updated;
          }),
        }));
        if (updated) void AlarmService.scheduleAppointmentReminder(updated);
      },

      deleteAppointment: (id) => {
        set((state) => ({ appointments: state.appointments.filter((a) => a.id !== id) }));
        void AlarmService.cancelAppointmentReminder(id);
      },

      appointmentsForProfile: (profileId) =>
        get()
          .appointments.filter((a) => a.profileId === profileId)
          .sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? ''))),
    }),
    { name: 'appointments-store-v1' }
  )
);
