const db = require('../config/db');

const getIconLabel = (key) => {
  if (!key) return 'Other';
  return key.charAt(0).toUpperCase() + key.slice(1);
};

const findAll = async () => {
  const result = await db.query(`
    SELECT c.id, c.name, c.description, c.icon_key AS icon, c.status, c.created_at, c.updated_at,
           COALESCE(COUNT(p.id), 0)::integer AS "productCount"
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id
    GROUP BY c.id, c.name, c.description, c.icon_key, c.status, c.created_at, c.updated_at
    ORDER BY c.name ASC
  `);
  return result.rows; // Returns numeric id
};

const findById = async (id) => {
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId)) return null;

  const result = await db.query(`
    SELECT id, name, description, icon_key AS icon, status 
    FROM categories 
    WHERE id = $1
  `, [parsedId]);
  
  if (result.rowCount === 0) return null;
  return result.rows[0];
};

const existsByName = async (name) => {
  const result = await db.query(`
    SELECT id 
    FROM categories 
    WHERE LOWER(name) = LOWER($1)
  `, [name.trim()]);
  return result.rowCount > 0;
};

const existsByNameExceptId = async (name, id) => {
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId)) return false;

  const result = await db.query(`
    SELECT id 
    FROM categories 
    WHERE LOWER(name) = LOWER($1) AND id <> $2
  `, [name.trim(), parsedId]);
  return result.rowCount > 0;
};

const create = async (data) => {
  const name = data.name.trim();
  const description = data.description || '';
  const iconKey = data.icon || 'salad';
  const iconLabel = getIconLabel(iconKey);
  const status = data.status || 'active';

  const result = await db.query(`
    INSERT INTO categories (name, description, icon_key, icon_label, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, description, icon_key AS icon, status
  `, [name, description, iconKey, iconLabel, status]);
  
  return result.rows[0];
};

const update = async (id, data) => {
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId)) return null;

  const fields = [];
  const params = [];
  let index = 1;

  if (data.name) {
    fields.push(`name = $${index++}`);
    params.push(data.name.trim());
  }
  if (data.description !== undefined) {
    fields.push(`description = $${index++}`);
    params.push(data.description);
  }
  if (data.icon) {
    fields.push(`icon_key = $${index++}`);
    params.push(data.icon);
    fields.push(`icon_label = $${index++}`);
    params.push(getIconLabel(data.icon));
  }
  if (data.status) {
    fields.push(`status = $${index++}`);
    params.push(data.status);
  }

  if (fields.length === 0) return await findById(id);

  params.push(parsedId);
  const queryText = `
    UPDATE categories 
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
    WHERE id = $${index} 
    RETURNING id, name, description, icon_key AS icon, status
  `;

  const result = await db.query(queryText, params);
  if (result.rowCount === 0) return null;
  return result.rows[0];
};

const remove = async (id) => {
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId)) return null;

  const result = await db.query(`
    DELETE FROM categories 
    WHERE id = $1 
    RETURNING id, name, description, icon_key AS icon, status
  `, [parsedId]);
  
  if (result.rowCount === 0) return null;
  return result.rows[0];
};

module.exports = {
  findAll,
  findById,
  existsByName,
  existsByNameExceptId,
  create,
  update,
  remove
};
