"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "~/lib/hooks/use-auth";
import { productAPI } from "~/lib/api";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Skeleton } from "~/ui/primitives/skeleton";
import { ConfirmDialog } from "~/ui/components/confirm-dialog";
import { PrivateProductCard } from "~/ui/components/private-product-card";
import { Plus, Edit, Trash2, Package as PackageIcon, DollarSign, MapPin } from "lucide-react";

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
  images?: string[];
  created_at: string;
  updated_at: string;
};

export default function ProductsPageClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/sign-in");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.list();
      setProducts(response.data.data);
      console.log(response.data.data)
    } catch (err) {
      setError("Erreur lors du chargement des produits");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    setProductToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (productToDelete === null) return;

    try {
      await productAPI.delete(productToDelete);
      loadProducts();
    } catch (err) {
      setError("Erreur lors de la suppression du produit");
      console.error(err);
    } finally {
      setProductToDelete(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2 rounded-lg border bg-card p-2.5">
              <Skeleton className="aspect-square w-full rounded-t-lg" />
              <div className="space-y-2 pt-1">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-5 w-1/3" />
                <div className="flex gap-1.5 pt-1">
                  <Skeleton className="h-4 w-16 rounded-full" />
                  <Skeleton className="h-4 w-12 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes Produits</h1>
          <p className="text-muted-foreground">
            Gérez vos produits et leurs informations
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/products/new?from=products")}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Produit
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Supprimer le produit"
        description="Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        onConfirm={confirmDelete}
      />

      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PackageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun produit</h3>
            <p className="text-muted-foreground text-center mb-4">
              Vous n'avez pas encore créé de produit. Commencez par en créer un.
            </p>
            <Button onClick={() => router.push("/dashboard/products/new?from=products")}>
              <Plus className="mr-2 h-4 w-4" />
              Créer un produit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {products.map((product) => (
            <div key={product.id} className="relative group">
              <div onClick={() => router.push(`/dashboard/products/${product.id}`)}>
                <PrivateProductCard product={{ ...product, id: String(product.id), images: product.images || [] }} />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 bg-white hover:bg-gray-100 rounded-full shadow-md text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(product.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
