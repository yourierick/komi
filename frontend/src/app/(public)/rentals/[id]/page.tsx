"use client";

import { Loader2, MapPin, MessageCircle, Minus, Plus, Star, TrendingUp, User, BadgeCheck } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { publicRentalAPI, resellerLinkAPI, rentalCommentAPI } from "~/lib/api";
import { Comments } from "~/ui/components/comments";
import { useCart } from "~/lib/contexts/cart-context";
import { useAuth } from "~/lib/hooks/use-auth";
import { Button } from "~/ui/primitives/button";
import { Separator } from "~/ui/primitives/separator";
import { Skeleton } from "~/ui/primitives/skeleton";

/* -------------------------------------------------------------------------- */
/*                               Type declarations                            */
/* -------------------------------------------------------------------------- */

interface Rental {
  category: string;
  city: null | string;
  commission_type?: 'fixed' | 'none' | 'percentage';
  commission_value?: number;
  conditions: any;
  country: null | string;
  created_at: string;
  currency: string;
  description: string;
  id: string;
  images: null | string[];
  location: null | string;
  payment_frequency: string;
  price: number;
  rating: number;
  old_price?: number;
  discount_percent?: number;
  slug: string;
  specifications: any;
  status: string;
  sub_category: null | string;
  title: string;
  total_reviews: number;
  updated_at: string;
  user?: { email: string; id: number; name: string; rating?: number; certified?: boolean; };
  verified: boolean;
}

/* -------------------------------------------------------------------------- */
/*                         Helpers (shared, memo-safe)                        */
/* -------------------------------------------------------------------------- */

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

function getCurrencySymbol(currency: string | undefined): string {
  return currency ? currencySymbols[currency] || currency : "$";
}

/** Build an integer array `[0,…,length-1]` once */
const range = (length: number) => Array.from({ length }, (_, i) => i);

const CATEGORY_LABELS: Record<string, string> = {
  "Agriculture": "Agriculture",
  "Electronics": "Électronique",
  "Events": "Événements",
  "Furniture": "Mobilier",
  "Leisure": "Loisirs",
  "Logistics": "Logistique",
  "Machinery": "Machines",
  "other": "Autre",
  "real estate": "Immobilier",
  "Vehicles": "Véhicules",
};

