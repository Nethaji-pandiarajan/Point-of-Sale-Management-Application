const db = require('../config/db');
const { createNotification } = require('../utils/notification.helper');

const getCustomers = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    let queryText = `
      SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at AS "joinedDate",
             COALESCE(COUNT(o.id), 0)::integer AS "totalOrders",
             COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END), 0)::numeric AS "totalSpent"
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role = 'customer'
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      queryText += ` AND u.status = $${paramIndex++}`;
      params.push(status);
    }

    if (search) {
      queryText += ` AND (LOWER(u.name) LIKE $${paramIndex} OR LOWER(u.email) LIKE $${paramIndex} OR u.phone LIKE $${paramIndex})`;
      params.push(`%${search.toLowerCase().trim()}%`);
      paramIndex++;
    }

    queryText += `
      GROUP BY u.id, u.name, u.email, u.phone, u.status, u.created_at
      ORDER BY u.name ASC
    `;

    const result = await db.query(queryText, params);

    const mapped = result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      email: row.email,
      phone: row.phone || '',
      status: row.status,
      totalOrders: row.totalOrders,
      totalSpent: parseFloat(row.totalSpent),
      joinedDate: row.joinedDate ? new Date(row.joinedDate).toISOString().split('T')[0] : ''
    }));

    res.status(200).json({
      status: 'success',
      data: mapped
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find customer
    const userResult = await db.query(`
      SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at AS "joinedDate",
             COALESCE(COUNT(o.id), 0)::integer AS "totalOrders",
             COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END), 0)::numeric AS "totalSpent"
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.id = $1 AND u.role = 'customer'
      GROUP BY u.id, u.name, u.email, u.phone, u.status, u.created_at
    `, [id]);

    const customer = userResult.rows[0];
    if (!customer) {
      return res.status(404).json({ status: 'error', message: 'Customer not found' });
    }

    // Query historical orders for this customer from database with dynamic item concatenation
    const ordersResult = await db.query(`
      SELECT o.id, o.order_number AS "orderNo", o.total_amount AS total, o.created_at AS date, o.status,
             COALESCE(STRING_AGG(oi.quantity || 'x ' || oi.product_name, ', '), '') AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1
      GROUP BY o.id, o.order_number, o.total_amount, o.created_at, o.status
      ORDER BY o.created_at DESC
    `, [id]);

    const orderHistory = ordersResult.rows.map(o => ({
      id: o.id,
      items: o.items || 'No items',
      total: `₹${parseFloat(o.total).toFixed(2)}`,
      date: new Date(o.date).toISOString().split('T')[0],
      status: o.status
    }));

    res.status(200).json({
      status: 'success',
      data: {
        id: customer.id.toString(),
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        totalOrders: customer.totalOrders,
        totalSpent: parseFloat(customer.totalSpent),
        status: customer.status,
        joinedDate: customer.joinedDate ? new Date(customer.joinedDate).toISOString().split('T')[0] : '',
        orders: orderHistory
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateCustomerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status !== 'active' && status !== 'blocked') {
      return res.status(400).json({ status: 'error', message: 'Status must be active or blocked' });
    }

    const result = await db.query(`
      UPDATE users 
      SET status = $1 
      WHERE id = $2 AND role = $3 
      RETURNING id, name, email, phone, status
    `, [status, id, 'customer']);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Customer not found' });
    }

    const updatedCustomer = result.rows[0];

    createNotification({
      title: status === 'blocked' ? 'Customer Account Blocked' : 'Customer Account Unblocked',
      message: `Customer "${updatedCustomer.name}" status updated to ${status}.`,
      type: status === 'blocked' ? 'warning' : 'info',
      icon: 'users',
      reference_type: 'customer',
      reference_id: id
    });

    res.status(200).json({
      status: 'success',
      data: {
        ...updatedCustomer,
        id: updatedCustomer.id.toString()
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  updateCustomerStatus
};
