/**
 * Helper to extract a timestamp for a given status from the order's timeline array
 */
export function getTimelineTimestamp(timeline, targetStatus) {
  if (!Array.isArray(timeline)) return null;
  for (let i = timeline.length - 1; i >= 0; i--) {
    const entry = timeline[i];
    if (entry && entry.status === targetStatus && (entry.time || entry.timestamp)) {
      return entry.time || entry.timestamp;
    }
  }
  return null;
}

/**
 * Formats a duration in milliseconds into a concise, readable string.
 * Returns null if duration is negative, NaN, or exceeds 24 hours (unrealistic for a meal).
 */
export function formatDurationSpan(diffMs) {
  if (typeof diffMs !== 'number' || isNaN(diffMs) || diffMs < 0) return null;
  const diffMins = Math.floor(diffMs / 60000);

  // If longer than 24 hours, consider it stale/unrealistic test data
  if (diffMins > 24 * 60) return null;

  if (diffMins < 1) return '< 1 min';
  if (diffMins < 60) return `${diffMins} min`;

  const hrs = Math.floor(diffMins / 60);
  const remainingMins = diffMins % 60;
  return `${hrs} hr ${remainingMins.toString().padStart(2, '0')} min`;
}

/**
 * Calculates order timing and duration information.
 *
 * Rules:
 * 1. For ACTIVE orders (pending, preparing, ready):
 *    - Live elapsed time = Date.now() - createdAt
 *    - Example: "8 min elapsed", "1 hr 12 min elapsed"
 * 2. For SERVED orders:
 *    - Frozen timer = servedAt - createdAt
 *    - Example: "Served in 15 min", fallback: "Served"
 *    - NEVER uses Date.now()
 * 3. For COMPLETED orders:
 *    - Frozen timer = completedAt - createdAt
 *    - Example: "Completed in 18 min", fallback: "Completed"
 *    - NEVER uses Date.now()
 * 4. Stale records (> 24 hours):
 *    - Clean fallback: "Served" or "Completed" (never 100+ hr elapsed)
 */
export function getOrderTimingInfo(order) {
  if (!order) {
    return { text: 'Just now', isLive: false, status: 'unknown' };
  }

  const status = (order.status || '').toLowerCase();
  const createdAt = order.createdAt ? new Date(order.createdAt).getTime() : null;

  // COMPLETED ORDERS
  if (status === 'completed') {
    const rawCompletedTime =
      order.completedAt ||
      getTimelineTimestamp(order.timeline, 'completed') ||
      order.updatedAt;

    if (createdAt && rawCompletedTime) {
      const finishTime = new Date(rawCompletedTime).getTime();
      const diffMs = finishTime - createdAt;
      const formatted = formatDurationSpan(diffMs);
      if (formatted) {
        return {
          text: `Completed in ${formatted}`,
          isLive: false,
          isCompleted: true,
          status,
        };
      }
    }
    return {
      text: 'Completed',
      isLive: false,
      isCompleted: true,
      status,
    };
  }

  // SERVED ORDERS
  if (status === 'served') {
    const rawServedTime =
      order.servedAt ||
      getTimelineTimestamp(order.timeline, 'served') ||
      order.updatedAt;

    if (createdAt && rawServedTime) {
      const finishTime = new Date(rawServedTime).getTime();
      const diffMs = finishTime - createdAt;
      const formatted = formatDurationSpan(diffMs);
      if (formatted) {
        return {
          text: `Served in ${formatted}`,
          isLive: false,
          isServed: true,
          status,
        };
      }
    }
    return {
      text: 'Served',
      isLive: false,
      isServed: true,
      status,
    };
  }

  // CANCELLED ORDERS
  if (status === 'cancelled') {
    return {
      text: 'Cancelled',
      isLive: false,
      isCancelled: true,
      status,
    };
  }

  // ACTIVE ORDERS (pending, preparing, ready, or any ongoing)
  if (!createdAt) {
    return {
      text: 'Just now',
      isLive: true,
      isActive: true,
      status,
    };
  }

  const diffMs = Date.now() - createdAt;
  if (diffMs < 0) {
    return {
      text: 'Just now',
      isLive: true,
      isActive: true,
      status,
    };
  }

  const formatted = formatDurationSpan(diffMs);
  if (!formatted) {
    // Unrealistic active duration (e.g. stale order from days ago)
    return {
      text: 'Active',
      isLive: true,
      isActive: true,
      status,
    };
  }

  return {
    text: `${formatted} elapsed`,
    isLive: true,
    isActive: true,
    status,
  };
}

export default getOrderTimingInfo;