const PAYMENT_FREQUENCY_LABELS: Record<string, string> = {
  "daily": "par jour",
  "monthly": "par mois",
  "weekly": "par semaine",
};

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export default function RentalDetailPage() {
  /* ----------------------------- Routing --------------------------------- */
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  /* ----------------------------- Hooks ----------------------------------- */
  const { user } = useAuth();
  const { openWithItem } = useCart();

  /* ----------------------------- Local state ----------------------------- */
  const [rental, setRental] = useState<null | Rental>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<null | string>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [quantity, setQuantity] = useState(1);
  const [sharing, setSharing] = useState(false);
  const [reseller, setReseller] = useState<null | { id: number; name: string; email: string }>(null);
  const refCode = searchParams.get('ref');

  /* --------------------------- Fetch data ------------------------------- */
  useEffect(() => {
    const fetchRental = async () => {
      try {
        const response = await publicRentalAPI.get(id);
        const rentalData = response.data.data;
        setRental(rentalData);
        setSelectedImage(rentalData.images?.find((img: string) => img) || null);
      } catch (error) {
        console.error("Error fetching rental:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRental();
    }
  }, [id]);

  /* --------------------------- Fetch reseller info --------------------------- */
  useEffect(() => {
    const fetchReseller = async () => {
      if (refCode) {
        try {
          const response = await resellerLinkAPI.getResellerByCode(refCode);
          setReseller(response.data.data);
        } catch (error) {
          console.error("Error fetching reseller info:", error);
        }
      }
    };

    fetchReseller();
  }, [refCode]);

  const canResell = React.useMemo(() => {
    if (!rental || !user) return false;
    const isNotOwner = rental.user?.id !== user.id;
    const hasCommission = rental.commission_type !== 'none' && (rental.commission_value ?? 0) > 0;
    return isNotOwner && hasCommission;
  }, [user, rental]);

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const renderStars = () => {
    const rating = Number(rental?.rating ?? 0);
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center">
          {Array.from({ length: 5 }).map((_, i) => {
            const isFull = i < fullStars;
            const isHalf = !isFull && i < rating && hasHalfStar;
            
            return (
              <div className="relative h-5 w-5" key={`star-${rental?.id}-${i}`}>
                {/* Background star (empty) */}
                <Star className="absolute inset-0 h-5 w-5 text-gray-300" />
                {/* Foreground star (filled) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    width: isFull ? '100%' : isHalf ? '50%' : '0%',
                  }}
                >
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
            );
          })}
        </div>
        {rating > 0 && (
          <span className="text-sm font-medium tabular-nums">
            {rating.toFixed(1)}
          </span>
        )}
        {rental?.total_reviews && rental.total_reviews > 0 ? (
          <span className="text-sm text-muted-foreground">
            · {rental.total_reviews} avis
          </span>
        ):(<></>)}
      </div>
    );
  };

  const handleImageMouseEnter = () => {
    setIsZoomed(true);
  };

  const handleImageMouseLeave = () => {
    setIsZoomed(false);
  };

  const handleQuantityChange = (newQty: number) => {
    setQuantity((prev) => (newQty >= 1 ? newQty : prev));
  };

  /* -------------------------- Conditional UI ---------------------------- */
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 py-10">
          <div className={`
            container px-4
            md:px-6
          `}>
            <Skeleton className="mb-6 h-10 w-40" />
            <div className={`
              grid grid-cols-1 gap-8
              md:grid-cols-2
            `}>
              <Skeleton className="aspect-square w-full rounded-lg" />
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="mt-6 space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 py-10">
          <div className={`
            container px-4
            md:px-6
          `}>
            <h1 className="text-3xl font-bold">Location non trouvée</h1>
            <p className="mt-4">
              La location que vous recherchez n&apos;existe pas.
            </p>
            <Button className="mt-6" onClick={() => router.push("/rentals")}>
              Retour aux locations
            </Button>
          </div>
        </main>
      </div>
    );
  }

  /* ------------------------------ Markup --------------------------------- */
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-10">
        <div className={`
          container px-4 animate-in fade-in duration-300 ease-out
          motion-safe:slide-in-from-bottom-2
          md:px-6
        `}>
          {/* Back link */}
          <Button
            aria-label="Back to rentals"
            className="mb-6"
            onClick={() => router.push("/rentals")}
            variant="ghost"
          >
            ← Retour aux locations
          </Button>

          {/* Main grid */}
          <div className={`
            grid grid-cols-1 gap-8
            md:grid-cols-2
          `}>
            {/* Rental image with gallery */}
            <div className="space-y-4">
              {/* Main image with zoom */}
              <div
                className={`
                  relative aspect-square cursor-zoom-in overflow-hidden
                  rounded-lg bg-muted
                `}
                onMouseEnter={handleImageMouseEnter}
                onMouseLeave={handleImageMouseLeave}
                onMouseMove={handleImageMouseMove}
              >
                {selectedImage ? (
                  <img
                    alt={rental.title}
                    className={`
                      h-full w-full object-cover animate-in fade-in
                      duration-200 ease-out transition-transform
                    `}
                    key={selectedImage}
                    src={selectedImage}
                    style={{
                      transform: isZoomed ? "scale(2.5)" : "scale(1)",
                      transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                    }}
                  />
                ) : (
                  <div className={`
                    flex h-full w-full items-center justify-center
                    text-muted-foreground
                  `}>
                    Aucune image
                  </div>
                )}
                {rental.verified && (
                  <div className={`
                    absolute top-2 right-2 rounded-full bg-blue-500 px-2 py-1
                    text-xs font-bold text-white
                  `}>
                    Vérifié
                  </div>
                )}
              </div>

              {/* Thumbnail gallery */}
              {rental.images && rental.images.filter(Boolean).length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {rental.images.filter(Boolean).map((image, index) => (
                    <button
                      aria-label={`Image ${index + 1} de ${rental.title}`}
                      aria-pressed={selectedImage === image}
                      className={`
                        relative aspect-square overflow-hidden rounded-md
                        border-2 transition-[border-color,transform] duration-200
                        ease-out active:scale-95
                        ${
                        selectedImage === image
                          ? "border-primary"
                          : `
                            border-transparent
                            hover-fine:border-muted-foreground
                          `
                      }
                      `}
                      key={index}
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        alt=""
                        aria-hidden="true"
                        className="h-full w-full object-cover"
                        src={image}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Rental info */}
            <div className="flex flex-col">
              {/* Title & rating */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-balance">{rental.title}</h1>

                <div className="mt-2 flex items-center gap-2">
                  {/* Stars */}
                  <div
                    aria-label={`Rating ${rental.rating} out of 5`}
                    className="flex items-center"
                  >
                    {renderStars()}
                  </div>
                </div>
              </div>

              {/* Category & prices */}
              <div className="mb-6">
                <p className="text-lg font-medium text-muted-foreground">
                  {CATEGORY_LABELS[rental.category] || rental.category}
                </p>
                <div className="mt-2 flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl font-bold tabular-nums">
                    {getCurrencySymbol(rental.currency)}{Number(rental.price).toFixed(2)}
                  </span>
                  <span className="text-lg text-muted-foreground">
                    {PAYMENT_FREQUENCY_LABELS[rental.payment_frequency] || rental.payment_frequency}
                  </span>
                  {rental.old_price && (
                    <span className="text-xl text-muted-foreground line-through tabular-nums">
                      {getCurrencySymbol(rental.currency)}{Number(rental.old_price).toFixed(2)}
                    </span>
                  )}
                  {rental.discount_percent && (
                    <span className={`
                      rounded-full bg-red-500 px-2 py-1 text-xs font-bold
                      text-white
                    `}>
                      -{Number(rental.discount_percent).toFixed(0)}%
                    </span>
                  )}
                </div>

                {/* Commission */}
                {rental.commission_type && rental.commission_type !== 'none' && rental.commission_value && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <div className={`
                      flex items-center gap-2 rounded-lg border
                      border-purple-200 bg-purple-50 px-4 py-3
                    `}>
                      <div className={`
                        flex h-10 w-10 items-center justify-center rounded-full
                        bg-purple-100
                      `}>
                        <TrendingUp className="h-5 w-5 text-purple-700" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-900">Commission à la location</p>
                        <p className="text-[12px] font-semibold text-purple-700 tabular-nums">
                          {rental.commission_type === 'fixed'
                            ? `${getCurrencySymbol(rental.currency)}${Number(rental.commission_value).toFixed(2)} par vente`
                            : `${Number(rental.commission_value).toFixed(0)}% par location`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Location */}
              {(rental.location || rental.city || rental.country) && (
                <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>
                    {[rental.location, rental.city, rental.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}

              {/* Description */}
              <p className="mb-6 text-muted-foreground">
                {rental.description || "Aucune description disponible."}
              </p>

              {/* Status */}
              <div aria-atomic="true" aria-live="polite" className="mb-6">
                {rental.status === "available" ? (
                  <p className="flex items-center gap-2 text-sm font-medium text-green-600">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 motion-safe:animate-ping" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                    </span>
                    Disponible
                  </p>
                ) : (
                  <p className="flex items-center gap-2 text-sm font-medium text-red-500">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Non disponible
                  </p>
                )}
              </div>

              {/* Seller info */}
              {rental.user && (
                <div className={`
                  mb-6 rounded-lg border border-border bg-muted p-4
                `}>
                  <h3 className="mb-3 text-sm font-semibold">Fournisseur</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{rental.user.name}</span>
                      {rental.user.certified && (
                        <BadgeCheck className="h-4 w-4 text-blue-500" aria-label="Fournisseur certifié" />
                      )}
                      {rental.user.rating && rental.user.rating > 0 ? (
                        <div className="flex items-center gap-1 ml-2">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium">{rental.user.rating.toFixed(1)}</span>
                        </div>
                      ):('')}
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity selector & actions */}
              {(!user || user.id !== rental.user?.id) && (
                <div className={`
                  mb-6 flex flex-col gap-4
                  sm:flex-row sm:items-center
                `}>
                  {/* Quantity stepper */}
                  <div className={`
                    flex items-center rounded-md border border-input
                  `}>
                    <Button
                      aria-label="Réduire la quantité"
                      className="h-9 w-9 rounded-r-none"
                      disabled={quantity <= 1}
                      onClick={() => handleQuantityChange(quantity - 1)}
                      size="icon"
                      variant="ghost"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span
                      aria-live="polite"
                      className={`
                        w-12 text-center text-sm font-semibold tabular-nums
                        select-none
                      `}
                    >
                      {quantity}
                    </span>
                    <Button
                      aria-label="Augmenter la quantité"
                      className="h-9 w-9 rounded-l-none"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      size="icon"
                      variant="ghost"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Chat with supplier */}
                  <Button
                    className="flex-1"
                    disabled={rental.status !== "available"}
                    onClick={() => {
                      const finalReseller = reseller && user?.id === reseller.id ? undefined : reseller || undefined;

                      openWithItem({
                        id: rental.id,
                        type: 'rental',
                        name: rental.title,
                        image: rental.images?.[0] || '',
                        price: Number(rental.price),
                        quantity: quantity,
                        currency: rental.currency,
                        category: rental.category,
                        payment_frequency: rental.payment_frequency,
                        reseller: finalReseller,
                      });
                    }}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Precommander et Discuter
                  </Button>

                  {/* Resale button */}
                  {canResell && (
                  <Button
                    className={`
                      flex-1 bg-gradient-to-r from-green-500 to-emerald-600
                      text-white shadow-md shadow-green-500/20
                      transition-[transform,box-shadow] duration-200 ease-out
                      hover-fine:from-green-600 hover-fine:to-emerald-700
                      hover-fine:shadow-lg hover-fine:shadow-green-500/30
                      hover-fine:-translate-y-0.5
                    `}
                    disabled={sharing}
                    onClick={async () => {
                      setSharing(true);
                      try {
                        const response = await resellerLinkAPI.createRentalLink(rental.id);
                        const link = response.data.data.link;
                        const shareText = `🔥 Bon plan ! ${rental.title} à ${getCurrencySymbol(rental.currency)}${Number(rental.price).toFixed(2)} → passez à l'action ici !`;
                        
                        if (navigator.share) {
                          // Try to share with image if supported
                          if (navigator.canShare && rental.images?.[0]) {
                            try {
                              // Fetch image and convert to blob
                              const imageResponse = await fetch(rental.images[0]);
                              const blob = await imageResponse.blob();
                              const file = new File([blob], 'rental.jpg', { type: blob.type });
                              
                              // Check if we can share files
                              if (navigator.canShare({ files: [file] })) {
                                await navigator.share({
                                  title: rental.title,
                                  text: shareText,
                                  url: link,
                                  files: [file],
                                });
                                toast.success("Lien de revente partagé avec image !");
                                return;
                              }
                            } catch (imageError) {
                              console.log("Image sharing not supported, falling back to text only");
                            }
                          }
                          
                          // Fallback to text-only share
                          await navigator.share({
                            title: rental.title,
                            text: shareText,
                            url: link,
                          });
                          toast.success("Lien de revente partagé !");
                        } else {
                          // Fallback: copy to clipboard
                          await navigator.clipboard.writeText(`${shareText}\n${link}`);
                          toast.success("Lien de revente copié dans le presse-papier !");
                        }
                      } catch (error: any) {
                        if (error.name !== 'AbortError') {
                          console.error("Error creating reseller link:", error);
                          toast.error("Erreur lors de la création du lien de revente");
                        }
                      } finally {
                        setSharing(false);
                      }
                    }}
                  >
                    {sharing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <TrendingUp className="mr-2 h-4 w-4" />
                    )}
                    Parrainer
                  </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          <Separator className="my-8" />

          {/* Conditions & Specifications */}
          <div className={`
            grid grid-cols-1 gap-8
            md:grid-cols-2
          `}>
            {/* Conditions */}
            {rental.conditions && (
              <section>
                <h2 className="mb-4 text-xl font-semibold tracking-tight">Conditions</h2>
                {Array.isArray(rental.conditions) && rental.conditions.length > 0 ? (
                  <ul className="space-y-2.5">
                    {(rental.conditions as any[]).map((condition, index) => (
                      <li className="flex items-start gap-2.5" key={`condition-${index}`}>
                        <span className={`
                          mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary
                        `} />
                        <span className="text-sm">
                          <strong className="font-medium">{condition.key}</strong>
                          <span className="text-muted-foreground"> : {condition.value}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">{String(rental.conditions)}</p>
                )}
              </section>
            )}

            {/* Specifications */}
            {rental.specifications && (
              <section>
                <h2 className="mb-4 text-xl font-semibold tracking-tight">Spécifications</h2>
                <div className="divide-y">
                  {Array.isArray(rental.specifications) ? (
                    rental.specifications.map((spec: any, index: number) => (
                      <div
                        className="flex justify-between py-2.5 text-sm"
                        key={index}
                      >
                        <span className="font-medium capitalize">
                          {spec.key || String(index)}
                        </span>
                        <span className="text-muted-foreground">
                          {typeof spec.value === 'object' ? JSON.stringify(spec.value) : String(spec.value)}
                        </span>
                      </div>
                    ))
                  ) : typeof rental.specifications === "object" ? (
                    Object.entries(rental.specifications).map(([key, value]) => (
                      <div
                        className="flex justify-between py-2.5 text-sm"
                        key={key}
                      >
                        <span className="font-medium capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <span className="text-muted-foreground">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{String(rental.specifications)}</p>
                  )}
                </div>
              </section>
            )}

            {/* Comments and Reviews */}
            <section className="mt-8 md:col-span-2">
              <Comments 
                itemId={rental.id} 
                itemOwnerId={rental.user?.id}
                itemType="rental"
                commentAPI={rentalCommentAPI}
              />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
