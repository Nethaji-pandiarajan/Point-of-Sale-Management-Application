import { fetchFromApi } from './api';

export const getProfile = async () => {
  const response = await fetchFromApi('/admin/profile');
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await fetchFromApi('/admin/profile', {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
  return response.data;
};

export const changePassword = async (data) => {
  const response = await fetchFromApi('/admin/change-password', {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
  return response;
};

export const getRestaurantSettings = async () => {
  const response = await fetchFromApi('/restaurant/settings');
  return response.data;
};

export const updateRestaurantSettings = async (data) => {
  const response = await fetchFromApi('/restaurant/settings', {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
  return response.data;
};

export const uploadProfilePhoto = async (formData) => {
  const response = await fetchFromApi('/profile/upload-photo', {
    method: 'POST',
    body: formData
  });
  return response;
};

export const getDashboardStats = async () => {
  const response = await fetchFromApi('/admin/dashboard');
  return response.data;
};
