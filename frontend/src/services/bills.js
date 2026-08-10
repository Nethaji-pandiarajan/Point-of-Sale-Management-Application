import { fetchFromApi } from './api';

export const generateBill = async (orderId) => {
  const response = await fetchFromApi('/bills/generate', {
    method: 'POST',
    body: JSON.stringify({ orderId })
  });
  return response.data;
};

export const getBillByOrderId = async (orderId) => {
  const response = await fetchFromApi(`/bills/order/${orderId}`);
  return response.data;
};

export const processPayment = async (billId, payload = {}) => {
  const response = await fetchFromApi(`/bills/${billId}/pay`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return response.data;
};
