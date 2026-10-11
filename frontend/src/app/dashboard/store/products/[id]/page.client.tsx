"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "~/lib/hooks/use-auth";
import { productAPI } from "~/lib/api";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { ProductEditForm } from "./product-edit-form";
import { ArrowLeft, Package as PackageIcon } from "lucide-react";

function getCurrencySymbol(currency: string | undefined): string {
  const symbols: Record<string, string> = {
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
  return currency ? symbols[currency] || currency : "";
}

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
  shop?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
};

export function ShopProductDetailPageClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

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

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await productAPI.get(productId as string);
      const productData: Product = response.data.data;
      setProduct(productData);
      setSelectedImage(productData.images?.[0] || null);
    } catch (err) {
      setError("Erreur lors du chargement du produit");
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  const handleEditSuccess = () => {
    setMessage("Produit mis à jour avec succès");
    setIsEditing(false);
    loadProduct();
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setError("");
    setMessage("");
  };

  const handleEditError = (msg: string) => {
    setError(msg);
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
          <Button onClick={() => router.push("/dashboard/store/products")} className="mt-4">
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
          <Button variant="ghost" onClick={() => router.push("/dashboard/store/products")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <p className="text-muted-foreground">{product.slug}</p>
          </div>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            Modifier
          </Button>
        )}
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
        <ProductEditForm
          product={product}
          productId={productId as string}
          onSuccess={handleEditSuccess}
          onCancel={handleEditCancel}
          onError={handleEditError}
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
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

          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold">{product.name}</h2>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-lg font-medium text-muted-foreground">{CATEGORY_LABELS[product.category] || product.category}</span>
                {product.sub_category && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-lg font-medium text-muted-foreground">{product.sub_category}</span>
                  </>
                )}
              </div>
            </div>

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

            {product.short_description && (
              <p className="text-muted-foreground">{product.short_description}</p>
            )}

            {product.status === "available" ? (
              <p className="text-sm font-medium text-green-600">En stock</p>
            ) : (
              <p className="text-sm font-medium text-red-500">Indisponible</p>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button className="flex-1" onClick={() => setIsEditing(true)}>
                Modifier le produit
              </Button>
              <Button variant="outline" onClick={() => router.push("/dashboard/store/products")}>
                Retour
              </Button>
            </div>
          </div>
        </div>
      )}

      {!isEditing && product.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{product.description}</p>
          </CardContent>
        </Card>
      )}

      {!isEditing && product.images && product.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Galerie</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {!isEditing && (product.marque || product.model) && (
        <Card>
          <CardHeader>
            <CardTitle>Marque & Modèle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {product.marque && (
              <div className="flex justify-between text-sm">
                <span className="font-medium">Marque</span>
                <span className="text-muted-foreground">{product.marque}</span>
              </div>
            )}
            {product.model && (
              <div className="flex justify-between text-sm">
                <span className="font-medium">Modèle</span>
                <span className="text-muted-foreground">{product.model}</span>
              </div>
            )}
            {product.location && (
              <div className="flex justify-between text-sm">
                <span className="font-medium">Localisation</span>
                <span className="text-muted-foreground">{product.location}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
