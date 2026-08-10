const db = require('../config/db');
const { createNotification } = require('../utils/notification.helper');

const getKots = async (req, res, next) => {
  try {
    const { status, tableNo, waiterName, search, startDate, endDate, page = 1, limit = 20 } = req.query;

    let countQueryText = `
      SELECT COUNT(k.id)::integer
      FROM kots k
      LEFT JOIN orders o ON k.order_id = o.id
      WHERE 1=1
    `;

    let queryText = `
      SELECT k.id, k.kot_number AS "kotNumber", k.order_id AS "orderId", k.table_number AS "tableNo",
             k.waiter_id AS "waiterId", k.waiter_name AS "waiterName", k.status, k.notes, k.items,
             k.created_at AS "createdAt", k.updated_at AS "updatedAt",
             o.order_number AS "orderNo", o.status AS "orderStatus"
      FROM kots k
      LEFT JOIN orders o ON k.order_id = o.id
      WHERE 1=1
    `;

    const params = [];
    let index = 1;

    if (status) {
      countQueryText += ` AND k.status = $${index}`;
      queryText += ` AND k.status = $${index}`;
      params.push(status);
      index++;
    }

    if (tableNo) {
      countQueryText += ` AND LOWER(k.table_number) = LOWER($${index})`;
      queryText += ` AND LOWER(k.table_number) = LOWER($${index})`;
      params.push(tableNo.trim());
      index++;
    }

    if (waiterName) {
      countQueryText += ` AND k.waiter_name ILIKE $${index}`;
      queryText += ` AND k.waiter_name ILIKE $${index}`;
      params.push(`%${waiterName.trim()}%`);
      index++;
    }

    if (search) {
      countQueryText += ` AND (k.kot_number ILIKE $${index} OR o.order_number ILIKE $${index} OR k.table_number ILIKE $${index} OR k.waiter_name ILIKE $${index} OR k.notes ILIKE $${index})`;
      queryText += ` AND (k.kot_number ILIKE $${index} OR o.order_number ILIKE $${index} OR k.table_number ILIKE $${index} OR k.waiter_name ILIKE $${index} OR k.notes ILIKE $${index})`;
      params.push(`%${search.trim()}%`);
      index++;
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      countQueryText += ` AND k.created_at >= $${index}`;
      queryText += ` AND k.created_at >= $${index}`;
      params.push(start);
      index++;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      countQueryText += ` AND k.created_at <= $${index}`;
      queryText += ` AND k.created_at <= $${index}`;
      params.push(end);
      index++;
    }

    const countRes = await db.query(countQueryText, params);
    const totalCount = countRes.rows[0].count;

    queryText += ` ORDER BY k.created_at DESC`;

    const limitNum = parseInt(limit, 10) || 20;
    const pageNum = parseInt(page, 10) || 1;
    const offset = (pageNum - 1) * limitNum;

    queryText += ` LIMIT $${index++} OFFSET $${index++}`;
    params.push(limitNum, offset);

    const kotsRes = await db.query(queryText, params);

    const formatted = kotsRes.rows.map(row => ({
      id: row.id,
      kotNumber: row.kotNumber,
      orderId: row.orderId,
      orderNo: row.orderNo || `ORD-${row.orderId}`,
      orderStatus: row.orderStatus,
      tableNo: row.tableNo || '',
      waiterId: row.waiterId,
      waiterName: row.waiterName || 'Staff Waiter',
      status: row.status,
      notes: row.notes || '',
      items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));

    res.status(200).json({
      status: 'success',
      data: formatted,
      pagination: {
        totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum) || 1
      }
    });
  } catch (error) {
    next(error);
  }
};

const getKotById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid KOT ID format' });
    }

    const queryText = `
      SELECT k.id, k.kot_number AS "kotNumber", k.order_id AS "orderId", k.table_number AS "tableNo",
             k.waiter_id AS "waiterId", k.waiter_name AS "waiterName", k.status, k.notes, k.items,
             k.created_at AS "createdAt", k.updated_at AS "updatedAt",
             o.order_number AS "orderNo", o.status AS "orderStatus"
      FROM kots k
      LEFT JOIN orders o ON k.order_id = o.id
      WHERE k.id = $1
    `;

    const result = await db.query(queryText, [parsedId]);
    const row = result.rows[0];

    if (!row) {
      return res.status(404).json({ status: 'error', message: 'KOT ticket not found' });
    }

    const formatted = {
      id: row.id,
      kotNumber: row.kotNumber,
      orderId: row.orderId,
      orderNo: row.orderNo || `ORD-${row.orderId}`,
      orderStatus: row.orderStatus,
      tableNo: row.tableNo || '',
      waiterId: row.waiterId,
      waiterName: row.waiterName || 'Staff Waiter',
      status: row.status,
      notes: row.notes || '',
      items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };

    res.status(200).json({
      status: 'success',
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

const updateKotStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid KOT ID format' });
    }

    const { status } = req.body;
    const validStatuses = ['new', 'preparing', 'ready', 'served', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Invalid KOT status' });
    }

    const kotRes = await db.query('SELECT * FROM kots WHERE id = $1', [parsedId]);
    const kot = kotRes.rows[0];
    if (!kot) {
      return res.status(404).json({ status: 'error', message: 'KOT ticket not found' });
    }

    if (kot.status === status) {
      return getKotById(req, res, next);
    }

    const allowedKotTransitions = {
      new: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['served', 'cancelled'],
      served: [],
      cancelled: []
    };

    const currentKotStatus = kot.status || 'new';
    const allowedNext = allowedKotTransitions[currentKotStatus] || [];

    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid KOT status transition from "${currentKotStatus}" to "${status}". Allowed transitions: [${allowedNext.join(', ')}]`
      });
    }

    // Update KOT status
    const updateRes = await db.query(
      'UPDATE kots SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, parsedId]
    );

    // Sync parent Order status
    const orderStatusMap = {
      new: 'pending',
      preparing: 'preparing',
      ready: 'ready',
      served: 'served',
      cancelled: 'cancelled'
    };
    const targetOrderStatus = orderStatusMap[status] || 'pending';

    if (kot.order_id) {
      // Append timeline to order
      const orderRes = await db.query('SELECT timeline, order_number FROM orders WHERE id = $1', [kot.order_id]);
      if (orderRes.rowCount > 0) {
        const order = orderRes.rows[0];
        const timeline = order.timeline || [];
        const performer = req.user ? `${req.user.name} (${req.user.role || 'Kitchen Staff'})` : 'Kitchen Staff';

        timeline.push({
          status: targetOrderStatus,
          time: new Date().toISOString(),
          note: `Kitchen updated KOT ${kot.kot_number} to "${status.toUpperCase()}"`,
          by: performer
        });

        await db.query(
          'UPDATE orders SET status = $1, timeline = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
          [targetOrderStatus, JSON.stringify(timeline), kot.order_id]
        );
      }
    }

    // Trigger Notification
    createNotification({
      title: `KOT ${kot.kot_number} is ${status.toUpperCase()}`,
      message: `KOT Ticket ${kot.kot_number} (${kot.table_number || 'Dine-In'}) changed status to "${status.toUpperCase()}".`,
      type: status === 'ready' || status === 'served' ? 'success' : status === 'preparing' ? 'info' : 'warning',
      icon: 'chef-hat',
      reference_type: 'kot',
      reference_id: parsedId
    });

    return getKotById(req, res, next);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getKots,
  getKotById,
  updateKotStatus
};
