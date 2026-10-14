import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { BackToTop } from '@/components/BackToTop';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/hooks/useProducts';
import { formatPrice } from '@/lib/format';
import { site } from '@/site.config';

export default function Bulk() {
  const { data, isLoading, isError } = useProducts({ limit: 100 });
  const products = data?.items ?? [];
  const bulkable = products.filter((p) => (p.tiers?.length ?? 0) > 0);

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border/80 bg-card">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Wholesale</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">Buy in Bulk, Save More</h1>
          <p className="mt-3 max-w-2xl text-sm text-foreground/80 md:text-base">
            {site.bulk.tiersLabel}: order {site.bulk.defaultMOQ}+ pieces of any item and the discount applies
            automatically in your cart. No codes, no negotiation.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button className="h-11 rounded-full" asChild>
              <a
                href={`https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(`Hello ${site.brand}! I want a bulk quote.`)}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Ask for a Quote
              </a>
            </Button>
            <Button variant="outline" className="h-11 rounded-full" asChild>
              <Link to="/login">Get a Wholesale Account</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3" aria-label="Loading bulk products">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-border/80 bg-card p-3">
                <div className="aspect-[3/4] rounded-xl bg-secondary" />
                <div className="mx-1 mb-1 mt-3 h-4 rounded bg-secondary" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-border/80 bg-card px-6 py-16 text-center">
            <h2 className="text-xl font-semibold">Couldn't load bulk deals</h2>
            <Button variant="outline" className="mt-5" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {bulkable.map((product) => {
              const best = [...(product.tiers ?? [])].sort((a, b) => a.price - b.price)[0];
              return (
                <div key={product.id} className="relative">
                  <ProductCard product={product} />
                  {best && (
                    <p className="mt-1.5 px-1 text-xs font-semibold text-foreground/80">
                      {site.bulk.defaultMOQ}+ pcs @ {formatPrice(best.price)} each
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BackToTop />
    </div>
  );
}
