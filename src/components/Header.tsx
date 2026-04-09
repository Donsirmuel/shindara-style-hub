import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import productsData from '@/data/products.json';
import { Product } from '@/lib/types';
import { resolveImageUrl } from '@/utils/imageResolver';

interface HeaderProps {
  cartItemCount: number;
  onCartOpen: () => void;
}

export function Header({ cartItemCount, onCartOpen }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const cartLabel = cartItemCount > 99 ? '99+' : cartItemCount;
  const products = productsData as Product[];

  const navLinks = [
    { name: 'Women', path: '/women' },
    { name: 'Men', path: '/men' },
    { name: 'New In', path: '/', hash: '#fresh-picks' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string, hash?: string) => {
    if (hash) {
      return location.pathname === path && location.hash === hash;
    }
    return location.pathname === path;
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return products.slice(0, 6);
    }

    return products
      .filter((product) => {
        const haystack = [
          product.name,
          product.description,
          product.category,
          product.gender,
          ...product.colors,
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, 8);
  }, [products, searchQuery]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between md:h-[4.5rem]">
            <Link to="/" className="flex items-center">
              <span className="text-[0.95rem] font-semibold uppercase tracking-[0.14em] text-foreground md:text-[1.05rem]">
                SHINDARA
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-7">
              {navLinks.map((link) => (
                <Link
                  key={`${link.path}${link.hash ?? ''}`}
                  to={`${link.path}${link.hash ?? ''}`}
                  className={`border-b-2 border-transparent py-1 text-[13px] font-semibold tracking-[0.06em] transition-colors ${
                    isActive(link.path, link.hash)
                      ? 'border-accent text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1 md:gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-[17px] w-[17px]" />
                <span className="sr-only">Search</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={onCartOpen}
                className="relative h-10 w-10 text-muted-foreground hover:text-foreground"
              >
                <ShoppingBag className="h-[17px] w-[17px]" />
                {cartItemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-accent-foreground">
                    {cartLabel}
                  </span>
                )}
                <span className="sr-only">Shopping cart</span>
              </Button>

              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-foreground transition-colors">
                    <Menu className="h-[18px] w-[18px]" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[290px]">
                  <SheetHeader>
                    <SheetTitle className="text-base font-bold tracking-[0.16em]">SHINDARA</SheetTitle>
                  </SheetHeader>
                  <Separator className="my-5" />
                  <nav className="flex flex-col gap-1">
                    {navLinks.map((link) => {
                      return (
                        <Link
                          key={`${link.path}${link.hash ?? ''}`}
                          to={`${link.path}${link.hash ?? ''}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`rounded-md px-4 py-3 text-[15px] font-semibold tracking-[0.03em] transition-colors ${
                            isActive(link.path, link.hash) ? 'bg-accent/15 text-foreground' : 'text-foreground/85 hover:bg-secondary'
                          }`}
                        >
                          {link.name}
                        </Link>
                      );
                    })}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-border/80 p-0 sm:max-w-xl">
          <DialogHeader className="border-b border-border/70 px-5 pb-4 pt-5">
            <DialogTitle>Search Shindara</DialogTitle>
            <Input
              autoFocus
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by item name, color, or style"
              className="mt-2"
            />
          </DialogHeader>

          <div className="space-y-2 px-5 pb-5 pt-3">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="flex items-center gap-3 rounded-lg border border-border/70 bg-card p-2.5 transition-colors hover:bg-secondary/60"
                >
                  <img
                    src={resolveImageUrl(product.images?.[0])}
                    alt={product.name}
                    className="h-14 w-12 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{product.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{product.gender === 'women' ? 'Women' : 'Men'}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatPrice(product.price)}</p>
                </Link>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No products matched your search.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
