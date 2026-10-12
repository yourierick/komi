"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "~/lib/hooks/use-auth";
import { rentalAPI } from "~/lib/api";
import { toast } from "sonner";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { ArrowLeft, Loader2, Plus, X, Image as ImageIcon } from "lucide-react";

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

export default function NewRentalPageClient() {
  const { user } = useAuth();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setValidationErrors({});
    setSubmitting(true);

    if (formData.commission_type !== "none" && formData.commission_value) {
      const price = parseFloat(formData.price);
      const commissionValue = parseFloat(formData.commission_value);
      const exceedsLimit = formData.commission_type === "percentage"
        ? commissionValue > 20
        : !isNaN(price) && commissionValue > price * 0.2;

      if (exceedsLimit) {
        setValidationErrors({
          commission_value: "La commission ne peut pas dépasser 20 % du prix de la location",
        });
        setError("Veuillez corriger les erreurs dans le formulaire");
        setSubmitting(false);
        return;
      }
    }

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

      await rentalAPI.create(fd);
      router.push("/dashboard/rentals");
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
        toast.error("Le formulaire est invalide. Veuillez corriger les erreurs indiquées.");
      } else {
        setError("Erreur lors de la création de la location");
      }
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const addCondition = () =>
    setFormData({ ...formData, conditions: [...formData.conditions, { key: "", value: "" }] });
  const removeCondition = (i: number) =>
    setFormData({ ...formData, conditions: formData.conditions.filter((_, idx) => idx !== i) });
  const updateCondition = (i: number, field: "key" | "value", val: string) => {
    const updated = [...formData.conditions];
    updated[i][field] = val;
    setFormData({ ...formData, conditions: updated });
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
        <Button variant="ghost" onClick={() => router.push("/dashboard/rentals")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nouvelle Location</h1>
          <p className="text-muted-foreground">Créez une nouvelle annonce de location</p>
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
                  placeholder="Titre de votre location"
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
                  placeholder="Décrivez votre location..."
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                {validationErrors.description && (
                  <p className="text-sm text-destructive">{validationErrors.description}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="short_description">Description courte</Label>
                <textarea
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  placeholder="Brève description pour les cartes..."
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                {validationErrors.short_description && (
                  <p className="text-sm text-destructive">{validationErrors.short_description}</p>
                )}
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
                  {validationErrors.sub_category && (
                    <p className="text-sm text-destructive">{validationErrors.sub_category}</p>
                  )}
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
                {validationErrors.location && (
                  <p className="text-sm text-destructive">{validationErrors.location}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ville"
                />
                {validationErrors.city && (
                  <p className="text-sm text-destructive">{validationErrors.city}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Pays"
                />
                {validationErrors.country && (
                  <p className="text-sm text-destructive">{validationErrors.country}</p>
                )}
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
                <Label htmlFor="old_price">Ancien prix</Label>
                <Input
                  id="old_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.old_price}
                  onChange={(e) => setFormData({ ...formData, old_price: e.target.value })}
                  placeholder="0.00"
                />
                {validationErrors.old_price && (
                  <p className="text-sm text-destructive">{validationErrors.old_price}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="discount_percent">Pourcentage de réduction</Label>
                <Input
                  id="discount_percent"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                  placeholder="0.00"
                />
                {validationErrors.discount_percent && (
                  <p className="text-sm text-destructive">{validationErrors.discount_percent}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="currency">Devise</Label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {["USD", "EUR", "XAF", "CDF", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {validationErrors.currency && (
                  <p className="text-sm text-destructive">{validationErrors.currency}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payment_frequency">Fréquence de paiement</Label>
                <select
                  id="payment_frequency"
                  value={formData.payment_frequency}
                  onChange={(e) => setFormData({ ...formData, payment_frequency: e.target.value as any })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="daily">Par jour</option>
                  <option value="weekly">Par semaine</option>
                  <option value="monthly">Par mois</option>
                </select>
                {validationErrors.payment_frequency && (
                  <p className="text-sm text-destructive">{validationErrors.payment_frequency}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Statut</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="available">Disponible</option>
                  <option value="rented">Loué</option>
                  <option value="maintenance">En maintenance</option>
                  <option value="unavailable">Indisponible</option>
                </select>
                {validationErrors.status && (
                  <p className="text-sm text-destructive">{validationErrors.status}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="commission_type">Type de commission</Label>
                <select
                  id="commission_type"
                  value={formData.commission_type}
                  onChange={(e) => setFormData({ ...formData, commission_type: e.target.value as any })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="none">Aucune</option>
                  <option value="fixed">Fixe</option>
                  <option value="percentage">Pourcentage</option>
                </select>
                {validationErrors.commission_type && (
                  <p className="text-sm text-destructive">{validationErrors.commission_type}</p>
                )}
              </div>

              {formData.commission_type !== 'none' && (
                <div className="grid gap-2">
                  <Label htmlFor="commission_value">
                    {formData.commission_type === 'fixed' ? 'Valeur de commission' : 'Pourcentage de commission'}
                  </Label>
                  <Input
                    id="commission_value"
                    type="number"
                    step="0.01"
                    min="0"
                    max={
                      formData.commission_type === 'percentage'
                        ? 20
                        : formData.price
                          ? parseFloat(formData.price) * 0.2
                          : undefined
                    }
                    value={formData.commission_value}
                    onChange={(e) => setFormData({ ...formData, commission_value: e.target.value })}
                    placeholder={formData.commission_type === 'fixed' ? '0.00' : '0'}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.commission_type === 'percentage'
                      ? "Maximum 20 % du prix de la location"
                      : formData.price
                        ? `Maximum ${(parseFloat(formData.price) * 0.2).toFixed(2)} (20 % du prix)`
                        : "Maximum 20 % du prix de la location"}
                  </p>
                  {validationErrors.commission_value && (
                    <p className="text-sm text-destructive">{validationErrors.commission_value}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Conditions de location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.conditions.map((cond, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="Condition"
                    value={cond.key}
                    onChange={(e) => updateCondition(i, "key", e.target.value)}
                  />
                  <Input
                    placeholder="Valeur"
                    value={cond.value}
                    onChange={(e) => updateCondition(i, "value", e.target.value)}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeCondition(i)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addCondition}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une condition
              </Button>
              {validationErrors.conditions && (
                <p className="text-sm text-destructive">{validationErrors.conditions}</p>
              )}
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
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeSpecification(i)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addSpecification}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une spécification
              </Button>
              {validationErrors.specifications && (
                <p className="text-sm text-destructive">{validationErrors.specifications}</p>
              )}
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
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/rentals")}>
            Annuler
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              "Créer la location"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
