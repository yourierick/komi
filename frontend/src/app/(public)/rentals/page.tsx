"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Star } from "lucide-react";
import Link from "next/link";

import { publicRentalAPI } from "~/lib/api";
import { Button } from "~/ui/primitives/button";
import { RentalCard } from "~/ui/components/rental-card";
import { Skeleton } from "~/ui/primitives/skeleton";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type Category = string;

interface Rental {
  category: string;
  id: string;
  images: string[] | null;
  title: string;
  price: number;
  currency: string;
  payment_frequency: string;
  rating: number;
  location?: string;
  city?: string;
  country?: string;
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
  "real estate": "Immobilier",
  "Vehicles": "Véhicules",
  "Machinery": "Machines",
  "Electronics": "Électronique",
  "Events": "Événements",
  "Leisure": "Loisirs",
  "Furniture": "Mobilier",
  "Logistics": "Logistique",
  "Agriculture": "Agriculture",
  "other": "Autre",
};

/* -------------------------------------------------------------------------- */
/*                              Component                                     */
/* -------------------------------------------------------------------------- */

export default function RentalsPage() {
  /* ----------------------------- State ---------------------------------- */
  const searchParams = useSearchParams();
  const supplierId = searchParams?.get("supplier");
  
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = React.useState<Category>("All");

  /* ----------------------- Categories (derived) ------------------------- */
  const categories: Category[] = React.useMemo(() => {
    const dynamic = Array.from(new Set(rentals.map((r) => r.category))).sort();
    return ["All", ...dynamic];
  }, [rentals]);

  /* --------------------- Filtered rentals (memo) ----------------------- */
  const filteredRentals = React.useMemo(
    () =>
      selectedCategory === "All"
        ? rentals
        : rentals.filter((r) => r.category === selectedCategory),
    [selectedCategory, rentals],
  );

  /* --------------------------- Fetch data ------------------------------- */
  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const params: any = {};
        if (supplierId) {
          params.supplier = supplierId;
        }
        
        const response = await publicRentalAPI.list(params);
        setRentals(response.data.data);
      } catch (error) {
        console.error("Error fetching rentals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRentals();
  }, [supplierId]);

  /* ----------------------------- Render --------------------------------- */
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-10">
        <div
          className={`
            container px-4
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
              <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
              <p className="mt-1 text-lg text-muted-foreground">
                Parcourez nos biens en location et trouvez ce qu&apos;il vous faut.
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
                  title={`Filter by ${category}`}
                  variant={
                    category === selectedCategory ? "default" : "outline"
                  }
                >
                  {CATEGORY_LABELS[category] || category}
                </Button>
              ))}
            </div>
          </div>

          {/* Loading state */}
          {loading ? (
            <div
              className={`
                grid grid-cols-1 gap-6
                sm:grid-cols-2
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
            <>
              {/* Rental grid */}
              <div
                className={`
                  grid grid-cols-1 gap-6
                  sm:grid-cols-2
                  md:grid-cols-3
                  lg:grid-cols-4
                `}
              >
                {filteredRentals.map((rental) => (
                  <RentalCard key={rental.id} rental={rental} />
                ))}
              </div>

              {/* Empty state */}
              {filteredRentals.length === 0 && (
                <div className="mt-8 text-center">
                  <p className="text-muted-foreground">
                    Aucune location trouvée dans cette catégorie.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
