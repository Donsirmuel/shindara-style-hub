import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import productsData from '@/data/products.json';
import { Product } from '@/lib/types';
import { resolveImageUrl } from '@/utils/imageResolver';
import heroImage from '@/assets/hero-image.png';

const featuredLookItems = [
  { name: 'Structured Silk Top', price: 8500 },
  { name: 'Linen Wide-Leg Trousers', price: 12000 },
  { name: 'Mini Leather Bucket Bag', price: 10500 },
  { name: 'Nude Pointed Mules', price: 14000 },
];

const categoryCards = [
  {
    title: 'Easy Wear',
    description: 'Pieces you can wear from morning to evening without stress.',
    productId: 'prod-003',
    href: '/women',
  },
  {
    title: 'Office Ready',
    description: 'Sharp, clean fits for workdays and formal meetings.',
    productId: 'prod-010',
    href: '/men',
  },
  {
    title: 'Weekend Outfits',
    description: 'Relaxed looks that still feel put together.',
    productId: 'prod-001',
    href: '/women',
  },
  {
    title: 'Standout Pieces',
    description: 'Strong items that lift your wardrobe without trying too hard.',
    productId: 'prod-011',
    href: '/men',
  },
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(price);

const getTag = (product: Product, index: number) => {
  if (product.hotDeal) return 'Hot';
  if (product.newArrival) return 'Just in';
  if (index % 3 === 1) return 'Low stock';
  return 'Popular';
};

const getTagStyles = (tag: string) => {
  if (tag === 'Hot') return 'bg-accent text-accent-foreground';
  if (tag === 'Low stock') return 'bg-foreground text-primary-foreground';
  if (tag === 'Just in') return 'bg-white text-foreground';
  return 'bg-secondary text-foreground';
};

export default function Home() {
  const products = productsData as Product[];
  const productMap = new Map(products.map((product) => [product.id, product]));
  const freshPicksOrder = ['prod-003', 'prod-005', 'prod-006', 'prod-007', 'prod-008', 'prod-009', 'prod-010', 'prod-012'];
  const popularOrder = ['prod-003', 'prod-005', 'prod-006', 'prod-010', 'prod-007'];
  const featuredLookImages = ['prod-003', 'prod-005', 'prod-006', 'prod-004'];
  const freshPicks = freshPicksOrder
    .map((id) => productMap.get(id))
    .filter((product): product is Product => Boolean(product));
  const popularItems = popularOrder
    .map((id) => productMap.get(id))
    .filter((product): product is Product => Boolean(product));
  const lookTotal = featuredLookItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="bg-background">
      <section className="relative min-h-[calc(100vh-4.5rem)] overflow-hidden">
        <img
          src={heroImage}
          alt="Shindara boutique interior"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/35 to-foreground/20" />
        <div className="relative mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="max-w-xl space-y-6 rounded-2xl border border-white/25 bg-black/35 p-6 text-primary-foreground backdrop-blur-sm sm:p-8">
            <h1 className="text-4xl font-bold leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl">
              Look Good Without Stress
            </h1>
            <p className="max-w-md text-base leading-7 text-primary-foreground/90 sm:text-lg">
              Simple, clean clothes you&apos;ll actually wear.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="h-11 rounded-full bg-white px-6 text-foreground hover:bg-white/90" asChild>
                <Link to="/women">Shop Women</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 rounded-full border-white/70 bg-transparent px-6 text-primary-foreground hover:bg-white/15"
                asChild
              >
                <Link to="/men">Shop Men</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="grid min-h-[340px] grid-cols-2 gap-2 rounded-2xl border border-border/80 bg-card p-2">
            {featuredLookImages.map((id) => {
              const product = productMap.get(id);
              if (!product) {
                return null;
              }

              return (
                <img
                  key={id}
                  src={resolveImageUrl(product.images?.[0])}
                  alt={product.name}
                  className="h-full w-full rounded-xl object-cover"
                  loading="lazy"
                />
              );
            })}
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Featured look</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Wear It Like This</h2>

            <div className="mt-6 space-y-4 border-y border-border/80 py-5">
              {featuredLookItems.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-foreground/80">{item.name}</span>
                  <span className="font-semibold text-foreground">{formatPrice(item.price)}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Total</p>
                <p className="mt-1 text-3xl font-bold tracking-tight">{formatPrice(lookTotal)}</p>
              </div>
              <Button className="h-11 rounded-full px-6" asChild>
                <Link to="/women">Buy Full Look</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="fresh-picks" className="scroll-mt-24">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">New this week</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Fresh Picks</h2>
            </div>
            <Link to="/women" className="hidden items-center gap-2 text-sm font-semibold text-foreground/80 hover:text-foreground sm:inline-flex">
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {freshPicks.map((product, index) => {
              const tag = getTag(product, index);
              return (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="group overflow-hidden rounded-2xl border border-border/80 bg-card transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                    <img
                      src={resolveImageUrl(product.images?.[0])}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ${getTagStyles(tag)}`}>
                      {tag}
                    </span>
                    <span className="absolute inset-x-3 bottom-3 translate-y-3 rounded-full bg-foreground/90 px-3 py-1.5 text-center text-xs font-medium text-primary-foreground opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      Quick View
                    </span>
                  </div>

                  <div className="space-y-1.5 p-3.5">
                    <h3 className="text-sm font-semibold leading-5 text-foreground sm:text-base">{product.name}</h3>
                    <p className="text-sm font-semibold sm:text-base">{formatPrice(product.price)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">What People Are Buying</h2>
            <p className="text-sm font-medium text-muted-foreground">Popular this week</p>
          </div>

          <div className="mt-6 space-y-3">
            {popularItems.map((item) => (
              <Link
                key={item.id}
                to={`/product/${item.id}`}
                className="flex items-center justify-between rounded-xl border border-border/80 bg-background px-4 py-3 transition-colors hover:bg-secondary/60"
              >
                <span className="text-sm font-medium text-foreground/85 sm:text-base">{item.name}</span>
                <span className="text-sm font-semibold text-foreground sm:text-base">{formatPrice(item.price)}</span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Shop by Style</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {categoryCards.map((category) => (
              <Link
                key={category.title}
                to={category.href}
                className="group relative overflow-hidden rounded-2xl border border-border/80"
              >
                <img
                  src={resolveImageUrl(productMap.get(category.productId)?.images?.[0])}
                  alt={category.title}
                  loading="lazy"
                  className="h-60 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-72"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-primary-foreground sm:p-6">
                  <h3 className="text-2xl font-semibold">{category.title}</h3>
                  <p className="mt-1.5 max-w-sm text-sm leading-6 text-primary-foreground/85">{category.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="bg-foreground py-16 text-primary-foreground sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/65">Shindara philosophy</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">We Don&apos;t Do Too Much</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-primary-foreground/80 sm:text-lg">
            Just clean clothes that fit well, wear well, and look right every day.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Find Something You&apos;ll Actually Wear</h2>
        <Button className="mt-7 h-11 rounded-full px-8" asChild>
          <Link to="/women">Start Shopping</Link>
        </Button>
      </section>
    </div>
  );
}
