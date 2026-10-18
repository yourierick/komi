"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { adminAPI } from "~/lib/api";
import { cn } from "~/lib/cn";
import { useAuth } from "~/lib/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/ui/primitives/card";
import { Skeleton } from "~/ui/primitives/skeleton";
import {
  MapPin,
  MessageSquare,
  Package,
  ShoppingCart,
  Star,
  Store,
  Users,
  Wrench,
} from "lucide-react";

type AdminStats = {
  users: number;
  shops: number;
  products: number;
  rentals: number;
  services: number;
  orders: number;
  pending_comments: number;
  pending_supplier_reviews: number;
};

const statCards = [
  { key: "users", title: "Utilisateurs", icon: Users, color: "text-purple-600 dark:text-purple-400", href: "/admin/users" },
  { key: "shops", title: "Magasins", icon: Store, color: "text-blue-600 dark:text-blue-400", href: "/admin/shops" },
  { key: "products", title: "Produits", icon: Package, color: "text-green-600 dark:text-green-400", href: "/admin/products" },
  { key: "rentals", title: "Locations", icon: MapPin, color: "text-orange-600 dark:text-orange-400", href: "/admin/rentals" },
  { key: "services", title: "Services", icon: Wrench, color: "text-teal-600 dark:text-teal-400", href: "/admin/services" },
  { key: "orders", title: "Commandes", icon: ShoppingCart, color: "text-indigo-600 dark:text-indigo-400", href: "/admin/orders" },
  // les deux compteurs de modération se mettent en avant dès qu'ils ne sont pas à zéro
  { key: "pending_comments", title: "Commentaires en attente", icon: MessageSquare, color: "text-amber-600 dark:text-amber-400", href: "/admin/comments", alert: true },
  { key: "pending_supplier_reviews", title: "Avis fournisseurs en attente", icon: Star, color: "text-yellow-600 dark:text-yellow-400", href: "/admin/comments", alert: true },
] as const;

// hover gaté sur les pointeurs fins (le tactile laisse un faux :hover collé),
// press feedback sur toute la carte puisqu'elle est cliquable
const interactiveCard =
  "h-full border-border/60 transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out " +
  "hover-fine:border-border hover-fine:bg-accent hover-fine:shadow-md active:scale-[0.99]";

const cardLink =
  "block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const quickAccess = [
  { title: "Utilisateurs", description: "Gérer les comptes et les administrateurs", icon: Users, href: "/admin/users", color: "bg-purple-500" },
  { title: "Catalogue", description: "Produits, locations et services", icon: Package, href: "/admin/products", color: "bg-green-500" },
  { title: "Modération", description: "Commentaires et avis en attente", icon: MessageSquare, href: "/admin/comments", color: "bg-amber-500" },
];

export default function AdminDashboardPageClient() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await adminAPI.dashboard();
        setStats(response.data.data);
      } catch (err) {
        console.error("Error loading admin stats:", err);
        setError("Erreur lors du chargement des statistiques");
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="container flex-1 p-4 md:p-6">
        <div className="mb-6 space-y-2 md:mb-8">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>

        <div className="mb-4 md:mb-6">
          <Skeleton className="mb-3 h-6 w-40 md:mb-4" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="bg-muted/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-5" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-7 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mb-4 md:mb-6">
          <Skeleton className="mb-3 h-6 w-36 md:mb-4" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-muted/50">
                <CardHeader className="space-y-2 pb-3">
                  <Skeleton className="mb-2 h-10 w-10 rounded-lg sm:h-12 sm:w-12" />
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-44" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        container flex-1 p-4 duration-300 ease-out
        animate-in fade-in
        motion-safe:slide-in-from-bottom-2
        md:p-6
      `}
    >
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Vue d'ensemble de la plateforme — {user?.name}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/15 p-4 text-sm text-destructive duration-200 animate-in fade-in md:mb-6">
          {error}
        </div>
      )}

      <div className="mb-4 md:mb-6">
        <h2 className="mb-3 text-lg font-semibold md:mb-4 md:text-xl">Statistiques générales</h2>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const value = stats?.[stat.key] ?? 0;
            const needsAttention = "alert" in stat && stat.alert && value > 0;

            return (
              <Link className={cardLink} href={stat.href} key={stat.key}>
                <Card
                  className={cn(
                    "bg-muted/50",
                    interactiveCard,
                    needsAttention && "border-amber-500/50 bg-amber-500/5",
                  )}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className={`h-4 w-4 shrink-0 md:h-5 md:w-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl md:text-2xl font-bold tabular-nums">
                        {value}
                      </span>
                      {needsAttention && (
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                          à traiter
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mb-4 md:mb-6">
        <h2 className="mb-3 text-lg font-semibold md:mb-4 md:text-xl">Accès rapide</h2>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {quickAccess.map((card) => (
            <Link className={cardLink} href={card.href} key={card.href + card.title}>
              <Card className={cn("bg-muted/50", interactiveCard)}>
                <CardHeader className="pb-3">
                  <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-lg text-white sm:h-12 sm:w-12 ${card.color}`}>
                    <card.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <CardTitle className="text-base sm:text-lg">{card.title}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{card.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
