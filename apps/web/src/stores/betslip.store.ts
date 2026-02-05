import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BetSlipItem {
  id: string;
  fixtureId: number;
  matchName: string;
  market: string;
  selection: string;
  odds: number;
  handicap?: string;
  addedAt: number;
}

interface BetSlipState {
  items: BetSlipItem[];
  isOpen: boolean;
  
  addSelection: (item: Omit<BetSlipItem, 'id' | 'addedAt'>) => void;
  removeSelection: (id: string) => void;
  toggleSelection: (item: Omit<BetSlipItem, 'id' | 'addedAt'>) => void;
  clearAll: () => void;
  
  isSelected: (fixtureId: number, market: string, selection: string) => boolean;
  getSelectionKey: (fixtureId: number, market: string, selection: string) => string;
  
  setOpen: (open: boolean) => void;
  
  getTotalOdds: () => number;
  getItemCount: () => number;
}

const createSelectionKey = (fixtureId: number, market: string, selection: string) =>
  `${fixtureId}-${market}-${selection}`;

export const useBetSlipStore = create<BetSlipState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addSelection: (item) => {
        const id = createSelectionKey(item.fixtureId, item.market, item.selection);
        const existingIndex = get().items.findIndex((i) => i.id === id);
        
        if (existingIndex === -1) {
          set((state) => ({
            items: [...state.items, { ...item, id, addedAt: Date.now() }],
          }));
        }
      },

      removeSelection: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      toggleSelection: (item) => {
        const id = createSelectionKey(item.fixtureId, item.market, item.selection);
        const existingIndex = get().items.findIndex((i) => i.id === id);
        
        if (existingIndex !== -1) {
          set((state) => ({
            items: state.items.filter((i) => i.id !== id),
          }));
        } else {
          const existingMatchMarket = get().items.find(
            (i) => i.fixtureId === item.fixtureId && i.market === item.market
          );
          
          set((state) => ({
            items: [
              ...state.items.filter(
                (i) => !(i.fixtureId === item.fixtureId && i.market === item.market)
              ),
              { ...item, id, addedAt: Date.now() },
            ],
          }));
        }
      },

      clearAll: () => {
        set({ items: [] });
      },

      isSelected: (fixtureId, market, selection) => {
        const id = createSelectionKey(fixtureId, market, selection);
        return get().items.some((item) => item.id === id);
      },

      getSelectionKey: createSelectionKey,

      setOpen: (open) => {
        set({ isOpen: open });
      },

      getTotalOdds: () => {
        const items = get().items;
        if (items.length === 0) return 0;
        return items.reduce((acc, item) => acc * item.odds, 1);
      },

      getItemCount: () => get().items.length,
    }),
    {
      name: 'bet-slip-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
