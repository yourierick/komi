"use client";

import { useEffect, useState } from "react";
import { productAPI, shopAPI } from "~/lib/api";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Loader2, Plus, X, Image as ImageIcon } from "lucide-react";

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

type Product = {
  id: number;
  name: string;
  description?: string;
  short_description?: string;
  category: string;
  sub_category?: string;
  location?: string;
  model?: string;
  marque?: string;
  price: number;
  old_price?: number;
  discount_percent?: number;
  is_on_sale?: boolean;
  currency: string;
  min_order: number;
  status: "available" | "unavailable";
  commission_type: "none" | "fixed" | "percentage";
  commission_value?: number;
  features?: string[];
  specifications?: string[];
  images?: string[];
  shop_id?: number;
  shop?: {
    id: number;
    name: string;
  };
};

type ProductEditFormProps = {
  product: Product;
  productId: string;
  onSuccess: () => void;
  onCancel: () => void;
  onError: (message: string) => void;
};

export function ProductEditForm({ product, productId, onSuccess, onCancel, onError }: ProductEditFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [shops, setShops] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || "",
    short_description: product.short_description || "",
    category: product.category,
    sub_category: product.sub_category || "",
    location: product.location || "",
    model: product.model || "",
    marque: product.marque || "",
    price: product.price.toString(),
    old_price: product.old_price?.toString() || "",
    discount_percent: product.discount_percent?.toString() || "",
    is_on_sale: product.is_on_sale || false,
    currency: product.currency,
    min_order: product.min_order.toString(),
    status: product.status,
    commission_type: product.commission_type,
    commission_value: product.commission_value?.toString() || "",
    features: (product.features as unknown as { key: string; value: string }[]) || [],
    specifications: (product.specifications as unknown as { key: string; value: string }[]) || [],
    images: [] as File[],
    existingImages: Array.isArray(product.images) ? product.images : [],
    shop_id: product.shop_id?.toString() || product.shop?.id?.toString() || "",
  });

  useEffect(() => {
    loadShops();
  }, []);

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
    setValidationErrors({});
    setSubmitting(true);

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
      formDataToSend.append('old_price', formData.old_price);
      formDataToSend.append('discount_percent', formData.discount_percent);
      formDataToSend.append('is_on_sale', formData.is_on_sale ? '1' : '0');
      formDataToSend.append('currency', formData.currency);
      formDataToSend.append('min_order', formData.min_order);
      formDataToSend.append('status', formData.status);
      formDataToSend.append('commission_type', formData.commission_type);
      formDataToSend.append('commission_value', formData.commission_value);
      formDataToSend.append('features', JSON.stringify(formData.features));
      formDataToSend.append('specifications', JSON.stringify(formData.specifications));
      if (formData.shop_id) {
        formDataToSend.append('shop_id', formData.shop_id);
      }

      formData.images.forEach((file) => {
        formDataToSend.append('images[]', file);
      });

      await productAPI.update(productId, formDataToSend);
      onSuccess();
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const imageErrors = Object.keys(errors).filter(key => key.startsWith('images.'));
        if (imageErrors.length > 0) {
          errors.images = imageErrors.map(key => {
            const error = errors[key];
            return Array.isArray(error) ? error.join(', ') : error;
          }).join(', ');
        }
        Object.keys(errors).forEach(key => {
          if (Array.isArray(errors[key])) {
            errors[key] = errors[key].join(', ');
          }
        });
        setValidationErrors(errors);
        onError("Veuillez corriger les erreurs dans le formulaire");
      } else {
        onError("Erreur lors de la mise à jour du produit");
      }
      console.error(err);
    } finally {
      setSubmitting(false);
    }
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      if (formData.images.length + (formData.existingImages?.length || 0) + newFiles.length > 6) {
        onError("Maximum 6 images autorisées");
        return;
      }
      setFormData({ ...formData, images: [...formData.images, ...newFiles] });
    }
  };

  const removeImage = (index: number) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
  };

  const removeExistingImage = (index: number) => {
    setFormData({ ...formData, existingImages: formData.existingImages?.filter((_, i) => i !== index) || [] });
  };

  return (
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
            </div>

            <div className="grid gap-2">
              <Label htmlFor="short_description">Description courte</Label>
              <Input
                id="short_description"
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                placeholder="Description courte (optionnel)"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="model">Modèle</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Modèle (optionnel)"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="marque">Marque</Label>
              <Input
                id="marque"
                value={formData.marque}
                onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                placeholder="Marque (optionnel)"
              />
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
            </div>

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
            </div>

            <div className="grid gap-2">
              <Label htmlFor="commission_type">Type de commission</Label>
              <select
                id="commission_type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.commission_type}
                onChange={(e) => setFormData({ ...formData, commission_type: e.target.value as "none" | "fixed" | "percentage" })}
              >
                <option value="none">Aucune</option>
                <option value="fixed">Fixe</option>
                <option value="percentage">Pourcentage</option>
              </select>
            </div>

            {formData.commission_type !== "none" && (
              <div className="grid gap-2">
                <Label htmlFor="commission_value">Valeur de la commission</Label>
                <Input
                  id="commission_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.commission_value}
                  onChange={(e) => setFormData({ ...formData, commission_value: e.target.value })}
                  placeholder={formData.commission_type === "percentage" ? "10" : "50"}
                />
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
                disabled={formData.images.length + (formData.existingImages?.length || 0) >= 6}
              />
              <p className="text-sm text-muted-foreground">
                {formData.images.length + (formData.existingImages?.length || 0)}/6 images
              </p>
              {validationErrors.images && (
                <p className="text-sm text-destructive">{validationErrors.images}</p>
              )}
            </div>

            {(formData.images.length > 0 || (formData.existingImages?.length || 0) > 0) && (
              <div className="grid grid-cols-3 gap-4">
                {formData.existingImages?.map((image, index) => (
                  <div key={`existing-${index}`} className="relative group">
                    <img
                      src={image}
                      alt={`Image existante ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeExistingImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {formData.images.map((image, index) => (
                  <div key={`new-${index}`} className="relative group">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Nouvelle image ${index + 1}`}
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

            {formData.images.length === 0 && (formData.existingImages?.length || 0) === 0 && (
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
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Traitement...
            </>
          ) : (
            "Mettre à jour"
          )}
        </Button>
      </div>
    </form>
  );
}
