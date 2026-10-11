"use client";

import { useRouter } from "next/navigation";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent } from "~/ui/primitives/card";
import { Package as PackageIcon, Trash2 } from "lucide-react";

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
  return currency ? currencySymbols[currency] || currency : "";
}

type Product = {
  id: number;
  name: string;
  slug: string;
  short_description?: string;
  description?: string;
  marque?: string;
  model?: string;
  price: number;
  old_price?: number;
  discount_percent?: number;
  currency: string;
  images?: string[];
  status: "available" | "unavailable";
  is_on_sale?: boolean;
  verified?: boolean;
};

type ProductCardProps = {
  product: Product;
  onDelete?: (id: number) => void;
};

export function ProductCard({ product, onDelete }: ProductCardProps) {
  const router = useRouter();

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer relative"
      onClick={() => router.push(`/dashboard/store/products/${product.id}`)}
    >
      {/* Image container with badges */}
      <div className="relative p-1">
        {product.images && product.images.length > 0 ? (
          <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100 rounded-t-lg p-4">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="aspect-[4/3] w-full bg-gray-100 rounded-t-lg flex items-center justify-center">
            <PackageIcon className="h-12 w-12 text-gray-300" />
          </div>
        )}

        {/* Sale badge - top left */}
        {product.is_on_sale && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-semibold rounded border border-red-600">
              SOLDES
            </span>
          </div>
        )}

        {/* Action buttons - top right */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-white hover:bg-gray-100 rounded-full shadow-md text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(product.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Product info */}
      <CardContent className="p-3 space-y-1.5">
        {/* Price section */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold">
            {Number(product?.price || 0).toFixed(2)} {getCurrencySymbol(product.currency)}
          </span>
          {product.old_price && (
            <>
              <span className="text-[10px] text-muted-foreground">Prix boutique :</span>
              <span className="text-[10px] text-muted-foreground line-through">
                {Number(product.old_price).toFixed(2)} {getCurrencySymbol(product.currency)}
              </span>
            </>
          )}
          {product.discount_percent && (
            <span className="ml-auto px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-semibold rounded">
              -{Number(product.discount_percent).toFixed(0)}%
            </span>
          )}
        </div>

        {/* Brand/Marque */}
        {product.marque && (
          <h3 className="font-bold text-sm uppercase tracking-wide">
            {product.marque}
          </h3>
        )}

        {/* Product name/description */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {product.short_description || product.name}
        </p>

        {/* Model/Size info */}
        {product.model && (
          <p className="text-[10px] text-muted-foreground">{product.model}</p>
        )}

        {/* Status badges */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
              product.status === "available"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {product.status === "available" ? "Disponible" : "Indisponible"}
          </span>
          {product.verified && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">
              Vérifié
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export type { Product };
