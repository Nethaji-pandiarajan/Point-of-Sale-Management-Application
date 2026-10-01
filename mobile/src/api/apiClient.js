// Centralized API Base URL (defaults to laptop LAN IP for physical device & APK testing)
const DEFAULT_URL = 'http://192.168.1.45:5000';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_URL;

let authToken = null;
let onUnauthorizedCallback = null;

export const setAuthToken = (token) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

export const setOnUnauthorized = (callback) => {
  onUnauthorizedCallback = callback;
};

export async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {})
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const config = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(url, config);
    const contentType = res.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      const errorMsg = (data && data.message) || res.statusText || 'API Request Failed';
      const error = new Error(errorMsg);
      error.status = res.status;
      error.data = data;

      if (res.status === 401) {
        // Clear token immediately to avoid repeating 401 calls
        authToken = null;
        if (onUnauthorizedCallback) {
          try {
            onUnauthorizedCallback(errorMsg);
          } catch (cbErr) {
            console.warn('[API] onUnauthorizedCallback error:', cbErr.message);
          }
        }
      }

      throw error;
    }

    return data;
  } catch (error) {
    const isNetworkError =
      error.name === 'TypeError' ||
      error.message?.includes('Network') ||
      error.message?.includes('fetch') ||
      error.message?.includes('Failed to fetch');

    if (isNetworkError) {
      console.error(
        `[API Network Failure] Could not reach backend at: ${url}\nDetails: ${error.message}\nMake sure your Android device is on the SAME Wi-Fi network and can reach http://192.168.1.45:5000.`
      );
    } else if (error.status !== 401) {
      console.warn(`[API] Error on ${config.method || 'GET'} ${url} [Status ${error.status || 'N/A'}]:`, error.message);
    }
    throw error;
  }
}

export default {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};
