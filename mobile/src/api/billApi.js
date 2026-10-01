import apiClient from './apiClient';

export const billApi = {
  generateBill: async (orderId) => {
    return apiClient.post('/api/bills/generate', { orderId });
  },

  getBillByOrderId: async (orderId) => {
    return apiClient.get(`/api/bills/order/${orderId}`);
  },

  processPayment: async (billId, { paymentMethod = 'cash', discount = 0, tax = 0 }) => {
    return apiClient.post(`/api/bills/${billId}/pay`, {
      paymentMethod,
      discount,
      tax
    });
  }
};

export default billApi;
