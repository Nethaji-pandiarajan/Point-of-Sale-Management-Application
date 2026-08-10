const db = require('../config/db');
const { createNotification } = require('../utils/notification.helper');

const generateBill = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const parsedOrderId = parseInt(orderId, 10);

    if (isNaN(parsedOrderId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid order ID' });
    }

    // 1. Check if bill already exists for this order
    const existingBillRes = await db.query(`
      SELECT b.id, b.bill_number AS "billNumber", b.order_id AS "orderId", b.table_number AS "tableNo",
             b.waiter_id AS "waiterId", b.waiter_name AS "waiterName", b.subtotal, b.tax, b.discount,
             b.grand_total AS "grandTotal", b.payment_method AS "paymentMethod", b.payment_status AS "paymentStatus",
             b.created_at AS "createdAt", o.order_number AS "orderNo", o.status AS "orderStatus"
      FROM bills b
      LEFT JOIN orders o ON b.order_id = o.id
      WHERE b.order_id = $1
    `, [parsedOrderId]);

    if (existingBillRes.rowCount > 0) {
      const bill = existingBillRes.rows[0];
      // Fetch order items
      const itemsRes = await db.query(`
        SELECT product_name AS "name", quantity, unit_price AS "price", total_price AS "total"
        FROM order_items
        WHERE order_id = $1
      `, [parsedOrderId]);

      return res.status(200).json({
        status: 'success',
        message: 'Existing bill retrieved',
        data: {
          ...bill,
          subtotal: parseFloat(bill.subtotal),
          tax: parseFloat(bill.tax || 0),
          discount: parseFloat(bill.discount || 0),
          grandTotal: parseFloat(bill.grandTotal),
          items: itemsRes.rows
        }
      });
    }

    // 2. Fetch order details
    const orderRes = await db.query(`
      SELECT o.id, o.order_number AS "orderNo", o.table_number AS "tableNo", o.user_id AS "waiterId",
             o.subtotal, o.total_amount AS "totalAmount", o.status, u.name AS "waiterName"
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `, [parsedOrderId]);

    const order = orderRes.rows[0];
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    // 3. Fetch order items
    const itemsRes = await db.query(`
      SELECT product_name AS "name", quantity, unit_price AS "price", total_price AS "total"
      FROM order_items
      WHERE order_id = $1
    `, [parsedOrderId]);

    const subtotal = parseFloat(order.subtotal || order.totalAmount);
    const tax = 0.00; // Tax/Charges default
    const discount = 0.00;
    const grandTotal = subtotal + tax - discount;

    // 4. Generate sequential Bill number
    const year = new Date().getFullYear();
    const countRes = await db.query(
      "SELECT COUNT(id)::integer FROM bills WHERE created_at >= $1 AND created_at <= $2",
      [`${year}-01-01 00:00:00`, `${year}-12-31 23:59:59`]
    );
    const nextBillNum = (countRes.rows[0].count + 1).toString().padStart(6, '0');
    const billNumber = `BILL-${year}-${nextBillNum}`;

    // 5. Insert Bill record
    const insertRes = await db.query(`
      INSERT INTO bills (bill_number, order_id, table_number, waiter_id, waiter_name, subtotal, tax, discount, grand_total, payment_method, payment_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'cash', 'unpaid')
      RETURNING id, bill_number AS "billNumber", created_at AS "createdAt"
    `, [billNumber, parsedOrderId, order.tableNo || '', order.waiterId, order.waiterName || 'Staff', subtotal, tax, discount, grandTotal]);

    const billId = insertRes.rows[0].id;

    // Link bill_id to order
    await db.query('UPDATE orders SET bill_id = $1 WHERE id = $2', [billId, parsedOrderId]);

    res.status(201).json({
      status: 'success',
      message: 'Bill generated successfully',
      data: {
        id: billId,
        billNumber,
        orderId: parsedOrderId,
        orderNo: order.orderNo,
        tableNo: order.tableNo || '',
        waiterName: order.waiterName || 'Staff',
        subtotal,
        tax,
        discount,
        grandTotal,
        paymentMethod: 'cash',
        paymentStatus: 'unpaid',
        items: itemsRes.rows,
        createdAt: insertRes.rows[0].createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const getBillByOrderId = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const parsedOrderId = parseInt(orderId, 10);

    if (isNaN(parsedOrderId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid order ID' });
    }

    const billRes = await db.query(`
      SELECT b.id, b.bill_number AS "billNumber", b.order_id AS "orderId", b.table_number AS "tableNo",
             b.waiter_id AS "waiterId", b.waiter_name AS "waiterName", b.subtotal, b.tax, b.discount,
             b.grand_total AS "grandTotal", b.payment_method AS "paymentMethod", b.payment_status AS "paymentStatus",
             b.created_at AS "createdAt", o.order_number AS "orderNo", o.status AS "orderStatus"
      FROM bills b
      LEFT JOIN orders o ON b.order_id = o.id
      WHERE b.order_id = $1
    `, [parsedOrderId]);

    if (billRes.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Bill not generated for this order yet' });
    }

    const bill = billRes.rows[0];
    const itemsRes = await db.query(`
      SELECT product_name AS "name", quantity, unit_price AS "price", total_price AS "total"
      FROM order_items
      WHERE order_id = $1
    `, [parsedOrderId]);

    res.status(200).json({
      status: 'success',
      data: {
        ...bill,
        subtotal: parseFloat(bill.subtotal),
        tax: parseFloat(bill.tax || 0),
        discount: parseFloat(bill.discount || 0),
        grandTotal: parseFloat(bill.grandTotal),
        items: itemsRes.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

const processPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsedBillId = parseInt(id, 10);

    if (isNaN(parsedBillId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid bill ID' });
    }

    const { paymentMethod = 'cash', discount = 0, tax = 0 } = req.body;
    const validMethods = ['cash', 'online'];
    const pMethod = validMethods.includes(paymentMethod.toLowerCase()) ? paymentMethod.toLowerCase() : 'cash';

    // 1. Fetch bill details
    const billRes = await db.query('SELECT * FROM bills WHERE id = $1', [parsedBillId]);
    const bill = billRes.rows[0];

    if (!bill) {
      return res.status(404).json({ status: 'error', message: 'Bill not found' });
    }

    if (bill.payment_status === 'paid') {
      return res.status(400).json({ status: 'error', message: 'Payment has already been completed for this bill' });
    }

    const subtotal = parseFloat(bill.subtotal);
    const numTax = parseFloat(tax) || 0;
    const numDiscount = parseFloat(discount) || 0;
    const grandTotal = subtotal + numTax - numDiscount;

    // 2. Update Bill status
    await db.query(`
      UPDATE bills
      SET payment_status = 'paid', payment_method = $1, tax = $2, discount = $3, grand_total = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
    `, [pMethod, numTax, numDiscount, grandTotal, parsedBillId]);

    // 3. Fetch parent order & timeline
    const orderRes = await db.query('SELECT * FROM orders WHERE id = $1', [bill.order_id]);
    const order = orderRes.rows[0];

    if (order) {
      const timeline = order.timeline || [];
      const performer = req.user ? `${req.user.name} (${req.user.role || 'Staff'})` : 'Cashier Admin';

      timeline.push({
        status: 'completed',
        time: new Date().toISOString(),
        note: `Payment completed via ${pMethod.toUpperCase()} ($${grandTotal.toFixed(2)}). Order completed.`,
        by: performer
      });

      // Update Order to Completed & Paid
      await db.query(`
        UPDATE orders
        SET status = 'completed', payment_status = 'paid', payment_method = $1, total_amount = $2, timeline = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [pMethod, grandTotal, JSON.stringify(timeline), bill.order_id]);

      // Release table back to 'available' if no active orders remain
      const targetTableNumber = order.table_number;
      const targetTableId = order.table_id;

      if (targetTableNumber || targetTableId) {
        const activeCheck = await db.query(`
          SELECT COUNT(id)::integer FROM orders
          WHERE status IN ('pending', 'preparing', 'ready', 'served')
            AND (table_id = $1 OR (table_number IS NOT NULL AND LOWER(table_number) = LOWER($2)))
            AND id != $3
        `, [targetTableId || 0, targetTableNumber || '', bill.order_id]);

        const activeCount = parseInt(activeCheck.rows[0].count, 10);
        if (activeCount === 0) {
          await db.query(`
            UPDATE tables SET status = 'available'
            WHERE (id = $1 OR LOWER(table_number) = LOWER($2)) AND status != 'reserved'
          `, [targetTableId || 0, targetTableNumber || '']);
        }
      }

      // Sync KOT status
      await db.query(`UPDATE kots SET status = 'served', updated_at = CURRENT_TIMESTAMP WHERE order_id = $1`, [bill.order_id]);

      // Trigger notification
      createNotification({
        title: `Payment Completed - Bill ${bill.bill_number}`,
        message: `Payment of $${grandTotal.toFixed(2)} (${pMethod.toUpperCase()}) completed for Order #${order.order_number || bill.order_id}. Table released.`,
        type: 'success',
        icon: 'shopping-bag',
        reference_type: 'bill',
        reference_id: parsedBillId
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Payment completed successfully. Order marked as completed and table released.',
      data: {
        billId: parsedBillId,
        billNumber: bill.bill_number,
        orderId: bill.order_id,
        paymentMethod: pMethod,
        paymentStatus: 'paid',
        grandTotal
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateBill,
  getBillByOrderId,
  processPayment
};
