const db = require('../config/db');

const getOrders = async (req, res, next) => {
  try {
    const { status, search, startDate, endDate, page = 1, limit = 5 } = req.query;

    let countQueryText = `
      SELECT COUNT(o.id)::integer
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;

    let queryText = `
      SELECT o.id, o.order_number AS "orderNo", o.order_type AS "orderType", o.table_number AS "tableNo",
             o.status, o.subtotal, o.total_amount AS "totalAmount", o.notes, o.timeline, o.created_at AS "createdAt",
             u.name AS "customerName", u.email, u.phone,
             COALESCE(
               JSON_AGG(
                 JSON_BUILD_OBJECT('name', oi.product_name, 'quantity', oi.quantity, 'price', oi.unit_price)
               ) FILTER (WHERE oi.id IS NOT NULL),
               '[]'::json
             ) AS items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1
    `;

    const params = [];
    let index = 1;

    if (status) {
      countQueryText += ` AND o.status = $${index}`;
      queryText += ` AND o.status = $${index}`;
      params.push(status);
      index++;
    }

    if (search) {
      countQueryText += ` AND (o.order_number ILIKE $${index} OR CAST(o.id AS TEXT) ILIKE $${index} OR u.name ILIKE $${index})`;
      queryText += ` AND (o.order_number ILIKE $${index} OR CAST(o.id AS TEXT) ILIKE $${index} OR u.name ILIKE $${index})`;
      params.push(`%${search.trim()}%`);
      index++;
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      countQueryText += ` AND o.created_at >= $${index}`;
      queryText += ` AND o.created_at >= $${index}`;
      params.push(start);
      index++;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      countQueryText += ` AND o.created_at <= $${index}`;
      queryText += ` AND o.created_at <= $${index}`;
      params.push(end);
      index++;
    }

    // Get total count
    const countRes = await db.query(countQueryText, params);
    const totalCount = countRes.rows[0].count;

    // Add pagination & sorting
    queryText += `
      GROUP BY o.id, u.name, u.email, u.phone
      ORDER BY o.created_at DESC
    `;

    const limitNum = parseInt(limit, 10);
    const pageNum = parseInt(page, 10);
    const totalPages = Math.ceil(totalCount / limitNum) || 1;
    const offset = (pageNum - 1) * limitNum;

    queryText += ` LIMIT $${index++} OFFSET $${index++}`;
    params.push(limitNum);
    params.push(offset);

    const ordersRes = await db.query(queryText, params);

    const formatted = ordersRes.rows.map(row => ({
      id: row.id,
      orderNo: row.orderNo,
      customerName: row.customerName || 'Anonymous Customer',
      email: row.email || '',
      phone: row.phone || '',
      tableNo: row.tableNo || '',
      items: row.items,
      totalAmount: parseFloat(row.totalAmount),
      status: row.status,
      createdAt: row.createdAt,
      timeline: row.timeline || []
    }));

    res.status(200).json({
      status: 'success',
      data: formatted,
      pagination: {
        totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid order ID format' });
    }

    const queryText = `
      SELECT o.id, o.order_number AS "orderNo", o.order_type AS "orderType", o.table_number AS "tableNo",
             o.status, o.subtotal, o.total_amount AS "totalAmount", o.notes, o.timeline, o.created_at AS "createdAt",
             u.name AS "customerName", u.email, u.phone,
             COALESCE(
               JSON_AGG(
                 JSON_BUILD_OBJECT('name', oi.product_name, 'quantity', oi.quantity, 'price', oi.unit_price)
               ) FILTER (WHERE oi.id IS NOT NULL),
               '[]'::json
             ) AS items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id, u.name, u.email, u.phone
    `;

    const result = await db.query(queryText, [parsedId]);
    const order = result.rows[0];

    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    const formatted = {
      id: order.id,
      orderNo: order.orderNo,
      customerName: order.customerName || 'Anonymous Customer',
      email: order.email || '',
      phone: order.phone || '',
      tableNo: order.tableNo || '',
      items: order.items,
      totalAmount: parseFloat(order.totalAmount),
      status: order.status,
      createdAt: order.createdAt,
      timeline: order.timeline || []
    };

    res.status(200).json({
      status: 'success',
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { items, orderType, tableNo, notes } = req.body;
    const userId = req.user.id; // user set by protect middleware

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    // 1. Fetch user
    const userRes = await client.query('SELECT status, name, email, phone FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];
    if (!user) {
      throw new Error('Authenticated user profile not found');
    }
    if (user.status === 'blocked') {
      throw new Error('Your user profile has been blocked. Order rejected.');
    }

    // 2. Validate all products and calculate sums
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const { productId, quantity } = item;
      const parsedProductId = parseInt(productId, 10);
      const qNum = parseInt(quantity, 10);

      if (isNaN(parsedProductId)) {
        throw new Error('Product ID must be an integer');
      }
      if (isNaN(qNum) || qNum <= 0) {
        throw new Error('Item quantity must be a positive integer');
      }

      const prodRes = await client.query('SELECT name, price, is_available FROM products WHERE id = $1', [parsedProductId]);
      const product = prodRes.rows[0];
      if (!product) {
        throw new Error(`Product not found`);
      }
      if (!product.is_available) {
        throw new Error(`Product "${product.name}" is currently unavailable/out of stock`);
      }

      const unitPrice = parseFloat(product.price);
      const totalPrice = unitPrice * qNum;
      subtotal += totalPrice;

      validatedItems.push({
        productId: parsedProductId,
        productName: product.name,
        quantity: qNum,
        unitPrice,
        totalPrice
      });
    }

    const totalAmount = subtotal;

    // 3. Generate sequential order number
    const year = new Date().getFullYear();
    const countRes = await client.query(
      "SELECT COUNT(id)::integer FROM orders WHERE created_at >= $1 AND created_at <= $2",
      [`${year}-01-01 00:00:00`, `${year}-12-31 23:59:59`]
    );
    const nextNum = (countRes.rows[0].count + 1).toString().padStart(6, '0');
    const orderNumber = `ORD-${year}-${nextNum}`;

    // 4. Create timeline logs
    const timeline = [
      { status: 'pending', time: new Date().toISOString(), note: `Order placed by customer ${user.name}` }
    ];

    // 5. Insert order (letting PostgreSQL assign integer ID automatically)
    const orderInsertRes = await client.query(`
      INSERT INTO orders (user_id, order_number, order_type, table_number, status, subtotal, total_amount, notes, timeline)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [userId, orderNumber, orderType || 'dine_in', tableNo || '', 'pending', subtotal, totalAmount, notes || '', JSON.stringify(timeline)]);

    const orderId = orderInsertRes.rows[0].id;

    // 6. Insert order items
    for (const val of validatedItems) {
      await client.query(`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [orderId, val.productId, val.productName, val.quantity, val.unitPrice, val.totalPrice]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
      data: {
        id: orderId,
        orderNo: orderNumber,
        customerName: user.name,
        email: user.email,
        phone: user.phone,
        tableNo: tableNo || '',
        items: validatedItems.map(vi => ({ name: vi.productName, quantity: vi.quantity, price: vi.unitPrice })),
        totalAmount,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    });

  } catch (e) {
    await client.query('ROLLBACK');
    res.status(400).json({
      status: 'error',
      message: e.message || 'Order transaction failed'
    });
  } finally {
    client.release();
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid order ID format' });
    }

    const { status } = req.body;

    const validStatuses = ['pending', 'preparing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Invalid order status value' });
    }

    // Fetch current order status and timeline
    const orderRes = await db.query('SELECT status, timeline, order_number FROM orders WHERE id = $1', [parsedId]);
    const order = orderRes.rows[0];
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    if (order.status === status) {
      return getOrderById(req, res, next);
    }

    // Append timeline record
    const timeline = order.timeline || [];
    timeline.push({
      status,
      time: new Date().toISOString(),
      note: `Order status updated to "${status.charAt(0).toUpperCase() + status.slice(1)}"`
    });

    // Update status in DB
    const updateRes = await db.query(
      'UPDATE orders SET status = $1, timeline = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [status, JSON.stringify(timeline), parsedId]
    );

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Failed to update order status' });
    }

    return getOrderById(req, res, next);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus
};
