import { fetchFromApi } from './api';

export const getCustomers = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.search) queryParams.append('search', filters.search);

  const queryStr = queryParams.toString();
  const endpoint = `/customers${queryStr ? `?${queryStr}` : ''}`;

  const response = await fetchFromApi(endpoint);
  return response.data;
};

export const getCustomer = async (id) => {
  const response = await fetchFromApi(`/customers/${id}`);
  return response.data;
};

export const updateCustomerStatus = async (id, status) => {
  const response = await fetchFromApi(`/customers/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
  return response.data;
};
