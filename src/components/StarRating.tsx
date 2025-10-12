import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  reviewCount?: number;
}

export function StarRating({ 
  rating, 
  maxStars = 5, 
  size = 'sm', 
  showNumber = false,
  reviewCount 
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[...Array(maxStars)].map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= Math.floor(rating);
          const isPartial = starValue > Math.floor(rating) && starValue <= Math.ceil(rating);
          const partialPercentage = isPartial ? ((rating % 1) * 100) : 0;

          return (
            <div key={index} className="relative">
              <Star className={cn(sizeClasses[size], 'text-muted-foreground')} />
              {(isFilled || isPartial) && (
                <div 
                  className="absolute top-0 left-0 overflow-hidden"
                  style={{ width: isFilled ? '100%' : `${partialPercentage}%` }}
                >
                  <Star className={cn(sizeClasses[size], 'fill-accent text-accent')} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {showNumber && (
        <span className="text-sm text-muted-foreground">
          {rating.toFixed(1)}
          {reviewCount !== undefined && ` (${reviewCount})`}
        </span>
      )}
    </div>
  );
}
