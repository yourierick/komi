"use client";

import { MessageCircle, Minus, Plus, Star, Store, TrendingUp, User, BadgeCheck } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { publicProductAPI, resellerLinkAPI } from "~/lib/api";
import { ProductComments } from "~/ui/components/product-comments";
import { useCart } from "~/lib/contexts/cart-context";
import { useAuth } from "~/lib/hooks/use-auth";
import { Button } from "~/ui/primitives/button";
import { Separator } from "~/ui/primitives/separator";
import { Skeleton } from "~/ui/primitives/skeleton";

/* -------------------------------------------------------------------------- */
/*                               Type declarations                            */
/* -------------------------------------------------------------------------- */

interface Product {
  category: string;
  commission_type?: 'fixed' | 'none' | 'percentage';
  commission_value?: number;
  currency?: string;
  description: string;
  discount_percent?: number;
  features: any;
  id: string;
  image?: string;
  images?: string[];
  inStock?: boolean;
  marque?: string;
  min_order?: number;
  model?: string;
  name: string;
  old_price?: number;
  originalPrice?: number;
  price: number;
  rating?: number;
  shop?: null | { id: number; name: string };
  short_description?: string;
  specifications?: Record<string, string>;
  specs?: Record<string, string>;
  status?: string;
  total_reviews?: number;
  user?: { email: string; id: number; name: string; rating?: number; certified?: boolean; };
  verified?: boolean;
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

const CATEGORY_LABELS: Record<string, string> = {
    "Agriculture, Livestock, and Fishing": "Agriculture, élevage et pêche",
    "Applications and New Technologies": "Applications et nouvelles technologies",
    "Books, Media, and Games": "Livres, médias et jeux",
    "Buildings": "Bâtiments",
    "Computers and Accessories": "Ordinateurs et accessoires",
    "Construction and Real Estate": "Construction et immobilier",
    "Electrical Equipment and Supplies": "Matériel électrique et fournitures",
    "Electronics and Components": "Électronique et composants",
    "Food and Beverages": "Aliments et boissons",
    "hardware and home improvement": "Quincaillerie et amélioration de la maison",
    "Home and decor": "Maison et décoration",
    "Home Appliances": "Électroménager",
    "Jewelry, Eyewear, and Watches": "Bijoux, lunettes et montres",
    "Luggage, Bags, Cases": "Bagages, sacs et étuis",
    "Makeup": "Maquillage",
    "Medical and Health": "Médical et santé",
    "office supplies": "Fournitures de bureau",
    "Packaging and Printing": "Emballage et impression",
    "Parents, Children, and Games": "Parents, enfants et jeux",
    "Phones and Accessories": "Téléphones et accessoires",
    "Renewable Energy": "Énergie renouvelable",
    "shoes and accessories": "Chaussures et accessoires",
    "Sports and Fitness": "Sports et fitness",
    "vehicle parts and accessories": "Pièces et accessoires automobiles",
    "Vehicles and Transportation": "Véhicules et transport",
    "Wearables and Accessories": "Vêtements et accessoires",
  };


/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export default function ProductDetailPage() {
  /* ----------------------------- Routing --------------------------------- */
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  /* ----------------------------- Hooks ----------------------------------- */
  const { user } = useAuth();
  const { openWithItem } = useCart();

  /* ----------------------------- Local state ----------------------------- */
  const [product, setProduct] = useState<null | Product>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = React.useState(1);
  const [reseller, setReseller] = useState<null | { id: number; name: string; email: string }>(null);
  const refCode = searchParams.get('ref');

  /* --------------------------- Fetch data ------------------------------- */
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await publicProductAPI.get(id);
        const productData = response.data.data;
        setProduct(productData);
        // Set initial quantity to min_order if it exists
        if (productData.min_order && productData.min_order > 0) {
          setQuantity(productData.min_order);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
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

  /* ----------------------- Derived/computed values ----------------------- */
  const discountPercentage = React.useMemo(() => {
    if (!product?.originalPrice) return 0;
    return Math.round(
      ((product.originalPrice - product.price) / product.originalPrice) * 100,
    );
  }, [product]);

  const canResell = React.useMemo(() => {
    if (!product) return false;
    const isNotOwner = product.user?.id !== user?.id;
    const hasCommission = product.commission_type !== 'none';
    return isNotOwner && hasCommission;
  }, [user, product]);

  /* ------------------------------ Handlers ------------------------------- */
  const handleQuantityChange = React.useCallback((newQty: number) => {
    const minOrder = product?.min_order || 1;
    setQuantity((prev) => (newQty >= minOrder ? newQty : prev));
  }, [product]);

  const renderStars = () => {
    const rating = Number(product?.rating ?? 0);
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center">
          {Array.from({ length: 5 }).map((_, i) => {
            const isFull = i < fullStars;
            const isHalf = !isFull && i < rating && hasHalfStar;
            
            return (
              <div className="relative h-5 w-5" key={`star-${product?.id}-${i}`}>
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
          <span className="text-sm text-muted-foreground">
            ({rating.toFixed(1)})
          </span>
        )}
        {product?.total_reviews && product.total_reviews > 0 ? (
          <span className="text-sm text-muted-foreground">
            ({product.total_reviews} avis)
          </span>
        ):('')}
      </div>
    );
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

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 py-10">
          <div
            className={`
              container px-4
              md:px-6
            `}
          >
            <h1 className="text-3xl font-bold">Produit non trouvé</h1>
            <p className="mt-4">
              Le produit que vous recherchez n&apos;existe pas.
            </p>
            <Button className="mt-6" onClick={() => router.push("/products")}>
              Retour aux produits
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
        <div
          className={`
            container px-4
            md:px-6
          `}
        >
          {/* Back link */}
          <Button
            aria-label="Retour aux produits"
            className="mb-6"
            onClick={() => router.push("/products")}
            variant="ghost"
          >
            ← Retour aux produits
          </Button>

          {/* Main grid */}
          <div
            className={`
              grid grid-cols-1 gap-8
              md:grid-cols-2
            `}
          >
            {/* ------------------------ Product image ------------------------ */}
            <div
              className={`
                relative aspect-square overflow-hidden rounded-lg bg-muted
              `}
            >
              <img
                alt={product.name}
                className="h-full w-full object-cover"
                src={product.images?.[0] || product.image || ""}
              />
              {discountPercentage > 0 && (
                <div
                  className={`
                    absolute top-2 left-2 rounded-full bg-red-500 px-2 py-1
                    text-xs font-bold text-white
                  `}
                >
                  -{discountPercentage}%
                </div>
              )}
            </div>

            {/* ---------------------- Product info -------------------------- */}
            <div className="flex flex-col">
              {/* Title & rating */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold">{product.name}</h1>

                <div className="mt-2 flex items-center gap-2">
                  {renderStars()}
                </div>
              </div>

              {/* Category & prices */}
              <div className="mb-6">
                <p className="text-lg font-medium text-muted-foreground">
                  {CATEGORY_LABELS[product.category] || product.category}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-3xl font-bold">
                    {getCurrencySymbol(product.currency)}{Number(product.price).toFixed(2)}
                  </span>
                  {product.old_price && (
                    <span className="text-xl text-muted-foreground line-through">
                      {getCurrencySymbol(product.currency)}{Number(product.old_price).toFixed(2)}
                    </span>
                  )}
                  {product.discount_percent && (
                    <span className={`
                      rounded bg-red-500 px-2 py-1 text-sm font-semibold
                      text-white
                    `}>
                      -{Number(product.discount_percent).toFixed(0)}%
                    </span>
                  )}
                </div>
                
                {/* Important info cards */}
                <div className="mt-4 flex flex-wrap gap-3">
                  {/* Min order */}
                  {product.min_order && (
                    <div className={`
                      flex items-center gap-2 rounded-lg border
                      border-orange-200 bg-orange-50 px-4 py-3
                    `}>
                      <div className={`
                        flex h-10 w-10 items-center justify-center rounded-full
                        bg-orange-100
                      `}>
                        <span className="text-lg font-bold text-orange-700">
                          {product.min_order}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-orange-900">Commande minimum</p>
                        <p className="text-[10px] text-orange-700">Quantité requise</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Commission */}
                  {product.commission_type && product.commission_type !== 'none' && product.commission_value && (
                    <div className={`
                      flex items-center gap-2 rounded-lg border
                      border-purple-200 bg-purple-50 px-4 py-3
                    `}>
                      <div className={`
                        flex h-10 w-10 items-center justify-center rounded-full
                        bg-purple-100
                      `}>
                        <span className="text-sm font-bold text-purple-700">
                          {product.commission_type === 'fixed' ? '$' : '%'}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-purple-900">Commission</p>
                        <p className="text-sm font-bold text-purple-700">
                          {product.commission_type === 'fixed' 
                            ? `${getCurrencySymbol(product.currency)}${Number(product.commission_value).toFixed(2)}`
                            : `${Number(product.commission_value).toFixed(0)}%`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="mb-6 text-muted-foreground">
                {product.description}
              </p>

              {/* Stock */}
              <div aria-atomic="true" aria-live="polite" className="mb-6">
                {product.status === "available" ? (
                  <p className="text-sm font-medium text-green-600">En stock</p>
                ) : (
                  <p className="text-sm font-medium text-red-500">
                    Rupture de stock
                  </p>
                )}
              </div>

              {/* Verified badge */}
              {product.verified && (
                <div className="mb-6">
                  <div className={`
                    inline-flex items-center gap-2 rounded-lg border
                    border-blue-200 bg-blue-50 px-4 py-2
                  `}>
                    <svg 
                      className="h-5 w-5 text-blue-600" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        clipRule="evenodd" 
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                        fillRule="evenodd" 
                      />
                    </svg>
                    <span className="text-sm font-semibold text-blue-900">
                      Produit vérifié
                    </span>
                  </div>
                </div>
              )}

              {/* Seller & shop info */}
              {product.user && (
                <div className={`
                  mb-6 rounded-lg border border-gray-200 bg-muted p-4
                `}>
                  <h3 className="mb-3 text-sm font-semibold bg-muted">Fournisseur</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{product.user.name}</span>
                      {product.user.certified && (
                        <BadgeCheck className="h-4 w-4 text-blue-500" aria-label="Fournisseur certifié" />
                      )}
                      {product.user.rating && product.user.rating > 0 ? (
                        <div className="flex items-center gap-1 ml-2">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium">{product.user.rating.toFixed(1)}</span>
                        </div>
                      ): ('')}
                    </div>
                    {product.shop && (
                      <div className="flex items-center gap-2 text-sm">
                        <Store className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{product.shop.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quantity selector & Add to cart */}

              <div
                className={`
                  mb-6 flex flex-col gap-4
                  sm:flex-row sm:items-center
                `}
              >
                {/* Chat with supplier */}
                {!user || user.id !== product.user?.id ? (
                  <Button
                    className="flex-1"
                    disabled={product.status !== "available"}
                    onClick={() => {
                      const finalReseller = reseller && user?.id === reseller.id ? undefined : reseller || undefined;

                      openWithItem({
                        id: product.id,
                        type: 'product',
                        name: product.name,
                        image: product.images?.[0] || '',
                        price: Number(product.price),
                        quantity: quantity,
                        currency: product.currency,
                        category: product.category,
                        min_order: product.min_order,
                        reseller: finalReseller,
                        shop_id: product.shop?.id || undefined,
                      });
                    }}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Precommander et Discuter
                  </Button>
                ) : null}

                {/* Resale button */}
                {canResell && (
                  <Button
                    className={`
                      flex-1 bg-gradient-to-r from-green-500 to-emerald-600
                      text-white shadow-md shadow-green-500/20
                      hover:from-green-600 hover:to-emerald-700
                      hover:shadow-lg hover:shadow-green-500/30
                      hover:-translate-y-0.5
                      transition-all duration-200
                    `}
                    onClick={async () => {
                      try {
                        const response = await resellerLinkAPI.createProductLink(product.id);
                        const link = response.data.data.link;
                        const shareText = `🔥 Bon plan ! ${product.name} à ${getCurrencySymbol(product.currency)}${Number(product.price).toFixed(2)} → passez à l'action ici !`;
                        
                        if (navigator.share) {
                          // Try to share with image if supported
                          if (navigator.canShare && product.images?.[0]) {
                            try {
                              // Fetch image and convert to blob
                              const imageResponse = await fetch(product.images[0]);
                              const blob = await imageResponse.blob();
                              const file = new File([blob], 'product.jpg', { type: blob.type });
                              
                              // Check if we can share files
                              if (navigator.canShare({ files: [file] })) {
                                await navigator.share({
                                  title: product.name,
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
                            title: product.name,
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
                      }
                    }}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Revendre
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          {/* ---------------------- Features & Specs ------------------------ */}
          <div
            className={`
              grid grid-cols-1 gap-8
              md:grid-cols-2
            `}
          >
            {/* Features */}
            <section>
              <h2 className="mb-4 text-2xl font-bold">Caractéristiques</h2>
              <ul className="space-y-2">
                {Array.isArray(product.features) ? (
                    (product.features as any[]).map((condition, index) => (
                      <li className="flex items-start" key={`condition-${index}`}>
                        <span className={`
                          mt-1 mr-2 h-2 w-2 rounded-full bg-primary
                        `} />
                        <span>
                          <strong>{condition.key}</strong> : {condition.value}
                        </span>
                      </li>
                    ))
                  ) : (
                    <p className="text-muted-foreground">{String(product.features)}</p>
                  )}
              </ul>
            </section>

            {/* Specifications */}
            <section>
              <h2 className="mb-4 text-2xl font-bold">Spécifications</h2>
              <div className="space-y-2">
                {Array.isArray(product.specifications) ? (
                    product.specifications.map((spec: any, index: number) => (
                      <div
                        className="flex justify-between border-b pb-2 text-sm"
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
                  ) : typeof product.specifications === "object" ? (
                    Object.entries(product.specifications).map(([key, value]) => (
                      <div
                        className="flex justify-between border-b pb-2 text-sm"
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
                    <p className="text-muted-foreground">{String(product.specifications)}</p>
                  )}
              </div>
            </section>

            {/* Comments and Reviews */}
            <section className="mt-8">
              <ProductComments 
                productId={product.id} 
                productOwnerId={product.user?.id}
              />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
