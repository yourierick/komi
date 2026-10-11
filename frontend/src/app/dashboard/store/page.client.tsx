"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "~/lib/hooks/use-auth";
import { shopAPI } from "~/lib/api";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Plus, Edit, Trash2, Store as StoreIcon, MapPin, Star, CheckCircle, MoreVertical } from "lucide-react";

type Shop = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  rccm?: string;
  status: "active" | "inactive" | "suspended";
  verified: boolean;
  rating: number;
  total_reviews: number;
  social_links?: Record<string, string>;
  business_hours?: Record<string, string>;
  created_at: string;
  updated_at: string;
};

export default function StorePageClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      setLoading(true);
      const response = await shopAPI.list();
      setShops(response.data.data);
    } catch (err) {
      setError("Erreur lors du chargement des magasins");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce magasin ?")) {
      return;
    }

    try {
      await shopAPI.delete(id);
      loadShops();
    } catch (err) {
      setError("Erreur lors de la suppression du magasin");
      console.error(err);
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes Magasins</h1>
          <p className="text-muted-foreground">
            Gérez vos magasins et leurs informations
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/store/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Magasin
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {shops.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <StoreIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun magasin</h3>
            <p className="text-muted-foreground text-center mb-4">
              Vous n'avez pas encore créé de magasin. Commencez par en créer un.
            </p>
            <Button onClick={() => router.push("/dashboard/store/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Créer un magasin
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => (
            <Card 
              key={shop.id} 
              className="overflow-hidden hover:shadow-xl transition-transform duration-200 ease-out group cursor-pointer"
              onClick={() => router.push(`/dashboard/store/${shop.id}`)}
            >
              {shop.banner && (
                <div className="h-32 w-full overflow-hidden">
                  <img
                    src={shop.banner}
                    alt={shop.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {shop.logo && (
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={shop.logo}
                          alt={shop.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold truncate">
                        {shop.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{shop.rating.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">({shop.total_reviews})</span>
                        </div>
                        {shop.verified && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(shop.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {shop.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {shop.description}
                  </p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      shop.status === "active"
                        ? "bg-green-100 text-green-700"
                        : shop.status === "inactive"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {shop.status === "active"
                      ? "Actif"
                      : shop.status === "inactive"
                      ? "Inactif"
                      : "Suspendu"}
                  </span>
                  {shop.city && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{shop.city}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export { StorePageClient };
