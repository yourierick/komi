"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "~/lib/hooks/use-auth";
import { rentalAPI, rentalCommentAPI } from "~/lib/api";
import { toast } from "sonner";
import { CommentsDashboard } from "~/ui/components/comments-dashboard";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { ArrowLeft, MapPin, Package as PackageIcon, CheckCircle, Loader2, Plus, X, Image as ImageIcon, Edit } from "lucide-react";

const CATEGORIES = [
  "real estate",
  "Vehicles",
  "Machinery",
  "Electronics",
  "Events",
  "Leisure",
  "Furniture",
  "Logistics",
  "Agriculture",
  "other",
];

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

const currencySymbols: Record<string, string> = {
  USD: "$", EUR: "€", XAF: "FCFA", CDF: "FC",
  GBP: "£", JPY: "¥", CAD: "C$", AUD: "A$", CHF: "CHF", CNY: "¥",
};
function getCurrencySymbol(c?: string) { return c ? currencySymbols[c] || c : ""; }

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "/ jour", weekly: "/ semaine", monthly: "/ mois",
};
const STATUS_LABELS: Record<string, string> = {
  available: "Disponible", rented: "Loué", maintenance: "En maintenance", unavailable: "Indisponible",
};
const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  rented: "bg-blue-100 text-blue-700",
  maintenance: "bg-yellow-100 text-yellow-700",
  unavailable: "bg-gray-100 text-gray-700",
};

type Rental = {
  id: number;
  title: string;
  slug: string;
  description?: string;
  short_description?: string;
  category: string;
  sub_category?: string;
  location?: string;
  city?: string;
  country?: string;
  price: number;
  old_price?: number;
  discount_percent?: number;
  currency: string;
  payment_frequency: "daily" | "weekly" | "monthly";
  status: "available" | "rented" | "maintenance" | "unavailable";
  verified: boolean;
  rating: number;
  total_reviews: number;
  commission_type?: 'none' | 'fixed' | 'percentage';
  commission_value?: number;
  conditions?: { key: string; value: string }[];
  specifications?: { key: string; value: string }[];
  images?: string[];
  created_at: string;
  updated_at: string;
};

