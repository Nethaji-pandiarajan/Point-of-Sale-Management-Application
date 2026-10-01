import apiClient, { setAuthToken } from './apiClient';

export const authApi = {
  login: async (email, password) => {
    const data = await apiClient.post('/api/auth/login', { email, password });
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  logout: async () => {
    setAuthToken(null);
    return { success: true };
  },

  getProfile: async () => {
    return apiClient.get('/api/auth/me');
  }
};

export default authApi;
