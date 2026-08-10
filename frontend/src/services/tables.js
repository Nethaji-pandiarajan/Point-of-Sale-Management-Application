import { fetchFromApi } from './api';

export const getTables = async (filters = {}, page = 1, limit = 10) => {
  const queryParams = new URLSearchParams();
  queryParams.append('page', page);
  queryParams.append('limit', limit);

  if (filters.status) queryParams.append('status', filters.status);
  if (filters.search) queryParams.append('search', filters.search);

  const response = await fetchFromApi(`/tables?${queryParams.toString()}`);
  return response; // returns { status, data, pagination }
};

export const getTable = async (id) => {
  const response = await fetchFromApi(`/tables/${id}`);
  return response.data;
};

export const createTable = async (data) => {
  const response = await fetchFromApi('/tables', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.data;
};

export const updateTable = async (id, data) => {
  const response = await fetchFromApi(`/tables/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return response.data;
};

export const deleteTable = async (id) => {
  const response = await fetchFromApi(`/tables/${id}`, {
    method: 'DELETE'
  });
  return response;
};
