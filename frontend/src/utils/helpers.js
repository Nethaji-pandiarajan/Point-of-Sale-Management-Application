// General utility helpers for Saleiz frontend
export const formatCurrency = (value) => {
  const num = parseFloat(value);
  if (isNaN(num)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(num);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const getProductImageUrl = (imagePath) => {
  if (!imagePath) return '🍔';
  if (imagePath.startsWith('data:') || imagePath.startsWith('http') || imagePath.startsWith('/')) {
    if (imagePath.startsWith('/uploads')) {
      const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
      return `${backendUrl}${imagePath}`;
    }
    return imagePath;
  }
  return imagePath; // emoji or local asset fallback
};
