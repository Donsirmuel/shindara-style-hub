import { useState, useEffect } from 'react';
import { CartItem, Product } from '@/lib/types';
import { toast } from 'sonner';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem('shindara-cart');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('shindara-cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, size: string, color: string, quantity: number = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id && item.size === size && item.color === color
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        toast.success('Cart updated', {
          description: `Increased quantity to ${updated[existingIndex].quantity}`,
        });
        return updated;
      }

      toast.success('Added to cart', {
        description: `${product.name} has been added to your cart`,
      });
      return [...prev, { product, quantity, size, color }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;

    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
    toast.info('Removed from cart');
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    totalItems,
  };
}
