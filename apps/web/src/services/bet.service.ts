import api from './api';
import {
  PlaceBetRequest,
  PlaceBetResponse,
  Bet,
  PaginatedResponse,
  BetStatus,
} from '@/types/bet';

export interface BetHistoryParams {
  page?: number;
  limit?: number;
  status?: BetStatus;
  fromDate?: string;
  toDate?: string;
}

export const betService = {
  placeBet: (data: PlaceBetRequest) =>
    api.post<PlaceBetResponse>('/bets/place', data),

  getBets: (params?: BetHistoryParams) =>
    api.get<PaginatedResponse<Bet>>('/bets', { params }),

  getBetById: (id: string) =>
    api.get<Bet>(`/bets/${id}`),
};

export default betService;
