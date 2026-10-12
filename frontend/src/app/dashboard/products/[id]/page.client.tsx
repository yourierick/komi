"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAuth } from "~/lib/hooks/use-auth";
import { productAPI, shopAPI } from "~/lib/api";
import { toast } from "sonner";
import { ProductCommentsDashboard } from "~/ui/components/product-comments-dashboard";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { ArrowLeft, MapPin, DollarSign, Package as PackageIcon, CheckCircle, Loader2, Plus, X, Image as ImageIcon } from "lucide-react";

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
  slug: string;
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
  verified: boolean;
  status: "available" | "unavailable";
  commission_type: "none" | "fixed" | "percentage";
  commission_value?: number;
  features?: string[];
  specifications?: string[];
  images?: string[];
  shop_id?: number;
  created_at: string;
  updated_at: string;
};

export default function ProductDetailPageClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const returnTo = from === "store" ? "/dashboard/store/products" : "/dashboard/products";
  const productId = params.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [shops, setShops] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });

  const imageContainerRef = useRef<HTMLDivElement>(null);

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
    existingImages: [] as string[],
    shop_id: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/sign-in");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user && productId) {
      loadProduct();
    }
  }, [user, productId]);

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

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await productAPI.get(productId as string);
      const productData: Product = response.data.data;
      setProduct(productData);
      setSelectedImage(productData.images?.[0] || null);
      setFormData({
        name: productData.name,
        description: productData.description || "",
        short_description: productData.short_description || "",
        category: productData.category,
        sub_category: productData.sub_category || "",
        location: productData.location || "",
        model: productData.model || "",
        marque: productData.marque || "",
        price: productData.price.toString(),
        old_price: productData.old_price?.toString() || "",
        discount_percent: productData.discount_percent?.toString() || "",
        is_on_sale: productData.is_on_sale || false,
        currency: productData.currency,
        min_order: productData.min_order.toString(),
        status: productData.status,
        commission_type: productData.commission_type,
        commission_value: productData.commission_value?.toString() || "",
        features: (productData.features as unknown as { key: string; value: string }[]) || [],
        specifications: (productData.specifications as unknown as { key: string; value: string }[]) || [],
        images: [],
        existingImages: Array.isArray(productData.images) ? productData.images : [],
        shop_id: productData.shop_id?.toString() || "",
      });
    } catch (err) {
      setError("Erreur lors du chargement du produit");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setMessage("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
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

      await productAPI.update(productId as string, formDataToSend);
      setMessage("Produit mis à jour avec succès");
      await loadProduct();
      setIsEditing(false);
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
        setError("Erreur lors de la mise à jour du produit");
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
        setError("Maximum 6 images autorisées");
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

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const handleImageMouseEnter = () => {
    setIsZoomed(true);
  };

  const handleImageMouseLeave = () => {
    setIsZoomed(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Chargement...</h1>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Produit non trouvé</h1>
          <Button onClick={() => router.push(returnTo)} className="mt-4">
            Retour aux produits
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push(returnTo)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <p className="text-muted-foreground">{product.slug}</p>
          </div>
        </div>
        <Button onClick={handleEdit}>
          Modifier
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-md bg-green-100 p-4 text-sm text-green-800">
          {message}
        </div>
      )}

      {isEditing ? (
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
                    <option value="available">En stock</option>
                    <option value="unavailable">Rupture de stock</option>
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
                    onChange={(e) => setFormData({ ...formData, commission_type: e.target.value as "none" | "fixed" | "percentage" })}
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
                      value={formData.commission_value}
                      onChange={(e) => setFormData({ ...formData, commission_value: e.target.value })}
                      placeholder={formData.commission_type === "percentage" ? "10" : "50"}
                    />
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
            <Button type="button" variant="outline" onClick={handleCancelEdit}>
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
      ) : (
        <div className="flex min-h-screen flex-col">
          <main className="flex-1 py-10">
            <div className="container px-4 md:px-6">
              {/* Back link */}
              <Button
                aria-label="Retour aux produits"
                className="mb-6"
                onClick={() => router.push(returnTo)}
                variant="ghost"
              >
                ← Retour aux produits
              </Button>

              {/* Main grid */}
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Product image */}
                <div
                  ref={imageContainerRef}
                  className="relative aspect-square overflow-hidden rounded-lg bg-muted cursor-crosshair"
                  onMouseMove={handleImageMouseMove}
                  onMouseEnter={handleImageMouseEnter}
                  onMouseLeave={handleImageMouseLeave}
                >
                  {selectedImage || product.images?.[0] ? (
                    <img
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-200 ease-out"
                      style={{
                        transform: isZoomed ? "scale(2.5)" : "scale(1)",
                        transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                      }}
                      src={selectedImage || product.images?.[0]}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PackageIcon className="h-24 w-24 text-muted-foreground" />
                    </div>
                  )}
                  {product.is_on_sale && product.discount_percent && (
                    <div className="absolute top-4 left-4 rounded-full bg-red-500 px-3 py-1 text-sm font-bold text-white pointer-events-none">
                      -{Number(product.discount_percent).toFixed(0)}%
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="flex flex-col">
                  {/* Title & category */}
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold">{product.name}</h1>
                    <div className="mt-2 flex items-center gap-2">
                      <PackageIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-lg font-medium text-muted-foreground">
                        {CATEGORY_LABELS[product.category] || product.category}
                      </span>
                      {product.sub_category && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-lg font-medium text-muted-foreground">
                            {product.sub_category}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Prices */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold">
                        {Number(product.price || 0).toFixed(2)} {getCurrencySymbol(product.currency)}
                      </span>
                      {product.old_price && (
                        <span className="text-xl text-muted-foreground line-through">
                          {Number(product.old_price).toFixed(2)} {getCurrencySymbol(product.currency)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Short description */}
                  {product.short_description && (
                    <p className="mb-6 text-muted-foreground">
                      {product.short_description}
                    </p>
                  )}

                  {/* Description */}
                  {product.description && (
                    <p className="mb-6 text-muted-foreground">
                      {product.description}
                    </p>
                  )}

                  {/* Stock status */}
                  <div className="mb-6">
                    {product.status === "available" ? (
                      <p className="text-sm font-medium text-green-600">En stock</p>
                    ) : (
                      <p className="text-sm font-medium text-red-500">En rupture de stock</p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Button
                      className="flex-1"
                      onClick={() => setIsEditing(true)}
                    >
                      Modifier le produit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push(returnTo)}
                    >
                      Retour
                    </Button>
                  </div>
                </div>
              </div>

              <div className="my-8 border-t" />

              {/* Brand/Model/Location */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
                {(product.marque || product.model) && (
                  <div className="rounded-lg border p-6">
                    <h2 className="mb-3 text-xl font-bold">Marque & Modèle</h2>
                    <div className="space-y-2">
                      {product.marque && (
                        <div className="flex justify-between border-b pb-2 text-sm">
                          <span className="font-medium">Marque</span>
                          <span className="text-muted-foreground">{product.marque}</span>
                        </div>
                      )}
                      {product.model && (
                        <div className="flex justify-between border-b pb-2 text-sm">
                          <span className="font-medium">Modèle</span>
                          <span className="text-muted-foreground">{product.model}</span>
                        </div>
                      )}
                      {product.location && (
                        <div className="flex justify-between border-b pb-2 text-sm">
                          <span className="font-medium">Localisation</span>
                          <span className="text-muted-foreground">{product.location}</span>
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
                      <span className={product.status === "available" ? "text-green-600" : "text-red-500"}>
                        {product.status === "available" ? "En stock" : "En rupture de stock"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-2 text-sm">
                      <span className="font-medium">Commande minimum</span>
                      <span className="text-muted-foreground">{product.min_order} pièces</span>
                    </div>
                    {product.verified && (
                      <div className="flex justify-between border-b pb-2 text-sm">
                        <span className="font-medium">Vérification</span>
                        <span className="text-green-600">Vérifié</span>
                      </div>
                    )}
                    {product.commission_type !== "none" && (
                      <div className="flex justify-between border-b pb-2 text-sm">
                        <span className="font-medium">Commission</span>
                        <span className="text-muted-foreground">
                          {product.commission_type === 'percentage' ? product.commission_value + '%' :  product.commission_value + getCurrencySymbol(product.currency)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {product.images && product.images.length > 0 && (
                  <div className="rounded-lg border p-6">
                    <h2 className="mb-3 text-xl font-bold">Galerie</h2>
                    <div className="grid grid-cols-3 gap-2">
                      {product.images.map((image, index) => (
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
                {product.features && product.features.length > 0 && (
                  <section>
                    <h2 className="mb-4 text-2xl font-bold">Caractéristiques</h2>
                    <ul className="space-y-2">
                      {product.features.map((feature, index) => (
                        <li className="flex items-start" key={`feature-${index}`}>
                          <span className="mt-1.5 mr-2 h-2 w-2 rounded-full bg-primary" />
                          <span>
                            {typeof feature === 'string' ? feature : `${(feature as any).key}: ${(feature as any).value}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Specifications */}
                {product.specifications && product.specifications.length > 0 && (
                  <section>
                    <h2 className="mb-4 text-2xl font-bold">Spécifications</h2>
                    <div className="space-y-2">
                      {product.specifications.map((spec, index) => (
                        <div
                          className="flex justify-between border-b pb-2 text-sm"
                          key={`spec-${index}`}
                        >
                          <span className="font-medium capitalize">
                            {typeof spec === 'string' ? spec : (spec as any).key}
                          </span>
                          <span className="text-muted-foreground">
                            {typeof spec === 'string' ? '' : (spec as any).value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Comments and Reviews Management */}
              <div className="mt-8">
                <ProductCommentsDashboard productId={String(product.id)} />
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
