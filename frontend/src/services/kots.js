import { fetchFromApi } from './api';

export const getKots = async (filters = {}, page = 1, limit = 20) => {
  const queryParams = new URLSearchParams();
  queryParams.append('page', page);
  queryParams.append('limit', limit);

  if (filters.status) queryParams.append('status', filters.status);
  if (filters.tableNo) queryParams.append('tableNo', filters.tableNo);
  if (filters.waiterName) queryParams.append('waiterName', filters.waiterName);
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.startDate) queryParams.append('startDate', filters.startDate);
  if (filters.endDate) queryParams.append('endDate', filters.endDate);

  const response = await fetchFromApi(`/kots?${queryParams.toString()}`);
  return response;
};

export const getKot = async (id) => {
  const response = await fetchFromApi(`/kots/${id}`);
  return response.data;
};

export const updateKotStatus = async (id, status) => {
  const response = await fetchFromApi(`/kots/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
  return response.data;
};
