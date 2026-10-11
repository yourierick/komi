"use client";

import Link from "next/link";
import * as React from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { publicServiceAPI } from "~/lib/api";
import { ServiceCard } from "~/ui/components/service-card";
import { Button } from "~/ui/primitives/button";
import { Skeleton } from "~/ui/primitives/skeleton";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type Category = string;

interface Service {
  category: string;
  city?: string;
  country?: string;
  currency?: string;
  description?: string;
  id: string;
  images?: null | string[];
  location?: string;
  payment_frequency?: string;
  price: number;
  rating?: number;
  slug: string;
  status?: string;
  sub_category?: string;
  title: string;
  total_reviews?: number;
  verified?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                            Helpers / utilities                             */
/* -------------------------------------------------------------------------- */

const slugify = (str: string) =>
  str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

const CATEGORY_LABELS: Record<string, string> = {
  beauty: "Beauté",
  cleaning: "Nettoyage",
  consulting: "Consulting",
  delivery: "Livraison",
  education: "Éducation",
  electrical: "Électricité",
  "electronic and repair": "Électronique et Réparation",
  finance: "Finance",
  health: "Santé",
  legal: "Juridique",
  maintenance: "Maintenance",
  musician: "Musique",
  painting: "Peinture",
  printing: "Impression",
  "software engineering": "Ingénierie Logicielle",
  tech: "Tech",
};

/* -------------------------------------------------------------------------- */
/*                              Component                                     */
/* -------------------------------------------------------------------------- */

export default function ServicesPage() {
  /* ----------------------------- State ---------------------------------- */
  const searchParams = useSearchParams();
  const supplierId = searchParams?.get("supplier");
  
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>(["Tous"]);
  const [selectedCategory, setSelectedCategory] = useState<Category>("Tous");
  const [loading, setLoading] = useState(true);

  /* --------------------------- Fetch data ------------------------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const params: any = {};
        if (supplierId) {
          params.supplier = supplierId;
        }
        
        const [servicesRes, categoriesRes] = await Promise.all([
          publicServiceAPI.list(params),
          publicServiceAPI.categories(),
        ]);
        setServices(servicesRes.data.data);
        const categoryNames = categoriesRes.data.data.map((c: any) => c.name);
        setCategories(["Tous", ...categoryNames]);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supplierId]);

  /* --------------------- Filtered services (memo) ----------------------- */
  const filteredServices = React.useMemo(
    () =>
      selectedCategory === "Tous"
        ? services
        : services.filter((s) => s.category === selectedCategory),
    [selectedCategory, services],
  );

  /* ----------------------------- Render --------------------------------- */
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-10">
        <div
          className={`
            px-4
            md:px-6
          `}
        >
          {/* Heading & filters */}
          <div
            className={`
              mb-8 flex flex-col gap-4
              md:flex-row md:items-center md:justify-between
            `}
          >
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Services</h1>
              <p className="mt-1 text-lg text-muted-foreground">
                Parcourez les services proposés par nos professionnels.
              </p>
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  aria-pressed={category === selectedCategory}
                  className="rounded-full"
                  key={slugify(category)}
                  onClick={() => setSelectedCategory(category)}
                  size="sm"
                  title={`Filtrer par ${category}`}
                  variant={
                    category === selectedCategory ? "default" : "outline"
                  }
                >
                  {CATEGORY_LABELS[category] || category}
                </Button>
              ))}
            </div>
          </div>

          {/* Service grid */}
          {loading ? (
            <div
              className={`
                grid grid-cols-1 gap-6
                sm:grid-cols-1
                md:grid-cols-3
                lg:grid-cols-4
              `}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="stagger-item">
                  <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                  <Skeleton className="mt-3 h-4 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div
              className={`
                grid grid-cols-1 gap-6
                sm:grid-cols-1
                md:grid-cols-3
                lg:grid-cols-4
              `}
            >
              {filteredServices.map((service) => (
                <Link href={`/services/${service.id}`} key={service.id}>
                  <ServiceCard service={{ ...service, id: String(service.id) }} />
                </Link>
              ))}
            </div>
          )}

          {/* Empty state */}
          {filteredServices.length === 0 && (
            <div className="mt-8 text-center">
              <p className="text-muted-foreground">
                Aucun service trouvé dans cette catégorie.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
