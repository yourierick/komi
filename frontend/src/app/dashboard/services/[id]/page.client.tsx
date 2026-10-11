"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "~/lib/hooks/use-auth";
import { serviceAPI, serviceCommentAPI } from "~/lib/api";
import { CommentsDashboard } from "~/ui/components/comments-dashboard";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { ArrowLeft, MapPin, Package as PackageIcon, CheckCircle, Loader2, Plus, X, Image as ImageIcon, Edit } from "lucide-react";

const CATEGORIES = [
  "consulting",
  "maintenance",
  "delivery",
  "cleaning",
  "education",
  "health",
  "beauty",
  "tech",
  "legal",
  "finance",
  "printing",
  "software engineering",
  "electrical",
  "electronic and repair",
  "painting",
  "musician",
];

const CATEGORY_LABELS: Record<string, string> = {
  "consulting": "Conseil",
  "maintenance": "Maintenance",
  "delivery": "Livraison",
  "cleaning": "Nettoyage",
  "education": "Éducation",
  "health": "Santé",
  "beauty": "Beauté",
  "tech": "Technologie",
  "legal": "Juridique",
  "finance": "Finance",
  "printing": "Impression",
  "software engineering": "Ingénierie logicielle",
  "electrical": "Électrique",
  "electronic and repair": "Électronique et réparation",
  "painting": "Peinture",
  "musician": "Musicien",
};

const currencySymbols: Record<string, string> = {
  USD: "$", EUR: "€", XAF: "FCFA", CDF: "FC",
  GBP: "£", JPY: "¥", CAD: "C$", AUD: "A$", CHF: "CHF", CNY: "¥",
};
function getCurrencySymbol(c?: string) { return c ? currencySymbols[c] || c : ""; }

const FREQUENCY_LABELS: Record<string, string> = {
  hourly: "/ heure", daily: "/ jour", weekly: "/ semaine", monthly: "/ mois", per_project: "/ projet",
};
const STATUS_LABELS: Record<string, string> = {
  available: "Disponible", unavailable: "Indisponible",
};
const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  unavailable: "bg-gray-100 text-gray-700",
};

type Service = {
  id: number;
  title: string;
  slug: string;
  description?: string;
  category: string;
  sub_category?: string;
  location?: string;
  city?: string;
  country?: string;
  price: number;
  currency: string;
  payment_frequency: "hourly" | "daily" | "weekly" | "monthly" | "per_project";
  status: "available" | "unavailable";
  verified: boolean;
  rating: number;
  total_reviews: number;
  features?: { key: string; value: string }[];
  specifications?: { key: string; value: string }[];
  images?: string[];
  video?: string;
  availability?: { [key: string]: string[] };
  created_at: string;
  updated_at: string;
};

