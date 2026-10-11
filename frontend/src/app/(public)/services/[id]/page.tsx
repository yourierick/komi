"use client";

import { MapPin, Package, Play, Star, BadgeCheck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { useEffect, useState } from "react";

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
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  const mediaItems = React.useMemo(() => {
    const items: { type: "image" | "video"; url: string }[] = [];
    if (service?.images) {
      service.images.forEach((image) => {
        items.push({ type: "image", url: image });
      });
    }
    if (service?.video) {
      items.push({ type: "video", url: service.video });
    }
    return items;
  }, [service?.images, service?.video]);

  const handleContact = () => {
    if (!service?.user) return;

    // Prevent owner from contacting themselves
    if (user?.id === service.user.id) {
      alert("Vous ne pouvez pas vous contacter vous-même");
      return;
    }

    setContactDialogOpen(true);
  };

  const contactViaWhatsApp = () => {
    if (!service?.user?.phone) {
      alert("Numéro de téléphone non disponible");
      return;
    }
    const message = encodeURIComponent(`Bonjour, je suis intéressé par votre service "${service.title}"`);
    window.open(`https://wa.me/${service.user.phone}?text=${message}`, '_blank');
    setContactDialogOpen(false);
  };

  const contactViaEmail = () => {
    if (!service?.user?.email) {
      alert("Email non disponible");
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
        if (serviceData.images && serviceData.images.length > 0) {
          setSelectedMedia(serviceData.images[0]);
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
            container px-4
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
              <div className={`
                relative aspect-square overflow-hidden rounded-xl border
                bg-gray-100
              `}>
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
                      className="h-full w-full object-cover"
                      src={selectedMedia}
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
                      className={`
                        relative aspect-square overflow-hidden rounded-md
                        border-2 transition-colors duration-200 ease-out
                        ${
                        selectedMedia === media.url
                          ? "border-primary"
                          : `
                            border-transparent
                            hover:border-muted-foreground
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
                          alt={`${service.title} ${index + 1}`}
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
                    <h1 className="text-3xl font-bold">{service.title}</h1>
                    <p className="mt-2 text-lg text-muted-foreground">
                      {CATEGORY_LABELS[service.category] || service.category}
                      {service.sub_category && ` • ${service.sub_category}`}
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
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {renderStars(Number(service.rating || 0))}
                    </div>
                    <span className="text-sm font-medium">
                      {Number(service.rating || 0).toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({service.total_reviews || 0} avis)
                    </span>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <span className="text-3xl font-bold">
                  {Number(service.price || 0).toFixed(2)} {getCurrencySymbol(service.currency)}
                </span>
                <span className="text-lg text-muted-foreground">
                  {FREQUENCY_LABELS[service.payment_frequency || 'hourly']}
                </span>
              </div>

              {service.description && (
                <p className="mb-6 text-muted-foreground">{service.description}</p>
              )}

              <div className="mb-6 flex flex-wrap items-center gap-4">
                <span
                  className={`
                    rounded-full px-3 py-1 text-sm font-medium
                    ${
                    service.status === "available"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }
                  `}
                >
                  {service.status === "available" ? "Disponible" : "Indisponible"}
                </span>
              </div>

              {(service.city || service.location) && (
                <div className={`
                  mb-6 flex items-center gap-2 text-muted-foreground
                `}>
                  <MapPin className="h-4 w-4" />
                  <span>
                    {service.city || service.location}
                    {service.country ? `, ${service.country}` : ""}
                  </span>
                </div>
              )}

              {user?.id !== service.user?.id && (
                <Button
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
                  className={`
                    w-full
                    sm:w-auto
                  `}
                >
                  Précommander et Contacter le prestataire
                </Button>
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
                <h2 className="mb-4 text-2xl font-bold">Caractéristiques</h2>
                <ul className="space-y-2">
                  {service.features.map((feature, index) => (
                    <li className="flex items-start" key={index}>
                      <span className={`
                        mt-1 mr-2 h-2 w-2 rounded-full bg-primary
                      `} />
                      <span>
                        <strong>{feature.key}</strong> : {feature.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Specifications */}
            {service.specifications && service.specifications.length > 0 && (
              <section>
                <h2 className="mb-4 text-2xl font-bold">Spécifications</h2>
                <div className="space-y-2">
                  {service.specifications.map((spec, index) => (
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
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Seller info */}
          {service.user && (
            <div className="mt-8 rounded-lg border border-gray-200 bg-muted p-4">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Fournisseur</h3>
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

      {/* Contact Choice Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choisir le moyen de contact</DialogTitle>
            <DialogDescription>
              Comment souhaitez-vous contacter le prestataire "{service?.user?.name}" ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {service?.user?.phone && (
              <Button 
                onClick={contactViaWhatsApp}
                className="w-full sm:w-auto bg-green-500 hover:bg-green-600"
              >
                WhatsApp
              </Button>
            )}
            {service?.user?.email && (
              <Button 
                onClick={contactViaEmail}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Email
              </Button>
            )}
            <Button 
              variant="ghost" 
              onClick={() => setContactDialogOpen(false)}
              className="w-full sm:w-auto"
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
