"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { publicProductAPI } from "~/lib/api";
import { ProductCard } from "~/ui/components/product-card";
import { Button } from "~/ui/primitives/button";
import { Skeleton } from "~/ui/primitives/skeleton";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type Category = string;

interface Product {
  category: string;
  id: string;
  images?: string[];
  image?: string;
  status?: string;
  inStock?: boolean;
  name: string;
  originalPrice?: number;
  old_price?: number;
  discount_percent?: number;
  price: number;
  rating?: number;
  total_reviews?: number;
  currency?: string;
  marque?: string;
  short_description?: string;
  model?: string;
  verified?: boolean;
  is_on_sale?: boolean;
  min_order?: number;
  commission_type?: 'none' | 'fixed' | 'percentage';
  commission_value?: number;
}

/* -------------------------------------------------------------------------- */
/*                            Helpers / utilities                             */
/* -------------------------------------------------------------------------- */

const slugify = (str: string) =>
  str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

/* -------------------------------------------------------------------------- */
/*                              Component                                     */
/* -------------------------------------------------------------------------- */

export default function ProductsPage() {
  /* ----------------------------- State ---------------------------------- */
  const searchParams = useSearchParams();
  const supplierId = searchParams?.get("supplier");
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(["Tous"]);
  const [selectedCategory, setSelectedCategory] = useState<Category>("Tous");
  const [loading, setLoading] = useState(true);


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

  /* --------------------------- Fetch data ------------------------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const params: any = {};
        if (supplierId) {
          params.supplier = supplierId;
        }
        
        const [productsRes, categoriesRes] = await Promise.all([
          publicProductAPI.list(params),
          publicProductAPI.categories(),
        ]);
        setProducts(productsRes.data.data);
        const categoryNames = categoriesRes.data.data.map((c: any) => c.name);
        setCategories(["Tous", ...categoryNames]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supplierId]);

  /* --------------------- Filtered products (memo) ----------------------- */
  const filteredProducts = React.useMemo(
    () =>
      selectedCategory === "Tous"
        ? products
        : products.filter((p) => p.category === selectedCategory),
    [selectedCategory, products],
  );

  /* --------------------------- Handlers --------------------------------- */
  const handleAddToWishlist = React.useCallback((productId: string) => {
    // TODO: integrate with Wishlist feature
    console.log(`Added ${productId} to wishlist`);
  }, []);

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
              <h1 className="text-3xl font-bold tracking-tight">Produits</h1>
              <p className="mt-1 text-lg text-muted-foreground">
                Parcourez nos derniers produits et trouvez ce que vous aimez.
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

          {/* Product grid */}
          {loading ? (
            <div
              className={`
                grid grid-cols-1 gap-6
                sm:grid-cols-1
                md:grid-cols-3
                lg:grid-cols-5
              `}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="stagger-item">
                  <Skeleton className="aspect-square w-full rounded-lg" />
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
                lg:grid-cols-5
              `}
            >
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  onAddToWishlist={handleAddToWishlist}
                  product={product}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {filteredProducts.length === 0 && (
            <div className="mt-8 text-center">
              <p className="text-muted-foreground">
                Aucun produit trouvé dans cette catégorie.
              </p>
            </div>
          )}

          {/* Pagination */}
          <nav
            aria-label="Pagination"
            className="mt-12 flex items-center justify-center gap-2"
          >
            <Button disabled variant="outline">
              Précédent
            </Button>
            <Button aria-current="page" variant="default">
              1
            </Button>
            <Button disabled variant="outline">
              Suivant
            </Button>
          </nav>
        </div>
      </main>
    </div>
  );
}
