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

export const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const getOrderTimeMetrics = (order, now = new Date()) => {
  if (!order || !order.createdAt) {
    return { primaryText: '—', secondaryText: '', urgency: 'normal' };
  }

  const createdTime = new Date(order.createdAt);
  if (isNaN(createdTime.getTime())) {
    return { primaryText: '—', secondaryText: '', urgency: 'normal' };
  }

  const status = (order.status || '').toLowerCase();
  const timeline = Array.isArray(order.timeline) ? order.timeline : [];

  let startTime = createdTime;
  let endTime = now;
  let labelSuffix = 'ago';

  if (status === 'pending') {
    labelSuffix = 'waiting';
    endTime = now;
  } else if (status === 'preparing') {
    labelSuffix = 'preparing';
    const prepEvent = timeline.find(t => t.status === 'preparing');
    if (prepEvent && prepEvent.time) {
      const pTime = new Date(prepEvent.time);
      if (!isNaN(pTime.getTime())) {
        startTime = pTime;
      }
    }
    endTime = now;
  } else if (status === 'completed') {
    labelSuffix = 'total';
    const compEvent = timeline.find(t => t.status === 'completed');
    if (compEvent && compEvent.time) {
      const cTime = new Date(compEvent.time);
      if (!isNaN(cTime.getTime())) {
        endTime = cTime;
      }
    } else {
      endTime = order.updatedAt ? new Date(order.updatedAt) : createdTime;
    }
  } else if (status === 'cancelled') {
    labelSuffix = 'total';
    const cancelEvent = timeline.find(t => t.status === 'cancelled');
    if (cancelEvent && cancelEvent.time) {
      const cancTime = new Date(cancelEvent.time);
      if (!isNaN(cancTime.getTime())) {
        endTime = cancTime;
      }
    } else {
      endTime = order.updatedAt ? new Date(order.updatedAt) : createdTime;
    }
  }

  const diffMs = Math.max(0, endTime.getTime() - startTime.getTime());
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  let primaryText = '';
  if (diffMinutes < 1) {
    primaryText = `0 min ${labelSuffix}`;
  } else if (diffMinutes < 60) {
    primaryText = `${diffMinutes} min ${labelSuffix}`;
  } else {
    const hrs = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    primaryText = `${hrs} hr ${mins} min ${labelSuffix}`;
  }

  // Calculate urgency for active orders (pending or preparing) based on total creation wait time
  let urgency = 'normal';
  if (status === 'pending' || status === 'preparing') {
    const totalWaitMs = Math.max(0, now.getTime() - createdTime.getTime());
    const totalWaitMins = Math.floor(totalWaitMs / (1000 * 60));
    if (totalWaitMins >= 20) {
      urgency = 'delayed';
    } else if (totalWaitMins >= 10) {
      urgency = 'attention';
    }
  }

  const secondaryText = `Placed at ${formatTime(order.createdAt)}`;

  return { primaryText, secondaryText, urgency, diffMinutes };
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
