"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "~/lib/hooks/use-auth";
import { productAPI } from "~/lib/api";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { ConfirmDialog } from "~/ui/components/confirm-dialog";
import { ArrowLeft, Plus } from "lucide-react";
import { ProductCard } from "./product-card";

type Product = {
  id: number;
  name: string;
  slug: string;
  short_description?: string;
  description?: string;
  marque?: string;
  model?: string;
  price: number;
  old_price?: number;
  discount_percent?: number;
  currency: string;
  images?: string[];
  status: "available" | "unavailable";
  is_on_sale?: boolean;
  verified?: boolean;
};

export function ShopProductsPageClient() {
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Chargement...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/dashboard/store")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Produits du magasin</h1>
            <p className="text-muted-foreground">
              Gérez les produits de votre magasin
            </p>
          </div>
        </div>
        <Button onClick={() => router.push("/dashboard/products/new?from=store")}>
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

      <Card>
        <CardHeader>
          <CardTitle>Tous les produits</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun produit pour le moment</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
