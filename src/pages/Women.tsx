import { useState, useMemo } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SlidersHorizontal } from 'lucide-react';
import { BackToTop } from '@/components/BackToTop';
import productsData from '@/data/products.json';
import categoriesData from '@/data/categories.json';
import { Product, Category } from '@/lib/types';
import heroWomen from '@/assets/hero-women.jpg';

export default function Women() {
  const products = (productsData as Product[]).filter((p) => p.gender === 'women');
  const categories = (categoriesData as Category[]).filter((c) => c.gender === 'women');

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'rating' | 'popularity' | 'newest'>('default');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) => selectedCategories.includes(p.category));
    }

    // Filter by price range
    filtered = filtered.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Sort products
    if (sortBy === 'price-asc') {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'popularity') {
      filtered = [...filtered].sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    } else if (sortBy === 'newest') {
      filtered = [...filtered].sort((a, b) => {
        if (a.newArrival && !b.newArrival) return -1;
        if (!a.newArrival && b.newArrival) return 1;
        return 0;
      });
    }

    return filtered;
  }, [products, selectedCategories, sortBy, priceRange]);

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Categories</h3>
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={category.id}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => toggleCategory(category.id)}
              />
              <Label htmlFor={category.id} className="cursor-pointer">
                {category.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Price Range</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>₦{priceRange[0].toLocaleString()}</span>
            <span>₦{priceRange[1].toLocaleString()}</span>
          </div>
          <Slider
            min={0}
            max={100000}
            step={1000}
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            className="w-full"
          />
          <div className="space-y-2 pt-2">
            <Button
              variant={priceRange[1] === 10000 ? 'secondary' : 'ghost'}
              className="w-full justify-start text-sm"
              onClick={() => setPriceRange([0, 10000])}
            >
              Under ₦10,000
            </Button>
            <Button
              variant={priceRange[0] === 10000 && priceRange[1] === 25000 ? 'secondary' : 'ghost'}
              className="w-full justify-start text-sm"
              onClick={() => setPriceRange([10000, 25000])}
            >
              ₦10,000 - ₦25,000
            </Button>
            <Button
              variant={priceRange[0] === 25000 && priceRange[1] === 50000 ? 'secondary' : 'ghost'}
              className="w-full justify-start text-sm"
              onClick={() => setPriceRange([25000, 50000])}
            >
              ₦25,000 - ₦50,000
            </Button>
            <Button
              variant={priceRange[0] === 50000 ? 'secondary' : 'ghost'}
              className="w-full justify-start text-sm"
              onClick={() => setPriceRange([50000, 100000])}
            >
              Above ₦50,000
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Sort By</h3>
        <div className="space-y-2">
          <Button
            variant={sortBy === 'default' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setSortBy('default')}
          >
            Default
          </Button>
          <Button
            variant={sortBy === 'popularity' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setSortBy('popularity')}
          >
            Popularity
          </Button>
          <Button
            variant={sortBy === 'rating' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setSortBy('rating')}
          >
            Highest Rated
          </Button>
          <Button
            variant={sortBy === 'newest' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setSortBy('newest')}
          >
            Newest
          </Button>
          <Button
            variant={sortBy === 'price-asc' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setSortBy('price-asc')}
          >
            Price: Low to High
          </Button>
          <Button
            variant={sortBy === 'price-desc' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setSortBy('price-desc')}
          >
            Price: High to Low
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden animate-fade-in mt-16 md:mt-0">
        <img
          src={heroWomen}
          alt="Women's Fashion Collection"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30 flex items-center">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 animate-fade-in">Women's Fashion</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Explore our stunning collection of women's clothing and accessories
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Products Count */}
        <div className="mb-8">
          <p className="text-muted-foreground">
            Showing {filteredProducts.length} products
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Filters */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <FilterContent />
            </div>
          </aside>

          {/* Mobile Filter Button */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filters & Sort
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px]">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No products found matching your filters.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSelectedCategories([]);
                    setPriceRange([0, 100000]);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <BackToTop />
    </div>
  );
}
