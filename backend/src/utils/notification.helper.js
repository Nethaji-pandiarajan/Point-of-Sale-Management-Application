const db = require('../config/db');

/**
 * Creates a database-driven system notification.
 * 
 * @param {Object} notificationData
 * @param {string} notificationData.title - Short descriptive title
 * @param {string} notificationData.message - Notification message text
 * @param {string} [notificationData.type='info'] - 'success' | 'info' | 'warning' | 'error'
 * @param {string} [notificationData.icon='bell'] - Icon identifier key
 * @param {string} [notificationData.reference_type='system'] - 'order' | 'product' | 'customer' | 'category' | 'system'
 * @param {string|number} [notificationData.reference_id=null] - ID of target entity
 * @param {number} [notificationData.created_by=null] - User ID initiating action
 */
const createNotification = async (notificationData) => {
  try {
    const {
      title,
      message,
      type = 'info',
      icon = 'bell',
      reference_type = 'system',
      reference_id = null,
      created_by = null
    } = notificationData;

    if (!title || !message) {
      console.warn('⚠️ Cannot create notification: Missing title or message');
      return null;
    }

    const result = await db.query(
      `INSERT INTO notifications (title, message, type, icon, reference_type, reference_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, message, type, icon, reference_type AS "referenceType", reference_id AS "referenceId", is_read AS "isRead", created_at AS "createdAt"`,
      [
        title.trim(),
        message.trim(),
        type,
        icon,
        reference_type,
        reference_id ? String(reference_id) : null,
        created_by ? parseInt(created_by, 10) : null
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('❌ Failed to log database notification:', error.message);
    return null;
  }
};

module.exports = {
  createNotification
};
