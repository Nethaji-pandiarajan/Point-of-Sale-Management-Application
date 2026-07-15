// In-memory Category Mock DB
let categories = [
  { id: '1', name: 'Appetizers', description: 'Light starters and finger foods', icon: '🥗', status: 'active' },
  { id: '2', name: 'Main Course', description: 'Filling primary dinner courses', icon: '🍝', status: 'active' },
  { id: '3', name: 'Desserts', description: 'Sweet cakes, pies and ice creams', icon: '🍰', status: 'active' },
  { id: '4', name: 'Beverages', description: 'Hot and cold refreshments', icon: '🍹', status: 'active' }
];

const findAll = () => {
  return [...categories];
};

const findById = (id) => {
  return categories.find(c => c.id === id) || null;
};

const existsByName = (name) => {
  return categories.some(c => c.name.toLowerCase() === name.trim().toLowerCase());
};

const existsByNameExceptId = (name, id) => {
  return categories.some(c => c.id !== id && c.name.toLowerCase() === name.trim().toLowerCase());
};

const create = (data) => {
  const newCategory = {
    id: Math.random().toString(36).substring(2, 9),
    name: data.name.trim(),
    description: data.description || '',
    icon: data.icon || '🍽️',
    status: data.status || 'active'
  };
  categories.push(newCategory);
  return newCategory;
};

const update = (id, data) => {
  const catIndex = categories.findIndex(c => c.id === id);
  if (catIndex === -1) return null;

  if (data.name) categories[catIndex].name = data.name.trim();
  if (data.description !== undefined) categories[catIndex].description = data.description;
  if (data.icon) categories[catIndex].icon = data.icon;
  if (data.status) categories[catIndex].status = data.status;

  return categories[catIndex];
};

const remove = (id) => {
  const catIndex = categories.findIndex(c => c.id === id);
  if (catIndex === -1) return null;
  const deleted = categories[catIndex];
  categories = categories.filter(c => c.id !== id);
  return deleted;
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
