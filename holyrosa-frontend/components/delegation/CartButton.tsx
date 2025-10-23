'use client';

import React from 'react';
import { useDelegationCart } from '@/context/DelegationCartContext';
import CartModal from './CartModal';

interface CartButtonProps {
  isOpen: boolean;
  onClose: () => void;
  onClick?: () => void;
}

export const CartButton: React.FC<CartButtonProps> = ({ isOpen, onClose, onClick }) => {
  const { getCartCount } = useDelegationCart();
  const cartCount = getCartCount();

  return (
    <>
      {/* Cart Modal */}
      {isOpen && <CartModal onClose={onClose} />}
    </>
  );
};

export default CartButton;