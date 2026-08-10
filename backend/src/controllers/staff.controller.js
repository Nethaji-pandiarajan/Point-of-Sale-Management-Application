const db = require('../config/db');
const bcrypt = require('bcrypt');
const { createNotification } = require('../utils/notification.helper');

const getStaff = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    let countQueryText = `SELECT COUNT(id)::integer FROM users WHERE role = 'waiter'`;
    let queryText = `
      SELECT id, name, email, phone, role, status,
             profile_image AS "profileImage",
             created_at AS "createdAt", updated_at AS "updatedAt"
      FROM users
      WHERE role = 'waiter'
    `;

    const params = [];
    let index = 1;

    if (status) {
      countQueryText += ` AND status = $${index}`;
      queryText += ` AND status = $${index}`;
      params.push(status);
      index++;
    }

    if (search) {
      countQueryText += ` AND (name ILIKE $${index} OR email ILIKE $${index} OR phone ILIKE $${index})`;
      queryText += ` AND (name ILIKE $${index} OR email ILIKE $${index} OR phone ILIKE $${index})`;
      params.push(`%${search.trim()}%`);
      index++;
    }

    const countRes = await db.query(countQueryText, params);
    const totalCount = parseInt(countRes.rows[0].count, 10);

    queryText += ` ORDER BY id DESC`;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    queryText += ` LIMIT $${index} OFFSET $${index + 1}`;
    params.push(limitNum, offset);

    const staffRes = await db.query(queryText, params);

    res.status(200).json({
      status: 'success',
      data: staffRes.rows,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum) || 1,
        page: pageNum,
        limit: limitNum
      }
    });
  } catch (error) {
    next(error);
  }
};

const getStaffById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resStaff = await db.query(
      `SELECT id, name, email, phone, role, status, profile_image AS "profileImage", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM users WHERE id = $1 AND role = 'waiter'`,
      [id]
    );

    if (resStaff.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Staff member not found' });
    }

    res.status(200).json({
      status: 'success',
      data: resStaff.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const createStaff = async (req, res, next) => {
  try {
    const { name, email, password, phone = '', status = 'active' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ status: 'error', message: 'Staff member name is required' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ status: 'error', message: 'Email address is required' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ status: 'error', message: 'Password must be at least 6 characters' });
    }

    // Check email uniqueness
    const dupRes = await db.query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1)`, [email.trim()]);
    if (dupRes.rowCount > 0) {
      return res.status(400).json({ status: 'error', message: `User with email "${email.trim()}" already exists` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertRes = await db.query(
      `INSERT INTO users (name, email, password, phone, role, status)
       VALUES ($1, $2, $3, $4, 'waiter', $5)
       RETURNING id, name, email, phone, role, status, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [name.trim(), email.trim(), hashedPassword, phone.trim(), status]
    );

    const newStaff = insertRes.rows[0];

    createNotification({
      title: 'Staff Member Added',
      message: `Waiter "${newStaff.name}" added to team.`,
      type: 'success',
      icon: 'users',
      reference_type: 'staff',
      reference_id: newStaff.id
    });

    res.status(201).json({
      status: 'success',
      data: newStaff
    });
  } catch (error) {
    next(error);
  }
};

const updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, status } = req.body;

    const existRes = await db.query(`SELECT id FROM users WHERE id = $1 AND role = 'waiter'`, [id]);
    if (existRes.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Staff member not found' });
    }

    if (email) {
      const dupRes = await db.query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2`, [email.trim(), id]);
      if (dupRes.rowCount > 0) {
        return res.status(400).json({ status: 'error', message: `Email "${email.trim()}" is already taken` });
      }
    }

    const updateRes = await db.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           status = COALESCE($4, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND role = 'waiter'
       RETURNING id, name, email, phone, role, status, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [name ? name.trim() : null, email ? email.trim() : null, phone !== undefined ? phone.trim() : null, status || null, id]
    );

    const updatedStaff = updateRes.rows[0];

    createNotification({
      title: 'Staff Details Updated',
      message: `Waiter "${updatedStaff.name}" account updated.`,
      type: 'info',
      icon: 'users',
      reference_type: 'staff',
      reference_id: updatedStaff.id
    });

    res.status(200).json({
      status: 'success',
      data: updatedStaff
    });
  } catch (error) {
    next(error);
  }
};

const resetStaffPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ status: 'error', message: 'New password must be at least 6 characters' });
    }

    const existRes = await db.query(`SELECT id, name FROM users WHERE id = $1 AND role = 'waiter'`, [id]);
    if (existRes.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Staff member not found' });
    }

    const staffObj = existRes.rows[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(`UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [hashedPassword, id]);

    createNotification({
      title: 'Staff Password Reset',
      message: `Password reset for waiter "${staffObj.name}".`,
      type: 'info',
      icon: 'key',
      reference_type: 'staff',
      reference_id: id
    });

    res.status(200).json({
      status: 'success',
      message: `Password for "${staffObj.name}" reset successfully`
    });
  } catch (error) {
    next(error);
  }
};

const deleteStaff = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existRes = await db.query(`SELECT id, name FROM users WHERE id = $1 AND role = 'waiter'`, [id]);
    if (existRes.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Staff member not found' });
    }

    const staffObj = existRes.rows[0];

    await db.query(`DELETE FROM users WHERE id = $1 AND role = 'waiter'`, [id]);

    createNotification({
      title: 'Staff Member Deleted',
      message: `Waiter "${staffObj.name}" removed from system.`,
      type: 'warning',
      icon: 'users',
      reference_type: 'staff',
      reference_id: id
    });

    res.status(200).json({
      status: 'success',
      message: `Staff member "${staffObj.name}" deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStaff,
  getStaffById,
  createStaff,
  updateStaff,
  resetStaffPassword,
  deleteStaff
};
