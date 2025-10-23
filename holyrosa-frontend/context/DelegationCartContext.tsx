'use client';

import React, { createContext, useContext, useState } from 'react';
import { Medicine } from '@/types';

export interface CartItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  availableQuantity: number;
  packageType: string;
  genericName: string;
}

export interface DelegationCheckoutItem {
  medicineId: string;
  medicineName: string;
  packageType: string;
  genericName: string;
  delegations: {
    delegateTo: 'ipp' | 'dispensary' | 'other';
    quantity: number;
    delegationDate: string;
    remarks: string;
  }[];
}

interface DelegationCartContextType {
  cart: CartItem[];
  addToCart: (medicine: Medicine, quantity: number) => void;
  removeFromCart: (medicineId: string) => void;
  updateCartQuantity: (medicineId: string, quantity: number) => void;
  clearCart: () => void;
  getCartCount: () => number;
}

const DelegationCartContext = createContext<DelegationCartContextType | undefined>(undefined);

export const DelegationCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (medicine: Medicine, quantity: number) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.medicineId === medicine.id);
      if (existingItem) {
        // Update quantity if medicine already in cart
        return prevCart.map((item) =>
          item.medicineId === medicine.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, medicine.quantity) }
            : item
        );
      } else {
        // Add new item to cart
        return [
          ...prevCart,
          {
            medicineId: medicine.id,
            medicineName: medicine.name,
            quantity,
            availableQuantity: medicine.quantity,
            packageType: medicine.packageType,
            genericName: medicine.genericName,
          },
        ];
      }
    });
  };

  const removeFromCart = (medicineId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.medicineId !== medicineId));
  };

  const updateCartQuantity = (medicineId: string, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.medicineId === medicineId
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.availableQuantity)) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <DelegationCartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        getCartCount,
      }}
    >
      {children}
    </DelegationCartContext.Provider>
  );
};

export const useDelegationCart = () => {
  const context = useContext(DelegationCartContext);
  if (!context) {
    throw new Error('useDelegationCart must be used within DelegationCartProvider');
  }
  return context;
};