import { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { BackToTop } from '@/components/BackToTop';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import productsData from '@/data/products.json';
import categoriesData from '@/data/categories.json';
import { Category, Product } from '@/lib/types';
import heroMen from '@/assets/hero-men.jpg';

type SortOption = 'default' | 'popularity' | 'newest' | 'price-asc' | 'price-desc';

const MAX_PRICE = 100000;

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(price);

export default function Men() {
  const products = (productsData as Product[]).filter((product) => product.gender === 'men');
  const categories = (categoriesData as Category[]).filter((category) => category.gender === 'men');

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, MAX_PRICE]);

  const hasPriceFilter = priceRange[0] !== 0 || priceRange[1] !== MAX_PRICE;
  const activeFilterCount = selectedCategories.length + (hasPriceFilter ? 1 : 0);

  const categoryLabelById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories]
  );

  const filteredProducts = useMemo(() => {
    let next = products.filter((product) => product.price >= priceRange[0] && product.price <= priceRange[1]);

    if (selectedCategories.length > 0) {
      next = next.filter((product) => selectedCategories.includes(product.category));
    }

    if (sortBy === 'popularity') {
      next = [...next].sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    } else if (sortBy === 'newest') {
      next = [...next].sort((a, b) => Number(Boolean(b.newArrival)) - Number(Boolean(a.newArrival)));
    } else if (sortBy === 'price-asc') {
      next = [...next].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      next = [...next].sort((a, b) => b.price - a.price);
    }

    return next;
  }, [priceRange, products, selectedCategories, sortBy]);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((previous) =>
      previous.includes(categoryId)
        ? previous.filter((id) => id !== categoryId)
        : [...previous, categoryId]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSortBy('default');
    setPriceRange([0, MAX_PRICE]);
  };

  const applyQuickPreset = (preset: 'all' | 'best' | 'new' | 'traditional' | 'under-25') => {
    if (preset === 'all') {
      clearAllFilters();
      return;
    }
    if (preset === 'best') {
      setSelectedCategories([]);
      setSortBy('popularity');
      setPriceRange([0, MAX_PRICE]);
      return;
    }
    if (preset === 'new') {
      setSelectedCategories([]);
      setSortBy('newest');
      setPriceRange([0, MAX_PRICE]);
      return;
    }
    if (preset === 'traditional') {
      setSelectedCategories(['men-traditional']);
      setSortBy('default');
      setPriceRange([0, MAX_PRICE]);
      return;
    }
    setSelectedCategories([]);
    setSortBy('price-asc');
    setPriceRange([0, 25000]);
  };

  const activeChips = [
    ...selectedCategories.map((categoryId) => ({
      id: categoryId,
      label: categoryLabelById.get(categoryId) || categoryId,
      onRemove: () => toggleCategory(categoryId),
    })),
    ...(hasPriceFilter
      ? [
          {
            id: 'price',
            label: `${formatPrice(priceRange[0])} - ${formatPrice(priceRange[1])}`,
            onRemove: () => setPriceRange([0, MAX_PRICE] as [number, number]),
          },
        ]
      : []),
  ];

  const FilterContent = () => (
    <div className="space-y-7 rounded-2xl border border-border/80 bg-card p-5">
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">Categories</h3>
        <div className="mt-4 space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-2.5">
              <Checkbox
                id={`men-${category.id}`}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => toggleCategory(category.id)}
              />
              <Label htmlFor={`men-${category.id}`} className="cursor-pointer text-sm">
                {category.name}
              </Label>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">Price</h3>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>{formatPrice(priceRange[0])}</span>
            <span>{formatPrice(priceRange[1])}</span>
          </div>
          <Slider
            min={0}
            max={MAX_PRICE}
            step={1000}
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
          />
          <div className="space-y-2">
            <Button variant="ghost" className="h-8 w-full justify-start text-xs" onClick={() => setPriceRange([0, 10000])}>
              Under NGN 10,000
            </Button>
            <Button variant="ghost" className="h-8 w-full justify-start text-xs" onClick={() => setPriceRange([10000, 25000])}>
              NGN 10,000 - NGN 25,000
            </Button>
            <Button variant="ghost" className="h-8 w-full justify-start text-xs" onClick={() => setPriceRange([25000, 50000])}>
              NGN 25,000 - NGN 50,000
            </Button>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">Sort</h3>
        <div className="mt-4 space-y-2">
          <Button variant={sortBy === 'default' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setSortBy('default')}>
            Recommended
          </Button>
          <Button variant={sortBy === 'popularity' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setSortBy('popularity')}>
            Most Popular
          </Button>
          <Button variant={sortBy === 'newest' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setSortBy('newest')}>
            Just In
          </Button>
          <Button variant={sortBy === 'price-asc' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setSortBy('price-asc')}>
            Price: Low to High
          </Button>
          <Button variant={sortBy === 'price-desc' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setSortBy('price-desc')}>
            Price: High to Low
          </Button>
        </div>
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden">
        <img src={heroMen} alt="Men's collection" className="h-[270px] w-full object-cover object-top md:h-[320px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        <div className="absolute inset-0 mx-auto flex max-w-6xl items-end px-4 pb-8 sm:px-6 lg:px-8">
          <div className="max-w-lg rounded-2xl border border-white/20 bg-black/35 p-4 backdrop-blur-[2px] sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary-foreground/75">Men</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-primary-foreground md:text-5xl">Sharp Looks, No Noise</h1>
            <p className="mt-2 text-sm text-primary-foreground/85 md:text-base">
              Shirts, suits, and traditional pieces styled for workdays and weekend events.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Collection</p>
              <p className="mt-1 text-sm text-foreground/80">
                Showing <span className="font-semibold text-foreground">{filteredProducts.length}</span> pieces
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="rounded-full px-3 text-xs" onClick={() => applyQuickPreset('all')}>All</Button>
              <Button size="sm" variant="outline" className="rounded-full px-3 text-xs" onClick={() => applyQuickPreset('best')}>Best Sellers</Button>
              <Button size="sm" variant="outline" className="rounded-full px-3 text-xs" onClick={() => applyQuickPreset('new')}>Just In</Button>
              <Button size="sm" variant="outline" className="rounded-full px-3 text-xs" onClick={() => applyQuickPreset('traditional')}>Traditional</Button>
              <Button size="sm" variant="outline" className="rounded-full px-3 text-xs" onClick={() => applyQuickPreset('under-25')}>Under NGN 25k</Button>
            </div>
          </div>
        </section>

        {activeChips.length > 0 && (
          <section className="mt-4 flex flex-wrap items-center gap-2">
            {activeChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={chip.onRemove}
                className="rounded-full border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-foreground/85 hover:border-accent hover:text-foreground"
              >
                {chip.label} <span className="ml-1">x</span>
              </button>
            ))}
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={clearAllFilters}>
              Clear all
            </Button>
          </section>
        )}

        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-24">
              <FilterContent />
            </div>
          </aside>

          <section className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filter and Sort
                  {activeFilterCount > 0 && (
                    <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[90vw] max-w-[340px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filter Men's Shop</SheetTitle>
                </SheetHeader>
                <div className="mt-5">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </section>

          <section className="flex-1">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border/80 bg-card px-6 py-16 text-center">
                <h2 className="text-xl font-semibold">No items match this filter yet</h2>
                <p className="mt-2 text-sm text-muted-foreground">Try a different category or reset your filters.</p>
                <Button variant="outline" className="mt-5" onClick={clearAllFilters}>
                  Reset Filters
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
      <BackToTop />
    </div>
  );
}
