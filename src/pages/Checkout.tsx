import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CartItem, CheckoutFormData } from '@/lib/types';
import { resolveImageUrl } from '@/utils/imageResolver';

interface CheckoutProps {
  cartItems: CartItem[];
  onClearCart: () => void;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(price);

export default function Checkout({ cartItems, onClearCart }: CheckoutProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CheckoutFormData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = 2000;
  const total = subtotal + shipping;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.phone) {
      toast.error('Fill in all required details before checkout.');
      return;
    }

    toast.success('Order placed successfully.');
    onClearCart();
    setTimeout(() => navigate('/'), 1800);
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-2xl border border-border/80 bg-card px-8 py-10 text-center">
          <h1 className="text-2xl font-bold">Your cart is empty</h1>
          <p className="mt-2 text-sm text-muted-foreground">Add some pieces first and come back here.</p>
          <Button className="mt-5" onClick={() => navigate('/women')}>Start Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Checkout</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Complete Your Order</h1>
          <p className="mt-2 text-sm text-foreground/75">Simple delivery details and quick payment.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.42fr]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="text-xl">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="text-xl">Delivery Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={(event) => setFormData({ ...formData, firstName: event.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={(event) => setFormData({ ...formData, lastName: event.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    placeholder="+234 800 000 0000"
                    value={formData.phone}
                    onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    required
                    placeholder="Street address"
                    value={formData.address}
                    onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      required
                      value={formData.city}
                      onChange={(event) => setFormData({ ...formData, city: event.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      required
                      value={formData.state}
                      onChange={(event) => setFormData({ ...formData, state: event.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">Postal Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(event) => setFormData({ ...formData, zipCode: event.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" size="lg" className="h-11 w-full rounded-full">
              Place Order
            </Button>
          </form>

          <aside>
            <Card className="border-border/80 lg:sticky lg:top-24">
              <CardHeader>
                <CardTitle className="text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {cartItems.map((item) => {
                    const imageSrc = resolveImageUrl(item.product.images?.[0]);
                    return (
                      <div key={`${item.product.id}-${item.size}-${item.color}`} className="flex gap-3">
                        <div className="relative h-16 w-14 overflow-hidden rounded-md bg-secondary">
                          <img src={imageSrc} alt={item.product.name} className="h-full w-full object-cover" />
                          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-medium">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">{item.size} - {item.color}</p>
                        </div>
                        <p className="text-sm font-semibold">{formatPrice(item.product.price * item.quantity)}</p>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="font-semibold">{formatPrice(shipping)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-base">
                    <span className="font-semibold">Total</span>
                    <span className="text-lg font-bold">{formatPrice(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
