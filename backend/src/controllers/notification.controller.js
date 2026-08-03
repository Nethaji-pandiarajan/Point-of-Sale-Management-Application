const db = require('../config/db');

const getNotifications = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      read,
      reference_type,
      startDate,
      endDate
    } = req.query;

    let countQuery = `SELECT COUNT(*)::integer FROM notifications WHERE 1=1`;
    let queryText = `
      SELECT id, title, message, type, icon, 
             reference_type AS "referenceType", 
             reference_id AS "referenceId", 
             is_read AS "isRead", 
             created_at AS "createdAt"
      FROM notifications
      WHERE 1=1
    `;

    const params = [];
    let idx = 1;

    // Filters
    if (type) {
      countQuery += ` AND type = $${idx}`;
      queryText += ` AND type = $${idx}`;
      params.push(type);
      idx++;
    }

    if (read === 'true') {
      countQuery += ` AND is_read = TRUE`;
      queryText += ` AND is_read = TRUE`;
    } else if (read === 'false') {
      countQuery += ` AND is_read = FALSE`;
      queryText += ` AND is_read = FALSE`;
    }

    if (reference_type && reference_type !== 'all') {
      countQuery += ` AND reference_type = $${idx}`;
      queryText += ` AND reference_type = $${idx}`;
      params.push(reference_type);
      idx++;
    }

    if (search) {
      countQuery += ` AND (title ILIKE $${idx} OR message ILIKE $${idx})`;
      queryText += ` AND (title ILIKE $${idx} OR message ILIKE $${idx})`;
      params.push(`%${search.trim()}%`);
      idx++;
    }

    if (startDate) {
      countQuery += ` AND created_at >= $${idx}`;
      queryText += ` AND created_at >= $${idx}`;
      params.push(new Date(startDate));
      idx++;
    }

    if (endDate) {
      countQuery += ` AND created_at <= $${idx}`;
      queryText += ` AND created_at <= $${idx}`;
      params.push(new Date(endDate));
      idx++;
    }

    // Total Count
    const countRes = await db.query(countQuery, params);
    const totalCount = parseInt(countRes.rows[0].count, 10);

    // Unread Count
    const unreadRes = await db.query(`SELECT COUNT(*)::integer FROM notifications WHERE is_read = FALSE`);
    const unreadCount = parseInt(unreadRes.rows[0].count, 10);

    // Sorting & Pagination
    queryText += ` ORDER BY created_at DESC`;

    const limitNum = parseInt(limit, 10);
    const pageNum = parseInt(page, 10);
    const totalPages = Math.ceil(totalCount / limitNum) || 1;
    const offset = (pageNum - 1) * limitNum;

    queryText += ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limitNum);
    params.push(offset);

    const result = await db.query(queryText, params);

    res.status(200).json({
      status: 'success',
      data: result.rows,
      pagination: {
        totalCount,
        unreadCount,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });

  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const unreadRes = await db.query(`SELECT COUNT(*)::integer FROM notifications WHERE is_read = FALSE`);
    const unreadCount = parseInt(unreadRes.rows[0].count, 10);

    res.status(200).json({
      status: 'success',
      unreadCount
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid notification ID' });
    }

    const result = await db.query(
      `UPDATE notifications 
       SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING id, title, message, type, icon, reference_type AS "referenceType", reference_id AS "referenceId", is_read AS "isRead", created_at AS "createdAt"`,
      [parsedId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Notification not found' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const result = await db.query(
      `UPDATE notifications SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP WHERE is_read = FALSE`
    );

    res.status(200).json({
      status: 'success',
      message: `${result.rowCount} notification(s) marked as read`,
      updatedCount: result.rowCount
    });
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid notification ID' });
    }

    const result = await db.query(`DELETE FROM notifications WHERE id = $1`, [parsedId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Notification not found' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const clearReadNotifications = async (req, res, next) => {
  try {
    const result = await db.query(`DELETE FROM notifications WHERE is_read = TRUE`);

    res.status(200).json({
      status: 'success',
      message: `Cleared ${result.rowCount} read notification(s)`,
      deletedCount: result.rowCount
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications
};
