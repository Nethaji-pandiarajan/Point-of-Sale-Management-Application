const db = require('../config/db');

const mapProduct = (row) => {
  if (!row) return null;
  return {
    id: row.id, // Number type ID
    categoryId: row.category_id, // Number type categoryId
    name: row.name,
    description: row.description,
    price: parseFloat(row.price),
    availability: row.is_available ? 'available' : 'out_of_stock',
    image: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const findAll = async () => {
  const result = await db.query('SELECT * FROM products ORDER BY name ASC');
  return result.rows.map(mapProduct);
};

const findById = async (id) => {
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId)) return null;

  const result = await db.query('SELECT * FROM products WHERE id = $1', [parsedId]);
  return mapProduct(result.rows[0]);
};

const create = async (data) => {
  const categoryId = parseInt(data.categoryId, 10);
  const name = data.name.trim();
  const description = data.description || '';
  const price = parseFloat(data.price);
  const imageUrl = data.image || '🍔';
  const isAvailable = data.availability !== 'out_of_stock';

  const result = await db.query(`
    INSERT INTO products (category_id, name, description, price, image_url, is_available)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [categoryId, name, description, price, imageUrl, isAvailable]);
  return mapProduct(result.rows[0]);
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
  if (data.categoryId) {
    fields.push(`category_id = $${index++}`);
    params.push(parseInt(data.categoryId, 10));
  }
  if (data.price !== undefined) {
    fields.push(`price = $${index++}`);
    params.push(parseFloat(data.price));
  }
  if (data.availability) {
    fields.push(`is_available = $${index++}`);
    params.push(data.availability !== 'out_of_stock');
  }
  if (data.image) {
    fields.push(`image_url = $${index++}`);
    params.push(data.image);
  }

  if (fields.length === 0) return await findById(id);

  params.push(parsedId);
  const queryText = `
    UPDATE products 
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
    WHERE id = $${index} 
    RETURNING *
  `;

  const result = await db.query(queryText, params);
  return mapProduct(result.rows[0]);
};

const remove = async (id) => {
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId)) return null;

  const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING *', [parsedId]);
  return mapProduct(result.rows[0]);
};

const deleteByCategory = async (categoryId) => {
  const parsedCategoryId = parseInt(categoryId, 10);
  if (isNaN(parsedCategoryId)) return [];
  const result = await db.query('DELETE FROM products WHERE category_id = $1 RETURNING *', [parsedCategoryId]);
  return result.rows.map(mapProduct);
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
  deleteByCategory
};
