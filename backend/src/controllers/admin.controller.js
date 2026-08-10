const bcrypt = require('bcrypt');
const db = require('../config/db');
const { createNotification } = require('../utils/notification.helper');

const getProfile = async (req, res, next) => {
  try {
    // req.user has been attached by the protect middleware
    res.status(200).json({
      status: 'success',
      data: req.user
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({ status: 'error', message: 'Name and email are required fields' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ status: 'error', message: 'Please provide a valid email address' });
    }

    const phoneVal = phone !== undefined && phone !== null ? String(phone).trim() : '';

    const result = await db.query(
      'UPDATE users SET name = $1, email = $2, phone = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, name, email, phone, role, profile_image AS "profileImage"',
      [name.trim(), email.trim(), phoneVal, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    createNotification({
      title: 'Profile Updated',
      message: `Administrator profile details updated for ${result.rows[0].name}.`,
      type: 'info',
      icon: 'user',
      reference_type: 'system',
      reference_id: req.user.id,
      created_by: req.user.id
    });

    res.status(200).json({
      status: 'success',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, status: 'error', message: 'All password fields are required' });
    }

    // 1. Fetch user password hash from DB
    const userResult = await db.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ success: false, status: 'error', message: 'User not found' });
    }
    const currentHash = userResult.rows[0].password;

    // 2. Compare current password hash using bcrypt.compare()
    const isMatch = await bcrypt.compare(currentPassword, currentHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // 3. New password validation rules
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, status: 'error', message: 'New password must be at least 8 characters' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, status: 'error', message: 'New password must be different from current password' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, status: 'error', message: 'New password and confirm password do not match' });
    }

    // 4. Hash the new password using bcrypt.hash()
    const hashedNew = await bcrypt.hash(newPassword, 10);

    // 5. Update user password column in user table
    const updateResult = await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNew, req.user.id]);

    if (updateResult.rowCount === 0) {
      return res.status(500).json({ success: false, status: 'error', message: 'Failed to update database record' });
    }

    createNotification({
      title: 'Security Alert',
      message: 'Admin account password changed successfully.',
      type: 'warning',
      icon: 'shield-alert',
      reference_type: 'system',
      reference_id: req.user.id,
      created_by: req.user.id
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 1. Table Statistics
    const tableStatsRes = await db.query(`
      SELECT 
        COUNT(id)::integer AS "totalTables",
        COUNT(CASE WHEN status = 'available' THEN 1 END)::integer AS "availableTables",
        COUNT(CASE WHEN status = 'occupied' THEN 1 END)::integer AS "occupiedTables",
        COUNT(CASE WHEN status = 'reserved' THEN 1 END)::integer AS "reservedTables"
      FROM tables
    `);
    const tableStats = tableStatsRes.rows[0] || {};

    // 2. Active Orders & Today's Completed & Today's Revenue
    const orderStatsRes = await db.query(`
      SELECT
        COUNT(CASE WHEN status IN ('pending', 'preparing', 'ready', 'served') THEN 1 END)::integer AS "activeOrders",
        COUNT(CASE WHEN status = 'completed' AND created_at >= $1 THEN 1 END)::integer AS "todayCompletedOrders",
        COALESCE(SUM(CASE WHEN status = 'completed' AND created_at >= $1 THEN total_amount ELSE 0 END), 0)::numeric AS "todayRevenue"
      FROM orders
    `, [todayStart]);
    const orderStats = orderStatsRes.rows[0] || {};

    // 3. KOT Breakdown Statistics
    const kotStatsRes = await db.query(`
      SELECT
        COUNT(CASE WHEN status = 'new' THEN 1 END)::integer AS "newKotOrders",
        COUNT(CASE WHEN status = 'preparing' THEN 1 END)::integer AS "preparingOrders",
        COUNT(CASE WHEN status = 'ready' THEN 1 END)::integer AS "readyOrders"
      FROM kots
    `);
    const kotStats = kotStatsRes.rows[0] || {};

    // 4. Floor Overview Tables List (with active order link)
    const floorTablesRes = await db.query(`
      SELECT t.id, t.table_number AS "tableNumber", t.capacity, t.status,
             ao.id AS "activeOrderId",
             ao.order_number AS "activeOrderNo",
             ao.status AS "activeOrderStatus",
             ao.total_amount AS "activeOrderTotal",
             u.name AS "assignedWaiter"
      FROM tables t
      LEFT JOIN LATERAL (
        SELECT o.id, o.order_number, o.status, o.total_amount, o.user_id
        FROM orders o
        WHERE (o.table_id = t.id OR LOWER(o.table_number) = LOWER(t.table_number))
          AND o.status IN ('pending', 'preparing', 'ready', 'served')
        ORDER BY o.created_at DESC
        LIMIT 1
      ) ao ON true
      LEFT JOIN users u ON ao.user_id = u.id
      ORDER BY t.id ASC
    `);

    // 5. Feeds (New KOTs, Ready KOTs, Recent Orders)
    const newKotsRes = await db.query(`
      SELECT id, kot_number AS "kotNumber", order_id AS "orderId", table_number AS "tableNo", waiter_name AS "waiterName", items, created_at AS "createdAt"
      FROM kots
      WHERE status = 'new'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    const readyOrdersRes = await db.query(`
      SELECT id, order_number AS "orderNo", table_number AS "tableNo", total_amount AS "totalAmount", created_at AS "createdAt"
      FROM orders
      WHERE status = 'ready'
      ORDER BY updated_at DESC
      LIMIT 5
    `);

    const recentOrdersRes = await db.query(`
      SELECT o.id, o.order_number AS "orderNo", o.table_number AS "tableNo", o.status, o.payment_status AS "paymentStatus", o.total_amount AS "totalAmount", o.created_at AS "createdAt", u.name AS "customerName"
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 6
    `);

    res.status(200).json({
      status: 'success',
      data: {
        totalTables: parseInt(tableStats.totalTables || 0, 10),
        availableTables: parseInt(tableStats.availableTables || 0, 10),
        occupiedTables: parseInt(tableStats.occupiedTables || 0, 10),
        reservedTables: parseInt(tableStats.reservedTables || 0, 10),
        activeOrders: parseInt(orderStats.activeOrders || 0, 10),
        newKotOrders: parseInt(kotStats.newKotOrders || 0, 10),
        preparingOrders: parseInt(kotStats.preparingOrders || 0, 10),
        readyOrders: parseInt(kotStats.readyOrders || 0, 10),
        todayCompletedOrders: parseInt(orderStats.todayCompletedOrders || 0, 10),
        todayRevenue: parseFloat(orderStats.todayRevenue || 0),
        floorTables: floorTablesRes.rows,
        feeds: {
          newKots: newKotsRes.rows,
          readyOrders: readyOrdersRes.rows,
          recentOrders: recentOrdersRes.rows
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getDashboardStats
};
