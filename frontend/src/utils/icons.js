export const categoryIcons = [
  { key: 'pizza', label: 'Pizza', icon: '🍕', group: 'Fast Food' },
  { key: 'burger', label: 'Burger', icon: '🍔', group: 'Fast Food' },
  { key: 'hotdog', label: 'Hot Dog', icon: '🌭', group: 'Fast Food' },
  { key: 'taco', label: 'Taco', icon: '🌮', group: 'Fast Food' },
  { key: 'wrap', label: 'Wrap', icon: '🌯', group: 'Fast Food' },
  { key: 'fries', label: 'Fries', icon: '🍟', group: 'Fast Food' },
  { key: 'chicken', label: 'Chicken', icon: '🍗', group: 'Main Course' },
  { key: 'steak', label: 'Steak', icon: '🥩', group: 'Main Course' },
  { key: 'bbq', label: 'BBQ', icon: '🍖', group: 'Main Course' },
  { key: 'noodles', label: 'Noodles', icon: '🍜', group: 'Main Course' },
  { key: 'pasta', label: 'Pasta', icon: '🍝', group: 'Main Course' },
  { key: 'curry', label: 'Curry', icon: '🥘', group: 'Main Course' },
  { key: 'rice', label: 'Rice', icon: '🍛', group: 'Main Course' },
  { key: 'sushi', label: 'Sushi', icon: '🍣', group: 'Main Course' },
  { key: 'seafood', label: 'Seafood', icon: '🍤', group: 'Main Course' },
  { key: 'fish', label: 'Fish', icon: '🐟', group: 'Main Course' },
  { key: 'salad', label: 'Salad', icon: '🥗', group: 'General' },
  { key: 'sandwich', label: 'Sandwich', icon: '🥪', group: 'Fast Food' },
  { key: 'shawarma', label: 'Shawarma / Wrap', icon: '🥙', group: 'Fast Food' },
  { key: 'bakery', label: 'Bakery', icon: '🥐', group: 'Bakery' },
  { key: 'cake', label: 'Cake', icon: '🍰', group: 'Desserts' },
  { key: 'cupcake', label: 'Cupcake', icon: '🧁', group: 'Desserts' },
  { key: 'donut', label: 'Donut', icon: '🍩', group: 'Desserts' },
  { key: 'cookie', label: 'Cookie', icon: '🍪', group: 'Desserts' },
  { key: 'chocolate', label: 'Chocolate', icon: '🍫', group: 'Desserts' },
  { key: 'icecream', label: 'Ice Cream', icon: '🍨', group: 'Desserts' },
  { key: 'coffee', label: 'Coffee', icon: '☕', group: 'Drinks' },
  { key: 'tea', label: 'Tea', icon: '🫖', group: 'Drinks' },
  { key: 'softdrink', label: 'Soft Drink', icon: '🥤', group: 'Drinks' },
  { key: 'juice', label: 'Juice', icon: '🧃', group: 'Drinks' },
  { key: 'milkshake', label: 'Milkshake', icon: '🥛', group: 'Drinks' },
  { key: 'mocktail', label: 'Mocktail', icon: '🍹', group: 'Drinks' },
  { key: 'general', label: 'General Dish', icon: '🍽️', group: 'General' }
];

export const getIconEmoji = (key) => {
  if (!key) return '🍽️';
  const found = categoryIcons.find(i => i.key === key || i.icon === key);
  return found ? found.icon : key;
};

export const getIconLabel = (key) => {
  if (!key) return 'General Dish';
  const found = categoryIcons.find(i => i.key === key || i.icon === key);
  return found ? found.label : key;
};
