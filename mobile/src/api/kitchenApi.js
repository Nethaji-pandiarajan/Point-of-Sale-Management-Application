import apiClient from './apiClient';

export const kitchenApi = {
  getKots: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.tableNo) query.append('tableNo', params.tableNo);
    if (params.search) query.append('search', params.search);
    query.append('limit', params.limit || 50);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get(`/api/kots${queryString}`);
  },

  getKotById: async (id) => {
    return apiClient.get(`/api/kots/${id}`);
  },

  updateKotStatus: async (id, status) => {
    return apiClient.patch(`/api/kots/${id}/status`, { status });
  }
};

export default kitchenApi;
