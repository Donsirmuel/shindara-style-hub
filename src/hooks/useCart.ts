import { useState, useEffect } from 'react';
import { CartItem, Product } from '@/lib/types';
import { site } from '@/site.config';
import { toast } from 'sonner';

const CART_KEY = `${site.brandSlug}-cart`;

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      const parsed = stored ? (JSON.parse(stored) as unknown) : [];
      // Guard against corrupted storage or an older cart shape.
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (entry): entry is CartItem =>
          !!entry && typeof entry === 'object' &&
          !!(entry as CartItem).product && typeof (entry as CartItem).quantity === 'number',
      );
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
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

  const updateQuantity = (productId: string, size: string, color: string, quantity: number) => {
    if (quantity < 1) return;

    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId && item.size === size && item.color === color
          ? { ...item, quantity }
          : item
      )
    );
  };

  const removeItem = (productId: string, size: string, color: string) => {
    setItems((prev) =>
      prev.filter(
        (item) => !(item.product.id === productId && item.size === size && item.color === color)
      )
    );
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
