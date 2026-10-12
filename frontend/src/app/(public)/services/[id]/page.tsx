"use client";

import { Mail, MapPin, MessageCircle, Package, Play, Star, BadgeCheck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { publicServiceAPI, serviceCommentAPI } from "~/lib/api";
import { Comments } from "~/ui/components/comments";
import { useAuth } from "~/lib/hooks/use-auth";
import { useCart } from "~/lib/contexts/cart-context";
import { Button } from "~/ui/primitives/button";
import { Separator } from "~/ui/primitives/separator";
import { Skeleton } from "~/ui/primitives/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/ui/primitives/dialog";

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
  daily: "par jour",
  hourly: "par heure",
  monthly: "par mois",
  per_project: "par projet",
  weekly: "par semaine",
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

interface Service {
  availability?: Record<string, string[]>;
  category: string;
  city?: string;
  country?: string;
  currency?: string;
  description?: string;
  features?: any[];
  id: string;
  images?: null | string[];
  location?: string;
  payment_frequency?: string;
  price: number;
  rating?: number;
  slug: string;
  specifications?: any[];
  status?: string;
  sub_category?: string;
  title: string;
  total_reviews?: number;
  user?: { email: string; id: number; name: string; phone?: string; rating?: number; certified?: boolean; };
  verified?: boolean;
  video?: null | string;
}

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params?.id as string;
  const { user } = useAuth();
  const { openWithItem } = useCart();

  const [service, setService] = useState<null | Service>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);
  const [selectedMedia, setSelectedMedia] = useState<null | string>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  const mediaItems = React.useMemo(() => {
    const items: { type: "image" | "video"; url: string }[] = [];
    if (service?.images) {
      service.images.filter(Boolean).forEach((image) => {
        items.push({ type: "image", url: image });
      });
    }
    if (service?.video) {
      items.push({ type: "video", url: service.video });
    }
    return items;
  }, [service?.images, service?.video]);

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const contactViaWhatsApp = () => {
    if (!service?.user?.phone) {
      toast.error("Numéro de téléphone non disponible");
      return;
    }
    const message = encodeURIComponent(`Bonjour, je suis intéressé par votre service "${service.title}"`);
    window.open(`https://wa.me/${service.user.phone}?text=${message}`, '_blank');
    setContactDialogOpen(false);
  };

  const contactViaEmail = () => {
    if (!service?.user?.email) {
      toast.error("Email non disponible");
      return;
    }
    const subject = encodeURIComponent(`Intérêt pour votre service "${service.title}"`);
    const body = encodeURIComponent(`Bonjour,\n\nJe suis intéressé par votre service "${service.title}".\n\nPourriez-vous me donner plus d'informations ?\n\nCordialement.`);
    window.location.href = `mailto:${service.user.email}?subject=${subject}&body=${body}`;
    setContactDialogOpen(false);
  };

  useEffect(() => {
    if (!serviceId) return;

    const fetchService = async () => {
      try {
        const response = await publicServiceAPI.get(serviceId);
        const serviceData = response.data.data as Service;
        setService(serviceData);
        const firstImage = serviceData.images?.find((img) => img);
        if (firstImage) {
          setSelectedMedia(firstImage);
          setIsVideo(false);
        } else if (serviceData.video) {
          setSelectedMedia(serviceData.video);
          setIsVideo(true);
        }
      } catch {
        setError("Service introuvable");
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [serviceId]);

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return Array.from({ length: 5 }).map((_, i) => {
      const isFull = i < fullStars;
      const isHalf = !isFull && i < rating && hasHalfStar;

      return (
        <div className="relative h-5 w-5" key={i}>
          <Star className="absolute inset-0 h-5 w-5 text-gray-300" />
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
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 py-10">
          <div
            className={`
              container px-4
              md:px-6
            `}
          >
            <Skeleton className="mb-6 h-10 w-40" />
            <div
              className={`
                grid grid-cols-1 gap-8
                md:grid-cols-2
              `}
            >
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

  if (error || !service) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{error || "Service non trouvé"}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-10">
        <div
          className={`
            container px-4 animate-in fade-in duration-300 ease-out
            motion-safe:slide-in-from-bottom-2
            md:px-6
          `}
        >
          {/* Back link */}
          <Button
            aria-label="Retour aux services"
            className="mb-6"
            onClick={() => router.push("/services")}
            variant="ghost"
          >
            ← Retour aux services
          </Button>

          {/* Main grid */}
          <div
            className={`
              grid grid-cols-1 gap-8
              md:grid-cols-2
            `}
          >
            {/* Media gallery */}
            <div className="space-y-4">
              {/* Main media */}
              <div
                className={`
                  relative aspect-square overflow-hidden rounded-lg bg-muted
                  ${!isVideo && selectedMedia ? "cursor-zoom-in" : ""}
                `}
                onMouseEnter={() => !isVideo && setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleImageMouseMove}
              >
                {selectedMedia ? (
                  isVideo ? (
                    <video
                      className="h-full w-full object-cover"
                      controls
                      poster={mediaItems.find((m) => m.type === "image")?.url}
                      src={selectedMedia}
                    />
                  ) : (
                    <img
                      alt={service.title}
                      className={`
                        h-full w-full object-cover animate-in fade-in
                        duration-200 ease-out transition-transform
                      `}
                      key={selectedMedia}
                      src={selectedMedia}
                      style={{
                        transform: isZoomed ? "scale(2.5)" : "scale(1)",
                        transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                      }}
                    />
                  )
                ) : (
                  <div className={`
                    flex h-full w-full items-center justify-center
                  `}>
                    <Package className="h-24 w-24 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {mediaItems.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {mediaItems.map((media, index) => (
                    <button
                      aria-label={
                        media.type === "video"
                          ? `Vidéo de ${service.title}`
                          : `Image ${index + 1} de ${service.title}`
                      }
                      aria-pressed={selectedMedia === media.url}
                      className={`
                        relative aspect-square overflow-hidden rounded-md
                        border-2 transition-[border-color,transform] duration-200
                        ease-out active:scale-95
                        ${
                        selectedMedia === media.url
                          ? "border-primary"
                          : `
                            border-transparent
                            hover-fine:border-muted-foreground
                          `
                      }
                      `}
                      key={`${media.type}-${index}`}
                      onClick={() => {
                        setSelectedMedia(media.url);
                        setIsVideo(media.type === "video");
                      }}
                      type="button"
                    >
                      {media.type === "video" ? (
                        <div className={`
                          flex h-full w-full items-center justify-center
                          bg-muted
                        `}>
                          <Play className="h-8 w-8 text-muted-foreground" />
                        </div>
                      ) : (
                        <img
                          alt=""
                          aria-hidden="true"
                          className="h-full w-full object-cover"
                          src={media.url}
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col">
              <div className="mb-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight text-balance">{service.title}</h1>
                    <p className="mt-2 text-lg text-muted-foreground">
                      {CATEGORY_LABELS[service.category] || service.category}
                      {service.sub_category && ` · ${service.sub_category}`}
                    </p>
                  </div>
                  {service.verified && (
                    <div className={`
                      flex items-center gap-1.5 rounded-full bg-blue-100 px-3
                      py-1.5 text-blue-700
                    `}>
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path clipRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fillRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium">Vérifié</span>
                    </div>
                  )}
                </div>

                {(service.rating || service.total_reviews) && (
                  <div className="mt-3 flex items-center gap-1.5">
                    <div className="flex items-center gap-1">
                      {renderStars(Number(service.rating || 0))}
                    </div>
                    <span className="text-sm font-medium tabular-nums">
                      {Number(service.rating || 0).toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      · {service.total_reviews || 0} avis
                    </span>
                  </div>
                )}
              </div>

              <div className="mb-6 flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-bold tabular-nums">
                  {getCurrencySymbol(service.currency)}{Number(service.price || 0).toFixed(2)}
                </span>
                <span className="text-lg text-muted-foreground">
                  {FREQUENCY_LABELS[service.payment_frequency || 'hourly']}
                </span>
              </div>

              {service.description && (
                <p className="mb-6 text-muted-foreground">{service.description}</p>
              )}

              <div className="mb-6" aria-atomic="true" aria-live="polite">
                {service.status === "available" ? (
                  <p className="flex items-center gap-2 text-sm font-medium text-green-600">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 motion-safe:animate-ping" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                    </span>
                    Disponible
                  </p>
                ) : (
                  <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-gray-400" />
                    Indisponible
                  </p>
                )}
              </div>

              {(service.city || service.location || service.country) && (
                <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>
                    {[service.city || service.location, service.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}

              {user?.id !== service.user?.id && (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      openWithItem({
                        id: service.id,
                        type: 'service',
                        name: service.title,
                        image: service.images?.[0] || '',
                        price: Number(service.price),
                        quantity: 1,
                        category: service.category,
                        payment_frequency: service.payment_frequency,
                      });
                    }}
                  >
                    Précommander et Discuter
                  </Button>

                  {(service.user?.phone || service.user?.email) && (
                    <Button
                      className="flex-1"
                      onClick={() => setContactDialogOpen(true)}
                      variant="outline"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Contacter le prestataire
                    </Button>
                  )}
                </div>
              )}
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
            {service.features && service.features.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-semibold tracking-tight">Caractéristiques</h2>
                <ul className="space-y-2.5">
                  {service.features.map((feature, index) => (
                    <li className="flex items-start gap-2.5" key={index}>
                      <span className={`
                        mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary
                      `} />
                      <span className="text-sm">
                        <strong className="font-medium">{feature.key}</strong>
                        <span className="text-muted-foreground"> : {feature.value}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Specifications */}
            {service.specifications && service.specifications.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-semibold tracking-tight">Spécifications</h2>
                <div className="divide-y">
                  {service.specifications.map((spec, index) => (
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
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Seller info */}
          {service.user && (
            <div className="mt-8 rounded-lg border border-border bg-muted p-4">
              <h3 className="mb-3 text-sm font-semibold">Fournisseur</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{service.user.name}</span>
                  {service.user.certified && (
                    <BadgeCheck className="h-4 w-4 text-blue-500" aria-label="Fournisseur certifié" />
                  )}
                  {service.user.rating && service.user.rating > 0 && (
                    <div className="flex items-center gap-1 ml-2">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">{service.user.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Comments and Reviews */}
          <section className="mt-8">
            <Comments
              itemId={service.id}
              itemOwnerId={service.user?.id}
              itemType="service"
              commentAPI={serviceCommentAPI}
            />
          </section>
        </div>
      </main>

      {/* Contact choice dialog */}
      <Dialog onOpenChange={setContactDialogOpen} open={contactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contacter le prestataire</DialogTitle>
            <DialogDescription>
              Comment souhaitez-vous contacter {service?.user?.name} ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {service?.user?.phone && (
              <Button
                className="w-full bg-green-600 hover:bg-green-700 sm:w-auto"
                onClick={contactViaWhatsApp}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </Button>
            )}
            {service?.user?.email && (
              <Button
                className="w-full sm:w-auto"
                onClick={contactViaEmail}
                variant="outline"
              >
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
            )}
            <Button
              className="w-full sm:w-auto"
              onClick={() => setContactDialogOpen(false)}
              variant="ghost"
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getCurrencySymbol(currency: string | undefined): string {
  return currency ? currencySymbols[currency] || currency : "";
}
