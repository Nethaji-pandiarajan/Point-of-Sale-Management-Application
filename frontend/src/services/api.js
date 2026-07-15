// Base API client service for Saleiz frontend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const fetchFromApi = async (endpoint, options = {}) => {
  const token = localStorage.getItem('saleiz_token') || sessionStorage.getItem('saleiz_token');

  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      // Clear corrupt or expired session details
      localStorage.removeItem('saleiz_token');
      localStorage.removeItem('saleiz_user');
      sessionStorage.removeItem('saleiz_token');
      sessionStorage.removeItem('saleiz_user');
      
      // Save alert flag for login screen
      sessionStorage.setItem('saleiz_session_expired', 'true');
      
      // Force redirect to login page
      window.location.href = '/login';
      return;
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    return data;
  } catch (error) {
    console.error(`❌ API error fetching ${endpoint}:`, error.message);
    throw error;
  }
};
