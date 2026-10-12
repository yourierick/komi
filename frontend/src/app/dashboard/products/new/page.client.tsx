"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "~/lib/hooks/use-auth";
import { productAPI, shopAPI } from "~/lib/api";
import { toast } from "sonner";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { ArrowLeft, Loader2, Plus, X, Upload, Image as ImageIcon } from "lucide-react";

const CATEGORIES = [
  "Electronics and Components",
  "Applications and New Technologies",
  "Phones and Accessories",
  "Agriculture, Livestock, and Fishing",
  "Wearables and Accessories",
  "Home and decor",
  "Makeup",
  "Parents, Children, and Games",
  "Jewelry, Eyewear, and Watches",
  "Luggage, Bags, Cases",
  "Sports and Fitness",
  "Books, Media, and Games",
  "office supplies",
  "Food and Beverages",
  "Buildings",
  "Home Appliances",
  "shoes and accessories",
  "Vehicles and Transportation",
  "Electrical Equipment and Supplies",
  "Renewable Energy",
  "hardware and home improvement",
  "vehicle parts and accessories",
  "Construction and Real Estate",
  "Medical and Health",
  "Packaging and Printing",
  "Computers and Accessories",
];

const CATEGORY_LABELS: Record<string, string> = {
  "Electronics and Components": "Électronique et composants",
  "Applications and New Technologies": "Applications et nouvelles technologies",
  "Phones and Accessories": "Téléphones et accessoires",
  "Agriculture, Livestock, and Fishing": "Agriculture, élevage et pêche",
  "Wearables and Accessories": "Vêtements et accessoires",
  "Home and decor": "Maison et décoration",
  "Makeup": "Maquillage",
  "Parents, Children, and Games": "Parents, enfants et jeux",
  "Jewelry, Eyewear, and Watches": "Bijoux, lunettes et montres",
  "Luggage, Bags, Cases": "Bagages, sacs et étuis",
  "Sports and Fitness": "Sports et fitness",
  "Books, Media, and Games": "Livres, médias et jeux",
  "office supplies": "Fournitures de bureau",
  "Food and Beverages": "Aliments et boissons",
  "Buildings": "Bâtiments",
  "Home Appliances": "Électroménager",
  "shoes and accessories": "Chaussures et accessoires",
  "Vehicles and Transportation": "Véhicules et transport",
  "Electrical Equipment and Supplies": "Matériel électrique et fournitures",
  "Renewable Energy": "Énergie renouvelable",
  "hardware and home improvement": "Quincaillerie et amélioration de la maison",
  "vehicle parts and accessories": "Pièces et accessoires automobiles",
  "Construction and Real Estate": "Construction et immobilier",
  "Medical and Health": "Médical et santé",
  "Packaging and Printing": "Emballage et impression",
  "Computers and Accessories": "Ordinateurs et accessoires",
};

