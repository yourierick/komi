"use client";

import { ShoppingCart, Star } from "lucide-react";
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
  "real estate": "Immobilier",
  "Vehicles": "Véhicules",
  "Machinery": "Machines",
  "Electronics": "Électronique",
  "Events": "Événements",
  "Leisure": "Loisirs",
  "Furniture": "Mobilier",
  "Logistics": "Logistique",
  "Agriculture": "Agriculture",
  "other": "Autre",
};

const PAYMENT_FREQUENCY_LABELS: Record<string, string> = {
  daily: "jour",
  weekly: "semaine",
  monthly: "mois",
};

function getCurrencySymbol(currency: string | undefined): string {
  return currency ? currencySymbols[currency] || currency : "";
}

type RentalCardProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onError"
> & {
  onAddToCart?: (rentalId: string) => void;
  rental: {
    category: string;
    id: string;
    images: string[] | null;
    title: string;
    price: number;
    currency: string;
    payment_frequency: string;
    rating: number;
    location?: string;
    total_reviews?: number;
    city?: string;
    country?: string;
    status?: string;
    verified?: boolean;
    short_description?: string;
    old_price?: number;
    discount_percent?: number;
    commission_type?: 'none' | 'fixed' | 'percentage';
    commission_value?: number;
    user?: { id: number; name: string; email: string };
  };
};

export function RentalCard({
  className,
  onAddToCart,
  rental,
  ...props
}: RentalCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isAddingToCart, setIsAddingToCart] = React.useState(false);
  
  const { user } = useAuth();
  const { openWithItem } = useCart();
  const reseller = useResellerFromUrl();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();

    // Check if user is the rental owner
    if (user && rental.user && user.id === rental.user.id) {
      toast.error("Vous ne pouvez pas commander votre propre location");
      return;
    }

    // Check if logged-in user is the reseller, if so, set reseller to null
    const finalReseller = reseller && user?.id === reseller.id ? undefined : reseller || undefined;
    
    setIsAddingToCart(true);
    
    // Open cart with rental
    openWithItem({
      id: rental.id,
      type: 'rental',
      name: rental.title,
      image: rental.images?.[0] || '',
      price: Number(rental.price),
      quantity: 1,
      currency: rental.currency,
      category: rental.category,
      payment_frequency: rental.payment_frequency,
      reseller: finalReseller,
    });
    
    setTimeout(() => {
      setIsAddingToCart(false);
      if (onAddToCart) {
        onAddToCart(rental.id);
      }
    }, 300);
  };

  // Get image from backend data structure
  const rentalImage = rental.images && rental.images.length > 0 
    ? (Array.isArray(rental.images) ? rental.images[0] : rental.images)
    : null;

  const renderStars = () => {
    const rating = Number(rental.rating ?? 0);
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const isFull = i < fullStars;
          const isHalf = !isFull && i < rating && hasHalfStar;
          
          return (
            <div key={`star-${rental.id}-${i}`} className="relative h-4 w-4">
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
        {rental.total_reviews && rental.total_reviews > 0 && (
          <span className="text-[12px] text-muted-foreground">
            ({rental.total_reviews})
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={cn("group", className)} {...props}>
      <Link href={`/rentals/${rental.id}`}>
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
          <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
            {rentalImage ? (
              <img
                alt={rental.title}
                className={cn(
                  "h-full w-full object-cover transition-transform duration-300 ease",
                  isHovered && "scale-105"
                )}
                src={rentalImage}
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
              {CATEGORY_LABELS[rental.category] || rental.category}
            </Badge>
          </div>

          {/* Rental info */}
          <CardContent className="p-3 space-y-2">
            {/* Rating with 5 stars and verified badge */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {rental.rating !== undefined && rental.rating > 0 && (
                  <>
                    <div className="flex items-center">
                      {renderStars()}
                    </div>
                  </>
                )}
              </div>
              {rental.verified && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">
                  Vérifié
                </span>
              )}
            </div>

            {/* Rental title */}
            <h3 className="text-sm font-semibold line-clamp-1">
              {rental.title}
            </h3>

            {/* Short description */}
            {rental.short_description && (
              <p className="text-[14px] text-muted-foreground line-clamp-2">
                {rental.short_description}
              </p>
            )}

            {/* Location */}
            <p className="text-[14px] text-muted-foreground">
              {rental.location && `${rental.location}, `}
              {rental.city && `${rental.city}, `}
              {rental.country}
            </p>

            {/* Price section */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-lg font-bold text-primary">
                {getCurrencySymbol(rental.currency)}{Number(rental.price).toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">
                /{PAYMENT_FREQUENCY_LABELS[rental.payment_frequency] || rental.payment_frequency}
              </span>
              {rental.old_price && (
                <span className="text-xs text-muted-foreground line-through">
                  {getCurrencySymbol(rental.currency)}{Number(rental.old_price).toFixed(2)}
                </span>
              )}
              {rental.discount_percent && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-semibold rounded">
                  -{Number(rental.discount_percent).toFixed(0)}%
                </span>
              )}
            </div>
            
            {/* Status badges */}
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  rental.status === "available"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {rental.status === "available" ? "Disponible" : "Indisponible"}
              </span>
              
              {rental.commission_type && rental.commission_type !== 'none' && rental.commission_value && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700">
                  {rental.commission_type === 'fixed' 
                    ? `${getCurrencySymbol(rental.currency)}${Number(rental.commission_value).toFixed(0)}`
                    : `${Number(rental.commission_value).toFixed(0)}%`}
                </span>
              )}
              
              {rental.verified && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">
                  Vérifié
                </span>
              )}
            </div>
          </CardContent>

          <CardFooter className="p-3 pt-0">
            <Button
              className={cn(
                "w-full gap-2 transition-opacity duration-200 ease-out",
                isAddingToCart && "opacity-70"
              )}
              disabled={isAddingToCart || rental.status === 'unavailable'}
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
              Précommander et discuter
            </Button>
          </CardFooter>
        </Card>
      </Link>
    </div>
  );
}
