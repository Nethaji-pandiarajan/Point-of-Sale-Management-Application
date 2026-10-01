import apiClient from './apiClient';

export const orderApi = {
  getOrders: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.tableNo) query.append('tableNo', params.tableNo);
    if (params.waiterName) query.append('waiterName', params.waiterName);
    if (params.waiterId) query.append('waiterId', params.waiterId);
    if (params.paymentStatus) query.append('paymentStatus', params.paymentStatus);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page);
    query.append('limit', params.limit || 50);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get(`/api/orders${queryString}`);
  },

  getOrderById: async (id) => {
    return apiClient.get(`/api/orders/${id}`);
  },

  createOrder: async ({ items, orderType = 'dine_in', tableNo, guestCount, notes }) => {
    return apiClient.post('/api/orders', {
      items,
      orderType,
      tableNo,
      guestCount,
      notes
    });
  },

  addItemsToOrder: async (orderId, { items, notes }) => {
    return apiClient.post(`/api/orders/${orderId}/items`, {
      items,
      notes
    });
  },

  updateOrderStatus: async (orderId, status) => {
    return apiClient.patch(`/api/orders/${orderId}/status`, { status });
  },

  takeoverOrder: async (orderId) => {
    return apiClient.patch(`/api/orders/${orderId}/takeover`);
  }
};

export default orderApi;
