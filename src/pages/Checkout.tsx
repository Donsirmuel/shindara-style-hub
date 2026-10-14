import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CartItem, CheckoutFormData } from '@/lib/types';
import { formatPrice, cartSubtotal, lineTotal, whatsappOrderLink } from '@/lib/format';
import { ApiError, createOrder, createOrderPayment, markOrderPaid, type PlacedOrder } from '@/lib/api';
import { site } from '@/site.config';
import { resolveImageUrl } from '@/utils/imageResolver';

/**
 * Online payment for a just-placed unpaid order. Redirects to Bachs;
 * unconfigured stores answer 501 and the transfer/cash path stays.
 */
function PayNowCta({ refId, phone, total }: { refId: string; phone: string; total: number }) {
  const [busy, setBusy] = useState(false);
  // Demo refs (offline mode) have no backend order to pay for.
  if (refId.startsWith('DEMO-')) return null;
  return (
    <Button
      className="h-11 w-full rounded-full"
      disabled={busy || !phone}
      onClick={async () => {
        setBusy(true);
        try {
          const { url } = await createOrderPayment(refId, phone);
          window.location.href = url;
        } catch (e) {
          if (e instanceof ApiError && e.status === 501) {
            toast.info('Online payment is not enabled on this store yet — pay at pickup or by transfer.');
          } else {
            toast.error('Could not start online payment. Try again or pay at pickup.');
          }
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? 'Opening secure payment…' : `Pay ${formatPrice(total)} now`}
    </Button>
  );
}

function PaidCta({ refId, phone }: { refId: string; phone: string }) {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  if (done) return <p className="text-sm font-semibold text-green-700">Transfer noted — bring the receipt to the counter.</p>;
  return (
    <Button
      variant="outline"
      className="h-11 w-full rounded-full"
      disabled={busy || !phone}
      onClick={async () => {
        setBusy(true);
        try {
          await markOrderPaid(refId, phone);
          setDone(true);
          toast.success('Noted! The vendor will confirm when it lands.');
        } catch {
          toast.error('Could not update. You can still show your receipt at pickup.');
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? 'Saving…' : "I've sent the transfer"}
    </Button>
  );
}

interface CheckoutProps {
  cartItems: CartItem[];
  onClearCart: () => void;
}

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

  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>('delivery');

  // Bulk-aware line totals — same helper as the cart and the server math.
  const subtotal = cartSubtotal(cartItems);  const shipping = fulfillment === 'pickup' ? 0 : subtotal >= site.shipping.freeAbove ? 0 : site.shipping.baseFee;
  const total = subtotal + shipping;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.phone || !formData.firstName) {
      toast.error('Add at least your name and phone number.');
      return;
    }
    setPlacing(true);
    try {
      const order = await createOrder(
        { ...formData },
        cartItems.map((item) => ({
          productId: item.product.id,
          size: item.size,
          color: item.color,
          qty: item.quantity,
        })),
        fulfillment,
      );
      if (!order) {
        // Static demo (no backend): same success screen with a local ref so
        // the flow (ref → WhatsApp → track) can be exercised offline.
        const demoId = `DEMO-${Date.now().toString(36).toUpperCase().slice(-6)}`;
        setPlacedOrder({ id: demoId, subtotal, shipping, total, status: 'pending', payment: 'unpaid', emailSent: false });
        onClearCart();
        toast.success(`Demo order ${demoId} noted (connect the backend to save orders).`);
        return;
      }
      setPlacedOrder(order);
      onClearCart();
      toast.success(`Order ${order.id} received!`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        const p = e.payload as { available?: number; productId?: string };
        toast.error(`Not enough stock${p.productId ? ` for ${p.productId}` : ''}${p.available != null ? ` — ${p.available} left` : ''}. Adjust quantities and retry.`);
      } else if (e instanceof ApiError) {
        toast.error('Could not place the order. Check your details and retry.');
      } else {
        toast.error('Could not reach the server. Try again.');
      }
    } finally {
      setPlacing(false);
    }
  };

  if (placedOrder) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card px-8 py-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Order received</p>
          <h1 className="mt-2 font-mono text-3xl font-bold tracking-widest">{placedOrder.id}</h1>
          <p className="mt-1 text-xs text-muted-foreground">Screenshot this ref — show it at the counter.</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Total {formatPrice(placedOrder.total)} —{' '}
            {fulfillment === 'pickup'
              ? `pick up free at ${site.pickup.address}.`
              : 'pay on delivery. '}{' '}
            We will call {formData.phone || 'you'} to confirm.
          </p>
          {placedOrder.emailSent && (
            <p className="mt-2 text-xs text-muted-foreground">Receipt sent to {formData.email}.</p>
          )}
          <div className="mt-6 space-y-2">
            {placedOrder.payment === 'unpaid' && (
              <>
                <PayNowCta refId={placedOrder.id} phone={formData.phone} total={placedOrder.total} />
                <PaidCta refId={placedOrder.id} phone={formData.phone} />
              </>
            )}
            <Button className="h-11 w-full rounded-full" asChild>
              <a href={whatsappOrderLink(placedOrder.id, placedOrder.total)} target="_blank" rel="noreferrer">
                Confirm on WhatsApp
              </a>
            </Button>
            <Button variant="outline" className="h-11 w-full rounded-full" onClick={() => navigate('/track')}>
              Track Order
            </Button>
            <Button variant="ghost" className="h-11 w-full rounded-full" onClick={() => navigate('/')}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
                <CardTitle className="text-xl">Pickup or Delivery?</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setFulfillment('delivery')}
                  className={`rounded-xl border p-4 text-left transition-colors ${fulfillment === 'delivery' ? 'border-accent bg-accent/10' : 'border-border/80'}`}
                >
                  <p className="font-semibold">Deliver to me</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {subtotal >= site.shipping.freeAbove ? 'Free (order over ' + formatPrice(site.shipping.freeAbove) + ')' : formatPrice(site.shipping.baseFee)}
                  </p>
                </button>
                {site.pickup.enabled && (
                  <button
                    type="button"
                    onClick={() => setFulfillment('pickup')}
                    className={`rounded-xl border p-4 text-left transition-colors ${fulfillment === 'pickup' ? 'border-accent bg-accent/10' : 'border-border/80'}`}
                  >
                    <p className="font-semibold">Pick up free</p>
                    <p className="mt-1 text-sm text-muted-foreground">{site.pickup.address}</p>
                  </button>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardHeader>
                <CardTitle className="text-xl">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email (for your receipt)</Label>
                  <Input
                    id="email"
                    type="email"
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
                      placeholder={site.contact.phone}
                      value={formData.phone}
                      onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                    />
                  </div>

                <div>
                  <Label htmlFor="address">
                    {fulfillment === 'pickup' ? 'Address (optional — for receipts)' : 'Address *'}
                  </Label>
                  <Input
                    id="address"
                    required={fulfillment === 'delivery'}
                    placeholder="Street address"
                    value={formData.address}
                    onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="city">City{fulfillment === 'delivery' ? ' *' : ''}</Label>
                    <Input
                      id="city"
                      required={fulfillment === 'delivery'}
                      value={formData.city}
                      onChange={(event) => setFormData({ ...formData, city: event.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State{fulfillment === 'delivery' ? ' *' : ''}</Label>
                    <Input
                      id="state"
                      required={fulfillment === 'delivery'}
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

            <Button type="submit" size="lg" className="h-11 w-full rounded-full" disabled={placing}>
              {placing ? 'Placing order…' : fulfillment === 'pickup' ? 'Place Pickup Order' : 'Place Order'}
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
                        <p className="text-sm font-semibold">{formatPrice(lineTotal(item))}</p>
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
                    <span className="text-muted-foreground">{fulfillment === 'pickup' ? 'Pickup' : 'Delivery (est.)'}</span>
                    <span className="font-semibold">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
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
