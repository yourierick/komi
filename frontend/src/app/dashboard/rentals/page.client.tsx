"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "~/lib/hooks/use-auth";
import { rentalAPI } from "~/lib/api";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Skeleton } from "~/ui/primitives/skeleton";
import { ConfirmDialog } from "~/ui/components/confirm-dialog";
import { PrivateRentalCard } from "~/ui/components/private-rental-card";
import { Plus, Trash2, MapPin, Package as PackageIcon } from "lucide-react";

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

type Rental = {
  id: number;
  title: string;
  slug: string;
  description?: string;
  category: string;
  sub_category?: string;
  location?: string;
  city?: string;
  country?: string;
  price: number;
  currency: string;
  payment_frequency: "daily" | "weekly" | "monthly";
  status: "available" | "rented" | "maintenance" | "unavailable";
  verified: boolean;
  rating: number;
  total_reviews: number;
  images?: string[];
  created_at: string;
  updated_at: string;
};

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "/ jour",
  weekly: "/ semaine",
  monthly: "/ mois",
};

const STATUS_LABELS: Record<string, string> = {
  available: "Disponible",
  rented: "Loué",
  maintenance: "Maintenance",
  unavailable: "Indisponible",
};

const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  rented: "bg-blue-100 text-blue-700",
  maintenance: "bg-yellow-100 text-yellow-700",
  unavailable: "bg-gray-100 text-gray-700",
};

export default function RentalsPageClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rentalToDelete, setRentalToDelete] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/sign-in");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      loadRentals();
    }
  }, [user]);

  const loadRentals = async () => {
    try {
      setLoading(true);
      const response = await rentalAPI.list();
      setRentals(response.data.data);
    } catch (err) {
      setError("Erreur lors du chargement des locations");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    setRentalToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (rentalToDelete === null) return;
    try {
      await rentalAPI.delete(rentalToDelete);
      loadRentals();
    } catch (err) {
      setError("Erreur lors de la suppression de la location");
      console.error(err);
    } finally {
      setRentalToDelete(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          <h1 className="text-3xl font-bold tracking-tight">Mes Biens de Locations</h1>
          <p className="text-muted-foreground">
            Gérez vos annonces de location
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/rentals/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau bien de location
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
        title="Supprimer la location"
        description="Êtes-vous sûr de vouloir supprimer cette location ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        onConfirm={confirmDelete}
      />

      {rentals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PackageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun bien de location</h3>
            <p className="text-muted-foreground text-center mb-4">
              Vous n'avez pas encore créé de bien de location. Commencez par en créer un.
            </p>
            <Button onClick={() => router.push("/dashboard/rentals/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Créer un bien de location
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rentals.map((rental) => (
            <div key={rental.id} className="relative group">
              <div onClick={() => router.push(`/dashboard/rentals/${rental.id}`)}>
                <PrivateRentalCard rental={{ ...rental, id: String(rental.id), images: rental.images || null }} />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 bg-white hover:bg-gray-100 rounded-full shadow-md text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(rental.id);
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