export default function ServiceDetailPageClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id as string;

  const [service, setService] = useState<Service | null>(null);
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
    category: "",
    sub_category: "",
    location: "",
    city: "",
    country: "",
    price: "",
    currency: "USD",
    payment_frequency: "hourly" as "hourly" | "daily" | "weekly" | "monthly" | "per_project",
    status: "available" as "available" | "unavailable",
    features: [] as { key: string; value: string }[],
    specifications: [] as { key: string; value: string }[],
    images: [] as File[],
    existingImages: [] as string[],
    video: null as File | null,
    existingVideo: "" as string,
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/sign-in");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user && serviceId) loadService();
  }, [user, serviceId]);

  const loadService = async () => {
    try {
      setLoading(true);
      const response = await serviceAPI.get(serviceId);
      const data: Service = response.data.data;
      setService(data);
      setSelectedImage(data.images?.[0] || null);
      setFormData({
        title: data.title,
        description: data.description || "",
        category: data.category,
        sub_category: data.sub_category || "",
        location: data.location || "",
        city: data.city || "",
        country: data.country || "",
        price: data.price.toString(),
        currency: data.currency,
        payment_frequency: data.payment_frequency,
        status: data.status,
        features: (data.features as any) || [],
        specifications: (data.specifications as any) || [],
        images: [],
        existingImages: Array.isArray(data.images) ? data.images : [],
        video: null,
        existingVideo: data.video || "",
      });
    } catch {
      setError("Erreur lors du chargement du service");
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
      fd.append("category", formData.category);
      fd.append("sub_category", formData.sub_category);
      fd.append("location", formData.location);
      fd.append("city", formData.city);
      fd.append("country", formData.country);
      fd.append("price", formData.price);
      fd.append("currency", formData.currency);
      fd.append("payment_frequency", formData.payment_frequency);
      fd.append("status", formData.status);
      fd.append("features", JSON.stringify(formData.features));
      fd.append("specifications", JSON.stringify(formData.specifications));
      if (formData.video) {
        fd.append("video", formData.video);
      }
      formData.images.forEach((file) => fd.append("images[]", file));

      await serviceAPI.update(serviceId, fd);
      setMessage("Service mis à jour avec succès");
      await loadService();
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
      } else {
        setError("Erreur lors de la mise à jour du service");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const addFeature = () =>
    setFormData({ ...formData, features: [...formData.features, { key: "", value: "" }] });
  const removeFeature = (i: number) =>
    setFormData({ ...formData, features: formData.features.filter((_, idx) => idx !== i) });
  const updateFeature = (i: number, field: "key" | "value", val: string) => {
    const updated = [...formData.features]; updated[i][field] = val;
    setFormData({ ...formData, features: updated });
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

  if (!service) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Service introuvable</h1>
          <Button className="mt-4" onClick={() => router.push("/dashboard/services")}>Retour</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/dashboard/services")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{service.title}</h1>
            <p className="text-muted-foreground">{CATEGORY_LABELS[service.category] || service.category}</p>
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
                onClick={() => router.push("/dashboard/services")}
                variant="ghost"
              >
                ← Retour
              </Button>

              {/* Main grid */}
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Service image */}
                <div
                  ref={imageContainerRef}
                  className="relative aspect-square overflow-hidden rounded-lg bg-muted cursor-crosshair"
                  onMouseMove={handleMouseMove}
                  onMouseEnter={() => setIsZoomed(true)}
                  onMouseLeave={() => setIsZoomed(false)}
                >
                  {selectedImage || service.images?.[0] ? (
                    <img
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform duration-200 ease-out"
                      style={{
                        transform: isZoomed ? "scale(2.5)" : "scale(1)",
                        transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                      }}
                      src={selectedImage || service.images?.[0]}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PackageIcon className="h-24 w-24 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Service info */}
                <div className="flex flex-col">
                  {/* Title & category */}
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold">{service.title}</h1>
                    <div className="mt-2 flex items-center gap-2">
                      <PackageIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-lg font-medium text-muted-foreground">
                        {CATEGORY_LABELS[service.category] || service.category}
                      </span>
                      {service.sub_category && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-lg font-medium text-muted-foreground">
                            {service.sub_category}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Prices */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold">
                        {Number(service.price || 0).toFixed(2)} {getCurrencySymbol(service.currency)}
                      </span>
                      <span className="text-lg text-muted-foreground">
                        {FREQUENCY_LABELS[service.payment_frequency]}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {service.description && (
                    <p className="mb-6 text-muted-foreground">
                      {service.description}
                    </p>
                  )}

                  {/* Stock status */}
                  <div className="mb-6">
                    {service.status === "available" ? (
                      <p className="text-sm font-medium text-green-600">Disponible</p>
                    ) : (
                      <p className="text-sm font-medium text-red-500">Indisponible</p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Button
                      className="flex-1"
                      onClick={() => setIsEditing(true)}
                    >
                      Modifier le service
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/dashboard/services")}
                    >
                      Retour
                    </Button>
                  </div>
                </div>
              </div>

              <div className="my-8 border-t" />

              {/* Location */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
                {(service.location || service.city || service.country) && (
                  <div className="rounded-lg border p-6">
                    <h2 className="mb-3 text-xl font-bold">Localisation</h2>
                    <div className="space-y-2">
                      {service.location && (
                        <div className="flex justify-between border-b pb-2 text-sm">
                          <span className="font-medium">Adresse</span>
                          <span className="text-muted-foreground">{service.location}</span>
                        </div>
                      )}
                      {service.city && (
                        <div className="flex justify-between border-b pb-2 text-sm">
                          <span className="font-medium">Ville</span>
                          <span className="text-muted-foreground">{service.city}</span>
                        </div>
                      )}
                      {service.country && (
                        <div className="flex justify-between border-b pb-2 text-sm">
                          <span className="font-medium">Pays</span>
                          <span className="text-muted-foreground">{service.country}</span>
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
                      <span className={service.status === "available" ? "text-green-600" : "text-red-500"}>
                        {STATUS_LABELS[service.status]}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-2 text-sm">
                      <span className="font-medium">Fréquence de paiement</span>
                      <span className="text-muted-foreground">{FREQUENCY_LABELS[service.payment_frequency]}</span>
                    </div>
                    {service.verified && (
                      <div className="flex justify-between border-b pb-2 text-sm">
                        <span className="font-medium">Vérification</span>
                        <span className="text-green-600">Vérifié</span>
                      </div>
                    )}
                    {service.rating > 0 && (
                      <div className="flex justify-between border-b pb-2 text-sm">
                        <span className="font-medium">Note</span>
                        <span className="text-muted-foreground">{service.rating}/5 ({service.total_reviews} avis)</span>
                      </div>
                    )}
                  </div>
                </div>

                {service.images && service.images.length > 0 && (
                  <div className="rounded-lg border p-6">
                    <h2 className="mb-3 text-xl font-bold">Mes réalisations</h2>
                    <div className="grid grid-cols-3 gap-2">
                      {service.images.map((image, index) => (
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

              {/* Features & Specifications */}
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Features */}
                {service.features && service.features.length > 0 && (
                  <section>
                    <h2 className="mb-4 text-2xl font-bold">Caractéristiques</h2>
                    <ul className="space-y-2">
                      {service.features.map((feature, index) => (
                        <li className="flex items-start" key={`feature-${index}`}>
                          <span className="mt-1.5 mr-2 h-2 w-2 rounded-full bg-primary" />
                          <span>
                            {typeof feature === 'string' ? feature : `${feature.key}: ${feature.value}`}
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
                </div>
                <div className="grid gap-2">
                  <Label>Ville</Label>
                  <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Pays</Label>
                  <Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
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
                  <Label>Devise</Label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {["USD","EUR","XAF","CDF","GBP","JPY","CAD","AUD","CHF","CNY"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label>Fréquence</Label>
                  <select
                    value={formData.payment_frequency}
                    onChange={(e) => setFormData({ ...formData, payment_frequency: e.target.value as any })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="hourly">Par heure</option>
                    <option value="daily">Par jour</option>
                    <option value="weekly">Par semaine</option>
                    <option value="monthly">Par mois</option>
                    <option value="per_project">Par projet</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label>Statut</Label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="available">Disponible</option>
                    <option value="unavailable">Indisponible</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader><CardTitle>Caractéristiques</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {formData.features.map((feat, i) => (
                  <div key={i} className="flex gap-2">
                    <Input placeholder="Caractéristique" value={feat.key} onChange={(e) => updateFeature(i, "key", e.target.value)} />
                    <Input placeholder="Valeur" value={feat.value} onChange={(e) => updateFeature(i, "value", e.target.value)} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFeature(i)}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addFeature}>
                  <Plus className="mr-2 h-4 w-4" />Ajouter
                </Button>
              </CardContent>
            </Card>

            {/* Specifications */}
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

            {/* Video */}
            <Card className="md:col-span-2">
              <CardHeader><CardTitle>Vidéo</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {formData.existingVideo && (
                  <div className="mb-4">
                    <Label>Vidéo actuelle</Label>
                    <video
                      src={formData.existingVideo}
                      controls
                      className="w-full max-h-64 mt-2 rounded-md"
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label>Changer la vidéo (max 10Mo)</Label>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && file.size > 10 * 1024 * 1024) {
                        setError("La vidéo ne doit pas dépasser 10Mo");
                        return;
                      }
                      setFormData({ ...formData, video: file || null });
                    }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  {formData.video && (
                    <p className="text-sm text-muted-foreground">
                      Sélectionné: {formData.video.name} ({(formData.video.size / 1024 / 1024).toFixed(2)} Mo)
                    </p>
                  )}
                  {validationErrors.video && (
                    <p className="text-sm text-destructive">{validationErrors.video}</p>
                  )}
                </div>
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
      {!isEditing && service && (
        <div className="mt-8">
          <CommentsDashboard 
            itemId={String(service.id)} 
            commentAPI={serviceCommentAPI}
          />
        </div>
      )}
    </div>
  );
}
