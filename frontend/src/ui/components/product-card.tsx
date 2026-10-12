"use client";

import { Heart, ShoppingCart, Star } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { cn } from "~/lib/cn";
import { useCart } from "~/lib/contexts/cart-context";
import { useAuth } from "~/lib/hooks/use-auth";
import { useResellerFromUrl } from "~/lib/hooks/use-reseller";
import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardFooter } from "~/ui/primitives/card";

const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  XAF: "FCFA",
  CDF: "FC",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
  CHF: "CHF",
  CNY: "¥",
};

const CATEGORY_LABELS: Record<string, string> = {
  "Electronics and Components": "Électronique et composants",
  "Applications and New Technologies": "Applications et nouvelles technologies",
  "Phones and Accessories": "Téléphones et accessoires",
  "Agriculture, Livestock, and Fishing": "Agriculture, élevage et pêche",
  "Wearables and Accessories": "Vêtements et accessoires",
  "Home and decor": "Maison et décoration",
  "Makeup": "Maquillage",
  "Parents, Children, and Games": "Parents, enfants et jeux",
  "Jewelry, Eyewear, and Watches": "Bijoux, lunettes et montres",
  "Luggage, Bags, Cases": "Bagages, sacs et étuis",
  "Sports and Fitness": "Sports et fitness",
  "Books, Media, and Games": "Livres, médias et jeux",
  "office supplies": "Fournitures de bureau",
  "Food and Beverages": "Aliments et boissons",
  "Buildings": "Bâtiments",
  "Home Appliances": "Électroménager",
  "shoes and accessories": "Chaussures et accessoires",
  "Vehicles and Transportation": "Véhicules et transport",
  "Electrical Equipment and Supplies": "Matériel électrique et fournitures",
  "Renewable Energy": "Énergie renouvelable",
  "hardware and home improvement": "Quincaillerie et amélioration de la maison",
  "vehicle parts and accessories": "Pièces et accessoires automobiles",
  "Construction and Real Estate": "Construction et immobilier",
  "Medical and Health": "Médical et santé",
  "Packaging and Printing": "Emballage et impression",
  "Computers and Accessories": "Ordinateurs et accessoires",
};

function getCurrencySymbol(currency: string | undefined): string {
  return currency ? currencySymbols[currency] || currency : "";
}


type ProductCardProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onError"
> & {
  onAddToCart?: (productId: string) => void;
  onAddToWishlist?: (productId: string) => void;
  product: {
    category: string;
    id: string;
    images?: string[];
    image?: string;
    status?: string;
    inStock?: boolean;
    name: string;
    originalPrice?: number;
    price: number;
    rating?: number;
    total_reviews?: number;
    currency?: string;
    old_price?: number;
    discount_percent?: number;
    marque?: string;
    short_description?: string;
    model?: string;
    verified?: boolean;
    is_on_sale?: boolean;
    min_order?: number;
    commission_type?: 'none' | 'fixed' | 'percentage';
    commission_value?: number;
    shop?: { id: number; name: string } | null;
    user?: { id: number; name: string; email: string };
  };
  variant?: "compact" | "default";
};

