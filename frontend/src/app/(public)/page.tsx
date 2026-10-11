"use client";

import { ArrowRight, Clock, ShoppingBag, Star, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { publicProductAPI, publicRentalAPI, publicServiceAPI } from "~/lib/api";
import { ProductCard } from "~/ui/components/product-card";
import { RentalCard } from "~/ui/components/rental-card";
import { ServiceCard } from "~/ui/components/service-card";
import { TestimonialsSection } from "~/ui/components/testimonials/testimonials-with-marquee";
import { Button } from "~/ui/primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/ui/primitives/card";
import { Skeleton } from "~/ui/primitives/skeleton";

import { testimonials } from "./mocks";

const featuresWhyChooseUs = [
  {
    description:
      "Livraison gratuite sur toutes les commandes de plus de 50 $. Livraison rapide et fiable jusqu'à votre porte.",
    icon: <Truck className="h-6 w-6 text-primary" />,
    title: "Livraison gratuite",
  },
  {
    description:
      "Vos informations de paiement sont toujours sécurisées avec nous. Nous utilisons un chiffrement de pointe de l'industrie.",
    icon: <ShoppingBag className="h-6 w-6 text-primary" />,
    title: "Paiement sécurisé",
  },
  {
    description:
      "Notre équipe de support client est toujours disponible pour vous aider avec toutes questions ou préoccupations.",
    icon: <Clock className="h-6 w-6 text-primary" />,
    title: "Support 24/7",
  },
  {
    description:
      "Nous garantissons la qualité de chaque produit que nous vendons. Garantie de remboursement de 30 jours.",
    icon: <Star className="h-6 w-6 text-primary" />,
    title: "Garantie qualité",
  },
];

const CATEGORY_IMAGES: Record<string, string> = {
  "Agriculture, Livestock, and Fishing": "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Applications and New Technologies": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Books, Media, and Games": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Buildings": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Computers and Accessories": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Construction and Real Estate": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Electrical Equipment and Supplies": "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Electronics and Components": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Food and Beverages": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "hardware and home improvement": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Home and decor": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Home Appliances": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Jewelry, Eyewear, and Watches": "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Luggage, Bags, Cases": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Makeup": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Medical and Health": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "office supplies": "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Packaging and Printing": "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Parents, Children, and Games": "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Phones and Accessories": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Renewable Energy": "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "shoes and accessories": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Sports and Fitness": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "vehicle parts and accessories": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Vehicles and Transportation": "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  "Wearables and Accessories": "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
};

const CATEGORY_LABELS: Record<string, string> = {
  "Agriculture, Livestock, and Fishing": "Agriculture, Élevage et Pêche",
  "Applications and New Technologies": "Applications et Nouvelles Technologies",
  "Books, Media, and Games": "Livres, Médias et Jeux",
  "Buildings": "Bâtiments",
  "Computers and Accessories": "Ordinateurs et Accessoires",
  "Construction and Real Estate": "Construction et Immobilier",
  "Electrical Equipment and Supplies": "Matériel et Fournitures Électriques",
  "Electronics and Components": "Électronique",
  "Food and Beverages": "Aliments et Boissons",
  "hardware and home improvement": "Quincaillerie et Bricolage",
  "Home and decor": "Maison et Décoration",
  "Home Appliances": "Électroménager",
  "Jewelry, Eyewear, and Watches": "Bijoux, Lunettes et Montres",
  "Luggage, Bags, Cases": "Bagages, Sacs, Étuis",
  "Makeup": "Maquillage",
  "Medical and Health": "Médical et Santé",
  "office supplies": "Fournitures de bureau",
  "Packaging and Printing": "Emballage et Impression",
  "Parents, Children, and Games": "Parents, Enfants et Jeux",
  "Phones and Accessories": "Téléphones et Accessoires",
  "Renewable Energy": "Énergie Renouvelable",
  "shoes and accessories": "Chaussures et Accessoires",
  "Sports and Fitness": "Sports et Fitness",
  "vehicle parts and accessories": "Pièces et Accessoires Automobiles",
  "Vehicles and Transportation": "Véhicules et Transport",
  "Wearables and Accessories": "Vêtements et Accessoires",
};

function SectionHeading({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="mb-10 flex flex-col items-center text-center">
      <h2
        className={`
          font-display text-3xl leading-tight font-bold tracking-tight text-balance
          md:text-4xl
        `}
      >
        {title}
      </h2>
      <div className="mt-3 h-1 w-12 rounded-full bg-primary" />
      <p className="mt-4 max-w-2xl text-muted-foreground text-pretty">
        {description}
      </p>
    </div>
  );
}

export default function HomePage() {
  const [categories, setCategories] = useState<{ count: number; name: string; }[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [featuredRentals, setFeaturedRentals] = useState<any[]>([]);
  const [featuredServices, setFeaturedServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, productsRes, rentalsRes, servicesRes] = await Promise.all([
          publicProductAPI.categories(),
          publicProductAPI.featured(),
          publicRentalAPI.list(),
          publicServiceAPI.list(),
        ]);
        setCategories(categoriesRes.data.data);
        setFeaturedProducts(productsRes.data.data);
        setFeaturedRentals(rentalsRes.data.data.slice(0, 3));
        setFeaturedServices(servicesRes.data.data.slice(0, 4));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  return (
    <>
      {/* no gap between sections: the alternating bg-muted/50 bands have to
          touch to read as bands rather than floating blocks */}
      <main className="flex min-h-screen flex-col bg-background">
        {/* Sample banner */}
        {/* <UkraineBanner /> */}

        {/* Hero Section */}
        <section
          className={`
            relative overflow-hidden bg-gradient-to-b from-muted/60
            to-background py-24
            md:py-32
          `}
        >
          <div
            className={`
              bg-grid pointer-events-none absolute inset-0
              [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]
            `}
          />
          <div
            className={`
              relative z-10 container mx-auto max-w-7xl px-4
              sm:px-6
              lg:px-8
            `}
          >
            <div
              className={`
                grid items-center gap-10
                lg:grid-cols-2 lg:gap-12
              `}
            >
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  {/* <HeroBadge /> */}

                  <h1
                    className={`
                      font-display text-4xl leading-tight font-bold
                      tracking-tight text-balance text-foreground
                      sm:text-5xl
                      md:text-6xl
                      lg:leading-[1.1]
                    `}
                  >
                    Gagnez{" "}
                    <span
                      className={`
                        bg-gradient-to-r from-primary to-primary/70 bg-clip-text
                        text-transparent
                      `}
                    >
                      sans capital
                    </span>
                  </h1>
                  <p
                    className={`
                      max-w-[640px] text-lg text-muted-foreground text-pretty
                      md:text-xl
                    `}
                  >
                    La plateforme qui connecte vendeurs, commissionnaires et
                    clients en RDC. Trouvez facilement ce que vous cherchez, et
                    générez des revenus sans rien investir.
                  </p>
                </div>
                <div
                  className={`
                    flex flex-col gap-3
                    sm:flex-row
                  `}
                >
                  <Link href="/products">
                    <Button className="group h-12 gap-1.5 px-8" size="lg">
                      Parcourir le magasin
                      <ArrowRight
                        className={`
                          h-4 w-4 transition-transform duration-200 ease-out
                          group-hover:translate-x-0.5
                        `}
                      />
                    </Button>
                  </Link>
                  <Link href="/auth/sign-up">
                    <Button className="h-12 px-8" size="lg" variant="outline">
                      Commencez dès maintenant
                    </Button>
                  </Link>
                </div>
                <div
                  className={`
                    flex flex-wrap gap-5 text-sm text-muted-foreground
                  `}
                >
                  <div className="flex items-center gap-1.5">
                    <Truck className="h-5 w-5 text-primary/70" />
                    <span>Livraison gratuite à partir de 50 $</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-5 w-5 text-primary/70" />
                    <span>Support client 24/7</span>
                  </div>
                </div>
              </div>
              <div
                className={`
                  relative mx-auto hidden aspect-square w-full max-w-md
                  overflow-hidden rounded-xl border shadow-lg
                  lg:block
                `}
              >
                <div
                  className={`
                    absolute inset-0 z-10 bg-gradient-to-tr from-primary/20
                    via-transparent to-transparent
                  `}
                />
                <Image
                  alt="Shopping experience"
                  className="object-cover"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  src="https://images.unsplash.com/photo-1624767735494-1929dc24ad43?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
                />
              </div>
            </div>
          </div>
          <div
            className={`
              absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent
              via-primary/20 to-transparent
            `}
          />
        </section>

        {/* Featured Categories */}
        <section
          className={`
            py-12
            md:py-16
          `}
        >
          <div
            className={`
              container mx-auto max-w-7xl px-4
              sm:px-6
              lg:px-8
            `}
          >
            <SectionHeading
              description="Trouvez ce qu'il vous faut parmi nos collections sélectionnées"
              title="Magasin par catégorie"
            />
            <div
              className={`
                grid grid-cols-1 gap-4
                sm:grid-cols-2
                lg:grid-cols-4 lg:gap-6
              `}
            >
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="stagger-item">
                    <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                    <Skeleton className="mt-4 h-4 w-3/4" />
                  </div>
                ))
              ) : categories.length === 0 ? (
                <p className="col-span-full text-center text-muted-foreground">Aucune catégorie disponible</p>
              ) : (
                categories.slice(0, 4).map((category) => (
                  <Link
                    aria-label={`Browse ${category.name} products`}
                    className={`
                      stagger-item group relative flex flex-col space-y-4
                      overflow-hidden rounded-2xl border bg-card shadow
                      transition-[transform,box-shadow] duration-200 ease-out
                      hover-fine:-translate-y-1 hover-fine:shadow-lg
                    `}
                    href={`/products?category=${encodeURIComponent(category.name)}`}
                    key={category.name}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <div
                        className={`
                          absolute inset-0 z-10 bg-gradient-to-t
                          from-background/80 to-transparent
                        `}
                      />
                      <Image
                        alt={category.name}
                        className={`
                          object-cover transition-transform duration-300 ease
                          group-hover:scale-105
                        `}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        src={CATEGORY_IMAGES[category.name] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"}
                      />
                    </div>
                    <div className="relative z-20 -mt-6 p-4">
                      <div className="mb-1 text-lg font-medium">
                        {CATEGORY_LABELS[category.name] || category.name}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {category.count} produits
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section
          className={`
            bg-muted/50 py-12
            md:py-16
          `}
        >
          <div
            className={`
              container mx-auto max-w-7xl px-4
              sm:px-6
              lg:px-8
            `}
          >
            <SectionHeading
              description="Découvrez nos produits les plus récents et les plus demandés"
              title="Produits en vedette"
            />
            <div
              className={`
                grid grid-cols-1 gap-6
                sm:grid-cols-2
                lg:grid-cols-4
              `}
            >
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="stagger-item">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="mt-3 h-4 w-3/4" />
                    <Skeleton className="mt-2 h-4 w-1/2" />
                  </div>
                ))
              ) : featuredProducts.length === 0 ? (
                <p className="col-span-full text-center text-muted-foreground"></p>
              ) : (
                featuredProducts.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
            </div>
            <div className="mt-10 flex justify-center">
              <Link href="/products">
                <Button className="group h-12 px-8" size="lg" variant="outline">
                  Voir tous les produits
                  <ArrowRight
                    className={`
                      ml-2 h-4 w-4 transition-transform duration-200 ease-out
                      group-hover:translate-x-0.5
                    `}
                  />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Rentals */}
        <section
          className={`
            py-12
            md:py-16
          `}
        >
          <div
            className={`
              container mx-auto max-w-7xl px-4
              sm:px-6
              lg:px-8
            `}
          >
            <SectionHeading
              description="Des biens disponibles à la location pour vos besoins personnels ou professionnels"
              title="Biens à louer"
            />
            <div
              className={`
                grid grid-cols-1 gap-6
                sm:grid-cols-2
                lg:grid-cols-4
              `}
            >
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="stagger-item">
                    <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                    <Skeleton className="mt-3 h-4 w-3/4" />
                    <Skeleton className="mt-2 h-4 w-1/2" />
                  </div>
                ))
              ) : featuredRentals.length === 0 ? (
                <p className="col-span-full text-center text-muted-foreground">Aucune location disponible</p>
              ) : (
                featuredRentals.map((rental: any) => (
                  <RentalCard
                    key={rental.id}
                    rental={rental}
                  />
                ))
              )}
            </div>
            <div className="mt-10 flex justify-center">
              <Link href="/rentals">
                <Button className="group h-12 px-8" size="lg" variant="outline">
                  Voir toutes les locations
                  <ArrowRight
                    className={`
                      ml-2 h-4 w-4 transition-transform duration-200 ease-out
                      group-hover:translate-x-0.5
                    `}
                  />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Services */}
        <section
          className={`
            bg-muted/50 py-12
            md:py-16
          `}
        >
          <div
            className={`
              container mx-auto max-w-7xl px-4
              sm:px-6
              lg:px-8
            `}
          >
            <SectionHeading
              description="Découvrez les services proposés par nos professionnels vérifiés"
              title="Services à la une"
            />
            <div
              className={`
                grid grid-cols-1 gap-6
                sm:grid-cols-2
                lg:grid-cols-4
              `}
            >
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="stagger-item">
                    <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                    <Skeleton className="mt-3 h-4 w-3/4" />
                    <Skeleton className="mt-2 h-4 w-1/2" />
                  </div>
                ))
              ) : featuredServices.length === 0 ? (
                <p className="col-span-full text-center text-muted-foreground">Aucun service disponible</p>
              ) : (
                featuredServices.map((service: any) => (
                  <Link href={`/services/${service.id}`} key={service.id}>
                    <ServiceCard service={{ ...service, id: String(service.id) }} />
                  </Link>
                ))
              )}
            </div>
            <div className="mt-10 flex justify-center">
              <Link href="/services">
                <Button className="group h-12 px-8" size="lg" variant="outline">
                  Voir tous les services
                  <ArrowRight
                    className={`
                      ml-2 h-4 w-4 transition-transform duration-200 ease-out
                      group-hover:translate-x-0.5
                    `}
                  />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          className={`
            py-12
            md:py-16
          `}
          id="features"
        >
          <div
            className={`
              container mx-auto max-w-7xl px-4
              sm:px-6
              lg:px-8
            `}
          >
            <SectionHeading
              description="Nous offrons la meilleure expérience d'achat avec des fonctionnalités premium"
              title="Pourquoi nous choisir"
            />
            <div
              className={`
                grid gap-8
                md:grid-cols-2
                lg:grid-cols-4
              `}
            >
              {featuresWhyChooseUs.map((feature) => (
                <Card
                  className={`
                    rounded-2xl border-none bg-card shadow
                    transition-[transform,box-shadow] duration-200 ease-out
                    hover-fine:-translate-y-1 hover-fine:shadow-lg
                  `}
                  key={feature.title}
                >
                  <CardHeader className="pb-2">
                    <div
                      className={`
                        mb-3 flex h-12 w-12 items-center justify-center
                        rounded-full bg-primary/10
                      `}
                    >
                      {feature.icon}
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section
          className={`
            bg-muted/50 py-12
            md:py-16
          `}
        >
          <div
            className={`
              container mx-auto max-w-7xl px-4
              sm:px-6
              lg:px-8
            `}
          >
            <TestimonialsSection
              className="py-0"
              description="Ne nous croyez pas sur parole - écoutez-le depuis nos clients satisfaits"
              testimonials={testimonials}
              title="Ce que nos clients disent!"
            />
          </div>
        </section>

        {/* CTA Section */}
        <section
          className={`
            py-12
            md:py-16
          `}
        >
          <div
            className={`
              container mx-auto max-w-7xl px-4
              sm:px-6
              lg:px-8
            `}
          >
            <div
              className={`
                relative overflow-hidden rounded-xl bg-primary/10 p-8 shadow-lg
                md:p-12
              `}
            >
              <div
                className={`
                  bg-grid pointer-events-none absolute inset-0
                  [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]
                `}
              />
              <div className="relative z-10 mx-auto max-w-2xl text-center">
                <h2
                  className={`
                    font-display text-3xl leading-tight font-bold tracking-tight
                    md:text-4xl
                  `}
                >
                  Prêt à vous lancer ?
                </h2>
                <p
                  className={`
                    mt-4 text-lg text-muted-foreground text-pretty
                    md:text-xl
                  `}
                >
                  Rejoignez des milliers de clients satisfaits, achetez en toute
                  sécurité et commencez à générer des revenus dès aujourd'hui.
                </p>
                <div
                  className={`
                    mt-6 flex flex-col items-center justify-center gap-3
                    sm:flex-row
                  `}
                >
                  <Link href="/auth/sign-up">
                    <Button className="h-12 px-8" size="lg">
                      S'inscrire maintenant
                    </Button>
                  </Link>
                  <Link href="/products">
                    <Button className="h-12 px-8" size="lg" variant="outline">
                      Parcourir les produits
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
