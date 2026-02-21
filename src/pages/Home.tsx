import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const newArrivals = products.filter((p) => p.newArrival);
  const latestCollection = products.filter((p) => p.latestCollection);
  const hotDeals = products.filter((p) => p.hotDeal);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[62vh] overflow-hidden sm:min-h-[66vh] md:min-h-[82vh]">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Shindara Fashion Collection"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/65 to-background/35" />
          <div className="absolute -left-20 top-12 h-44 w-44 rounded-full bg-accent/25 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="relative container mx-auto grid h-full items-center gap-8 px-4 py-10 md:grid-cols-12 md:py-16">
          <div className="space-y-4 sm:space-y-6 md:col-span-7">
            <Badge variant="secondary" className="animate-fade-in rounded-full px-3 py-1 text-xs font-semibold">
              <Sparkles className="mr-1 h-3.5 w-3.5" /> New season drop is live
            </Badge>
            <h1 className="animate-fade-in text-3xl font-bold tracking-tight sm:text-4xl md:text-6xl">
              Discover Your Style
            </h1>
            <p className="animate-fade-in max-w-xl text-base text-foreground/80 sm:text-lg md:text-xl">
              Premium Nigerian fashion at affordable prices. Explore our collection of
              contemporary and traditional designs.
            </p>

            <div className="animate-fade-in flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <Button size="lg" className="w-full sm:w-auto" asChild>
                <Link to="/women">
                  Shop Women
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-card/70 backdrop-blur" asChild>
                <Link to="/men">Shop Men</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-3 sm:gap-3">
              <div className="flex items-center gap-2 rounded-lg border bg-card/70 px-3 py-2 backdrop-blur">
                <ShieldCheck className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium sm:text-sm">Quality Assured</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-card/70 px-3 py-2 backdrop-blur">
                <Truck className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium sm:text-sm">Nationwide Delivery</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-card/70 px-3 py-2 backdrop-blur">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium sm:text-sm">Weekly New Arrivals</span>
              </div>
            </div>
          </div>

          <div className="hidden md:col-span-5 md:block">
            <div className="ml-auto w-full max-w-sm space-y-3 rounded-2xl border bg-card/80 p-4 shadow-lg backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Spotlight</p>
              <h3 className="text-xl font-semibold">Fresh picks this week</h3>
              <p className="text-sm text-muted-foreground">Discover curated looks from our latest arrivals and hot deals.</p>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/women" className="rounded-lg border bg-secondary px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/70">
                  Women
                </Link>
                <Link to="/men" className="rounded-lg border bg-secondary px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/70">
                  Men
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">New Arrivals</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Fresh styles just in - be the first to shop our newest pieces
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Hot Deals */}
      <section className="bg-accent/10 py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Hottest Deals 🔥</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Limited time offers on your favorite items - grab them before they're gone
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {hotDeals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-secondary/30 py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Shop by Category</h2>
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

      {/* Latest Collection */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Latest Collection</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover our most recent fashion curations
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {latestCollection.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Featured Collection</h2>
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
      <section className="bg-secondary/30 py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Trending Now</h2>
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

      {/* Blog Section */}
      <section className="bg-secondary/30 py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Fashion Insights</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Stay updated with the latest fashion trends, styling tips, and industry news
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <article className="group overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="aspect-video overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80"
                  alt="Fashion trends"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-6 space-y-3">
                <span className="text-xs font-medium text-accent">Fashion Trends</span>
                <h3 className="text-xl font-semibold group-hover:text-accent transition-colors">
                  Top 10 Fashion Trends for 2025
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  Discover the hottest fashion trends that will dominate 2025, from bold colors to sustainable fabrics.
                </p>
                <Link to="/about" className="inline-flex items-center text-sm font-medium text-accent hover:underline">
                  Read more <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </div>
            </article>

            <article className="group overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="aspect-video overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80"
                  alt="Styling tips"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-6 space-y-3">
                <span className="text-xs font-medium text-accent">Styling Tips</span>
                <h3 className="text-xl font-semibold group-hover:text-accent transition-colors">
                  How to Style Ankara for Any Occasion
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  Learn expert tips on styling traditional Ankara prints for both casual and formal events.
                </p>
                <Link to="/about" className="inline-flex items-center text-sm font-medium text-accent hover:underline">
                  Read more <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </div>
            </article>

            <article className="group overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="aspect-video overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80"
                  alt="Shopping guide"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-6 space-y-3">
                <span className="text-xs font-medium text-accent">Shopping Guide</span>
                <h3 className="text-xl font-semibold group-hover:text-accent transition-colors">
                  Building a Versatile Wardrobe
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  Essential pieces every wardrobe needs for creating countless outfit combinations.
                </p>
                <Link to="/about" className="inline-flex items-center text-sm font-medium text-accent hover:underline">
                  Read more <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl space-y-6 rounded-2xl bg-accent p-8 text-center text-accent-foreground shadow-lg md:p-12">
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
              <Button size="lg" variant="secondary" className="hover-scale">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
