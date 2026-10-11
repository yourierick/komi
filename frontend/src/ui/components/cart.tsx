import { cn } from "~/lib/cn";

import { CartClient } from "./cart-client";

export interface CartItem {
  id: string;
  type: 'product' | 'rental';
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

interface CartProps {
  className?: string;
}

const mockCart: CartItem[] = [
  {
    category: "Audio",
    id: "1",
    type: "product",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    name: "Premium Wireless Headphones",
    price: 199.99,
    quantity: 1,
  },
  {
    category: "Wearables",
    id: "2",
    type: "product",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    name: "Smart Watch Series 5",
    price: 299.99,
    quantity: 2,
  },
];

export function Cart({ className }: CartProps) {
  return (
    <div className={cn("relative", className)}>
      {/* // TODO: Fetch cart from e.g. LocalStorage and/or database */}
      <CartClient className={cn("", className)} mockCart={mockCart} />
    </div>
  );
}
