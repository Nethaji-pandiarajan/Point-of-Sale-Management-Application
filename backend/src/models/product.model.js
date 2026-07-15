// In-memory Product Mock DB
let products = [
  { id: '1', name: 'Truffle Parmesan Fries', description: 'Hand-cut fries with truffle oil and shaved parmesan', categoryId: '1', price: 12.50, availability: 'available', image: '🍟' },
  { id: '2', name: 'Classic Caesar Salad', description: 'Romaine lettuce, garlic croutons, creamy Caesar dressing', categoryId: '1', price: 14.00, availability: 'available', image: '🥗' },
  { id: '3', name: 'Margherita Woodfired Pizza', description: 'Fresh mozzarella, san marzano tomatoes, fresh basil', categoryId: '2', price: 18.50, availability: 'available', image: '🍕' },
  { id: '4', name: 'Spaghetti Carbonara', description: 'Pecorino romano, guanciale, fresh eggs, black pepper', categoryId: '2', price: 22.00, availability: 'available', image: '🍝' },
  { id: '5', name: 'Saleiz Tiramisu Cup', description: 'Espresso-soaked ladyfingers, mascarpone cream, cocoa powder', categoryId: '3', price: 9.50, availability: 'available', image: '🍰' },
  { id: '6', name: 'Artisan Gelato Trio', description: 'Choice of chocolate, pistachio, strawberry and vanilla', categoryId: '3', price: 8.00, availability: 'out_of_stock', image: '🍨' },
  { id: '7', name: 'Lemon Mint Iced Tea', description: 'Freshly brewed black tea, organic honey, fresh lemon juice', categoryId: '4', price: 4.50, availability: 'available', image: '🍹' },
  { id: '8', name: 'Double Espresso Shot', description: 'Rich premium dark roast espresso blend', categoryId: '4', price: 3.50, availability: 'available', image: '☕' }
];

const findAll = () => {
  return [...products];
};

const findById = (id) => {
  return products.find(p => p.id === id) || null;
};

const create = (data) => {
  const newProduct = {
    id: Math.random().toString(36).substring(2, 9),
    name: data.name.trim(),
    description: data.description || '',
    categoryId: data.categoryId,
    price: data.price,
    availability: data.availability || 'available',
    image: data.image || '🍔'
  };
  products.push(newProduct);
  return newProduct;
};

const update = (id, data) => {
  const prodIndex = products.findIndex(p => p.id === id);
  if (prodIndex === -1) return null;

  if (data.name) products[prodIndex].name = data.name.trim();
  if (data.description !== undefined) products[prodIndex].description = data.description;
  if (data.categoryId) products[prodIndex].categoryId = data.categoryId;
  if (data.price !== undefined) products[prodIndex].price = data.price;
  if (data.availability) products[prodIndex].availability = data.availability;
  if (data.image) products[prodIndex].image = data.image;

  return products[prodIndex];
};

const remove = (id) => {
  const prodIndex = products.findIndex(p => p.id === id);
  if (prodIndex === -1) return null;
  const deleted = products[prodIndex];
  products = products.filter(p => p.id !== id);
  return deleted;
};

const deleteByCategory = (categoryId) => {
  products = products.filter(p => p.categoryId !== categoryId);
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
  deleteByCategory
};
