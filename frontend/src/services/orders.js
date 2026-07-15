import { fetchFromApi } from './api';

export const getOrders = async (filters = {}, page = 1, limit = 5) => {
  const queryParams = new URLSearchParams();
  queryParams.append('page', page);
  queryParams.append('limit', limit);

  if (filters.status) queryParams.append('status', filters.status);
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.startDate) queryParams.append('startDate', filters.startDate);
  if (filters.endDate) queryParams.append('endDate', filters.endDate);

  const response = await fetchFromApi(`/orders?${queryParams.toString()}`);
  return response; // returns full response, containing { data, pagination }
};

export const getOrder = async (id) => {
  const response = await fetchFromApi(`/orders/${id}`);
  return response.data;
};

export const updateOrderStatus = async (id, status) => {
  const response = await fetchFromApi(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
  return response.data;
};
