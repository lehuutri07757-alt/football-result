import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'vi';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'vi',
      setLanguage: (language) => set({ language }),
      toggleLanguage: () => {
        const next: Language = get().language === 'vi' ? 'en' : 'vi';
        set({ language: next });
      },
    }),
    {
      name: 'language-storage',
    },
  ),
);