export function ProductCard({
  className,
  onAddToCart,
  onAddToWishlist,
  product,
  variant = "default",
  ...props
}: ProductCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isAddingToCart, setIsAddingToCart] = React.useState(false);
  const [isInWishlist, setIsInWishlist] = React.useState(false);
  
  const { user } = useAuth();
  const { openWithItem } = useCart();

  const reseller = useResellerFromUrl();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();

    // Check if user is the product owner
    if (user && product.user && user.id === product.user.id) {
      toast.error("Vous ne pouvez pas commander votre propre produit");
      return;
    }

    // Check if logged-in user is the reseller, if so, set reseller to null
    const finalReseller = reseller && user?.id === reseller.id ? undefined : reseller || undefined;
    
    setIsAddingToCart(true);
    
    // Open cart with product
    openWithItem({
      id: product.id,
      type: 'product',
      name: product.name,
      image: product.images?.[0] || product.image || '',
      price: Number(product.price),
      quantity: product.min_order || 1,
      currency: product.currency,
      category: product.category,
      min_order: product.min_order,
      reseller: finalReseller,
      shop_id: product.shop?.id || undefined,
    });
    
    setTimeout(() => {
      setIsAddingToCart(false);
      if (onAddToCart) {
        onAddToCart(product.id);
      }
    }, 300);
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onAddToWishlist) {
      setIsInWishlist(!isInWishlist);
      onAddToWishlist(product.id);
    }
  };

  // Get image from backend data structure (images array or single image)
  const productImage = product.images?.[0] || product.image;

  // Map status to inStock for compatibility
  const isInStock = product.status === "available" || product.inStock !== false;

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  const renderStars = () => {
      const rating = Number(product.rating ?? 0);
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 >= 0.5;
  
      return (
        <div className="flex items-center">
          {Array.from({ length: 5 }).map((_, i) => {
            const isFull = i < fullStars;
            const isHalf = !isFull && i < rating && hasHalfStar;
            
            return (
              <div key={`star-${product.id}-${i}`} className="relative h-4 w-4">
                {/* Background star (empty) */}
                <Star className="absolute inset-0 h-4 w-4 text-gray-300" />
                {/* Foreground star (filled) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    width: isFull ? '100%' : isHalf ? '50%' : '0%',
                  }}
                >
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
            );
          })}
          {rating > 0 && (
            <span className="ml-1 mr-1 text-xs text-muted-foreground">
              {rating.toFixed(1)}
            </span>
          )}
          {product.total_reviews && product.total_reviews > 0 && (
            <span className="text-[12px] text-muted-foreground">
              ({product.total_reviews})
            </span>
          )}
        </div>
      );
  };

  return (
    <div className={cn("group", className)} {...props}>
      <Link href={`/products/${product.id}`}>
        <Card
          className={cn(
            `
              relative h-full overflow-hidden rounded-lg py-0
              transition-[transform,box-shadow] duration-200 ease-out
              hover:shadow-md
            `,
            isHovered && "ring-1 ring-primary/20"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative aspect-square overflow-hidden rounded-t-lg">
            {productImage ? (
              <img
                alt={product.name}
                className={cn(
                  "h-full w-full object-cover transition-transform duration-300 ease",
                  isHovered && "scale-105"
                )}
                src={productImage}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
                No image
              </div>
            )}

            {/* Category badge */}
            <Badge
              className={`
                absolute top-2 left-2 bg-background/80 backdrop-blur-sm
              `}
              variant="outline"
            >
              {CATEGORY_LABELS[product.category] || product.category}
            </Badge>

            {/* Discount badge */}
            {discount > 0 && (
              <Badge
                className={`
                absolute top-2 right-2 bg-destructive
                text-destructive-foreground
              `}
              >
                {discount}% OFF
              </Badge>
            )}
            
            {/* Sale badge */}
            {product.is_on_sale && (
              <Badge
                className={`
                absolute top-2 right-2 bg-red-500
                text-white font-semibold
              `}
              >
                SOLDE
              </Badge>
            )}
          </div>

          {/* Product info */}
          <CardContent className="p-2.5 space-y-1.5">
            {/* Rating with 5 stars and verified badge */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {product.rating !== undefined && product.rating > 0 && (
                  <>
                    <div className="flex items-center">
                      {renderStars()}
                    </div>
                  </>
                )}
              </div>
              {product.verified && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">
                  Vérifié
                </span>
              )}
            </div>

            {/* Product name */}
            <h3 className="text-sm font-semibold line-clamp-1">
              {product.name}
            </h3>

            {/* Short description */}
            {product.short_description && (
              <p className="text-[14px] text-muted-foreground line-clamp-2">
                {product.short_description}
              </p>
            )}

            {/* Brand/Marque */}
            {product.marque && (
              <p className="text-[14px] text-muted-foreground uppercase tracking-wide">
                {product.marque}
              </p>
            )}

            {/* Price section */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-lg font-bold text-primary">
                {Number(product?.price || 0).toFixed(2)} {getCurrencySymbol(product.currency)}
              </span>
              {product.old_price && (
                <span className="text-xs text-muted-foreground line-through">
                  {Number(product.old_price).toFixed(2)} {getCurrencySymbol(product.currency)}
                </span>
              )}
              {product.discount_percent && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-semibold rounded">
                  -{Number(product.discount_percent).toFixed(0)}%
                </span>
              )}
            </div>

            {/* Status and info badges */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  product.status === "available"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {product.status === "available" ? "En Stock" : "Rupture"}
              </span>
              
              {product.min_order && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-700">
                  Min: {product.min_order}
                </span>
              )}
              
              {product.commission_type && product.commission_type !== 'none' && product.commission_value && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700">
                  {product.commission_type === 'fixed' 
                    ? `${getCurrencySymbol(product.currency)}${Number(product.commission_value).toFixed(0)}`
                    : `${Number(product.commission_value).toFixed(0)}%`}
                </span>
              )}
            </div>
          </CardContent>

          {variant === "default" && (
            <CardFooter className="p-4 pt-0">
              <Button
                className={cn(
                  "w-full gap-2 transition-opacity duration-200 ease-out",
                  isAddingToCart && "opacity-70"
                )}
                disabled={isAddingToCart || product.status === 'unavailable'}
                onClick={handleAddToCart}
              >
                {isAddingToCart ? (
                  <div
                    className={`
                      h-4 w-4 animate-spin rounded-full border-2
                      border-background border-t-transparent
                    `}
                  />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                Précommander
              </Button>
            </CardFooter>
          )}

          {variant === "compact" && (
            <CardFooter className="p-4 pt-0">
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground">
                    ${Number(product.price).toFixed(2)}
                  </span>
                  {product.originalPrice ? (
                    <span className="text-sm text-muted-foreground line-through">
                      ${Number(product.originalPrice).toFixed(2)}
                    </span>
                  ) : null}
                </div>
                <Button
                  className="h-8 w-8 rounded-full"
                  disabled={isAddingToCart}
                  onClick={handleAddToCart}
                  size="icon"
                  variant="ghost"
                >
                  {isAddingToCart ? (
                    <div
                      className={`
                        h-4 w-4 animate-spin rounded-full border-2
                        border-primary border-t-transparent
                      `}
                    />
                  ) : (
                    <ShoppingCart className="h-4 w-4" />
                  )}
                  <span className="sr-only">Précommander et discuter</span>
                </Button>
              </div>
            </CardFooter>
          )}

          {!isInStock && (
            <div
              className={`
                absolute inset-0 flex items-center justify-center
                bg-background/80 backdrop-blur-sm
              `}
            >
              <Badge className="px-3 py-1 text-sm" variant="destructive">
                Out of Stock
              </Badge>
            </div>
          )}
        </Card>
      </Link>
    </div>
  );
}
