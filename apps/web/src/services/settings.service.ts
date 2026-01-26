import api from './api';
import {
  DataProvider,
  CreateDataProviderPayload,
  UpdateDataProviderPayload,
  DataProviderQuery,
} from '@/types/data-provider';

export const settingsService = {
  async getDataProviders(params?: DataProviderQuery): Promise<DataProvider[]> {
    const response = await api.get<DataProvider[]>('/settings/data-providers', { params });
    return response.data;
  },

  async getDataProvider(id: string): Promise<DataProvider> {
    const response = await api.get<DataProvider>(`/settings/data-providers/${id}`);
    return response.data;
  },

  async createDataProvider(data: CreateDataProviderPayload): Promise<DataProvider> {
    const response = await api.post<DataProvider>('/settings/data-providers', data);
    return response.data;
  },

  async updateDataProvider(id: string, data: UpdateDataProviderPayload): Promise<DataProvider> {
    const response = await api.put<DataProvider>(`/settings/data-providers/${id}`, data);
    return response.data;
  },

  async deleteDataProvider(id: string): Promise<void> {
    await api.delete(`/settings/data-providers/${id}`);
  },

  async toggleProviderStatus(id: string, status: 'active' | 'inactive'): Promise<DataProvider> {
    const response = await api.post<DataProvider>(`/settings/data-providers/${id}/toggle`, { status });
    return response.data;
  },

  async resetProviderUsage(id: string, type: 'daily' | 'monthly' | 'both'): Promise<DataProvider> {
    const response = await api.post<DataProvider>(`/settings/data-providers/${id}/reset-usage`, { type });
    return response.data;
  },

  async resetProviderHealth(id: string): Promise<DataProvider> {
    const response = await api.post<DataProvider>(`/settings/data-providers/${id}/reset-health`);
    return response.data;
  },
};

export default settingsService;
