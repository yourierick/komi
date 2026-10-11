"use client";

import { Building2, Mail, MapPin, Package, Phone, Star, User, BadgeCheck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { supplierAPI } from "~/lib/api";
import { SupplierReviews } from "~/ui/components/supplier-reviews";
import { Button } from "~/ui/primitives/button";
import { Skeleton } from "~/ui/primitives/skeleton";

interface Supplier {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  picture?: string;
  rating: number;
  total_reviews: number;
  certified: boolean;
  products_count: number;
  rentals_count: number;
  services_count: number;
  shops_count: number;
}

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params?.id as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supplierId) return;

    const fetchSupplier = async () => {
      try {
        setLoading(true);
        const response = await supplierAPI.get(supplierId);
        setSupplier(response.data.data);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching supplier:", err);
        if (err.response?.status === 404) {
          setError("Fournisseur non trouvé");
        } else {
          setError("Erreur lors du chargement du fournisseur");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSupplier();
  }, [supplierId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{error || "Fournisseur non trouvé"}</h3>
            <Button onClick={() => router.push("/suppliers")} className="mt-4">
              Retour aux fournisseurs
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/suppliers")}
          className="mb-6"
        >
          ← Retour aux fournisseurs
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Supplier Info Card */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border bg-card p-6">
              <div className="flex flex-col items-center text-center">
                {supplier.picture ? (
                  <img
                    src={supplier.picture}
                    alt={supplier.name}
                    className="h-32 w-32 rounded-full object-cover mb-4"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center mb-4">
                    <User className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold">{supplier.name}</h1>
                  {supplier.certified && (
                    <BadgeCheck className="h-6 w-6 text-blue-500" aria-label="Fournisseur certifié" />
                  )}
                </div>

                {/* Rating */}
                {supplier.total_reviews > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="ml-1 font-semibold">{supplier.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({supplier.total_reviews} avis)
                    </span>
                  </div>
                )}

                {/* Contact Info */}
                <div className="w-full mt-6 space-y-3 text-left">
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="break-all">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{supplier.address}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="w-full mt-6 pt-6 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Produits</span>
                    <span className="font-medium">{supplier.products_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Locations</span>
                    <span className="font-medium">{supplier.rentals_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Services</span>
                    <span className="font-medium">{supplier.services_count}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Catalog Section */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-bold mb-6">Catalogue</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Products Button */}
                {supplier.products_count > 0 && (
                  <Button
                    variant="outline"
                    className="h-auto flex-col items-start p-6 text-left transition-all duration-200 hover:border-primary hover:shadow-md active:scale-[0.97]"
                    onClick={() => router.push(`/products?supplier=${supplier.id}`)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Package className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" />
                      <span className="text-lg font-semibold">Produits</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {supplier.products_count} produit{supplier.products_count > 1 ? 's' : ''} disponible{supplier.products_count > 1 ? 's' : ''}
                    </p>
                  </Button>
                )}

                {/* Rentals Button */}
                {supplier.rentals_count > 0 && (
                  <Button
                    variant="outline"
                    className="h-auto flex-col items-start p-6 text-left transition-all duration-200 hover:border-primary hover:shadow-md active:scale-[0.97]"
                    onClick={() => router.push(`/rentals?supplier=${supplier.id}`)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Package className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" />
                      <span className="text-lg font-semibold">Biens de location</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {supplier.rentals_count} bien{supplier.rentals_count > 1 ? 's' : ''} de location disponible{supplier.rentals_count > 1 ? 's' : ''}
                    </p>
                  </Button>
                )}

                {/* Services Button */}
                {supplier.services_count > 0 && (
                  <Button
                    variant="outline"
                    className="h-auto flex-col items-start p-6 text-left transition-all duration-200 hover:border-primary hover:shadow-md active:scale-[0.97]"
                    onClick={() => router.push(`/services?supplier=${supplier.id}`)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" />
                      <span className="text-lg font-semibold">Services</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {supplier.services_count} service{supplier.services_count > 1 ? 's' : ''} disponible{supplier.services_count > 1 ? 's' : ''}
                    </p>
                  </Button>
                )}
              </div>

              {supplier.products_count === 0 && supplier.rentals_count === 0 && supplier.services_count === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Aucun produit, location ou service disponible pour le moment
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <SupplierReviews supplierId={supplier.id} supplierName={supplier.name} />
        </div>
      </main>
    </div>
  );
}
