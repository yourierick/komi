"use client";

import { Package as PackageIcon, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { serviceAPI } from "~/lib/api";
import { useAuth } from "~/lib/hooks/use-auth";
import { ConfirmDialog } from "~/ui/components/confirm-dialog";
import { ServiceCard } from "~/ui/components/service-card";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent } from "~/ui/primitives/card";
import { Skeleton } from "~/ui/primitives/skeleton";

interface Service {
  category: string;
  city?: string;
  country?: string;
  created_at: string;
  currency: string;
  description?: string;
  id: number;
  images?: string[];
  location?: string;
  payment_frequency: "daily" | "hourly" | "monthly" | "per_project" | "weekly";
  price: number;
  rating: number;
  slug: string;
  status: "available" | "unavailable";
  sub_category?: string;
  title: string;
  total_reviews: number;
  updated_at: string;
  verified: boolean;
}

export default function ServicesPageClient() {
  const { loading: authLoading, user } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<null | number>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/sign-in");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      loadServices();
    }
  }, [user]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await serviceAPI.list();
      setServices(response.data.data);
    } catch (err) {
      setError("Erreur lors du chargement des services");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    setServiceToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (serviceToDelete === null) return;
    try {
      await serviceAPI.delete(serviceToDelete);
      loadServices();
    } catch (err) {
      setError("Erreur lors de la suppression du service");
      console.error(err);
    } finally {
      setServiceToDelete(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-36" />
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
          <h1 className="text-3xl font-bold tracking-tight">Mes Services</h1>
          <p className="text-muted-foreground">
            Gérez vos offres de services
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/services/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Service
        </Button>
      </div>

      {error && (
        <div className={`
          rounded-md bg-destructive/15 p-4 text-sm text-destructive
        `}>
          {error}
        </div>
      )}

      <ConfirmDialog
        cancelText="Annuler"
        confirmText="Supprimer"
        description="Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible."
        onConfirm={confirmDelete}
        onOpenChange={setConfirmOpen}
        open={confirmOpen}
        title="Supprimer le service"
        variant="destructive"
      />

      {services.length === 0 ? (
        <Card>
          <CardContent className={`
            flex flex-col items-center justify-center py-12
          `}>
            <PackageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Aucun service</h3>
            <p className="mb-4 text-center text-muted-foreground">
              Vous n'avez pas encore créé de service. Commencez par en créer un.
            </p>
            <Button onClick={() => router.push("/dashboard/services/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Créer un service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={`
          grid gap-6
          md:grid-cols-2
          lg:grid-cols-3
        `}>
          {services.map((service) => (
            <div className="relative" key={service.id}>
              <ServiceCard
                className="h-full cursor-pointer"
                onClick={() => router.push(`/dashboard/services/${service.id}`)}
                service={{
                  ...service,
                  id: String(service.id),
                  status: service.status,
                }}
              />
              <Button
                className={`
                  absolute top-2 right-2 h-8 w-8 rounded-full bg-white p-0
                  text-destructive shadow-md
                  hover:bg-gray-100
                `}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(service.id);
                }}
                size="icon"
                variant="ghost"
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
