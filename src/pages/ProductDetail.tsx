import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Minus, Plus, ZoomIn } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { StarRating } from '@/components/StarRating';
import { useProductDetail } from '@/hooks/useProducts';
import { formatPrice, tierPriceFor } from '@/lib/format';
import { site } from '@/site.config';
import { Product } from '@/lib/types';
import { resolveImageUrl } from '@/utils/imageResolver';
import { toast } from 'sonner';

interface ProductDetailProps {
  onAddToCart: (product: Product, size: string, color: string, quantity: number) => void;
}

export default function ProductDetail({ onAddToCart }: ProductDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useProductDetail(id);
  const product = data?.product;
  const apiVariants = useMemo(() => data?.variants ?? [], [data]);
  const tiers = useMemo(() => data?.tiers ?? [], [data]);

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  const resolvedImages = useMemo(() => {
    if (!product) {
      return [];
    }
    return product.images.map((image) => resolveImageUrl(image));
  }, [product]);

  // Prefer live variant sizes/colors from the API; fall back to product fields (static demo).
  const sizes = useMemo(
    () => (apiVariants.length ? [...new Set(apiVariants.map((v) => v.size))] : (product?.sizes ?? [])),
    [apiVariants, product],
  );
  const colors = useMemo(
    () => (apiVariants.length ? [...new Set(apiVariants.map((v) => v.color))] : (product?.colors ?? [])),
    [apiVariants, product],
  );
  const selectedVariant = apiVariants.find((v) => v.size === selectedSize && v.color === selectedColor);
  const selectedStock = selectedVariant ? selectedVariant.stock : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8 sm:py-10">
        <div className="mx-auto grid max-w-6xl animate-pulse gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:gap-12 lg:px-8">
          <div className="aspect-[4/5] rounded-2xl bg-secondary" />
          <div className="space-y-4 rounded-2xl border border-border/80 bg-card p-6 sm:p-8">
            <div className="h-8 w-2/3 rounded bg-secondary" />
            <div className="h-6 w-1/3 rounded bg-secondary" />
            <div className="h-24 rounded bg-secondary" />
            <div className="h-11 rounded-full bg-secondary" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-2xl border border-border/80 bg-card px-8 py-10 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">The item may have moved or been removed.</p>
          <Button className="mt-5" onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const currentImage = resolvedImages[selectedImage] ?? '';
  const unitPrice = tierPriceFor(quantity, product.price, tiers);
  const bulkActive = unitPrice < product.price;
  const sortedTiers = [...tiers].sort((a, b) => a.minQty - b.minQty);
  const nextTier = sortedTiers.find((t) => t.minQty > quantity) ?? null;
  // Only the tier actually setting the price gets the badge — with several
  // qualified tiers, cheaper-higher ones would otherwise all shout "yours".
  const pricedTier = bulkActive ? sortedTiers.filter((t) => quantity >= t.minQty && t.price === unitPrice).pop() ?? null : null;
  // Before a variant is picked, fall back to catalog rollups so an
  // all-sold-out product never claims "In Stock".
  const overallOut = (product.stockTotal ?? Infinity) === 0 || (!product.inStock && selectedStock == null);

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      toast.error('Choose size and color before adding to cart.');
      return;
    }
    if (selectedStock != null && selectedStock <= 0) {
      toast.error('That size/color is out of stock.');
      return;
    }
    if (selectedStock != null && quantity > selectedStock) {
      toast.error(`Only ${selectedStock} left in ${selectedSize} / ${selectedColor}.`);
      return;
    }
    onAddToCart(product, selectedSize, selectedColor, quantity);
    toast.success('Added to cart');
  };

  return (
    <div className="min-h-screen bg-background py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-6 px-0 text-sm font-semibold" onClick={() => navigate(-1)}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to shop
        </Button>

        <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:gap-12">
          <section className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card">
              <img
                src={currentImage}
                alt={product.name}
                className="aspect-[4/5] w-full cursor-zoom-in object-cover"
                onClick={() => setZoomOpen(true)}
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-4"
                onClick={() => setZoomOpen(true)}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              {discount > 0 && (
                <Badge className="absolute left-4 top-4 bg-destructive text-destructive-foreground">-{discount}%</Badge>
              )}
            </div>

            {resolvedImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                {resolvedImages.map((image, index) => (
                  <button
                    key={`${product.id}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(index)}
                    className={`overflow-hidden rounded-xl border-2 transition-colors ${
                      selectedImage === index ? 'border-accent' : 'border-border/70'
                    }`}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              {product.gender === 'women' ? 'Women' : 'Men'}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{product.name}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {product.rating ? (
                <div className="flex items-center gap-2">
                  <StarRating rating={product.rating} />
                  <span className="text-sm text-muted-foreground">
                    ({product.reviewCount || 0} reviews)
                  </span>
                </div>
              ) : null}
              <Badge variant={product.inStock && !overallOut ? 'outline' : 'secondary'}>
                {selectedStock != null
                  ? selectedStock > 0
                    ? `${selectedStock} left in ${selectedSize} / ${selectedColor}`
                    : 'Out of stock in this variant'
                  : overallOut
                    ? 'Out of Stock'
                    : (product.minStock != null && product.minStock <= site.inventory.lowStockAt)
                      ? `Only ${product.minStock} left in some sizes`
                      : 'In Stock'}
              </Badge>
            </div>

            <div className="mt-5 flex items-end gap-3 border-b border-border/80 pb-5">
              <p className="text-3xl font-bold">{formatPrice(bulkActive ? unitPrice : product.price)}</p>
              {bulkActive ? (
                <p className="text-lg text-muted-foreground line-through">{formatPrice(product.price)}</p>
              ) : product.originalPrice ? (
                <p className="text-lg text-muted-foreground line-through">{formatPrice(product.originalPrice)}</p>
              ) : null}
              {bulkActive && (
                <Badge className="bg-accent text-accent-foreground">Bulk price applied</Badge>
              )}
            </div>

            {site.features.bulk && tiers.length > 0 && (
              <div className="mt-5 rounded-xl border border-border/80 bg-secondary/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {site.bulk.tiersLabel}
                </p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span>1 – {(sortedTiers[0]?.minQty ?? 2) - 1} pcs</span>
                    <span className="font-semibold">{formatPrice(product.price)} each</span>
                  </div>
                  {sortedTiers.map((tier) => {
                    const active = quantity >= tier.minQty;
                    const isPriced = pricedTier?.minQty === tier.minQty;
                    return (
                      <div key={tier.minQty} className={`flex items-center justify-between text-sm ${active ? 'font-semibold text-foreground' : 'text-foreground/75'}`}>
                        <span>
                          {tier.minQty}+ pcs
                          {isPriced && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[11px] text-accent-foreground">yours</span>}
                        </span>
                        <span className="font-semibold">{formatPrice(tier.price)} each</span>
                      </div>
                    );
                  })}
                </div>
                {nextTier && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Add {nextTier.minQty - quantity} more to unlock {formatPrice(nextTier.price)} each.
                  </p>
                )}
              </div>
            )}

            <p className="mt-5 text-sm leading-7 text-foreground/80">{product.description}</p>

            <div className="mt-7 space-y-6">
              <div>
                <Label className="mb-3 block text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">Size</Label>
                <RadioGroup value={selectedSize} onValueChange={setSelectedSize} className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <div key={size}>
                      <RadioGroupItem value={size} id={`size-${size}`} className="peer sr-only" />
                      <Label
                        htmlFor={`size-${size}`}
                        className="flex h-10 min-w-[3rem] cursor-pointer items-center justify-center rounded-md border border-border/80 px-4 text-sm font-medium transition-colors peer-data-[state=checked]:border-accent peer-data-[state=checked]:bg-accent/15"
                      >
                        {size}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="mb-3 block text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">Color</Label>
                <RadioGroup value={selectedColor} onValueChange={setSelectedColor} className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <div key={color}>
                      <RadioGroupItem value={color} id={`color-${color}`} className="peer sr-only" />
                      <Label
                        htmlFor={`color-${color}`}
                        className="flex h-10 cursor-pointer items-center justify-center rounded-md border border-border/80 px-4 text-sm font-medium transition-colors peer-data-[state=checked]:border-accent peer-data-[state=checked]:bg-accent/15"
                      >
                        {color}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="mb-3 block text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">Quantity</Label>
                <div className="flex w-fit items-center rounded-md border border-border/80">
                  <Button variant="ghost" size="icon" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center text-sm font-semibold">{quantity}</span>
                  <Button variant="ghost" size="icon" onClick={() => setQuantity((value) => value + 1)} disabled={selectedStock != null && quantity >= selectedStock}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                size="lg"
                className="h-11 w-full rounded-full"
                onClick={handleAddToCart}
                disabled={!product.inStock || overallOut || selectedStock === 0 || (selectedStock != null && quantity > selectedStock)}
              >
                {!product.inStock || overallOut || selectedStock === 0
                  ? 'Out of Stock'
                  : selectedStock != null && quantity > selectedStock
                    ? `Only ${selectedStock} available — lower quantity`
                    : bulkActive ? `Add to Cart — ${formatPrice(unitPrice * quantity)} total` : 'Add to Cart'}
              </Button>
            </div>
          </section>
        </div>
      </div>

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-3xl overflow-hidden p-0">
          <img src={currentImage} alt={product.name} className="w-full object-cover" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
