import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { betService } from '@/services/bet.service';
import { Bet } from '@/types/bet';

export interface BetSlipItem {
  id: string;
  fixtureId: number;
  matchName: string;
  market: string;
  selection: string;
  odds: number;
  handicap?: string;
  addedAt: number;
  oddsId?: string;
  error?: string;
}

interface BetSlipState {
  items: BetSlipItem[];
  isOpen: boolean;
  stake: number;
  isPlacing: boolean;
  error: string | null;
  lastPlacedBet: Bet | null;
  showConfirmation: boolean;
  
  addSelection: (item: Omit<BetSlipItem, 'id' | 'addedAt' | 'error'>) => void;
  removeSelection: (id: string) => void;
  toggleSelection: (item: Omit<BetSlipItem, 'id' | 'addedAt' | 'error'>) => void;
  clearAll: () => void;
  clearItemError: (id: string) => void;
  clearAllItemErrors: () => void;
  
  isSelected: (fixtureId: number, market: string, selection: string) => boolean;
  getSelectionKey: (fixtureId: number, market: string, selection: string) => string;
  
  setOpen: (open: boolean) => void;
  setStake: (amount: number) => void;
  
  getTotalOdds: () => number;
  getItemCount: () => number;
  
  placeBet: () => Promise<void>;
  resetAfterPlacement: () => void;
  dismissConfirmation: () => void;
}

const createSelectionKey = (fixtureId: number, market: string, selection: string) =>
  `${fixtureId}-${market}-${selection}`;

export const useBetSlipStore = create<BetSlipState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      stake: 0,
      isPlacing: false,
      error: null,
      lastPlacedBet: null,
      showConfirmation: false,

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
        set({ items: [], stake: 0, error: null });
      },

      clearItemError: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, error: undefined } : item
          ),
        }));
      },

      clearAllItemErrors: () => {
        set((state) => ({
          items: state.items.map((item) => ({ ...item, error: undefined })),
        }));
      },

      isSelected: (fixtureId, market, selection) => {
        const id = createSelectionKey(fixtureId, market, selection);
        return get().items.some((item) => item.id === id);
      },

      getSelectionKey: createSelectionKey,

      setOpen: (open) => {
        set({ isOpen: open });
      },

      setStake: (amount) => {
        set({ stake: amount, error: null });
      },

      getTotalOdds: () => {
        const items = get().items;
        if (items.length === 0) return 0;
        return items.reduce((acc, item) => acc * item.odds, 1);
      },

      getItemCount: () => get().items.length,

      placeBet: async () => {
        const { items, stake } = get();
        if (items.length === 0 || stake <= 0) return;

        const targetItem = items[0];
        if (!targetItem.oddsId) {
          set((state) => ({
            error: null,
            items: state.items.map((i) =>
              i.id === targetItem.id
                ? { ...i, error: 'Odds information not found. Please select again.' }
                : i
            ),
          }));
          return;
        }

        set({ isPlacing: true, error: null });

        try {
          const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
          const response = await betService.placeBet({
            oddsId: targetItem.oddsId,
            stake,
            idempotencyKey,
          });

           set({
             isPlacing: false,
             lastPlacedBet: response.data.bet,
             items: [],
             stake: 0,
             error: null,
             showConfirmation: true,
           });
         } catch (err: unknown) {
           const error = err as { response?: { data?: { message?: string; code?: string } } };
           const code = error?.response?.data?.message || '';
           const errorMessages: Record<string, string> = {
             'ODDS_SUSPENDED': 'Odds have been suspended.',
             'MATCH_NOT_BETTABLE': 'This match is not available for betting.',
             'INSUFFICIENT_FUNDS': 'Insufficient balance. Please deposit more funds.',
             'LIMIT_EXCEEDED': 'Bet limit exceeded. Please check your limits.',
             'DUPLICATE_BET': 'This bet has already been placed.',
           };
           const message = Object.entries(errorMessages).find(([key]) => code.includes(key))?.[1]
             || 'Failed to place bet. Please try again.';

           const isItemError = ['ODDS_SUSPENDED', 'MATCH_NOT_BETTABLE'].some((key) => code.includes(key));
           if (isItemError) {
             set((state) => ({
               isPlacing: false,
               error: null,
               items: state.items.map((i) =>
                 i.id === targetItem.id ? { ...i, error: message } : i
               ),
             }));
           } else {
             set({ isPlacing: false, error: message });
           }
         }
      },

       resetAfterPlacement: () => {
         set({ lastPlacedBet: null, error: null });
       },

       dismissConfirmation: () => {
         set({ showConfirmation: false, lastPlacedBet: null, error: null });
       },
    }),
    {
      name: 'bet-slip-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
