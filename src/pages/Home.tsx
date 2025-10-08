import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/ProductCard';
import heroImage from '@/assets/hero-fashion.jpg';
import womenCategory from '@/assets/women-category.jpg';
import menCategory from '@/assets/men-category.jpg';
import productsData from '@/data/products.json';
import { Product } from '@/lib/types';

export default function Home() {
  const products = productsData as Product[];
  const featuredProducts = products.filter((p) => p.featured);
  const trendingProducts = products.filter((p) => p.trending);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[80vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Shindara Fashion Collection"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-background/20" />
        </div>

        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight animate-fade-in">
              Discover Your Style
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground animate-fade-in">
              Premium Nigerian fashion at affordable prices. Explore our collection of
              contemporary and traditional designs.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in">
              <Button size="lg" asChild>
                <Link to="/women">
                  Shop Women
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/men">Shop Men</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Shop by Category</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore our curated collections for men and women
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Link
              to="/women"
              className="group relative aspect-[4/5] overflow-hidden rounded-lg hover-lift"
            >
              <img
                src={womenCategory}
                alt="Women's Fashion"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex items-end p-8">
                <div>
                  <h3 className="text-3xl font-bold mb-2">Women's Collection</h3>
                  <p className="text-muted-foreground mb-4">
                    Elegant dresses, tops, skirts & more
                  </p>
                  <Button variant="secondary">
                    Explore Women's
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Link>

            <Link
              to="/men"
              className="group relative aspect-[4/5] overflow-hidden rounded-lg hover-lift"
            >
              <img
                src={menCategory}
                alt="Men's Fashion"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex items-end p-8">
                <div>
                  <h3 className="text-3xl font-bold mb-2">Men's Collection</h3>
                  <p className="text-muted-foreground mb-4">
                    Shirts, suits, traditional wear & more
                  </p>
                  <Button variant="secondary">
                    Explore Men's
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Collection</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Handpicked items from our latest arrivals
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Trending */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Trending Now</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Popular picks loved by our customers
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {trendingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6 p-8 md:p-12 rounded-2xl bg-accent text-accent-foreground">
            <h2 className="text-3xl md:text-4xl font-bold">
              Join the Shindara Community
            </h2>
            <p className="text-lg opacity-90">
              Subscribe to our newsletter for exclusive deals, style tips, and new arrivals
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-md bg-accent-foreground text-accent focus-ring"
                aria-label="Email address"
              />
              <Button size="lg" variant="secondary">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
