import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext({});

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  function addItem(product, quantity = 1) {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === product.id);
      
      if (existingItem) {
        return currentItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...currentItems, { ...product, quantity }];
      }
    });
  }

  function removeItem(productId) {
    setItems(currentItems => currentItems.filter(item => item.id !== productId));
  }

  function updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }

  function clearCart() {
    setItems([]);
  }

  const totalPrice = items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalPrice,
      totalItems,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}