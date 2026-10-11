"use client";

import { Search, User, Package, Building2, Star, BadgeCheck } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import { supplierAPI } from "~/lib/api";
import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
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

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Add fadeIn animation styles
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async (search?: string) => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) {
        params.search = search;
      }
      const response = await supplierAPI.list(params);
      setSuppliers(response.data.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      setError("Erreur lors du chargement des fournisseurs");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSuppliers(searchQuery);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Fournisseurs</h1>
          <p className="text-muted-foreground">
            Découvrez nos fournisseurs de confiance
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher un fournisseur par nom, email, téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Rechercher</Button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-lg border p-6">
                <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
                <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                <Skeleton className="h-4 w-1/2 mx-auto mb-4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Suppliers Grid */}
        {!loading && suppliers.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {suppliers.map((supplier, index) => (
              <Link
                key={supplier.id}
                href={`/suppliers/${supplier.id}`}
                className="group rounded-lg border bg-card p-6 transition-all duration-200 hover:shadow-lg hover:border-primary/20"
                style={{
                  animation: `fadeIn 300ms ease-out forwards`,
                  animationDelay: `${index * 50}ms`,
                  opacity: 0,
                }}
              >
                <div className="flex flex-col items-center text-center">
                  {supplier.picture ? (
                    <img
                      src={supplier.picture}
                      alt={supplier.name}
                      className="h-20 w-20 rounded-full object-cover mb-4 transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-105">
                      <User className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold transition-colors duration-200 group-hover:text-primary">
                      {supplier.name}
                    </h3>
                    {supplier.certified && (
                      <BadgeCheck className="h-5 w-5 text-blue-500" aria-label="Fournisseur certifié" />
                    )}
                  </div>
                  
                  {/* Rating */}
                  {supplier.total_reviews > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{supplier.rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">
                        ({supplier.total_reviews})
                      </span>
                    </div>
                  )}
                  
                  {supplier.address && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {supplier.address}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 w-full mt-4 pt-4 border-t">
                    <div className="flex flex-col items-center">
                      <Package className="h-4 w-4 text-muted-foreground mb-1 transition-transform duration-200 group-hover:scale-110" />
                      <span className="text-sm font-medium">{supplier.products_count}</span>
                      <span className="text-xs text-muted-foreground">Produits</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Package className="h-4 w-4 text-muted-foreground mb-1 transition-transform duration-200 group-hover:scale-110" />
                      <span className="text-sm font-medium">{supplier.rentals_count}</span>
                      <span className="text-xs text-muted-foreground">Locations</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Building2 className="h-4 w-4 text-muted-foreground mb-1 transition-transform duration-200 group-hover:scale-110" />
                      <span className="text-sm font-medium">{supplier.services_count}</span>
                      <span className="text-xs text-muted-foreground">Services</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && suppliers.length === 0 && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun fournisseur trouvé</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Essayez une autre recherche"
                : "Il n'y a pas encore de fournisseurs"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
