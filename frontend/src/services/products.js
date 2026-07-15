import { fetchFromApi } from './api';

export const getProducts = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  if (filters.category) queryParams.append('category', filters.category);
  if (filters.availability) queryParams.append('availability', filters.availability);
  if (filters.search) queryParams.append('search', filters.search);

  const queryStr = queryParams.toString();
  const endpoint = `/products${queryStr ? `?${queryStr}` : ''}`;
  
  const response = await fetchFromApi(endpoint);
  return response.data;
};

export const createProduct = async (data) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== null) {
      formData.append(key, data[key]);
    }
  });

  const response = await fetchFromApi('/products', {
    method: 'POST',
    body: formData
  });
  return response.data;
};

export const updateProduct = async (id, data) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== null) {
      formData.append(key, data[key]);
    }
  });

  const response = await fetchFromApi(`/products/${id}`, {
    method: 'PUT',
    body: formData
  });
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await fetchFromApi(`/products/${id}`, {
    method: 'DELETE'
  });
  return response;
};
