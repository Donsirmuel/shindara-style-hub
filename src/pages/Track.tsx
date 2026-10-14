import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ApiError, createOrderPayment, markOrderPaid, trackOrder, type TrackedOrder } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { site } from '@/site.config';

const STAGES = ['pending', 'confirmed', 'ready', 'completed'] as const;
const STAGE_LABEL: Record<string, string> = {
  pending: 'Reserved',
  confirmed: 'Confirmed',
  ready: 'Packed & ready',
  completed: 'Collected',
  cancelled: 'Cancelled',
};

export function PaymentCta({ order, phone, onPaid }: { order: TrackedOrder; phone: string; onPaid: (payment: TrackedOrder['payment']) => void }) {
  const [busy, setBusy] = useState(false);
  if (order.payment === 'paid') {
    return <p className="text-sm font-semibold text-green-700">Paid — thank you!</p>;
  }
  if (order.payment === 'paid_pending') {
    return <p className="text-sm text-muted-foreground">Transfer noted — the vendor will confirm when it lands.</p>;
  }
  return (
    <Button
      variant="outline"
      className="h-10 rounded-full"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const res = await markOrderPaid(order.ref, phone);
          onPaid(res.payment as TrackedOrder['payment']);
          toast.success('Noted! Show your transfer receipt at the counter.');
        } catch (e) {
          toast.error(e instanceof ApiError && e.status === 403 ? 'Phone number does not match this order.' : 'Could not update. Try again.');
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? 'Saving…' : "I've sent the transfer"}
    </Button>
  );
}

export default function Track() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [ref, setRef] = useState(() => searchParams.get('ref') ?? '');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [looking, setLooking] = useState(false);
  const [paying, setPaying] = useState(false);
  // Bachs redirects back here (?ref=..&paid=1) after a completed checkout.
  // The webhook is the source of truth, but celebrate loudly when it landed.
  const justPaid = searchParams.get('paid') === '1' && order?.payment === 'paid';

  const lookup = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!ref.trim() || !phone.trim()) {
      toast.error('Enter your order ref and phone number.');
      return;
    }
    setLooking(true);
    try {
      const found = await trackOrder(ref, phone);
      setOrder(found);
      // Keep the ref in the URL so Bachs redirects land prefilled.
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('ref', found.ref);
        return next;
      }, { replace: true });
    } catch (e) {
      setOrder(null);
      toast.error(e instanceof ApiError && e.status === 404 ? 'No order matches that ref + phone.' : 'Could not reach the server.');
    } finally {
      setLooking(false);
    }
  };

  const payNow = async () => {
    if (!order || !phone.trim()) return;
    setPaying(true);
    try {
      const { url } = await createOrderPayment(order.ref, phone);
      window.location.href = url;
    } catch (e) {
      if (e instanceof ApiError && e.status === 501) {
        toast.info('Online payment is not enabled on this store yet — pay at pickup or by transfer.');
      } else {
        toast.error('Could not start online payment. Try again or pay at pickup.');
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-xl space-y-5">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-2xl">Track your order</CardTitle>
            <p className="text-sm text-muted-foreground">Enter the ref from your receipt (e.g. SH-482913) plus the phone number you ordered with.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={lookup} className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <Label htmlFor="track-ref" className="sr-only">Order ref</Label>
                <Input id="track-ref" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="SH-482913" className="font-mono uppercase" />
              </div>
              <div className="flex-1">
                <Label htmlFor="track-phone" className="sr-only">Phone</Label>
                <Input id="track-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="080…" inputMode="tel" />
              </div>
              <Button type="submit" disabled={looking}>{looking ? '…' : 'Find'}</Button>
            </form>
          </CardContent>
        </Card>

        {order && (
          <Card className="border-border/80">
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-xl font-bold">{order.ref}</p>
                <div className="flex gap-1.5">
                  <Badge variant={order.fulfillment === 'pickup' ? 'secondary' : 'outline'}>
                    {order.fulfillment === 'pickup' ? 'Pickup' : 'Delivery'}
                  </Badge>
                  <Badge variant={order.status === 'cancelled' ? 'secondary' : 'default'}>
                    {STAGE_LABEL[order.status] ?? order.status}
                  </Badge>
                </div>
              </div>

              {order.status !== 'cancelled' && (
                <ol className="flex items-center gap-1">
                  {STAGES.map((stage, i) => {
                    const reached = STAGES.indexOf(order.status as typeof STAGES[number]) >= i;
                    return (
                      <li key={stage} className="flex flex-1 items-center gap-1 last:flex-none">
                        <span className={`h-2 flex-1 rounded-full ${reached ? 'bg-accent' : 'bg-secondary'}`} />
                      </li>
                    );
                  })}
                </ol>
              )}

              <div className="space-y-1.5">
                {order.items.map((item) => (
                  <div key={`${item.productId}-${item.qty}`} className="flex justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">{item.productName} × {item.qty}</span>
                    <span className="font-semibold">{formatPrice(item.unitPrice * item.qty)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total due</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              {order.fulfillment === 'pickup' && (
                <p className="text-sm text-muted-foreground">Pick up at {site.pickup.address}. Show this ref at the counter.</p>
              )}
              {justPaid && (
                <p className="rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-700">
                  Payment received — your order is confirmed. Show this ref at the counter.
                </p>
              )}
              {order.payment === 'unpaid' && order.status !== 'cancelled' && (
                <Button className="h-10 w-full rounded-full" disabled={paying} onClick={payNow}>
                  {paying ? 'Opening secure payment…' : `Pay ${formatPrice(order.total)} now`}
                </Button>
              )}
              <PaymentCta order={order} phone={phone} onPaid={(payment) => setOrder((prev) => (prev ? { ...prev, payment } : prev))} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
