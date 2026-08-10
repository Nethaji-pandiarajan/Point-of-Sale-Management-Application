import { fetchFromApi } from './api';

export const getStaff = async (filters = {}, page = 1, limit = 10) => {
  const queryParams = new URLSearchParams();
  queryParams.append('page', page);
  queryParams.append('limit', limit);

  if (filters.status) queryParams.append('status', filters.status);
  if (filters.search) queryParams.append('search', filters.search);

  const response = await fetchFromApi(`/staff?${queryParams.toString()}`);
  return response; // returns { status, data, pagination }
};

export const getStaffMember = async (id) => {
  const response = await fetchFromApi(`/staff/${id}`);
  return response.data;
};

export const createStaff = async (data) => {
  const response = await fetchFromApi('/staff', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.data;
};

export const updateStaff = async (id, data) => {
  const response = await fetchFromApi(`/staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return response.data;
};

export const resetStaffPassword = async (id, newPassword) => {
  const response = await fetchFromApi(`/staff/${id}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ newPassword })
  });
  return response;
};

export const deleteStaff = async (id) => {
  const response = await fetchFromApi(`/staff/${id}`, {
    method: 'DELETE'
  });
  return response;
};
