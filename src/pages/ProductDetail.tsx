import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Minus, Plus, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import productsData from '@/data/products.json';
import { Product } from '@/lib/types';
import { StarRating } from '@/components/StarRating';

interface ProductDetailProps {
  onAddToCart: (product: Product, size: string, color: string, quantity: number) => void;
}

export default function ProductDetail({ onAddToCart }: ProductDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = (productsData as Product[]).find((p) => p.id === id);

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

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

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      alert('Please select size and color');
      return;
    }
    onAddToCart(product, selectedSize, selectedColor, quantity);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-secondary group">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="h-full w-full object-cover cursor-zoom-in"
                onClick={() => setZoomOpen(true)}
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setZoomOpen(true)}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              {discount > 0 && (
                <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">
                  -{discount}%
                </Badge>
              )}
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="flex gap-4">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square w-20 overflow-hidden rounded-md border-2 transition-colors ${
                      selectedImage === index ? 'border-accent' : 'border-transparent'
                    }`}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{product.name}</h1>
              {product.rating && (
                <div className="flex items-center gap-2 mb-3">
                  <StarRating rating={product.rating} />
                  {product.reviewCount && (
                    <span className="text-sm text-muted-foreground">
                      ({product.reviewCount} reviews)
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
              {!product.inStock && (
                <Badge variant="outline" className="text-base">
                  Out of Stock
                </Badge>
              )}
            </div>

            <p className="text-muted-foreground leading-relaxed">{product.description}</p>

            {/* Size Selection */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Size</Label>
              <RadioGroup value={selectedSize} onValueChange={setSelectedSize} className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <div key={size}>
                    <RadioGroupItem value={size} id={`size-${size}`} className="peer sr-only" />
                    <Label
                      htmlFor={`size-${size}`}
                      className="flex h-10 min-w-[3rem] cursor-pointer items-center justify-center rounded-md border-2 border-border px-4 font-medium peer-data-[state=checked]:border-accent peer-data-[state=checked]:bg-accent peer-data-[state=checked]:text-accent-foreground transition-colors hover:bg-secondary"
                    >
                      {size}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Color Selection */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Color</Label>
              <RadioGroup value={selectedColor} onValueChange={setSelectedColor} className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <div key={color}>
                    <RadioGroupItem value={color} id={`color-${color}`} className="peer sr-only" />
                    <Label
                      htmlFor={`color-${color}`}
                      className="flex h-10 cursor-pointer items-center justify-center rounded-md border-2 border-border px-4 font-medium peer-data-[state=checked]:border-accent peer-data-[state=checked]:bg-accent peer-data-[state=checked]:text-accent-foreground transition-colors hover:bg-secondary"
                    >
                      {color}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Quantity */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Quantity</Label>
              <div className="flex items-center border rounded-md w-fit">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart */}
            <Button
              size="lg"
              className="w-full"
              onClick={handleAddToCart}
              disabled={!product.inStock}
            >
              {product.inStock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          </div>
        </div>
      </div>

      {/* Image Zoom Dialog */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-4xl p-0">
          <img
            src={product.images[selectedImage]}
            alt={product.name}
            className="w-full h-auto"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
