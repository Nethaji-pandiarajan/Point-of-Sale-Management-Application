
const extractStatusTimestamp = (timeline, targetStatus, updatedAt, currentStatus) => {
  if (Array.isArray(timeline)) {
    for (let i = timeline.length - 1; i >= 0; i--) {
      const entry = timeline[i];
      if (entry && entry.status === targetStatus && (entry.time || entry.timestamp)) {
        return entry.time || entry.timestamp;
      }
    }
  }
  if (currentStatus === targetStatus && updatedAt) {
    return updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt;
  }
  return null;
};
const db = require('../config/db');
const { createNotification } = require('../utils/notification.helper');

const getOrders = async (req, res, next) => {
  try {
    const { status, tableNo, waiterName, waiterId, paymentStatus, search, startDate, endDate, page = 1, limit = 5 } = req.query;

    let countQueryText = `
      SELECT COUNT(o.id)::integer
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;

    let queryText = `
      SELECT o.id, o.user_id AS "waiterId", o.order_number AS "orderNo", o.order_type AS "orderType", o.table_number AS "tableNo",
             o.guest_count AS "guestCount",
             o.status, o.payment_status AS "paymentStatus", o.subtotal, o.total_amount AS "totalAmount", o.notes, o.timeline, o.created_at AS "createdAt", o.updated_at AS "updatedAt", o.updated_at AS "updatedAt",
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
      if (status === 'incomplete') {
        countQueryText += ` AND o.status NOT IN ('completed', 'cancelled')`;
        queryText += ` AND o.status NOT IN ('completed', 'cancelled')`;
      } else {
        countQueryText += ` AND o.status = $${index}`;
        queryText += ` AND o.status = $${index}`;
        params.push(status);
        index++;
      }
    }

    if (tableNo) {
      countQueryText += ` AND LOWER(o.table_number) = LOWER($${index})`;
      queryText += ` AND LOWER(o.table_number) = LOWER($${index})`;
      params.push(tableNo.trim());
      index++;
    }

    if (waiterId) {
      const parsedWId = parseInt(waiterId, 10);
      if (!isNaN(parsedWId)) {
        countQueryText += ' AND o.user_id = $' + index;
        queryText += ' AND o.user_id = $' + index;
        params.push(parsedWId);
        index++;
      }
    }

    if (waiterName) {
      countQueryText += ` AND u.name ILIKE $${index}`;
      queryText += ` AND u.name ILIKE $${index}`;
      params.push(`%${waiterName.trim()}%`);
      index++;
    }

    if (paymentStatus) {
      countQueryText += ` AND o.payment_status = $${index}`;
      queryText += ` AND o.payment_status = $${index}`;
      params.push(paymentStatus);
      index++;
    }

    if (search) {
      countQueryText += ` AND (o.order_number ILIKE $${index} OR CAST(o.id AS TEXT) ILIKE $${index} OR o.table_number ILIKE $${index} OR u.name ILIKE $${index} OR o.notes ILIKE $${index})`;
      queryText += ` AND (o.order_number ILIKE $${index} OR CAST(o.id AS TEXT) ILIKE $${index} OR o.table_number ILIKE $${index} OR u.name ILIKE $${index} OR o.notes ILIKE $${index})`;
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
    const totalCount = parseInt(countRes.rows[0].count, 10);

    // Get tab count summaries
    const incCountRes = await db.query(`SELECT COUNT(id)::integer FROM orders WHERE status NOT IN ('completed', 'cancelled')`);
    const compCountRes = await db.query(`SELECT COUNT(id)::integer FROM orders WHERE status = 'completed'`);
    const incompleteCount = parseInt(incCountRes.rows[0].count, 10);
    const completedCount = parseInt(compCountRes.rows[0].count, 10);

    // Add pagination & sorting
    const sortClause = status === 'incomplete' ? 'ORDER BY o.created_at ASC' : 'ORDER BY o.updated_at DESC, o.created_at DESC';
    queryText += `
      GROUP BY o.id, u.name, u.email, u.phone
      ${sortClause}
    `;

    const limitNum = parseInt(limit, 10);
    const pageNum = parseInt(page, 10);
    const totalPages = Math.ceil(totalCount / limitNum) || 1;
    const offset = (pageNum - 1) * limitNum;

    queryText += ` LIMIT $${index++} OFFSET $${index++}`;
    params.push(limitNum);
    params.push(offset);

    const result = await db.query(queryText, params);

    const formatted = result.rows.map(row => ({
      id: row.id,
      orderNo: row.orderNo,
      orderType: row.orderType,
      customerName: row.customerName || 'Anonymous Customer',
      waiterId: parseInt(row.waiterId || row.user_id, 10) || null,
      waiterName: row.customerName || '',
      email: row.email || '',
      phone: row.phone || '',
      tableNo: row.tableNo || '',
      guestCount: parseInt(row.guestCount, 10) || 1,
      notes: row.notes || '',
      items: row.items,
      subtotal: parseFloat(row.subtotal || row.totalAmount),
      totalAmount: parseFloat(row.totalAmount),
      status: row.status,
      paymentStatus: row.paymentStatus || 'unpaid',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      servedAt: extractStatusTimestamp(row.timeline, 'served', row.updatedAt, row.status),
      completedAt: extractStatusTimestamp(row.timeline, 'completed', row.updatedAt, row.status),
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
      SELECT o.id, o.user_id AS "waiterId", o.order_number AS "orderNo", o.order_type AS "orderType", o.table_number AS "tableNo",
             o.guest_count AS "guestCount",
             o.status, o.payment_status AS "paymentStatus", o.subtotal, o.total_amount AS "totalAmount", o.notes, o.timeline, o.created_at AS "createdAt",
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
      orderType: order.orderType,
      customerName: order.customerName || 'Anonymous Customer',
      waiterId: parseInt(order.waiterId || order.user_id, 10) || null,
      waiterName: order.customerName || '',
      email: order.email || '',
      phone: order.phone || '',
      tableNo: order.tableNo || '',
      guestCount: parseInt(order.guestCount, 10) || 1,
      notes: order.notes || '',
      items: order.items,
      subtotal: parseFloat(order.subtotal || order.totalAmount),
      totalAmount: parseFloat(order.totalAmount),
      status: order.status,
      paymentStatus: order.paymentStatus || 'unpaid',
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      servedAt: extractStatusTimestamp(order.timeline, 'served', order.updatedAt, order.status),
      completedAt: extractStatusTimestamp(order.timeline, 'completed', order.updatedAt, order.status),
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

    const { items, orderType, tableNo, notes, guestCount } = req.body;
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

    // 5. Link table_id, validate table capacity against guestCount, and mark occupied
    let matchedTableId = null;
    let tableCapacity = null;
    if (tableNo && tableNo.trim()) {
      const tableCheck = await client.query(
        "SELECT id, capacity FROM tables WHERE LOWER(table_number) = LOWER($1) OR LOWER(table_code) = LOWER($1)",
        [tableNo.trim()]
      );
      if (tableCheck.rowCount > 0) {
        matchedTableId = tableCheck.rows[0].id;
        tableCapacity = tableCheck.rows[0].capacity;
      }
    }

    const gCount = parseInt(guestCount !== undefined ? guestCount : 1, 10);
    if (isNaN(gCount) || gCount < 1) {
      throw new Error('Guest count must be at least 1');
    }
    if (tableCapacity && gCount > tableCapacity) {
      throw new Error(`Guest count (${gCount}) exceeds table capacity (${tableCapacity} seats)`);
    }

    if (matchedTableId) {
      await client.query(
        "UPDATE tables SET status = 'occupied' WHERE id = $1 AND status != 'reserved'",
        [matchedTableId]
      );
    }

    // Insert order
    const orderInsertRes = await client.query(`
      INSERT INTO orders (user_id, order_number, order_type, table_number, table_id, status, subtotal, total_amount, notes, timeline, guest_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [userId, orderNumber, orderType || 'dine_in', tableNo || '', matchedTableId, 'pending', subtotal, totalAmount, notes || '', JSON.stringify(timeline), gCount]);

    const orderId = orderInsertRes.rows[0].id;

    // 6. Insert order items
    for (const val of validatedItems) {
      await client.query(`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [orderId, val.productId, val.productName, val.quantity, val.unitPrice, val.totalPrice]);
    }

    // 7. Generate Kitchen Order Ticket (KOT)
    const kotCountRes = await client.query(
      "SELECT COUNT(id)::integer FROM kots WHERE created_at >= $1 AND created_at <= $2",
      [`${year}-01-01 00:00:00`, `${year}-12-31 23:59:59`]
    );
    const nextKotNum = (kotCountRes.rows[0].count + 1).toString().padStart(6, '0');
    const kotNumber = `KOT-${year}-${nextKotNum}`;

    const kotItemsJson = JSON.stringify(
      validatedItems.map(vi => ({
        productId: vi.productId,
        name: vi.productName,
        quantity: vi.quantity
      }))
    );

    await client.query(`
      INSERT INTO kots (kot_number, order_id, table_number, waiter_id, waiter_name, status, notes, items)
      VALUES ($1, $2, $3, $4, $5, 'new', $6, $7)
    `, [kotNumber, orderId, tableNo || '', userId, user.name, notes || '', kotItemsJson]);

    await client.query('COMMIT');

    // Create notification entry for new order
    createNotification({
      title: 'New Order Placed',
      message: `New Order #${orderNumber} placed for ${user.name} (${tableNo ? 'Table ' + tableNo : 'Takeaway'}). Total: $${totalAmount.toFixed(2)}.`,
      type: 'info',
      icon: 'shopping-bag',
      reference_type: 'order',
      reference_id: orderId,
      created_by: userId
    });

    res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
      data: {
        id: orderId,
        orderNo: orderNumber,
        orderType: orderType || 'dine_in',
        customerName: user.name,
        email: user.email,
        phone: user.phone,
        tableNo: tableNo || '',
        guestCount: gCount,
        tableId: matchedTableId,
        notes: notes || '',
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

    const validStatuses = ['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Invalid order status value' });
    }

    // Fetch current order status and timeline
    const orderRes = await db.query('SELECT status, timeline, order_number, table_number, table_id FROM orders WHERE id = $1', [parsedId]);
    const order = orderRes.rows[0];
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    if (order.status === status) {
      return getOrderById(req, res, next);
    }

    // Enforce strict state machine transitions
    const allowedTransitions = {
      pending: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['served', 'cancelled'],
      served: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    };

    const currentStatus = order.status || 'pending';
    const allowedNext = allowedTransitions[currentStatus] || [];

    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid order status transition from "${currentStatus}" to "${status}". Allowed transitions: [${allowedNext.join(', ')}]`
      });
    }

    // Append timeline record with performer identity
    const performer = req.user ? `${req.user.name} (${req.user.role || 'Staff'})` : 'System Admin';
    const timeline = order.timeline || [];
    timeline.push({
      status,
      time: new Date().toISOString(),
      note: `Order status updated to "${status.charAt(0).toUpperCase() + status.slice(1)}"`,
      by: performer
    });

    // Update status in DB
    const updateRes = await db.query(
      'UPDATE orders SET status = $1, timeline = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [status, JSON.stringify(timeline), parsedId]
    );

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Failed to update order status' });
    }

    // Sync corresponding KOT status
    const kotStatusMap = {
      pending: 'new',
      preparing: 'preparing',
      ready: 'ready',
      served: 'served',
      completed: 'served',
      cancelled: 'cancelled'
    };
    const targetKotStatus = kotStatusMap[status] || 'new';
    await db.query(
      'UPDATE kots SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE order_id = $2',
      [targetKotStatus, parsedId]
    );

    const updatedOrderObj = updateRes.rows[0];
    const targetTableNumber = updatedOrderObj.table_number;
    const targetTableId = updatedOrderObj.table_id;

    // Release table back to 'available' if order completed/cancelled and no other active orders remain
    if ((status === 'completed' || status === 'cancelled') && (targetTableNumber || targetTableId)) {
      const activeCheck = await db.query(
        `SELECT COUNT(id)::integer FROM orders
         WHERE status IN ('pending', 'preparing', 'ready', 'served')
           AND (table_id = $1 OR (table_number IS NOT NULL AND LOWER(table_number) = LOWER($2)))
           AND id != $3`,
        [targetTableId || 0, targetTableNumber || '', parsedId]
      );
      const activeCount = parseInt(activeCheck.rows[0].count, 10);
      if (activeCount === 0) {
        await db.query(
          `UPDATE tables SET status = 'available'
           WHERE (id = $1 OR LOWER(table_number) = LOWER($2)) AND status != 'reserved'`,
          [targetTableId || 0, targetTableNumber || '']
        );
      }
    } else if ((status === 'pending' || status === 'preparing' || status === 'ready' || status === 'served') && (targetTableNumber || targetTableId)) {
      // Mark table occupied if active
      await db.query(
        `UPDATE tables SET status = 'occupied'
         WHERE (id = $1 OR LOWER(table_number) = LOWER($2)) AND status != 'reserved'`,
        [targetTableId || 0, targetTableNumber || '']
      );
    }

    // Trigger notification
    const typeMap = { completed: 'success', served: 'success', ready: 'success', cancelled: 'error', preparing: 'info', pending: 'warning' };
    createNotification({
      title: `Order #${order.order_number || parsedId} ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Order #${order.order_number || parsedId} status changed to "${status.charAt(0).toUpperCase() + status.slice(1)}".`,
      type: typeMap[status] || 'info',
      icon: 'shopping-bag',
      reference_type: 'order',
      reference_id: parsedId
    });

    return getOrderById(req, res, next);
  } catch (error) {
    next(error);
  }
};


