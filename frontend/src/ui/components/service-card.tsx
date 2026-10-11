"use client";

import { MapPin, Package, Star } from "lucide-react";
import * as React from "react";

import { cn } from "~/lib/cn";

const currencySymbols: Record<string, string> = {
  AUD: "A$",
  CAD: "C$",
  CDF: "FC",
  CHF: "CHF",
  CNY: "¥",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  USD: "$",
  XAF: "FCFA",
};

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "/jour",
  hourly: "/heure",
  monthly: "/mois",
  per_project: "/projet",
  weekly: "/semaine",
};

const CATEGORY_LABELS: Record<string, string> = {
  beauty: "Beauté",
  cleaning: "Nettoyage",
  consulting: "Consulting",
  delivery: "Livraison",
  education: "Éducation",
  electrical: "Électricité",
  "electronic and repair": "Électronique et Réparation",
  finance: "Finance",
  health: "Santé",
  legal: "Juridique",
  maintenance: "Maintenance",
  musician: "Musique",
  painting: "Peinture",
  printing: "Impression",
  "software engineering": "Ingénierie Logicielle",
  tech: "Tech",
};

type ServiceCardProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onError"
> & {
  service: {
    category: string;
    city?: string;
    country?: string;
    currency?: string;
    description?: string;
    id: string;
    images?: null | string[];
    location?: string;
    payment_frequency?: string;
    price: number;
    rating?: number;
    status?: string;
    sub_category?: string;
    title: string;
    total_reviews?: number;
    verified?: boolean;
  };
};

export function ServiceCard({
  className,
  service,
  ...props
}: ServiceCardProps) {
  const firstImage = service.images && Array.isArray(service.images) && service.images.length > 0
    ? service.images[0]
    : null;

  const renderStars = () => {
    const rating = Number(service.rating ?? 0);
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const isFull = i < fullStars;
          const isHalf = !isFull && i < rating && hasHalfStar;

          return (
            <div className="relative h-4 w-4" key={`star-${service.id}-${i}`}>
              <Star className="absolute inset-0 h-4 w-4 text-gray-300" />
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
      </div>
    );
  };

  return (
    <div
      className={cn(
        `
          group overflow-hidden rounded-lg border bg-card shadow-sm
          transition-[transform,box-shadow] duration-200 ease-out
          hover:shadow-md
        `,
        className
      )}
      {...props}
    >
      <div className="relative p-1">
        {firstImage ? (
          <div className={`
            aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-gray-100
          `}>
            <img
              alt={service.title}
              className={`
                h-full w-full object-cover transition-transform duration-300
                group-hover:scale-105
              `}
              src={firstImage}
            />
          </div>
        ) : (
          <div className={`
            flex aspect-[4/3] w-full items-center justify-center rounded-t-lg
            bg-gray-100
          `}>
            <Package className="h-12 w-12 text-gray-300" />
          </div>
        )}

        {service.verified && (
          <div className="absolute top-3 left-3">
            <span className={`
              rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium
              text-blue-700
            `}>
              Vérifié
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold">
            {Number(service.price || 0).toFixed(2)} {getCurrencySymbol(service.currency)}
          </span>
          <span className="text-xs text-muted-foreground">
            {FREQUENCY_LABELS[service.payment_frequency || 'hourly'] || service.payment_frequency}
          </span>
        </div>

        <h3 className="line-clamp-1 text-sm font-semibold">{service.title}</h3>

        <p className="line-clamp-2 text-xs text-muted-foreground">
          {service.description}
        </p>

        {(service.city || service.location) && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {service.city || service.location}
            {service.country ? `, ${service.country}` : ""}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className={`
            rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium
            text-primary
          `}>
            {CATEGORY_LABELS[service.category] || service.category}
          </span>
          {service.status && (
            <span
              className={`
                rounded-full px-2 py-0.5 text-[10px] font-medium
                ${
                service.status === "available"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }
              `}
            >
              {service.status === "available" ? "Disponible" : "Indisponible"}
            </span>
          )}
        </div>

        {(service.rating || service.total_reviews) && (
          <div className="flex items-center gap-2 pt-1">
            {renderStars()}
            <span className="text-xs text-muted-foreground">
              {Number(service.rating || 0).toFixed(1)} ({service.total_reviews || 0})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function getCurrencySymbol(currency: string | undefined): string {
  return currency ? currencySymbols[currency] || currency : "";
}
