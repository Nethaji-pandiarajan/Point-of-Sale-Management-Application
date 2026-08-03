import { fetchFromApi } from './api';

export const getNotifications = async (filters = {}) => {
  const query = new URLSearchParams();
  
  if (filters.page) query.append('page', filters.page);
  if (filters.limit) query.append('limit', filters.limit);
  if (filters.search) query.append('search', filters.search);
  if (filters.type && filters.type !== 'all') query.append('type', filters.type);
  if (filters.read !== undefined && filters.read !== 'all') query.append('read', filters.read);
  if (filters.reference_type && filters.reference_type !== 'all') query.append('reference_type', filters.reference_type);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const response = await fetchFromApi(`/notifications${queryString}`);
  return response;
};

export const getUnreadCount = async () => {
  const response = await fetchFromApi('/notifications/unread-count');
  return response.unreadCount || 0;
};

export const markAsRead = async (id) => {
  const response = await fetchFromApi(`/notifications/${id}/read`, {
    method: 'PATCH'
  });
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await fetchFromApi('/notifications/read-all', {
    method: 'PATCH'
  });
  return response;
};

export const deleteNotification = async (id) => {
  const response = await fetchFromApi(`/notifications/${id}`, {
    method: 'DELETE'
  });
  return response;
};

export const clearReadNotifications = async () => {
  const response = await fetchFromApi('/notifications/clear-read', {
    method: 'DELETE'
  });
  return response;
};