export default function NewProductPageClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const returnTo = from === "store" ? "/dashboard/store/products" : "/dashboard/products";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shops, setShops] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    short_description: "",
    category: "",
    sub_category: "",
    location: "",
    model: "",
    marque: "",
    price: "",
    old_price: "",
    discount_percent: "",
    is_on_sale: false,
    currency: "USD",
    min_order: "1",
    status: "available" as "available" | "unavailable",
    commission_type: "none" as "none" | "fixed" | "percentage",
    commission_value: "",
    features: [] as { key: string; value: string }[],
    specifications: [] as { key: string; value: string }[],
    images: [] as File[],
    shop_id: "",
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/sign-in");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      loadShops();
    }
  }, [user]);

  const loadShops = async () => {
    try {
      const response = await shopAPI.list();
      setShops(response.data.data);
    } catch (err) {
      console.error("Failed to load shops", err);
    }
  };

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
          commission_value: "La commission ne peut pas dépasser 20 % du prix du produit",
        });
        setError("Veuillez corriger les erreurs dans le formulaire");
        setSubmitting(false);
        return;
      }
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('short_description', formData.short_description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('sub_category', formData.sub_category);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('model', formData.model);
      formDataToSend.append('marque', formData.marque);
      formDataToSend.append('price', formData.price);
      if (formData.old_price) {
        formDataToSend.append('old_price', formData.old_price);
      }
      if (formData.discount_percent) {
        formDataToSend.append('discount_percent', formData.discount_percent);
      }
      formDataToSend.append('is_on_sale', formData.is_on_sale ? '1' : '0');
      formDataToSend.append('currency', formData.currency);
      if (formData.min_order) {
        formDataToSend.append('min_order', formData.min_order);
      }
      formDataToSend.append('status', formData.status);
      formDataToSend.append('commission_type', formData.commission_type);
      if (formData.commission_type !== 'none' && formData.commission_value) {
        formDataToSend.append('commission_value', formData.commission_value);
      }
      formDataToSend.append('features', JSON.stringify(formData.features));
      formDataToSend.append('specifications', JSON.stringify(formData.specifications));
      if (formData.shop_id) {
        formDataToSend.append('shop_id', formData.shop_id);
      }

      // Append images as files
      formData.images.forEach((file) => {
        formDataToSend.append('images[]', file);
      });

      await productAPI.create(formDataToSend);
      router.push(returnTo);
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const errors = err.response.data.errors;
        // Flatten image errors (images.0, images.1, etc.) into a single error
        const imageErrors = Object.keys(errors).filter(key => key.startsWith('images.'));
        if (imageErrors.length > 0) {
          errors.images = imageErrors.map(key => {
            const error = errors[key];
            return Array.isArray(error) ? error.join(', ') : error;
          }).join(', ');
        }
        // Convert array errors to strings for other fields
        Object.keys(errors).forEach(key => {
          if (Array.isArray(errors[key])) {
            errors[key] = errors[key].join(', ');
          }
        });
        setValidationErrors(errors);
        setError("Veuillez corriger les erreurs dans le formulaire");
        toast.error("Le formulaire est invalide. Veuillez corriger les erreurs indiquées.");
      } else {
        setError("Erreur lors de la création du produit");
      }
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommissionTypeChange = (value: "none" | "fixed" | "percentage") => {
    setFormData({ ...formData, commission_type: value, commission_value: "" });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      if (formData.images.length + newFiles.length > 6) {
        setError("Maximum 6 images autorisées");
        return;
      }
      setFormData({ ...formData, images: [...formData.images, ...newFiles] });
    }
  };

  const removeImage = (index: number) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, { key: "", value: "" }] });
  };

  const removeFeature = (index: number) => {
    setFormData({ ...formData, features: formData.features.filter((_, i) => i !== index) });
  };

  const updateFeature = (index: number, field: "key" | "value", value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index][field] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addSpecification = () => {
    setFormData({ ...formData, specifications: [...formData.specifications, { key: "", value: "" }] });
  };

  const removeSpecification = (index: number) => {
    setFormData({ ...formData, specifications: formData.specifications.filter((_, i) => i !== index) });
  };

  const updateSpecification = (index: number, field: "key" | "value", value: string) => {
    const newSpecifications = [...formData.specifications];
    newSpecifications[index][field] = value;
    setFormData({ ...formData, specifications: newSpecifications });
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Chargement...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push(returnTo)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nouveau Produit</h1>
          <p className="text-muted-foreground">Créez un nouveau produit</p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom du produit *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Entrez le nom de votre produit"
                  required
                />
                {validationErrors.name && (
                  <p className="text-sm text-destructive">{validationErrors.name}</p>
                )}
              </div>

              {shops.length > 0 && (
                <div className="grid gap-2">
                  <Label htmlFor="shop_id">Magasin</Label>
                  <select
                    id="shop_id"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.shop_id}
                    onChange={(e) => setFormData({ ...formData, shop_id: e.target.value })}
                  >
                    <option value="">Sélectionnez un magasin (optionnel)</option>
                    {shops.map((shop) => (
                      <option key={shop.id} value={shop.id}>
                        {shop.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.shop_id && (
                    <p className="text-sm text-destructive">{validationErrors.shop_id}</p>
                  )}
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="category">Catégorie *</Label>
                <select
                  id="category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Sélectionnez une catégorie</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat] || cat}
                    </option>
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
                  placeholder="Sous-catégorie (optionnel)"
                />
                {validationErrors.sub_category && (
                  <p className="text-sm text-destructive">{validationErrors.sub_category}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez votre produit..."
                />
                {validationErrors.description && (
                  <p className="text-sm text-destructive">{validationErrors.description}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="short_description">Description courte</Label>
                <Input
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  placeholder="Description courte (optionnel)"
                />
                {validationErrors.short_description && (
                  <p className="text-sm text-destructive">{validationErrors.short_description}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="model">Modèle</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Modèle (optionnel)"
                />
                {validationErrors.model && (
                  <p className="text-sm text-destructive">{validationErrors.model}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="marque">Marque</Label>
                <Input
                  id="marque"
                  value={formData.marque}
                  onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                  placeholder="Marque (optionnel)"
                />
                {validationErrors.marque && (
                  <p className="text-sm text-destructive">{validationErrors.marque}</p>
                )}
              </div>
            </CardContent>
          </Card>

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
                  placeholder="99.99"
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
                  placeholder="149.99"
                />
                {validationErrors.old_price && (
                  <p className="text-sm text-destructive">{validationErrors.old_price}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="discount_percent">Pourcentage de remise</Label>
                <Input
                  id="discount_percent"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                  placeholder="33.33"
                />
                {validationErrors.discount_percent && (
                  <p className="text-sm text-destructive">{validationErrors.discount_percent}</p>
                )}
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <input
                    id="is_on_sale"
                    type="checkbox"
                    checked={formData.is_on_sale}
                    onChange={(e) => setFormData({ ...formData, is_on_sale: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Label htmlFor="is_on_sale">En promotion</Label>
                </div>
                {validationErrors.is_on_sale && (
                  <p className="text-sm text-destructive">{validationErrors.is_on_sale}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="currency">Devise</Label>
                <select
                  id="currency"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="XAF">XAF</option>
                  <option value="CDF">CDF</option>
                </select>
                {validationErrors.currency && (
                  <p className="text-sm text-destructive">{validationErrors.currency}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="min_order">Commande minimum</Label>
                <Input
                  id="min_order"
                  type="number"
                  min="1"
                  value={formData.min_order}
                  onChange={(e) => setFormData({ ...formData, min_order: e.target.value })}
                  placeholder="1"
                />
                {validationErrors.min_order && (
                  <p className="text-sm text-destructive">{validationErrors.min_order}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Statut</Label>
                <select
                  id="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as "available" | "unavailable" })}
                >
                  <option value="available">Disponible</option>
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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.commission_type}
                  onChange={(e) => handleCommissionTypeChange(e.target.value as "none" | "fixed" | "percentage")}
                >
                  <option value="none">Aucune</option>
                  <option value="fixed">Fixe</option>
                  <option value="percentage">Pourcentage</option>
                </select>
                {validationErrors.commission_type && (
                  <p className="text-sm text-destructive">{validationErrors.commission_type}</p>
                )}
              </div>

              {formData.commission_type !== "none" && (
                <div className="grid gap-2">
                  <Label htmlFor="commission_value">Valeur de la commission</Label>
                  <Input
                    id="commission_value"
                    type="number"
                    step="0.01"
                    min="0"
                    max={
                      formData.commission_type === "percentage"
                        ? 20
                        : formData.price
                          ? parseFloat(formData.price) * 0.2
                          : undefined
                    }
                    value={formData.commission_value}
                    onChange={(e) => setFormData({ ...formData, commission_value: e.target.value })}
                    placeholder={formData.commission_type === "percentage" ? "10" : "50"}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.commission_type === "percentage"
                      ? "Maximum 20 % du prix du produit"
                      : formData.price
                        ? `Maximum ${(parseFloat(formData.price) * 0.2).toFixed(2)} (20 % du prix)`
                        : "Maximum 20 % du prix du produit"}
                  </p>
                  {validationErrors.commission_value && (
                    <p className="text-sm text-destructive">{validationErrors.commission_value}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Localisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="location">Localisation</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ville, Pays"
                />
                {validationErrors.location && (
                  <p className="text-sm text-destructive">{validationErrors.location}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Caractéristiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Label htmlFor={`feature-key-${index}`}>Clé</Label>
                    <Input
                      id={`feature-key-${index}`}
                      value={feature.key}
                      onChange={(e) => updateFeature(index, "key", e.target.value)}
                      placeholder="Ex: Couleur"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`feature-value-${index}`}>Valeur</Label>
                    <Input
                      id={`feature-value-${index}`}
                      value={feature.value}
                      onChange={(e) => updateFeature(index, "value", e.target.value)}
                      placeholder="Ex: Rouge"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6"
                    onClick={() => removeFeature(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addFeature}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une caractéristique
              </Button>
              {validationErrors.features && (
                <p className="text-sm text-destructive">{validationErrors.features}</p>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Spécifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.specifications.map((spec, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Label htmlFor={`spec-key-${index}`}>Clé</Label>
                    <Input
                      id={`spec-key-${index}`}
                      value={spec.key}
                      onChange={(e) => updateSpecification(index, "key", e.target.value)}
                      placeholder="Ex: Poids"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`spec-value-${index}`}>Valeur</Label>
                    <Input
                      id={`spec-value-${index}`}
                      value={spec.value}
                      onChange={(e) => updateSpecification(index, "value", e.target.value)}
                      placeholder="Ex: 1.5 kg"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6"
                    onClick={() => removeSpecification(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addSpecification}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une spécification
              </Button>
              {validationErrors.specifications && (
                <p className="text-sm text-destructive">{validationErrors.specifications}</p>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="images">Images (maximum 6)</Label>
                <Input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={formData.images.length >= 6}
                />
                <p className="text-sm text-muted-foreground">
                  {formData.images.length}/6 images
                </p>
                {validationErrors.images && (
                  <p className="text-sm text-destructive">{validationErrors.images}</p>
                )}
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {formData.images.length === 0 && (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Aucune image sélectionnée
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => router.push(returnTo)}>
            Annuler
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              "Créer le produit"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
