import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Profile {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;

  // --- Sağlık bilgileri (opsiyonel) ---
  dateOfBirth?: string;   // YYYY-MM-DD
  doctorName?: string;
  doctorPhone?: string;
  heightCm?: number;
  weightKg?: number;
}

type ProfileInput = Omit<Profile, 'id' | 'createdAt'>;

interface ProfileStore {
  profiles: Profile[];
  activeProfileId: string;
  addProfile: (input: ProfileInput) => void;
  updateProfile: (id: string, updates: Partial<ProfileInput>) => void;
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  activeProfile: () => Profile | undefined;
}

const DEFAULT_PROFILE: Profile = {
  id: 'default',
  name: 'Ben',
  emoji: '👤',
  createdAt: new Date().toISOString(),
};

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      profiles: [DEFAULT_PROFILE],
      activeProfileId: 'default',

      addProfile: (input) => {
        const newProfile: Profile = {
          ...input,
          id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ profiles: [...state.profiles, newProfile] }));
      },

      updateProfile: (id, updates) =>
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      deleteProfile: (id) => {
        if (id === 'default') return;
        set((state) => {
          const remaining = state.profiles.filter((p) => p.id !== id);
          return {
            profiles: remaining,
            activeProfileId:
              state.activeProfileId === id ? 'default' : state.activeProfileId,
          };
        });
      },

      setActiveProfile: (id) => set({ activeProfileId: id }),

      activeProfile: () => {
        const { profiles, activeProfileId } = get();
        return profiles.find((p) => p.id === activeProfileId);
      },
    }),
    { name: 'profile-store' }
  )
);
