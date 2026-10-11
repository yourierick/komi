"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "~/lib/hooks/use-auth";
import { serviceAPI } from "~/lib/api";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { ArrowLeft, Loader2, Plus, X, Image as ImageIcon } from "lucide-react";

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

export default function NewServicePageClient() {
  const { user } = useAuth();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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
    video: null as File | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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

      await serviceAPI.create(fd);
      router.push("/dashboard/services");
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const imageErrors = Object.keys(errors).filter((k) => k.startsWith("images."));
        if (imageErrors.length > 0) {
          errors.images = imageErrors.map((k) => {
            const e = errors[k];
            return Array.isArray(e) ? e.join(", ") : e;
          }).join(", ");
        }
        Object.keys(errors).forEach((k) => {
          if (Array.isArray(errors[k])) errors[k] = errors[k].join(", ");
        });
        setValidationErrors(errors);
        setError("Veuillez corriger les erreurs dans le formulaire");
      } else {
        setError("Erreur lors de la création du service");
      }
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const addFeature = () =>
    setFormData({ ...formData, features: [...formData.features, { key: "", value: "" }] });
  const removeFeature = (i: number) =>
    setFormData({ ...formData, features: formData.features.filter((_, idx) => idx !== i) });
  const updateFeature = (i: number, field: "key" | "value", val: string) => {
    const updated = [...formData.features];
    updated[i][field] = val;
    setFormData({ ...formData, features: updated });
  };

  const addSpecification = () =>
    setFormData({ ...formData, specifications: [...formData.specifications, { key: "", value: "" }] });
  const removeSpecification = (i: number) =>
    setFormData({ ...formData, specifications: formData.specifications.filter((_, idx) => idx !== i) });
  const updateSpecification = (i: number, field: "key" | "value", val: string) => {
    const updated = [...formData.specifications];
    updated[i][field] = val;
    setFormData({ ...formData, specifications: updated });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files);
    if (formData.images.length + newFiles.length > 6) {
      setError("Maximum 6 images autorisées");
      return;
    }
    setFormData({ ...formData, images: [...formData.images, ...newFiles] });
  };

  const removeImage = (i: number) =>
    setFormData({ ...formData, images: formData.images.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/dashboard/services")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nouveau Service</h1>
          <p className="text-muted-foreground">Créez une nouvelle offre de service</p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Informations générales */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Titre de votre service"
                  required
                />
                {validationErrors.title && (
                  <p className="text-sm text-destructive">{validationErrors.title}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez votre service..."
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
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
                    ))}
                  </select>
                  {validationErrors.category && (
                    <p className="text-sm text-destructive">{validationErrors.category}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="sub_category">Sous-catégorie</Label>
                  <Input
                    id="sub_category"
                    value={formData.sub_category}
                    onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                    placeholder="Sous-catégorie"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Localisation */}
          <Card>
            <CardHeader>
              <CardTitle>Localisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="location">Adresse / Lieu</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Adresse ou lieu"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ville"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Pays"
                />
              </div>
            </CardContent>
          </Card>

          {/* Prix et disponibilité */}
          <Card>
            <CardHeader>
              <CardTitle>Prix et disponibilité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Prix *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
                {validationErrors.price && (
                  <p className="text-sm text-destructive">{validationErrors.price}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="currency">Devise</Label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {["USD", "EUR", "XAF", "CDF", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payment_frequency">Fréquence de paiement</Label>
                <select
                  id="payment_frequency"
                  value={formData.payment_frequency}
                  onChange={(e) => setFormData({ ...formData, payment_frequency: e.target.value as any })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="hourly">Par heure</option>
                  <option value="daily">Par jour</option>
                  <option value="weekly">Par semaine</option>
                  <option value="monthly">Par mois</option>
                  <option value="per_project">Par projet</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Statut</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="available">Disponible</option>
                  <option value="unavailable">Indisponible</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Caractéristiques */}
          <Card>
            <CardHeader>
              <CardTitle>Caractéristiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.features.map((feat, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="Caractéristique"
                    value={feat.key}
                    onChange={(e) => updateFeature(i, "key", e.target.value)}
                  />
                  <Input
                    placeholder="Valeur"
                    value={feat.value}
                    onChange={(e) => updateFeature(i, "value", e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFeature(i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addFeature}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une caractéristique
              </Button>
            </CardContent>
          </Card>

          {/* Spécifications */}
          <Card>
            <CardHeader>
              <CardTitle>Spécifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.specifications.map((spec, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="Spécification"
                    value={spec.key}
                    onChange={(e) => updateSpecification(i, "key", e.target.value)}
                  />
                  <Input
                    placeholder="Valeur"
                    value={spec.value}
                    onChange={(e) => updateSpecification(i, "value", e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSpecification(i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addSpecification}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une spécification
              </Button>
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                    <ImageIcon className="h-4 w-4" />
                    Ajouter des images
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/gif"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={formData.images.length >= 6}
                  />
                </label>
                <p className="text-sm text-muted-foreground">
                  {formData.images.length}/6 images
                </p>
                {validationErrors.images && (
                  <p className="text-sm text-destructive">{validationErrors.images}</p>
                )}
              </div>

              {formData.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {formData.images.map((image, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Image ${i + 1}`}
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(i)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">Aucune image sélectionnée</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vidéo */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Vidéo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="video">Fichier vidéo (max 10Mo)</Label>
                <input
                  id="video"
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
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/services")}>
            Annuler
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              "Créer le service"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
