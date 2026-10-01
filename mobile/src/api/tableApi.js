import apiClient from './apiClient';

export const tableApi = {
  getTables: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page);
    query.append('limit', params.limit || 50);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get(`/api/tables${queryString}`);
  },

  getTableById: async (id) => {
    return apiClient.get(`/api/tables/${id}`);
  }
};

export default tableApi;