export default function RentalDetailPageClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const rentalId = params.id as string;

  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    short_description: "",
    category: "",
    sub_category: "",
    location: "",
    city: "",
    country: "",
    price: "",
    old_price: "",
    discount_percent: "",
    currency: "USD",
    payment_frequency: "daily" as "daily" | "weekly" | "monthly",
    status: "available" as "available" | "rented" | "maintenance" | "unavailable",
    commission_type: "none" as "none" | "fixed" | "percentage",
    commission_value: "",
    conditions: [] as { key: string; value: string }[],
    specifications: [] as { key: string; value: string }[],
    images: [] as File[],
    existingImages: [] as string[],
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/sign-in");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user && rentalId) loadRental();
  }, [user, rentalId]);

  const loadRental = async () => {
    try {
      setLoading(true);
      const response = await rentalAPI.get(rentalId);
      const data: Rental = response.data.data;
      setRental(data);
      setSelectedImage(data.images?.[0] || null);
      setFormData({
        title: data.title,
        description: data.description || "",
        short_description: data.short_description || "",
        category: data.category,
        sub_category: data.sub_category || "",
        location: data.location || "",
        city: data.city || "",
        country: data.country || "",
        price: data.price.toString(),
        old_price: data.old_price?.toString() || "",
        discount_percent: data.discount_percent?.toString() || "",
        currency: data.currency,
        payment_frequency: data.payment_frequency,
        status: data.status,
        commission_type: data.commission_type || "none",
        commission_value: data.commission_value?.toString() || "",
        conditions: (data.conditions as any) || [],
        specifications: (data.specifications as any) || [],
        images: [],
        existingImages: Array.isArray(data.images) ? data.images : [],
      });
    } catch {
      setError("Erreur lors du chargement de la location");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setValidationErrors({});
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("title", formData.title);
      fd.append("description", formData.description);
      fd.append("short_description", formData.short_description);
      fd.append("category", formData.category);
      fd.append("sub_category", formData.sub_category);
      fd.append("location", formData.location);
      fd.append("city", formData.city);
      fd.append("country", formData.country);
      fd.append("price", formData.price);
      if (formData.old_price) {
        fd.append("old_price", formData.old_price);
      }
      if (formData.discount_percent) {
        fd.append("discount_percent", formData.discount_percent);
      }
      fd.append("currency", formData.currency);
      fd.append("payment_frequency", formData.payment_frequency);
      fd.append("status", formData.status);
      fd.append("commission_type", formData.commission_type);
      if (formData.commission_type !== 'none' && formData.commission_value) {
        fd.append("commission_value", formData.commission_value);
      }
      fd.append("conditions", JSON.stringify(formData.conditions));
      fd.append("specifications", JSON.stringify(formData.specifications));
      formData.images.forEach((file) => fd.append("images[]", file));

      await rentalAPI.update(rentalId, fd);
      setMessage("Location mise à jour avec succès");
      await loadRental();
      setIsEditing(false);
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const imageErrors = Object.keys(errors).filter((k) => k.startsWith("images."));
        if (imageErrors.length > 0) {
          errors.images = imageErrors.map((k) => {
            const e = errors[k]; return Array.isArray(e) ? e.join(", ") : e;
          }).join(", ");
        }
        Object.keys(errors).forEach((k) => {
          if (Array.isArray(errors[k])) errors[k] = errors[k].join(", ");
        });
        setValidationErrors(errors);
        setError("Veuillez corriger les erreurs dans le formulaire");
        toast.error("Le formulaire est invalide. Veuillez corriger les erreurs indiquées.");
      } else {
        setError("Erreur lors de la mise à jour de la location");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const addCondition = () =>
    setFormData({ ...formData, conditions: [...formData.conditions, { key: "", value: "" }] });
  const removeCondition = (i: number) =>
    setFormData({ ...formData, conditions: formData.conditions.filter((_, idx) => idx !== i) });
  const updateCondition = (i: number, field: "key" | "value", val: string) => {
    const updated = [...formData.conditions]; updated[i][field] = val;
    setFormData({ ...formData, conditions: updated });
  };
  const addSpecification = () =>
    setFormData({ ...formData, specifications: [...formData.specifications, { key: "", value: "" }] });
  const removeSpecification = (i: number) =>
    setFormData({ ...formData, specifications: formData.specifications.filter((_, idx) => idx !== i) });
  const updateSpecification = (i: number, field: "key" | "value", val: string) => {
    const updated = [...formData.specifications]; updated[i][field] = val;
    setFormData({ ...formData, specifications: updated });
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files) return;
    const newFiles = Array.from(files);
    if (formData.images.length + (formData.existingImages?.length || 0) + newFiles.length > 6) {
      setError("Maximum 6 images autorisées"); return;
    }
    setFormData({ ...formData, images: [...formData.images, ...newFiles] });
  };
  const removeImage = (i: number) =>
    setFormData({ ...formData, images: formData.images.filter((_, idx) => idx !== i) });
  const removeExistingImage = (i: number) =>
    setFormData({ ...formData, existingImages: formData.existingImages.filter((_, idx) => idx !== i) });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = imageContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({ x, y });
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center"><h1 className="text-2xl font-bold">Chargement...</h1></div>
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Location introuvable</h1>
          <Button className="mt-4" onClick={() => router.push("/dashboard/rentals")}>Retour</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/dashboard/rentals")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{rental.title}</h1>
            <p className="text-muted-foreground">{CATEGORY_LABELS[rental.category] || rental.category}</p>
          </div>
        </div>
        {!isEditing && (
          <Button onClick={() => { setIsEditing(true); setMessage(""); setError(""); }}>
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">{error}</div>
      )}
      {message && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {message}
        </div>
      )}

      {!isEditing ? (
        /* ============ VUE DÉTAIL ============ */
        <div className="flex min-h-screen flex-col">
          <main className="flex-1 py-10">
            <div className="container px-4 md:px-6">
              {/* Back link */}
              <Button
                aria-label="Retour"
                className="mb-6"
                onClick={() => router.push("/dashboard/rentals")}
                variant="ghost"
              >
                ← Retour
              </Button>

              {/* Main grid */}
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Rental image */}
                <div
                  ref={imageContainerRef}
                  className="relative aspect-square overflow-hidden rounded-lg bg-muted cursor-crosshair"
                  onMouseMove={handleMouseMove}
                  onMouseEnter={() => setIsZoomed(true)}
                  onMouseLeave={() => setIsZoomed(false)}
                >
                  {selectedImage || rental.images?.[0] ? (
                    <img
                      alt={rental.title}
                      className="w-full h-full object-cover transition-transform duration-200 ease-out"
                      style={{
                        transform: isZoomed ? "scale(2.5)" : "scale(1)",
                        transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                      }}
                      src={selectedImage || rental.images?.[0]}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PackageIcon className="h-24 w-24 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Rental info */}
                <div className="flex flex-col">
                  {/* Title & category */}
                  <div className="mb-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h1 className="text-3xl font-bold">{rental.title}</h1>
                        <div className="mt-2 flex items-center gap-2">
                          <PackageIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-lg font-medium text-muted-foreground">
                            {CATEGORY_LABELS[rental.category] || rental.category}
                          </span>
                          {rental.sub_category && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-lg font-medium text-muted-foreground">
                                {rental.sub_category}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {rental.verified && (
                        <div className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-blue-700">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium">Vérifié</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Rating & Reviews */}
                    {(Number(rental.rating) > 0 || Number(rental.total_reviews) > 0) && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => {
                            const rating = Number(rental.rating || 0);
                            const fullStars = Math.floor(rating);
                            const hasHalfStar = rating % 1 >= 0.5;
                            const isFull = i < fullStars;
                            const isHalf = !isFull && i < rating && hasHalfStar;
                            
                            return (
                              <div key={`star-${i}`} className="relative h-5 w-5">
                                {/* Background star (empty) */}
                                <svg className="absolute inset-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                {/* Foreground star (filled) */}
                                <div
                                  className="absolute inset-0 overflow-hidden"
                                  style={{
                                    width: isFull ? '100%' : isHalf ? '50%' : '0%',
                                  }}
                                >
                                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <span className="text-sm font-medium">{Number(rental.rating || 0).toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">
                          ({Number(rental.total_reviews || 0)} {Number(rental.total_reviews || 0) > 1 ? 'avis' : 'avis'})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Prices */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold">
                        {Number(rental.price || 0).toFixed(2)} {getCurrencySymbol(rental.currency)}
                      </span>
                      <span className="text-lg text-muted-foreground">
                        {FREQUENCY_LABELS[rental.payment_frequency]}
                      </span>
                      {rental.old_price && (
                        <span className="text-xl text-muted-foreground line-through">
                          {Number(rental.old_price).toFixed(2)} {getCurrencySymbol(rental.currency)}
                        </span>
                      )}
                      {rental.discount_percent && (
                        <span className="px-2 py-1 bg-red-500 text-white text-sm font-semibold rounded">
                          -{Number(rental.discount_percent).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {rental.description && (
                    <p className="mb-6 text-muted-foreground">
                      {rental.description}
                    </p>
                  )}

                  {/* Short Description */}
                  {rental.short_description && (
                    <div className="mb-6 rounded-lg bg-muted/50 p-4">
                      <p className="text-sm text-muted-foreground italic">
                        {rental.short_description}
                      </p>
                    </div>
                  )}

                  {/* Stock status & Commission */}
                  <div className="mb-6 flex flex-wrap items-center gap-4">
                    <div>
                      {rental.status === "available" ? (
                        <p className="text-sm font-medium text-green-600">✓ Disponible</p>
                      ) : rental.status === "rented" ? (
                        <p className="text-sm font-medium text-blue-600">● Loué</p>
                      ) : rental.status === "maintenance" ? (
                        <p className="text-sm font-medium text-yellow-600">⚠ En maintenance</p>
                      ) : (
                        <p className="text-sm font-medium text-red-500">✕ Indisponible</p>
                      )}
                    </div>
                    
                    {rental.commission_type && rental.commission_type !== 'none' && rental.commission_value && (
                      <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2 border border-purple-200">
                        <span className="text-sm font-medium text-purple-900">Commission:</span>
                        <span className="text-sm font-bold text-purple-700">
                          {rental.commission_type === 'fixed' 
                            ? `${getCurrencySymbol(rental.currency)}${Number(rental.commission_value).toFixed(2)}`
                            : `${Number(rental.commission_value).toFixed(0)}%`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Button
                      className="flex-1"
                      onClick={() => setIsEditing(true)}
                    >
                      Modifier le bien de location
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/dashboard/rentals")}
                    >
                      Retour
                    </Button>
                  </div>
                </div>
              </div>

              <div className="my-8 border-t" />

              {/* Location */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
                {(rental.location || rental.city || rental.country) && (
                  <div className="rounded-lg border p-6">
                    <h2 className="mb-3 text-xl font-bold">Localisation</h2>
                    <div className="space-y-2">
                      {rental.location && (
                        <div className="flex justify-between border-b pb-2 text-sm">
                          <span className="font-medium">Adresse</span>
                          <span className="text-muted-foreground">{rental.location}</span>
                        </div>
                      )}
                      {rental.city && (
                        <div className="flex justify-between border-b pb-2 text-sm">
                          <span className="font-medium">Ville</span>
                          <span className="text-muted-foreground">{rental.city}</span>
                        </div>
                      )}
                      {rental.country && (
                        <div className="flex justify-between border-b pb-2 text-sm">
                          <span className="font-medium">Pays</span>
                          <span className="text-muted-foreground">{rental.country}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="rounded-lg border p-6">
                  <h2 className="mb-3 text-xl font-bold">Détails</h2>
                  <div className="space-y-2">
                    <div className="flex justify-between border-b pb-2 text-sm">
                      <span className="font-medium">Statut</span>
                      <span className={rental.status === "available" ? "text-green-600" : rental.status === "rented" ? "text-blue-600" : rental.status === "maintenance" ? "text-yellow-600" : "text-red-500"}>
                        {STATUS_LABELS[rental.status]}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-2 text-sm">
                      <span className="font-medium">Fréquence de paiement</span>
                      <span className="text-muted-foreground">{FREQUENCY_LABELS[rental.payment_frequency]}</span>
                    </div>
                    {rental.verified && (
                      <div className="flex justify-between border-b pb-2 text-sm">
                        <span className="font-medium">Vérification</span>
                        <span className="text-green-600">Vérifié</span>
                      </div>
                    )}
                    {rental.rating > 0 && (
                      <div className="flex justify-between border-b pb-2 text-sm">
                        <span className="font-medium">Note</span>
                        <span className="text-muted-foreground">{rental.rating}/5 ({rental.total_reviews} avis)</span>
                      </div>
                    )}
                  </div>
                </div>

                {rental.images && rental.images.length > 0 && (
                  <div className="rounded-lg border p-6">
                    <h2 className="mb-3 text-xl font-bold">Galerie</h2>
                    <div className="grid grid-cols-3 gap-2">
                      {rental.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(image)}
                          className={`relative w-full h-20 overflow-hidden rounded-md transition-colors duration-200 ease-out ${
                            selectedImage === image
                              ? "ring-2 ring-primary ring-offset-2"
                              : "hover:opacity-80"
                          }`}
                        >
                          <img
                            src={image}
                            alt={`Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="my-8 border-t" />

              {/* Conditions & Specifications */}
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Conditions */}
                {rental.conditions && rental.conditions.length > 0 && (
                  <section>
                    <h2 className="mb-4 text-2xl font-bold">Conditions de location</h2>
                    <ul className="space-y-2">
                      {rental.conditions.map((condition, index) => (
                        <li className="flex items-start" key={`condition-${index}`}>
                          <span className="mt-1.5 mr-2 h-2 w-2 rounded-full bg-primary" />
                          <span>
                            {typeof condition === 'string' ? condition : `${condition.key}: ${condition.value}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Specifications */}
                {rental.specifications && rental.specifications.length > 0 && (
                  <section>
                    <h2 className="mb-4 text-2xl font-bold">Spécifications</h2>
                    <div className="space-y-2">
                      {rental.specifications.map((spec, index) => (
                        <div
                          className="flex justify-between border-b pb-2 text-sm"
                          key={`spec-${index}`}
                        >
                          <span className="font-medium capitalize">
                            {typeof spec === 'string' ? spec : spec.key}
                          </span>
                          <span className="text-muted-foreground">
                            {typeof spec === 'string' ? '' : spec.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </main>
        </div>
      ) : (
        /* ============ FORMULAIRE D'ÉDITION ============ */
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="md:col-span-2">
              <CardHeader><CardTitle>Informations générales</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                  {validationErrors.title && <p className="text-sm text-destructive">{validationErrors.title}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  {validationErrors.description && <p className="text-sm text-destructive">{validationErrors.description}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="short_description">Description courte</Label>
                  <textarea
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    rows={2}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  {validationErrors.short_description && <p className="text-sm text-destructive">{validationErrors.short_description}</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Catégorie *</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Sélectionner</option>
                      {CATEGORIES.map((cat) => <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>)}
                    </select>
                    {validationErrors.category && <p className="text-sm text-destructive">{validationErrors.category}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sub_category">Sous-catégorie</Label>
                    <Input
                      id="sub_category"
                      value={formData.sub_category}
                      onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                    />
                    {validationErrors.sub_category && <p className="text-sm text-destructive">{validationErrors.sub_category}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Localisation</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Adresse / Lieu</Label>
                  <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                  {validationErrors.location && <p className="text-sm text-destructive">{validationErrors.location}</p>}
                </div>
                <div className="grid gap-2">
                  <Label>Ville</Label>
                  <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                  {validationErrors.city && <p className="text-sm text-destructive">{validationErrors.city}</p>}
                </div>
                <div className="grid gap-2">
                  <Label>Pays</Label>
                  <Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
                  {validationErrors.country && <p className="text-sm text-destructive">{validationErrors.country}</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Prix et disponibilité</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Prix *</Label>
                  <Input type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                  {validationErrors.price && <p className="text-sm text-destructive">{validationErrors.price}</p>}
                </div>
                <div className="grid gap-2">
                  <Label>Ancien prix</Label>
                  <Input type="number" step="0.01" min="0" value={formData.old_price} onChange={(e) => setFormData({ ...formData, old_price: e.target.value })} />
                  {validationErrors.old_price && <p className="text-sm text-destructive">{validationErrors.old_price}</p>}
                </div>
                <div className="grid gap-2">
                  <Label>Pourcentage de réduction</Label>
                  <Input type="number" step="0.01" min="0" max="100" value={formData.discount_percent} onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })} />
                  {validationErrors.discount_percent && <p className="text-sm text-destructive">{validationErrors.discount_percent}</p>}
                </div>
                <div className="grid gap-2">
                  <Label>Devise</Label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {["USD","EUR","XAF","CDF","GBP","JPY","CAD","AUD","CHF","CNY"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {validationErrors.currency && <p className="text-sm text-destructive">{validationErrors.currency}</p>}
                </div>
                <div className="grid gap-2">
                  <Label>Fréquence</Label>
                  <select
                    value={formData.payment_frequency}
                    onChange={(e) => setFormData({ ...formData, payment_frequency: e.target.value as any })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="daily">Par jour</option>
                    <option value="weekly">Par semaine</option>
                    <option value="monthly">Par mois</option>
                  </select>
                  {validationErrors.payment_frequency && <p className="text-sm text-destructive">{validationErrors.payment_frequency}</p>}
                </div>
                <div className="grid gap-2">
                  <Label>Statut</Label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="available">Disponible</option>
                    <option value="rented">Loué</option>
                    <option value="maintenance">En maintenance</option>
                    <option value="unavailable">Indisponible</option>
                  </select>
                  {validationErrors.status && <p className="text-sm text-destructive">{validationErrors.status}</p>}
                </div>
                <div className="grid gap-2">
                  <Label>Type de commission</Label>
                  <select
                    value={formData.commission_type}
                    onChange={(e) => setFormData({ ...formData, commission_type: e.target.value as any })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="none">Aucune</option>
                    <option value="fixed">Fixe</option>
                    <option value="percentage">Pourcentage</option>
                  </select>
                  {validationErrors.commission_type && <p className="text-sm text-destructive">{validationErrors.commission_type}</p>}
                </div>
                {formData.commission_type !== 'none' && (
                  <div className="grid gap-2">
                    <Label>
                      {formData.commission_type === 'fixed' ? 'Valeur de commission' : 'Pourcentage de commission'}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={formData.commission_type === 'percentage' ? 100 : undefined}
                      value={formData.commission_value}
                      onChange={(e) => setFormData({ ...formData, commission_value: e.target.value })}
                      placeholder={formData.commission_type === 'fixed' ? '0.00' : '0'}
                    />
                    {validationErrors.commission_value && <p className="text-sm text-destructive">{validationErrors.commission_value}</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Conditions */}
            <Card>
              <CardHeader><CardTitle>Conditions</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {formData.conditions.map((cond, i) => (
                  <div key={i} className="flex gap-2">
                    <Input placeholder="Condition" value={cond.key} onChange={(e) => updateCondition(i, "key", e.target.value)} />
                    <Input placeholder="Valeur" value={cond.value} onChange={(e) => updateCondition(i, "value", e.target.value)} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeCondition(i)}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addCondition}>
                  <Plus className="mr-2 h-4 w-4" />Ajouter
                </Button>
                {validationErrors.conditions && <p className="text-sm text-destructive">{validationErrors.conditions}</p>}
              </CardContent>
            </Card>

            {/* Spécifications */}
            <Card>
              <CardHeader><CardTitle>Spécifications</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {formData.specifications.map((spec, i) => (
                  <div key={i} className="flex gap-2">
                    <Input placeholder="Spécification" value={spec.key} onChange={(e) => updateSpecification(i, "key", e.target.value)} />
                    <Input placeholder="Valeur" value={spec.value} onChange={(e) => updateSpecification(i, "value", e.target.value)} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSpecification(i)}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addSpecification}>
                  <Plus className="mr-2 h-4 w-4" />Ajouter
                </Button>
                {validationErrors.specifications && <p className="text-sm text-destructive">{validationErrors.specifications}</p>}
              </CardContent>
            </Card>

            {/* Images */}
            <Card className="md:col-span-2">
              <CardHeader><CardTitle>Images</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                      <ImageIcon className="h-4 w-4" />Ajouter des images
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/gif"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={formData.images.length + (formData.existingImages?.length || 0) >= 6}
                    />
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {formData.images.length + (formData.existingImages?.length || 0)}/6 images
                  </p>
                  {validationErrors.images && <p className="text-sm text-destructive">{validationErrors.images}</p>}
                </div>

                {(formData.images.length > 0 || formData.existingImages.length > 0) ? (
                  <div className="grid grid-cols-3 gap-4">
                    {formData.existingImages.map((img, i) => (
                      <div key={`ex-${i}`} className="relative group">
                        <img src={img} alt={`Existante ${i + 1}`} className="w-full h-32 object-cover rounded-md" />
                        <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeExistingImage(i)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {formData.images.map((img, i) => (
                      <div key={`new-${i}`} className="relative group">
                        <img src={URL.createObjectURL(img)} alt={`Nouvelle ${i + 1}`} className="w-full h-32 object-cover rounded-md" />
                        <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeImage(i)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">Aucune image</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="outline" onClick={() => { setIsEditing(false); setMessage(""); setError(""); }}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Traitement...</>
              ) : "Mettre à jour"}
            </Button>
          </div>
        </form>
      )}

      {/* Comments Management */}
      {!isEditing && rental && (
        <div className="mt-8">
          <CommentsDashboard 
            itemId={String(rental.id)} 
            commentAPI={rentalCommentAPI}
          />
        </div>
      )}
    </div>
  );
}
