const db = require('../config/db');
const { createNotification } = require('../utils/notification.helper');

const getTables = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    let countQueryText = `SELECT COUNT(t.id)::integer FROM tables t WHERE 1=1`;
    let queryText = `
      SELECT t.id, t.table_number AS "tableNumber", t.capacity, t.status,
             t.created_at AS "createdAt", t.updated_at AS "updatedAt",
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
      WHERE 1=1
    `;

    const params = [];
    let index = 1;

    if (status) {
      countQueryText += ` AND t.status = $${index}`;
      queryText += ` AND t.status = $${index}`;
      params.push(status);
      index++;
    }

    if (search) {
      countQueryText += ` AND (t.table_number ILIKE $${index} OR CAST(t.capacity AS TEXT) ILIKE $${index})`;
      queryText += ` AND (t.table_number ILIKE $${index} OR CAST(t.capacity AS TEXT) ILIKE $${index})`;
      params.push(`%${search.trim()}%`);
      index++;
    }

    const countRes = await db.query(countQueryText, params);
    const totalCount = parseInt(countRes.rows[0].count, 10);

    queryText += ` ORDER BY t.id ASC`;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    queryText += ` LIMIT $${index} OFFSET $${index + 1}`;
    params.push(limitNum, offset);

    const tablesRes = await db.query(queryText, params);

    res.status(200).json({
      status: 'success',
      data: tablesRes.rows,
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

const getTableById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resTable = await db.query(
      `SELECT id, table_number AS "tableNumber", capacity, status, created_at AS "createdAt", updated_at AS "updatedAt" FROM tables WHERE id = $1`,
      [id]
    );

    if (resTable.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Table not found' });
    }

    res.status(200).json({
      status: 'success',
      data: resTable.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const createTable = async (req, res, next) => {
  try {
    const { tableNumber, capacity, status = 'available' } = req.body;

    if (!tableNumber || !tableNumber.trim()) {
      return res.status(400).json({ status: 'error', message: 'Table number/name is required' });
    }

    const capNum = parseInt(capacity, 10);
    if (isNaN(capNum) || capNum <= 0) {
      return res.status(400).json({ status: 'error', message: 'Valid seating capacity is required' });
    }

    // Check duplicate table number
    const dupRes = await db.query(
      `SELECT id FROM tables WHERE LOWER(table_number) = LOWER($1)`,
      [tableNumber.trim()]
    );
    if (dupRes.rowCount > 0) {
      return res.status(400).json({ status: 'error', message: `Table "${tableNumber.trim()}" already exists` });
    }

    const insertRes = await db.query(
      `INSERT INTO tables (table_number, capacity, status) VALUES ($1, $2, $3)
       RETURNING id, table_number AS "tableNumber", capacity, status, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [tableNumber.trim(), capNum, status]
    );

    const newTable = insertRes.rows[0];

    createNotification({
      title: 'Table Added',
      message: `Table "${newTable.tableNumber}" (${newTable.capacity} seats) added successfully.`,
      type: 'success',
      icon: 'armchair',
      reference_type: 'table',
      reference_id: newTable.id
    });

    res.status(201).json({
      status: 'success',
      data: newTable
    });
  } catch (error) {
    next(error);
  }
};

const updateTable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tableNumber, capacity, status } = req.body;

    const existRes = await db.query(`SELECT id FROM tables WHERE id = $1`, [id]);
    if (existRes.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Table not found' });
    }

    if (tableNumber) {
      const dupRes = await db.query(
        `SELECT id FROM tables WHERE LOWER(table_number) = LOWER($1) AND id != $2`,
        [tableNumber.trim(), id]
      );
      if (dupRes.rowCount > 0) {
        return res.status(400).json({ status: 'error', message: `Table "${tableNumber.trim()}" already exists` });
      }
    }

    const capNum = capacity !== undefined ? parseInt(capacity, 10) : undefined;
    if (capNum !== undefined && (isNaN(capNum) || capNum <= 0)) {
      return res.status(400).json({ status: 'error', message: 'Valid seating capacity is required' });
    }

    const updateRes = await db.query(
      `UPDATE tables
       SET table_number = COALESCE($1, table_number),
           capacity = COALESCE($2, capacity),
           status = COALESCE($3, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, table_number AS "tableNumber", capacity, status, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [tableNumber ? tableNumber.trim() : null, capNum || null, status || null, id]
    );

    const updatedTable = updateRes.rows[0];

    createNotification({
      title: 'Table Updated',
      message: `Table "${updatedTable.tableNumber}" details updated.`,
      type: 'info',
      icon: 'armchair',
      reference_type: 'table',
      reference_id: updatedTable.id
    });

    res.status(200).json({
      status: 'success',
      data: updatedTable
    });
  } catch (error) {
    next(error);
  }
};

const deleteTable = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existRes = await db.query(`SELECT id, table_number FROM tables WHERE id = $1`, [id]);
    if (existRes.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Table not found' });
    }

    const tableObj = existRes.rows[0];

    await db.query(`DELETE FROM tables WHERE id = $1`, [id]);

    createNotification({
      title: 'Table Deleted',
      message: `Table "${tableObj.table_number}" removed from system.`,
      type: 'warning',
      icon: 'armchair',
      reference_type: 'table',
      reference_id: id
    });

    res.status(200).json({
      status: 'success',
      message: `Table "${tableObj.table_number}" deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable
};
