const db = require('../config/db');

const parseDateRange = (query) => {
  const { startDate, endDate, range } = query;
  let start = new Date();
  let end = new Date();

  if (range === 'today') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (range === 'week') {
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
    start = new Date(start.setDate(diff));
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (range === 'month') {
    start = new Date(start.getFullYear(), start.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (startDate && endDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  } else {
    // Default last 30 days
    start = new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};

// 1. Sales Report
const getSalesReport = async (req, res, next) => {
  try {
    const { start, end } = parseDateRange(req.query);

    const summaryRes = await db.query(`
      SELECT
        COUNT(id)::integer AS "totalOrders",
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::integer AS "completedOrders",
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::integer AS "cancelledOrders",
        COUNT(CASE WHEN status IN ('pending', 'preparing', 'ready', 'served') THEN 1 END)::integer AS "activeOrders",
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0)::numeric AS "totalRevenue",
        COALESCE(AVG(CASE WHEN status = 'completed' THEN total_amount ELSE NULL END), 0)::numeric AS "avgOrderValue"
      FROM orders
      WHERE created_at >= $1 AND created_at <= $2
    `, [start, end]);

    const dailyBreakdownRes = await db.query(`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM-DD') AS "date",
        COUNT(id)::integer AS "totalOrders",
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::integer AS "completedOrders",
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0)::numeric AS "dailyRevenue"
      FROM orders
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY "date" ASC
    `, [start, end]);

    const summary = summaryRes.rows[0];

    res.status(200).json({
      status: 'success',
      data: {
        dateRange: { start, end },
        totalOrders: parseInt(summary.totalOrders || 0, 10),
        completedOrders: parseInt(summary.completedOrders || 0, 10),
        cancelledOrders: parseInt(summary.cancelledOrders || 0, 10),
        activeOrders: parseInt(summary.activeOrders || 0, 10),
        totalRevenue: parseFloat(summary.totalRevenue || 0),
        avgOrderValue: parseFloat(summary.avgOrderValue || 0),
        dailyBreakdown: dailyBreakdownRes.rows.map(r => ({
          date: r.date,
          totalOrders: parseInt(r.totalOrders, 10),
          completedOrders: parseInt(r.completedOrders, 10),
          dailyRevenue: parseFloat(r.dailyRevenue)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Product Report
const getProductReport = async (req, res, next) => {
  try {
    const { start, end } = parseDateRange(req.query);

    const productStatsRes = await db.query(`
      SELECT
        oi.product_name AS "productName",
        c.name AS "categoryName",
        SUM(oi.quantity)::integer AS "quantitySold",
        SUM(oi.total_price)::numeric AS "totalRevenue"
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE o.status = 'completed' AND o.created_at >= $1 AND o.created_at <= $2
      GROUP BY oi.product_name, c.name
      ORDER BY "quantitySold" DESC
    `, [start, end]);

    const formatted = productStatsRes.rows.map(r => ({
      productName: r.productName,
      categoryName: r.categoryName || 'Unassigned',
      quantitySold: parseInt(r.quantitySold, 10),
      totalRevenue: parseFloat(r.totalRevenue)
    }));

    res.status(200).json({
      status: 'success',
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// 3. Category Report
const getCategoryReport = async (req, res, next) => {
  try {
    const { start, end } = parseDateRange(req.query);

    const categoryStatsRes = await db.query(`
      SELECT
        c.name AS "categoryName",
        COUNT(DISTINCT o.id)::integer AS "orderCount",
        SUM(oi.quantity)::integer AS "itemsSold",
        SUM(oi.total_price)::numeric AS "totalRevenue"
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE o.status = 'completed' AND o.created_at >= $1 AND o.created_at <= $2
      GROUP BY c.name
      ORDER BY "totalRevenue" DESC
    `, [start, end]);

    const formatted = categoryStatsRes.rows.map(r => ({
      categoryName: r.categoryName,
      orderCount: parseInt(r.orderCount, 10),
      itemsSold: parseInt(r.itemsSold, 10),
      totalRevenue: parseFloat(r.totalRevenue)
    }));

    res.status(200).json({
      status: 'success',
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// 4. Table Report
const getTableReport = async (req, res, next) => {
  try {
    const { start, end } = parseDateRange(req.query);

    const tableStatsRes = await db.query(`
      SELECT
        t.table_number AS "tableNumber",
        t.capacity,
        COUNT(o.id)::integer AS "totalOrders",
        COUNT(CASE WHEN o.status = 'completed' THEN 1 END)::integer AS "completedOrders",
        COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END), 0)::numeric AS "totalRevenue"
      FROM tables t
      LEFT JOIN orders o ON (o.table_id = t.id OR LOWER(o.table_number) = LOWER(t.table_number)) AND o.created_at >= $1 AND o.created_at <= $2
      GROUP BY t.table_number, t.capacity
      ORDER BY "totalRevenue" DESC, "totalOrders" DESC
    `, [start, end]);

    const formatted = tableStatsRes.rows.map(r => ({
      tableNumber: r.tableNumber,
      capacity: r.capacity,
      totalOrders: parseInt(r.totalOrders, 10),
      completedOrders: parseInt(r.completedOrders, 10),
      totalRevenue: parseFloat(r.totalRevenue)
    }));

    res.status(200).json({
      status: 'success',
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// 5. Waiter Report
const getWaiterReport = async (req, res, next) => {
  try {
    const { start, end } = parseDateRange(req.query);

    const waiterStatsRes = await db.query(`
      SELECT
        u.name AS "waiterName",
        u.email,
        u.phone,
        COUNT(o.id)::integer AS "totalOrders",
        COUNT(CASE WHEN o.status = 'completed' THEN 1 END)::integer AS "completedOrders",
        COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END), 0)::numeric AS "totalSales"
      FROM users u
      JOIN orders o ON o.user_id = u.id
      WHERE o.created_at >= $1 AND o.created_at <= $2
      GROUP BY u.name, u.email, u.phone
      ORDER BY "totalSales" DESC
    `, [start, end]);

    const formatted = waiterStatsRes.rows.map(r => ({
      waiterName: r.waiterName,
      email: r.email,
      phone: r.phone,
      totalOrders: parseInt(r.totalOrders, 10),
      completedOrders: parseInt(r.completedOrders, 10),
      totalSales: parseFloat(r.totalSales)
    }));

    res.status(200).json({
      status: 'success',
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// 6. Payment Report
const getPaymentReport = async (req, res, next) => {
  try {
    const { start, end } = parseDateRange(req.query);

    const paymentRes = await db.query(`
      SELECT
        COUNT(CASE WHEN payment_method = 'cash' AND payment_status = 'paid' THEN 1 END)::integer AS "cashPaidOrders",
        COALESCE(SUM(CASE WHEN payment_method = 'cash' AND payment_status = 'paid' THEN total_amount ELSE 0 END), 0)::numeric AS "cashRevenue",
        COUNT(CASE WHEN payment_method = 'online' AND payment_status = 'paid' THEN 1 END)::integer AS "onlinePaidOrders",
        COALESCE(SUM(CASE WHEN payment_method = 'online' AND payment_status = 'paid' THEN total_amount ELSE 0 END), 0)::numeric AS "onlineRevenue",
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END)::integer AS "paidOrdersCount",
        COUNT(CASE WHEN payment_status = 'unpaid' OR payment_status IS NULL THEN 1 END)::integer AS "unpaidOrdersCount"
      FROM orders
      WHERE created_at >= $1 AND created_at <= $2
    `, [start, end]);

    const p = paymentRes.rows[0];

    res.status(200).json({
      status: 'success',
      data: {
        dateRange: { start, end },
        cashPaidOrders: parseInt(p.cashPaidOrders || 0, 10),
        cashRevenue: parseFloat(p.cashRevenue || 0),
        onlinePaidOrders: parseInt(p.onlinePaidOrders || 0, 10),
        onlineRevenue: parseFloat(p.onlineRevenue || 0),
        paidOrdersCount: parseInt(p.paidOrdersCount || 0, 10),
        unpaidOrdersCount: parseInt(p.unpaidOrdersCount || 0, 10),
        totalRevenue: parseFloat(p.cashRevenue || 0) + parseFloat(p.onlineRevenue || 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalesReport,
  getProductReport,
  getCategoryReport,
  getTableReport,
  getWaiterReport,
  getPaymentReport
};
