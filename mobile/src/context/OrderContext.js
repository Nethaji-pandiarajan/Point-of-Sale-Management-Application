import React, { createContext, useContext, useState, useMemo } from 'react';

const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  const [selectedTable, setSelectedTable] = useState(null);
  const [guestCount, setGuestCount] = useState(1);
  const [cart, setCart] = useState({}); // { [productId]: { product, quantity, notes } }
  const [activeOrder, setActiveOrder] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  const selectTable = (table) => {
    setSelectedTable(table);
    if (table) {
      const cap = parseInt(table.capacity, 10) || 4;
      if (table.status === 'occupied' && table.activeOrderGuests) {
        // Load existing active order guest count
        setGuestCount(Math.min(cap, Math.max(1, parseInt(table.activeOrderGuests, 10))));
      } else if (!selectedTable || selectedTable.id !== table.id) {
        // Reset to 1 for a new table
        setGuestCount(1);
      } else {
        // Clamp existing guestCount to table capacity
        setGuestCount(prev => Math.min(cap, Math.max(1, prev)));
      }
    }
  };

  const setGuests = (countOrUpdater) => {
    const cap = parseInt(selectedTable?.capacity, 10) || 4;
    setGuestCount((prev) => {
      const next = typeof countOrUpdater === 'function' ? countOrUpdater(prev) : countOrUpdater;
      return Math.min(cap, Math.max(1, next));
    });
  };

  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const current = prev[product.id];
      const newQty = current ? current.quantity + quantity : quantity;
      return {
        ...prev,
        [product.id]: {
          product,
          quantity: newQty,
          unitPrice: parseFloat(product.price || 0),
        },
      };
    });
  };

  const updateQuantity = (productId, quantity) => {
    setCart((prev) => {
      if (quantity <= 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      if (!prev[productId]) return prev;
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          quantity,
        },
      };
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const clearCart = () => {
    setCart({});
  };

  const cartCount = useMemo(() => {
    return Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartTotal = useMemo(() => {
    return Object.values(cart).reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
  }, [cart]);

  const cartItemsList = useMemo(() => {
    return Object.values(cart);
  }, [cart]);

  return (
    <OrderContext.Provider
      value={{
        selectedTable,
        selectTable,
        guestCount,
        setGuests,
        cart,
        cartCount,
        cartTotal,
        cartItemsList,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        activeOrder,
        setActiveOrder,
        refreshTrigger,
        triggerRefresh,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}
