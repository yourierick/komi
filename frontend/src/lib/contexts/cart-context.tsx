"use client";

import * as React from "react";

export interface CartItem {
  id: string;
  type: 'product' | 'rental' | 'service';
  name: string;
  image: string;
  price: number;
  quantity: number;
  currency?: string;
  category?: string;
  min_order?: number;
  payment_frequency?: string;
  shop_id?: number;
  reseller?: {
    id: number;
    name: string;
    email: string;
  };
}

interface CartContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  item: CartItem | null;
  setItem: (item: CartItem | null) => void;
  openWithItem: (item: CartItem) => void;
}

const CartContext = React.createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [item, setItem] = React.useState<CartItem | null>(null);

  const openWithItem = (cartItem: CartItem) => {
    setItem(cartItem);
    setIsOpen(true);
  };

  return (
    <CartContext.Provider value={{ isOpen, setIsOpen, item, setItem, openWithItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
