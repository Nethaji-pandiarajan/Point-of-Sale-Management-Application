import { fetchFromApi } from './api';

export const getSalesReport = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await fetchFromApi(`/reports/sales?${query}`);
  return response.data;
};

export const getProductReport = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await fetchFromApi(`/reports/products?${query}`);
  return response.data;
};

export const getCategoryReport = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await fetchFromApi(`/reports/categories?${query}`);
  return response.data;
};

export const getTableReport = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await fetchFromApi(`/reports/tables?${query}`);
  return response.data;
};

export const getWaiterReport = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await fetchFromApi(`/reports/waiters?${query}`);
  return response.data;
};

export const getPaymentReport = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await fetchFromApi(`/reports/payments?${query}`);
  return response.data;
};
