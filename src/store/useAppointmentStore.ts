import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Appointment } from '../types/appointment';

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
      },

      updateAppointment: (id, updates) =>
        set((state) => ({
          appointments: state.appointments.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        })),

      deleteAppointment: (id) =>
        set((state) => ({ appointments: state.appointments.filter((a) => a.id !== id) })),

      appointmentsForProfile: (profileId) =>
        get()
          .appointments.filter((a) => a.profileId === profileId)
          .sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? ''))),
    }),
    { name: 'appointments-store-v1' }
  )
);