const addItemsToOrder = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const parsedOrderId = parseInt(id, 10);
    if (isNaN(parsedOrderId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid order ID' });
    }

    const { items, notes } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Order must contain at least one item' });
    }

    await client.query('BEGIN');

    // 1. Fetch current order
    const orderRes = await client.query('SELECT * FROM orders WHERE id = $1', [parsedOrderId]);
    const order = orderRes.rows[0];
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new Error('Cannot add items to a completed or cancelled order');
    }

    // 2. Fetch user
    const userId = req.user ? req.user.id : order.user_id;
    const userRes = await client.query('SELECT name, email, phone FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0] || { name: 'Staff' };

    // 3. Validate new items and calculate added subtotal
    let additionalSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const { productId, quantity } = item;
      const parsedProductId = parseInt(productId, 10);
      const qNum = parseInt(quantity, 10);

      if (isNaN(parsedProductId)) throw new Error('Product ID must be an integer');
      if (isNaN(qNum) || qNum <= 0) throw new Error('Item quantity must be a positive integer');

      const prodRes = await client.query('SELECT name, price, is_available FROM products WHERE id = $1', [parsedProductId]);
      const product = prodRes.rows[0];
      if (!product) throw new Error(`Product ID ${parsedProductId} not found`);
      if (!product.is_available) throw new Error(`Product "${product.name}" is currently unavailable/out of stock`);

      const unitPrice = parseFloat(product.price);
      const totalPrice = unitPrice * qNum;
      additionalSubtotal += totalPrice;

      validatedItems.push({
        productId: parsedProductId,
        productName: product.name,
        quantity: qNum,
        unitPrice,
        totalPrice
      });
    }

    // 4. Insert new order items
    for (const val of validatedItems) {
      await client.query(`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [parsedOrderId, val.productId, val.productName, val.quantity, val.unitPrice, val.totalPrice]);
    }

    // 5. Update order totals & timeline
    const newSubtotal = parseFloat(order.subtotal || 0) + additionalSubtotal;
    const newTotal = parseFloat(order.total_amount || 0) + additionalSubtotal;

    const timeline = order.timeline || [];
    const itemNames = validatedItems.map(vi => `${vi.quantity}x ${vi.productName}`).join(', ');
    timeline.push({
      status: order.status,
      time: new Date().toISOString(),
      note: `Added items: ${itemNames}`,
      by: user.name
    });

    await client.query(`
      UPDATE orders
      SET subtotal = $1, total_amount = $2, timeline = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [newSubtotal, newTotal, JSON.stringify(timeline), parsedOrderId]);

    // 6. Generate supplementary KOT for only the new items
    const year = new Date().getFullYear();
    const kotCountRes = await client.query(
      "SELECT COUNT(id)::integer FROM kots WHERE created_at >= $1 AND created_at <= $2",
      [`${year}-01-01 00:00:00`, `${year}-12-31 23:59:59`]
    );
    const nextKotNum = (kotCountRes.rows[0].count + 1).toString().padStart(6, '0');
    const kotNumber = `KOT-${year}-${nextKotNum}`;

    const kotItemsJson = JSON.stringify(
      validatedItems.map(vi => ({
        productId: vi.productId,
        name: vi.productName,
        quantity: vi.quantity
      }))
    );

    await client.query(`
      INSERT INTO kots (kot_number, order_id, table_number, waiter_id, waiter_name, status, notes, items)
      VALUES ($1, $2, $3, $4, $5, 'new', $6, $7)
    `, [kotNumber, parsedOrderId, order.table_number || '', userId, user.name, notes || 'Additional items', kotItemsJson]);

    await client.query('COMMIT');

    // Create notification
    createNotification({
      title: 'Additional Items Added',
      message: `Supplementary KOT ${kotNumber} generated for Order #${order.order_number} (${order.table_number || 'Dine-In'}). Added: ${itemNames}.`,
      type: 'info',
      icon: 'shopping-bag',
      reference_type: 'order',
      reference_id: parsedOrderId,
      created_by: userId
    });

    return getOrderById(req, res, next);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(400).json({
      status: 'error',
      message: e.message || 'Failed to add items to order'
    });
  } finally {
    client.release();
  }
};


const takeoverOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid order ID format' });
    }

    const newWaiterId = req.user.id;
    const newWaiterName = req.user.name || 'Waiter';

    const orderRes = await db.query(
      `SELECT o.id, o.order_number AS "orderNo", o.status, o.user_id AS "currentWaiterId", o.table_number AS "tableNo", o.timeline,
              u.name AS "currentWaiterName"
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [parsedId]
    );

    const order = orderRes.rows[0];
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    if (!['pending', 'preparing', 'ready', 'served'].includes(order.status)) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot take over an order with status "${order.status}". Only active orders can be taken over.`
      });
    }

    if (order.currentWaiterId === newWaiterId) {
      return res.status(200).json({
        status: 'success',
        message: 'Order is already assigned to you',
        data: {
          id: order.id,
          orderNo: order.orderNo,
          tableNo: order.tableNo,
          assignedWaiterId: newWaiterId,
          assignedWaiter: newWaiterName
        }
      });
    }

    const prevWaiterName = order.currentWaiterName || 'Previous Server';
    let timeline = Array.isArray(order.timeline) ? order.timeline : [];
    timeline.push({
      action: 'takeover',
      previousWaiterId: order.currentWaiterId,
      previousWaiterName: prevWaiterName,
      newWaiterId: newWaiterId,
      newWaiterName: newWaiterName,
      timestamp: new Date().toISOString(),
      note: `Server changed: ${prevWaiterName} → ${newWaiterName}`
    });

    await db.query(
      'UPDATE orders SET user_id = $1, timeline = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [newWaiterId, JSON.stringify(timeline), parsedId]
    );

    res.status(200).json({
      status: 'success',
      message: `Table order successfully taken over from ${prevWaiterName}`,
      data: {
        id: order.id,
        orderNo: order.orderNo,
        tableNo: order.tableNo,
        assignedWaiterId: newWaiterId,
        assignedWaiter: newWaiterName,
        previousWaiter: prevWaiterName
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  takeoverOrder,
  addItemsToOrder,
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus
};