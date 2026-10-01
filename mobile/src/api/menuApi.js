import apiClient from './apiClient';

export const menuApi = {
  getProducts: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.availability) query.append('availability', params.availability);
    if (params.search) query.append('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get(`/api/products${queryString}`);
  },

  getCategories: async () => {
    return apiClient.get('/api/categories');
  }
};

export default menuApi;
