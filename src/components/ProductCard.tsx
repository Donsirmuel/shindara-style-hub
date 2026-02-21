import { Link } from 'react-router-dom';
import { Product } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/StarRating';
import { resolveImageUrl } from '@/utils/imageResolver';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const coverImage = resolveImageUrl(product.images?.[0]);

  return (
    <Card className="group overflow-hidden rounded-xl border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <Link to={`/product/${product.id}`}>
        <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
          <img
            src={coverImage}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          {product.newArrival && !product.hotDeal && (
            <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">
              NEW
            </Badge>
          )}
          {product.hotDeal && discount > 0 && (
            <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground">
              -{discount}%
            </Badge>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Badge variant="outline" className="text-lg">
                Out of Stock
              </Badge>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="space-y-1.5 p-3 sm:space-y-2 sm:p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-accent sm:text-base">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-end gap-2">
          <span className="text-base font-bold leading-none sm:text-lg">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="text-xs leading-none text-muted-foreground line-through sm:text-sm">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {product.rating && (
          <div className="mt-2">
            <StarRating 
              rating={product.rating} 
              showNumber 
              reviewCount={product.reviewCount} 
              size="sm"
            />
          </div>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:mt-2 sm:gap-2">
          {product.colors.slice(0, 3).map((color) => (
            <Badge key={color} variant="outline" className="rounded-full px-1.5 py-0 text-[10px] font-medium text-muted-foreground sm:px-2">
              {color}
            </Badge>
          ))}
          {product.colors.length > 3 && (
            <span className="text-xs text-muted-foreground">+{product.colors.length - 3}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
