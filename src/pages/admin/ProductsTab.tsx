import { Fragment, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  adminAddVariant, adminCreateProduct, adminDeleteVariant, adminDuplicateProduct, adminListProducts,
  adminSetTiers, adminSetVariantStock, adminUpdateProduct, adminUploadImage, ApiError,
  type AdminProductInput,
} from '@/lib/api';
import { downloadCsv, toCsv } from '@/lib/csv';
import { useCategories, useProductDetail } from '@/hooks/useProducts';
import { formatPrice } from '@/lib/format';
import { site } from '@/site.config';
import { ConfirmButton } from '@/components/ConfirmButton';
import type { Product } from '@/lib/types';

const emptyForm: AdminProductInput = {
  name: '', description: '', gender: 'women', categoryId: '', basePrice: 0,
  images: [], featured: false, inStock: true,
};

interface PendingPhoto {
  file: File;
  preview: string;
}

/**
 * New photos preview instantly from memory and only upload when the vendor
 * hits Save — closing the dialog abandons them, so no orphan uploads pile
 * up on the VPS.
 */
function ImagePicker({
  images, pending, onChangeUrls, onAddFiles, onRemovePending,
}: {
  images: string[];
  pending: PendingPhoto[];
  onChangeUrls: (urls: string[]) => void;
  onAddFiles: (files: File[]) => void;
  onRemovePending: (preview: string) => void;
}) {
  const move = (index: number, dir: -1 | 1) => {
    const next = [...images];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    onChangeUrls(next);
  };
  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])].filter((f) => f.type.startsWith('image/')).slice(0, 8 - images.length - pending.length);
    if (files.length) onAddFiles(files);
    e.target.value = '';
  };
  return (
    <div>
      <Label>Images ({images.length + pending.length}) — first is the cover</Label>
      <Input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={pick} />
      {(!!images.length || !!pending.length) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {images.map((url, i) => (
            <div key={`${url}-${i}`} className="group relative">
              <img src={url} alt={i === 0 ? 'Cover photo' : `Photo ${i + 1}`} className={`h-16 w-14 rounded-md object-cover ${i === 0 ? 'ring-2 ring-accent' : ''}`} />
              {i === 0 && (
                <span className="absolute left-0.5 top-0.5 rounded bg-accent px-1 text-[10px] font-bold text-accent-foreground">COVER</span>
              )}
              <button
                type="button"
                onClick={() => onChangeUrls(images.filter((_, j) => j !== i))}
                className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-destructive-foreground group-hover:flex"
                title="Remove image"
              >
                ×
              </button>
              <div className="absolute bottom-0.5 left-0.5 hidden gap-0.5 group-hover:flex">
                {i > 0 && (
                  <button type="button" onClick={() => move(i, -1)} className="rounded bg-black/70 px-1 text-[11px] font-bold text-white" title="Move earlier (toward cover)">‹</button>
                )}
                {i === 0 && images.length > 1 && (
                  <span className="rounded bg-black/50 px-1 text-[10px] text-white">cover</span>
                )}
                {i < images.length - 1 && (
                  <button type="button" onClick={() => move(i, 1)} className="rounded bg-black/70 px-1 text-[11px] font-bold text-white" title="Move later">›</button>
                )}
              </div>
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => onChangeUrls([url, ...images.filter((_, j) => j !== i)])}
                  className="absolute bottom-0.5 right-0.5 hidden rounded bg-black/70 px-1 text-[10px] font-semibold text-white group-hover:block"
                  title="Make cover photo"
                >
                  cover
                </button>
              )}
            </div>
          ))}
          {pending.map((p) => (
            <div key={p.preview} className="group relative">
              <img src={p.preview} alt="New photo (not uploaded yet)" className="h-16 w-14 rounded-md object-cover opacity-80 ring-1 ring-dashed ring-accent" />
              <span className="absolute left-0.5 top-0.5 rounded bg-black/70 px-1 text-[10px] font-bold text-white">NEW</span>
              <button
                type="button"
                onClick={() => onRemovePending(p.preview)}
                className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-destructive-foreground group-hover:flex"
                title="Discard photo"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductFields({
  form, set, pending, onAddFiles, onRemovePending,
}: {
  form: AdminProductInput;
  set: (patch: Partial<AdminProductInput>) => void;
  pending: PendingPhoto[];
  onAddFiles: (files: File[]) => void;
  onRemovePending: (preview: string) => void;
}) {
  const { data: categories } = useCategories();
  return (
    <div className="space-y-4">
      <div><Label>Name</Label><Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ankara Midi Dress" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Gender</Label>
          <Select value={form.gender} onValueChange={(v) => set({ gender: v as AdminProductInput['gender'] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="women">Women</SelectItem>
              <SelectItem value="men">Men</SelectItem>
              <SelectItem value="unisex">Unisex</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Category</Label>
          <Select value={form.categoryId} onValueChange={(v) => set({ categoryId: v })}>
            <SelectTrigger><SelectValue placeholder="Pick…" /></SelectTrigger>
            <SelectContent>
              {(categories ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.gender})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Price ({site.currency})</Label><Input type="number" min={0} value={form.basePrice} onChange={(e) => set({ basePrice: Number(e.target.value) })} /></div>
        <div><Label>Was price ({site.currency}, optional)</Label><Input type="number" min={0} value={form.originalPrice ?? ''} placeholder="—" onChange={(e) => set({ originalPrice: e.target.value ? Number(e.target.value) : null })} /></div>
      </div>
      <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => set({ description: e.target.value })} rows={3} /></div>
      <ImagePicker
        images={form.images ?? []}
        pending={pending}
        onChangeUrls={(images) => set({ images })}
        onAddFiles={onAddFiles}
        onRemovePending={onRemovePending}
      />
      <div className="flex flex-wrap gap-5">
        <div className="flex items-center gap-2">
          <Checkbox id="pf-featured" checked={!!form.featured} onCheckedChange={(v) => set({ featured: v === true })} />
          <Label htmlFor="pf-featured">Featured on homepage</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="pf-instock" checked={form.inStock !== false} onCheckedChange={(v) => set({ inStock: v === true })} />
          <Label htmlFor="pf-instock">In stock (visible for sale)</Label>
        </div>
      </div>
    </div>
  );
}

/** Create + edit share one dialog. Edit also manages variants and tiers below. */
function ProductDialog({ product, onSaved }: { product?: Product; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AdminProductInput>(emptyForm);
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const set = (patch: Partial<AdminProductInput>) => setForm((f) => ({ ...f, ...patch }));
  const editing = !!product;

  useEffect(() => {
    if (open && product) {
      setForm({
        name: product.name,
        description: product.description,
        gender: product.gender,
        categoryId: product.category,
        basePrice: product.price,
        originalPrice: product.originalPrice ?? null,
        images: product.images,
        featured: !!product.featured,
        inStock: product.inStock,
      });
    } else if (open) {
      setForm(emptyForm);
    }
    // Fresh pending tray every open; previews are revoked below on close.
    setPending([]);
  }, [open, product]);

  useEffect(() => {
    if (!open) pending.forEach((p) => URL.revokeObjectURL(p.preview));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  const save = useMutation({
    mutationFn: async () => {
      // Upload first so a failed upload never saves a product with dead URLs.
      let images = form.images ?? [];
      if (pending.length) {
        const uploaded: string[] = [];
        for (const p of pending) {
          uploaded.push(await adminUploadImage(p.file));
        }
        images = [...images, ...uploaded];
      }
      const payload = { ...form, images };
      if (editing) await adminUpdateProduct(product!.id, payload);
      else await adminCreateProduct(payload);
    },
    onSuccess: () => {
      toast.success(editing ? 'Product updated' : 'Product created with a default variant — set sizes, stock and tiers in Edit');
      if (!editing) setOpen(false);
      onSaved();
    },
    onError: (e: unknown) => {
      toast.error(e instanceof ApiError ? 'Upload failed (jpg/png/webp, max 5MB) — fix the photos and retry.' : 'Could not save — check the fields');
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editing ? (
          <Button size="sm" variant="outline">Edit</Button>
        ) : (
          <Button>Add Product</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{editing ? `Edit — ${product!.name}` : 'New product'}</DialogTitle></DialogHeader>
        <div className="space-y-5">
          <ProductFields
            form={form}
            set={set}
            pending={pending}
            onAddFiles={(files) => setPending((prev) => [...prev, ...files.map((file) => ({ file, preview: URL.createObjectURL(file) }))])}
            onRemovePending={(preview) => setPending((prev) => {
              const target = prev.find((p) => p.preview === preview);
              if (target) URL.revokeObjectURL(target.preview);
              return prev.filter((p) => p.preview !== preview);
            })}
          />
          <Button
            className="w-full"
            disabled={!form.name || !form.categoryId || !form.basePrice || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? (pending.length ? `Uploading ${pending.length} photo${pending.length > 1 ? 's' : ''}…` : 'Saving…') : editing ? 'Save changes' : 'Create product'}
          </Button>
          {editing && (
            <div className="space-y-5 border-t border-border/80 pt-5">
              <VariantsManager productId={product!.id} />
              <TiersEditor productId={product!.id} basePrice={product!.price} initialTiers={product!.tiers ?? []} onSaved={onSaved} />
            </div>
          )}
          {!editing && (
            <p className="text-xs text-muted-foreground">Creating adds one placeholder size at 0 stock — open Edit afterwards to add real sizes, stock and bulk tiers.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function VariantsManager({ productId }: { productId: string }) {
  const queryClient = useQueryClient();
  const { data } = useProductDetail(productId);
  const variants = data?.variants ?? [];
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [stock, setStock] = useState('10');
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['product', productId] });
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
  };

  const setVariantStock = useMutation({
    mutationFn: ({ id, next }: { id: string; next: number }) => adminSetVariantStock(id, next),
    onSuccess: refresh,
    onError: () => toast.error('Could not update stock'),
  });
  const addVariant = useMutation({
    mutationFn: () => adminAddVariant(productId, size.trim(), color.trim(), Number(stock) || 0),
    onSuccess: () => {
      setSize(''); setColor(''); setStock('10');
      toast.success('Variant added');
      refresh();
    },
    onError: () => toast.error('Could not add variant'),
  });
  const removeVariant = useMutation({
    mutationFn: (id: string) => adminDeleteVariant(id),
    onSuccess: () => {
      toast.success('Variant removed');
      refresh();
    },
    onError: (e: unknown) => {
      if (e instanceof ApiError && e.status === 409) {
        toast.error('Ordered before — set stock to 0 instead of deleting.');
      } else {
        toast.error('Could not remove variant');
      }
    },
  });

  return (
    <div className="space-y-2 rounded-xl border border-border/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Sizes & stock ({variants.reduce((s, v) => s + v.stock, 0)} total)
      </p>
      {variants.map((v) => (
        <div key={v.id} className="flex items-center gap-2 text-sm">
          <span className="min-w-0 flex-1 truncate font-medium">{v.size} / {v.color}</span>
          <Button size="icon" variant="ghost" className="h-7 w-7" disabled={v.stock <= 0} onClick={() => setVariantStock.mutate({ id: v.id, next: v.stock - 1 })}>
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className={`w-12 text-center font-semibold ${v.stock === 0 ? 'text-destructive' : v.stock < 5 ? 'text-amber-600' : ''}`}>
            {v.stock}
          </span>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setVariantStock.mutate({ id: v.id, next: v.stock + 1 })}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <ConfirmButton
            title={`Remove ${v.size} / ${v.color}?`}
            message="The variant disappears from the shop. Past orders keep their records."
            confirmLabel="Remove"
            busy={removeVariant.isPending}
            onConfirm={() => removeVariant.mutate(v.id)}
          >
            <Button size="sm" variant="ghost" className="text-destructive">Remove</Button>
          </ConfirmButton>
        </div>
      ))}
      <div className="flex flex-wrap items-end gap-2 border-t border-border/70 pt-2">
        <div><Label className="text-xs">Size</Label><Input className="h-8 w-20" placeholder="XL" value={size} onChange={(e) => setSize(e.target.value)} /></div>
        <div><Label className="text-xs">Color</Label><Input className="h-8 w-28" placeholder="Wine" value={color} onChange={(e) => setColor(e.target.value)} /></div>
        <div><Label className="text-xs">Stock</Label><Input className="h-8 w-20" type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} /></div>
        <Button size="sm" variant="outline" disabled={!size.trim() || !color.trim() || addVariant.isPending} onClick={() => addVariant.mutate()}>
          Add
        </Button>
      </div>
    </div>
  );
}

function TiersEditor({ productId, basePrice, initialTiers, onSaved }: { productId: string; basePrice: number; initialTiers: Product['tiers']; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState(
    (initialTiers ?? []).map((t) => ({ minQty: String(t.minQty), price: String(t.price) })),
  );
  const [error, setError] = useState<string | null>(null);

  const validate = (input: Array<{ minQty: string; price: string }>): Array<{ minQty: number; price: number }> | null => {
    const parsed = input.map((r) => ({ minQty: Number(r.minQty), price: Number(r.price) }));
    if (parsed.some((r) => !Number.isInteger(r.minQty) || r.minQty < 2)) {
      setError('Every tier needs a whole minimum quantity of 2 or more.');
      return null;
    }
    if (parsed.some((r) => !Number.isFinite(r.price) || r.price <= 0)) {
      setError('Every tier needs a price above ₦0.');
      return null;
    }
    // A "bulk discount" above the retail price is a surcharge — reject it.
    const overpriced = parsed.find((r) => r.price >= basePrice);
    if (overpriced) {
      setError(`Bulk must beat retail (${formatPrice(basePrice)}): ${formatPrice(overpriced.price)} at ${overpriced.minQty}+ doesn't.`);
      return null;
    }
    const seen = new Set<number>();
    for (const r of parsed) {
      if (seen.has(r.minQty)) {
        setError(`Two tiers start at ${r.minQty} pcs — keep one.`);
        return null;
      }
      seen.add(r.minQty);
    }
    setError(null);
    return parsed;
  };

  const save = useMutation({
    mutationFn: () => {
      const valid = validate(rows);
      if (!valid) throw new Error('validation');
      return adminSetTiers(productId, valid);
    },
    onSuccess: () => {
      toast.success('Bulk tiers saved');
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      onSaved();
    },
    onError: (e: unknown) => {
      if (e instanceof Error && e.message === 'validation') return; // message already shown inline
      toast.error('Could not save tiers');
    },
  });

  return (
    <div className="space-y-2 rounded-xl border border-border/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bulk tiers (min qty → price each)</p>
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            type="number" min={2} placeholder={`e.g. ${site.bulk.defaultMOQ}`} value={row.minQty}
            onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, minQty: e.target.value } : r)))}
          />
          <Input
            type="number" min={1} placeholder="Price each" value={row.price}
            onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, price: e.target.value } : r)))}
          />
          <Button size="sm" variant="ghost" onClick={() => setRows(rows.filter((_, j) => j !== i))}>x</Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setRows([...rows, { minQty: String(site.bulk.defaultMOQ), price: String(basePrice) }])}>
          Add tier
        </Button>
        <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>Save tiers</Button>
      </div>
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

export function ProductsTab() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['admin-products'], queryFn: adminListProducts });
  const [search, setSearch] = useState('');
  const [restockOnly, setRestockOnly] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const refresh = () => {
    setSelected([]);
    // Shop grids cache the same rows under ['products', ...].
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };
  const duplicate = useMutation({
    mutationFn: (id: string) => adminDuplicateProduct(id),
    onSuccess: () => {
      toast.success('Duplicated as a hidden draft — search "(Copy)" to review, restock, then unhide it.');
      refresh();
    },
    onError: () => toast.error('Could not duplicate product'),
  });
  const isLow = (p: { minStock?: number }) => (p.minStock ?? Infinity) <= site.inventory.lowStockAt;
  const visible = (data ?? []).filter((p) => {
    if (restockOnly && !isLow(p)) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${p.name} ${p.id} ${p.category}`.toLowerCase().includes(q);
  });
  const lowCount = (data ?? []).filter(isLow).length;

  const exportCsv = () => {
    if (!visible.length) {
      toast.info('Nothing to export with the current filter.');
      return;
    }
    downloadCsv(
      `products-${new Date().toISOString().slice(0, 10)}`,
      toCsv(
        ['id', 'name', 'price', 'category', 'gender', 'visible', 'featured', 'stock_total', 'min_stock', 'bulk_tiers'],
        visible.map((p) => [
          p.id, p.name, p.price, p.category, p.gender,
          p.inStock ? 'yes' : 'no', p.featured ? 'yes' : 'no',
          p.stockTotal ?? '', p.minStock ?? '',
          (p.tiers ?? []).map((t) => `${t.minQty}+@${t.price}`).join(' '),
        ]),
      ),
    );
    toast.success(`Exported ${visible.length} products.`);
  };

  const bulkSet = useMutation({
    mutationFn: async (patch: { featured?: boolean; inStock?: boolean }) => {
      await Promise.all(selected.map((id) => adminUpdateProduct(id, patch)));
    },
    onSuccess: (_d, patch) => {
      toast.success(
        patch.featured === true ? `${selected.length} marked featured`
        : patch.featured === false ? `${selected.length} unfeatured`
        : patch.inStock === false ? `${selected.length} hidden from shop`
        : `${selected.length} made visible`,
      );
      refresh();
    },
    onError: () => toast.error('Bulk update hit an error — some items may have changed. Reloading.'),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="max-w-xs"
          />
          <Button
            size="sm"
            variant={restockOnly ? 'default' : 'outline'}
            className="rounded-full"
            onClick={() => setRestockOnly(!restockOnly)}
          >
            Needs restock{lowCount > 0 ? ` (${lowCount})` : ''}
          </Button>
        </div>
        <ProductDialog onSaved={refresh} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={exportCsv}>Export CSV</Button>
        {selected.length > 0 && (
          <>
            <span className="text-xs font-semibold text-muted-foreground">{selected.length} selected</span>
            <Button size="sm" variant="outline" disabled={bulkSet.isPending} onClick={() => bulkSet.mutate({ featured: true })}>Feature</Button>
            <Button size="sm" variant="outline" disabled={bulkSet.isPending} onClick={() => bulkSet.mutate({ featured: false })}>Unfeature</Button>
            <Button size="sm" variant="outline" disabled={bulkSet.isPending} onClick={() => bulkSet.mutate({ inStock: true })}>Unhide</Button>
            <ConfirmButton
              title={`Hide ${selected.length} products?`}
              message="They leave the shop immediately but stay editable here, with history intact."
              confirmLabel="Hide all"
              busy={bulkSet.isPending}
              onConfirm={() => bulkSet.mutate({ inStock: false })}
            >
              <Button size="sm" variant="ghost" className="text-destructive">Hide</Button>
            </ConfirmButton>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Clear</Button>
          </>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{data ? `${visible.length} of ${data.length} products` : ' '}</p>
      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading products…</p>
      ) : isError || !data ? (
        <div className="rounded-2xl border border-border/80 bg-card px-6 py-12 text-center">
          <Button variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={visible.length > 0 && visible.every((p) => selected.includes(p.id))}
                    onCheckedChange={(v) => setSelected(v === true ? visible.map((p) => p.id) : [])}
                    aria-label="Select all listed products"
                  />
                </TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Bulk</TableHead>
                <TableHead className="text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(p.id)}
                      onCheckedChange={(v) => setSelected(v === true ? [...selected, p.id] : selected.filter((id) => id !== p.id))}
                      aria-label={`Select ${p.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {p.images[0] && <img src={p.images[0]} alt="" className="h-10 w-9 rounded-md object-cover" />}
                      <div>
                        <p className="font-medium">
                          {p.name}{' '}
                          {!p.inStock && <Badge variant="secondary">hidden</Badge>}{' '}
                          {p.featured && <Badge variant="outline">featured</Badge>}{' '}
                          {(p.minStock ?? Infinity) <= site.inventory.lowStockAt && (
                            <Badge variant="destructive">low stock{p.minStock === 0 ? ' — out in a variant' : ` (min ${p.minStock})`}</Badge>
                          )}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">{p.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatPrice(p.price)}</TableCell>
                  <TableCell>
                    {(p.tiers?.length ?? 0) > 0 ? (
                      <Badge variant="outline">{p.tiers!.map((t) => `${t.minQty}+ @ ${formatPrice(t.price)}`).join(' · ')}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">retail only</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="ghost" disabled={duplicate.isPending} onClick={() => duplicate.mutate(p.id)}>
                        Duplicate
                      </Button>
                      <ProductDialog product={p} onSaved={refresh} />
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
