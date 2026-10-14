import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminApproveCustomer, adminListCustomers } from '@/lib/api';

export function CustomersTab() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: () => adminListCustomers(),
  });

  const approve = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) => adminApproveCustomer(id, approved),
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      toast.success(v.approved ? 'Wholesaler approved — bulk prices now apply for them' : 'Approval revoked');
    },
    onError: () => toast.error('Could not update customer'),
  });

  if (isLoading) return <p className="py-10 text-center text-sm text-muted-foreground">Loading customers…</p>;
  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">Couldn't load customers.</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }
  const pending = data.filter((c) => c.role === 'wholesaler' && !c.approved);
  const rest = data.filter((c) => !(c.role === 'wholesaler' && !c.approved));

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/80 bg-card p-5">
        <h2 className="font-semibold">Pending wholesale approvals ({pending.length})</h2>
        {!pending.length ? (
          <p className="mt-2 text-sm text-muted-foreground">Nothing waiting. New wholesale signups land here.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {pending.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 p-3">
                <div>
                  <p className="font-semibold">{c.businessName || c.email || c.phone}</p>
                  <p className="text-xs text-muted-foreground">{[c.email, c.phone].filter(Boolean).join(' · ')}</p>
                </div>
                <Button size="sm" onClick={() => approve.mutate({ id: c.id, approved: true })} disabled={approve.isPending}>
                  Approve wholesaler
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="overflow-x-auto rounded-2xl border border-border/80 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Approved</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rest.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <p className="font-medium">{c.businessName || c.email || c.phone}</p>
                  <p className="text-xs text-muted-foreground">{[c.email, c.phone].filter(Boolean).join(' · ')}</p>
                </TableCell>
                <TableCell><Badge variant="outline">{c.role}</Badge></TableCell>
                <TableCell>{c.approved ? 'Yes' : 'No'}</TableCell>
                <TableCell className="text-right">
                  {c.role === 'wholesaler' && (
                    <Button size="sm" variant="outline" onClick={() => approve.mutate({ id: c.id, approved: !c.approved })} disabled={approve.isPending}>
                      {c.approved ? 'Revoke' : 'Approve'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
