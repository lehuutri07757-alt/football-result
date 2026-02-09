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
}

interface BetSlipState {
  items: BetSlipItem[];
  isOpen: boolean;
  stake: number;
  isPlacing: boolean;
  error: string | null;
  lastPlacedBet: Bet | null;
  showConfirmation: boolean;
  
  addSelection: (item: Omit<BetSlipItem, 'id' | 'addedAt'>) => void;
  removeSelection: (id: string) => void;
  toggleSelection: (item: Omit<BetSlipItem, 'id' | 'addedAt'>) => void;
  clearAll: () => void;
  
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

        set({ isPlacing: true, error: null });

        try {
          // For single bet, place bet for the first item
          const item = items[0];
          if (!item.oddsId) {
            set({ isPlacing: false, error: 'Không tìm thấy thông tin kèo. Vui lòng chọn lại.' });
            return;
          }

          const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
          const response = await betService.placeBet({
            oddsId: item.oddsId,
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
             'ODDS_SUSPENDED': 'Kèo đã tạm ngưng. Vui lòng chọn kèo khác.',
             'MATCH_NOT_BETTABLE': 'Trận đấu không cho phép đặt cược.',
             'INSUFFICIENT_FUNDS': 'Số dư không đủ. Vui lòng nạp thêm tiền.',
             'LIMIT_EXCEEDED': 'Vượt quá giới hạn cược. Kiểm tra hạn mức của bạn.',
             'DUPLICATE_BET': 'Cược này đã được đặt trước đó.',
           };
           const message = Object.entries(errorMessages).find(([key]) => code.includes(key))?.[1]
             || 'Đặt cược thất bại. Vui lòng thử lại.';
           set({ isPlacing: false, error: message });
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
