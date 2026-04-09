import { Link } from 'react-router-dom';
import { Minus, Plus, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CartItem } from '@/lib/types';
import { resolveImageUrl } from '@/utils/imageResolver';

interface CartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  onRemoveItem: (productId: string, size: string, color: string) => void;
}

export function Cart({ open, onOpenChange, items, onUpdateQuantity, onRemoveItem }: CartProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col px-4 sm:max-w-lg sm:px-6">
        <SheetHeader className="px-0">
          <SheetTitle>Shopping Cart ({items.length})</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center space-y-4">
            <p className="text-muted-foreground">Your cart is empty</p>
            <Button onClick={() => onOpenChange(false)} asChild>
              <Link to="/women">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 pr-1">
              <div className="space-y-4 py-2">
                {items.map((item) => {
                  const imageSrc = resolveImageUrl(item.product.images?.[0]);
                  return (
                    <div key={`${item.product.id}-${item.size}-${item.color}`} className="flex gap-3 sm:gap-4">
                      <div className="relative h-20 w-16 overflow-hidden rounded-md bg-secondary sm:h-24 sm:w-20">
                        <img
                          src={imageSrc}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <Link
                              to={`/product/${item.product.id}`}
                              className="font-semibold text-sm hover:text-accent transition-colors line-clamp-2"
                              onClick={() => onOpenChange(false)}
                            >
                              {item.product.name}
                            </Link>
                            <p className="text-xs text-muted-foreground mt-1">
                              Size: {item.size} - {item.color}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => onRemoveItem(item.product.id, item.size, item.color)}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove item</span>
                          </Button>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onUpdateQuantity(item.product.id, item.size, item.color, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onUpdateQuantity(item.product.id, item.size, item.color, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="font-semibold text-sm">
                            {formatPrice(item.product.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="space-y-4 border-t bg-card py-4">
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Shipping and taxes calculated at checkout.
                </p>
              </div>
              <Button className="w-full" size="lg" asChild onClick={() => onOpenChange(false)}>
                <Link to="/checkout">Proceed to Checkout</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
