import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  adminCreateCategory, adminDeleteCategory, adminRenameCategory, ApiError,
} from '@/lib/api';
import { useCategories } from '@/hooks/useProducts';
import { ConfirmButton } from '@/components/ConfirmButton';

function CategoryDialog({ id, currentName, onSaved }: { id?: string; currentName?: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName ?? '');
  const [gender, setGender] = useState<'men' | 'women' | 'all'>('women');
  const editing = !!id;

  const save = useMutation({
    mutationFn: async () => {
      if (editing) await adminRenameCategory(id!, name.trim());
      else await adminCreateCategory(name.trim(), gender);
    },
    onSuccess: () => {
      toast.success(editing ? 'Category renamed' : 'Category added');
      setOpen(false);
      setName('');
      onSaved();
    },
    onError: () => toast.error('Could not save category'),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && currentName) setName(currentName); }}>
      <DialogTrigger asChild>
        {editing ? <Button size="sm" variant="outline">Rename</Button> : <Button>Add Category</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{editing ? 'Rename category' : 'New category'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aso-Ebi" />
          </div>
          {!editing && (
            <div>
              <Label>Shows under</Label>
              <Select value={gender} onValueChange={(v) => setGender(v as typeof gender)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="women">Women</SelectItem>
                  <SelectItem value="men">Men</SelectItem>
                  <SelectItem value="all">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <Button className="w-full" disabled={name.trim().length < 2 || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? 'Saving…' : editing ? 'Save' : 'Add category'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CategoriesTab() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useCategories();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
  };

  const remove = useMutation({
    mutationFn: (id: string) => adminDeleteCategory(id),
    onSuccess: () => {
      toast.success('Category deleted');
      refresh();
    },
    onError: (e: unknown) => {
      if (e instanceof ApiError && e.status === 409) {
        toast.error('In use — move its products to another category first.');
      } else {
        toast.error('Could not delete category');
      }
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data ? `${data.length} categories` : ' '}</p>
        <CategoryDialog onSaved={refresh} />
      </div>
      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading categories…</p>
      ) : isError || !data ? (
        <div className="rounded-2xl border border-border/80 bg-card px-6 py-12 text-center">
          <Button variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Shows under</TableHead>
                <TableHead className="text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="font-medium">{c.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{c.id}</p>
                  </TableCell>
                  <TableCell><Badge variant="outline">{c.gender}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <CategoryDialog id={c.id} currentName={c.name} onSaved={refresh} />
                      <ConfirmButton
                        title={`Delete "${c.name}"?`}
                        message="Only empty categories can go. Move its products elsewhere first."
                        confirmLabel="Delete"
                        busy={remove.isPending}
                        onConfirm={() => remove.mutate(c.id)}
                      >
                        <Button size="sm" variant="ghost" className="text-destructive">Delete</Button>
                      </ConfirmButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
