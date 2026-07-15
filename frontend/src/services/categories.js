import { fetchFromApi } from './api';

export const getCategories = async () => {
  const response = await fetchFromApi('/categories');
  return response.data;
};

export const createCategory = async (data) => {
  const response = await fetchFromApi('/categories', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.data;
};

export const updateCategory = async (id, data) => {
  const response = await fetchFromApi(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await fetchFromApi(`/categories/${id}`, {
    method: 'DELETE'
  });
  return response;
};
