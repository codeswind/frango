import React, { createContext, useContext, useState } from 'react';

const OrderContext = createContext();

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const [currentOrder, setCurrentOrder] = useState(null);
  const [cart, setCart] = useState([]);
  const [orderDetails, setOrderDetails] = useState(null);

  const startNewOrder = (details) => {
    setOrderDetails(details);
    setCart([]);
  };

  const addToCart = (menuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === menuItem.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...menuItem, quantity: 1 }];
      }
    });
  };

  const updateCartQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCart([]);
    setOrderDetails(null);
    setCurrentOrder(null);
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return total + (price * quantity);
    }, 0);
  };

  const value = {
    currentOrder,
    setCurrentOrder,
    cart,
    orderDetails,
    startNewOrder,
    addToCart,
    updateCartQuantity,
    clearCart,
    getTotalAmount
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};