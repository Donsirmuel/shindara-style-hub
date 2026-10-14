import { Fragment, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  adminGetOrder, adminListOrders, adminSetOrderPayment, adminSetOrderStatus,
  type AdminOrder, type OrderPayment, type OrderStatus,
} from '@/lib/api';
import { customerWhatsAppLink, formatPrice } from '@/lib/format';
import { site } from '@/site.config';
import { ConfirmButton } from '@/components/ConfirmButton';

function contactLine(order: AdminOrder): string {
  try {
    const c = JSON.parse(order.contactJson) as { firstName?: string; lastName?: string; phone?: string; address?: string };
    return `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() + (c.phone ? ` · ${c.phone}` : '') + (c.address ? ` · ${c.address}` : '');
  } catch {
    return '';
  }
}

function contactPhone(order: AdminOrder): string {
  try {
    return (JSON.parse(order.contactJson) as { phone?: string }).phone ?? '';
  } catch {
    return '';
  }
}

function contactLines(order: AdminOrder): string[] {
  try {
    const c = JSON.parse(order.contactJson) as Record<string, string>;
    const name = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
    const addr = [c.address, c.city, c.state, c.zipCode].filter(Boolean).join(', ');
    return [
      [name, c.phone].filter(Boolean).join(' · '),
      c.email || '',
      addr,
      c.note ? `Note: ${c.note}` : '',
    ].filter(Boolean);
  } catch {
    return [];
  }
}

const statusVariant = (s: OrderStatus) =>
  s === 'completed' ? 'default' : s === 'confirmed' || s === 'ready' ? 'outline' : 'secondary';

const paymentLabel = (p: OrderPayment) =>
  p === 'paid' ? 'Paid' : p === 'paid_pending' ? 'Paid? confirm' : 'Unpaid';

type StatusFilter = 'all' | OrderStatus;

/** Next counter action for an order, or null when terminal. */
function nextAction(order: AdminOrder): { status: OrderStatus; label: string } | null {
  if (order.status === 'pending') return { status: 'confirmed', label: 'Confirm' };
  if (order.status === 'confirmed') return { status: 'ready', label: 'Mark ready' };
  if (order.status === 'ready') {
    return { status: 'completed', label: order.fulfillment === 'pickup' ? 'Mark collected' : 'Mark delivered' };
  }
  return null;
}

function OrderDetail({ id }: { id: string }) {
  const { data, isLoading, isError } = useQuery({ queryKey: ['admin-order', id], queryFn: () => adminGetOrder(id) });
  if (isLoading) return <p className="py-4 text-center text-sm text-muted-foreground">Loading order…</p>;
  if (isError || !data) return <p className="py-4 text-center text-sm text-muted-foreground">Couldn't load this order.</p>;
  return (
    <div className="grid gap-4 p-4 md:grid-cols-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items to pack</p>
        <div className="mt-2 space-y-1.5">
          {data.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">
                {item.productName} <span className="text-muted-foreground">× {item.qty}</span>
              </span>
              <span className="font-semibold">{formatPrice(item.unitPrice * item.qty)}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-right text-sm font-bold">Total {formatPrice(data.order.total)}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {data.order.fulfillment === 'pickup' ? 'Pickup by' : 'Deliver to'}
        </p>
        <div className="mt-2 space-y-0.5 text-sm">
          {contactLines(data.order).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export function OrdersTab() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['admin-orders'], queryFn: adminListOrders });
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const invalidate = (id?: string) => {
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    // The expanded detail row caches under ['admin-order', id].
    if (id) queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
  };

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => adminSetOrderStatus(id, status),
    onSuccess: (_data, vars) => {
      invalidate(vars.id);
      toast.success('Order updated');
    },
    onError: () => toast.error('Could not update order'),
  });

  const setPayment = useMutation({
    mutationFn: ({ id, payment }: { id: string; payment: OrderPayment }) => adminSetOrderPayment(id, payment),
    onSuccess: (_data, vars) => {
      invalidate(vars.id);
      toast.success('Payment updated');
    },
    onError: () => toast.error('Could not update payment'),
  });

  if (isLoading) return <p className="py-10 text-center text-sm text-muted-foreground">Loading orders…</p>;
  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">Couldn't load orders.</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }
  if (!data.length) return <p className="py-10 text-center text-sm text-muted-foreground">No orders yet. New checkout orders appear here.</p>;

  const q = search.trim().toLowerCase();
  const searched = q
    ? data.filter((o) => o.id.toLowerCase().includes(q) || contactPhone(o).toLowerCase().includes(q))
    : data;
  const filtered = filter === 'all' ? searched : searched.filter((o) => o.status === filter);
  const pending = data.filter((o) => o.status === 'pending').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ref or phone — e.g. SH-482913"
          className="max-w-xs font-mono"
        />
        {(['all', 'pending', 'confirmed', 'ready', 'completed', 'cancelled'] as const).map((s) => (
          <Button key={s} size="sm" variant={filter === s ? 'default' : 'outline'} className="rounded-full capitalize" onClick={() => setFilter(s)}>
            {s}{s === 'pending' && pending > 0 ? ` (${pending})` : ''}
          </Button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Get it</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((order) => {
              const advance = nextAction(order);
              return (
                <Fragment key={order.id}>
                  <TableRow>
                    <TableCell>
                      <button type="button" className="font-mono font-semibold underline decoration-dotted" onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                        {order.id}
                      </button>
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-sm">{contactLine(order) || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={order.fulfillment === 'pickup' ? 'secondary' : 'outline'}>
                        {order.fulfillment === 'pickup' ? 'Pickup' : 'Delivery'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatPrice(order.total)}</TableCell>
                    <TableCell>
                      <Badge variant={order.payment === 'paid' ? 'default' : order.payment === 'paid_pending' ? 'outline' : 'secondary'}>
                        {paymentLabel(order.payment)}
                      </Badge>
                    </TableCell>
                    <TableCell><Badge variant={statusVariant(order.status)}>{order.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        {(() => {
                          const notifyUrl = customerWhatsAppLink(
                            contactPhone(order),
                            `Hello from ${site.brand}! Your order ${order.id} (${formatPrice(order.total)}) is ${order.status}${order.fulfillment === 'pickup' ? `. Pick up at ${site.pickup.address}` : ', and will be delivered soon'}.`,
                          );
                          return notifyUrl ? (
                            <Button size="sm" variant="outline" asChild title="Notify customer on WhatsApp">
                              <a href={notifyUrl} target="_blank" rel="noreferrer">
                                <MessageCircle className="h-4 w-4" />
                              </a>
                            </Button>
                          ) : null;
                        })()}
                        {order.payment !== 'paid' && (
                          <Button size="sm" variant="outline" onClick={() => setPayment.mutate({ id: order.id, payment: 'paid' })} disabled={setPayment.isPending}>
                            Mark paid
                          </Button>
                        )}
                        {advance && (
                          <Button size="sm" onClick={() => setStatus.mutate({ id: order.id, status: advance.status })} disabled={setStatus.isPending}>
                            {advance.label}
                          </Button>
                        )}
                        {order.status === 'pending' && (
                          <ConfirmButton
                            title={`Cancel order ${order.id}?`}
                            message="Its items return to stock automatically."
                            confirmLabel="Cancel order"
                            busy={setStatus.isPending}
                            onConfirm={() => setStatus.mutate({ id: order.id, status: 'cancelled' })}
                          >
                            <Button size="sm" variant="ghost">Cancel</Button>
                          </ConfirmButton>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {expanded === order.id && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-secondary/30 p-0">
                        <OrderDetail id={order.id} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
