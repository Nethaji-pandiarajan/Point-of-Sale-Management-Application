// Common helper utilities for Saleiz backend
const formatDate = (date) => {
  return new Date(date).toISOString();
};

const sendSuccessResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data
  });
};

module.exports = {
  formatDate,
  sendSuccessResponse
};
