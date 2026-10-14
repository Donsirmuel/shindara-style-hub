import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { adminListCustomers, adminListOrders, adminListProducts } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { site } from '@/site.config';
import { OrdersTab } from './OrdersTab';
import { ProductsTab } from './ProductsTab';
import { CustomersTab } from './CustomersTab';
import { CategoriesTab } from './CategoriesTab';

function StatsStrip() {
  const { data: orders } = useQuery({ queryKey: ['admin-orders'], queryFn: adminListOrders });
  const { data: products } = useQuery({ queryKey: ['admin-products'], queryFn: adminListProducts });
  const { data: customers } = useQuery({ queryKey: ['admin-customers'], queryFn: () => adminListCustomers() });

  const pending = (orders ?? []).filter((o) => o.status === 'pending');
  const revenue = (orders ?? []).filter((o) => o.status === 'confirmed').reduce((s, o) => s + o.total, 0);
  const awaitingApproval = (customers ?? []).filter((c) => c.role === 'wholesaler' && !c.approved).length;
  const lowStock = (products ?? []).filter((p) => (p.minStock ?? Infinity) <= site.inventory.lowStockAt).length;

  const stats = [
    { label: 'Awaiting confirmation', value: String(pending.length) },
    { label: 'Confirmed revenue', value: formatPrice(revenue) },
    { label: 'Products live', value: String(products?.length ?? '—') },
    { label: 'Low-stock products', value: products ? String(lowStock) : '—' },
    { label: 'Wholesale approvals', value: String(awaitingApproval) },
  ];
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
      {stats.map((s) => (
        <Card key={s.label} className="border-border/80">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, isLoading, logout } = useAuth();
  const [tab, setTab] = useState('orders');

  if (isLoading) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Checking access…</p>;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-2xl border border-border/80 bg-card px-8 py-10 text-center">
          <h1 className="text-2xl font-bold">Admins only</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in with an admin account to manage the store.</p>
          <Button className="mt-5" onClick={() => navigate('/login')}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-2xl border border-border/80 bg-card px-8 py-10 text-center">
          <h1 className="text-2xl font-bold">No access</h1>
          <p className="mt-2 text-sm text-muted-foreground">This account can't open the dashboard.</p>
          <Button className="mt-5" variant="outline" onClick={() => navigate('/')}>Back to shop</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Dashboard</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Store Admin</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout.mutate(undefined, { onSuccess: () => navigate('/') })}
          >
            Sign out
          </Button>
        </div>

        <StatsStrip />

        <Tabs value={tab} onValueChange={setTab} className="mt-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>
          <TabsContent value="orders" className="mt-5"><OrdersTab /></TabsContent>
          <TabsContent value="products" className="mt-5"><ProductsTab /></TabsContent>
          <TabsContent value="categories" className="mt-5"><CategoriesTab /></TabsContent>
          <TabsContent value="customers" className="mt-5"><CustomersTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
