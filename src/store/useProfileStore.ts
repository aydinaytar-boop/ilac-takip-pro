import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Profile {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;
}

interface ProfileStore {
  profiles: Profile[];
  activeProfileId: string;
  addProfile: (name: string, emoji: string) => void;
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

      addProfile: (name, emoji) => {
        const newProfile: Profile = {
          id: `profile_${Date.now()}`,
          name,
          emoji,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ profiles: [...state.profiles, newProfile] }));
      },

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
