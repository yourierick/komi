"use client";

import Link from "next/link";
import { useEffect } from "react";

import { useAuth } from "~/lib/hooks/use-auth";
import { requireAuth } from "~/lib/api";
import { Button } from "~/ui/primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/ui/primitives/card";
import { Skeleton } from "~/ui/primitives/skeleton";
import { Badge } from "~/ui/primitives/badge";
import {
  Upload,
  BarChart3,
  CreditCard,
  User,
  Settings,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Données d'exemple pour les graphiques
const salesData = [
  { month: "Jan", sales: 4000, orders: 240 },
  { month: "Fév", sales: 3000, orders: 180 },
  { month: "Mar", sales: 5000, orders: 320 },
  { month: "Avr", sales: 4500, orders: 290 },
  { month: "Mai", sales: 6000, orders: 380 },
  { month: "Juin", sales: 5500, orders: 350 },
];

const userGrowthData = [
  { month: "Jan", users: 120 },
  { month: "Fév", users: 180 },
  { month: "Mar", users: 250 },
  { month: "Avr", users: 320 },
  { month: "Mai", users: 400 },
  { month: "Juin", users: 480 },
];

const categoryData = [
  { name: "Électronique", value: 400, color: "#3b82f6" },
  { name: "Vêtements", value: 300, color: "#10b981" },
  { name: "Alimentation", value: 200, color: "#f59e0b" },
  { name: "Autres", value: 100, color: "#8b5cf6" },
];

const recentOrders = [
  { id: "ORD-001", customer: "Jean Dupont", amount: 150.00, status: "Livré", date: "2024-06-15" },
  { id: "ORD-002", customer: "Marie Martin", amount: 89.50, status: "En cours", date: "2024-06-14" },
  { id: "ORD-003", customer: "Pierre Bernard", amount: 245.00, status: "Livré", date: "2024-06-13" },
  { id: "ORD-004", customer: "Sophie Petit", amount: 67.00, status: "Annulé", date: "2024-06-12" },
  { id: "ORD-005", customer: "Lucas Dubois", amount: 320.00, status: "En cours", date: "2024-06-11" },
];

const statsCards = [
  { title: "Revenus totaux", value: "€24,500", icon: DollarSign, color: "text-green-600", change: "+12.5%" },
  { title: "Commandes", value: "1,234", icon: ShoppingCart, color: "text-blue-600", change: "+8.2%" },
  { title: "Utilisateurs", value: "5,678", icon: Users, color: "text-purple-600", change: "+15.3%" },
  { title: "Taux de conversion", value: "3.2%", icon: TrendingUp, color: "text-orange-600", change: "+2.1%" },
];

export default function DashboardPageClient() {
  const { user, loading } = useAuth();
  useEffect(() => {
    if (!loading && !user) {
      requireAuth("/auth/sign-in");
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="container flex-1 p-4 md:p-6">
        <div className="mb-6 space-y-2 md:mb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="mb-4 md:mb-6">
          <Skeleton className="mb-3 h-6 w-40 md:mb-4" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-muted/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-5" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="mt-1 h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mb-4 md:mb-6">
          <Skeleton className="mb-3 h-6 w-48 md:mb-4" />
          <Card className="bg-muted/50">
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 md:mb-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="bg-muted/50">
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[250px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mb-4 md:mb-6">
          <Skeleton className="mb-3 h-6 w-44 md:mb-4" />
          <Card className="bg-muted/50">
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-52" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="mb-4 md:mb-6">
          <Skeleton className="mb-3 h-6 w-36 md:mb-4" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="bg-muted/50">
                <CardHeader className="space-y-2 pb-3">
                  <Skeleton className="mb-2 h-10 w-10 rounded-lg sm:h-12 sm:w-12" />
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-40" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const dashboardCards = [
    {
      title: "Téléversements",
      description: "Gérer vos fichiers et médias",
      icon: Upload,
      href: "/dashboard/uploads",
      color: "bg-blue-500",
    },
    {
      title: "Statistiques",
      description: "Voir vos statistiques d'utilisation",
      icon: BarChart3,
      href: "/dashboard/stats",
      color: "bg-green-500",
    },
    {
      title: "Facturation",
      description: "Gérer vos abonnements et paiements",
      icon: CreditCard,
      href: "/dashboard/billing",
      color: "bg-purple-500",
    },
    {
      title: "Profil",
      description: "Modifier vos informations personnelles",
      icon: User,
      href: "/dashboard/profile",
      color: "bg-orange-500",
    },
    {
      title: "Paramètres",
      description: "Configurer vos préférences",
      icon: Settings,
      href: "/dashboard/settings",
      color: "bg-gray-500",
    },
  ];

  return (
    <div className="container flex-1 p-4 md:p-6">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold md:text-3xl">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Bienvenue, {user?.name || "Utilisateur"}
        </p>
      </div>

      <div className="mb-4 md:mb-6">
        <h2 className="mb-3 text-lg font-semibold md:mb-4 md:text-xl">Statistiques générales</h2>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => (
            <Card key={stat.title} className="bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stat.change}</span> par rapport au mois dernier
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="mb-4 md:mb-6">
        <h2 className="mb-3 text-lg font-semibold md:mb-4 md:text-xl">Ventes et commandes</h2>
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Évolution des ventes</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Ventes et commandes sur les 6 derniers mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#3b82f6" name="Ventes (€)" />
                <Bar dataKey="orders" fill="#10b981" name="Commandes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 md:mb-6 grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Croissance des utilisateurs</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Nouveaux utilisateurs par mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} name="Utilisateurs" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Répartition par catégorie</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Ventes par catégorie de produits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 md:mb-6">
        <h2 className="mb-3 text-lg font-semibold md:mb-4 md:text-xl">Dernières commandes</h2>
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Historique récent</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Les 5 dernières commandes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-3 text-xs font-medium md:text-sm">ID Commande</th>
                    <th className="text-left pb-3 text-xs font-medium md:text-sm">Client</th>
                    <th className="text-left pb-3 text-xs font-medium md:text-sm">Montant</th>
                    <th className="text-left pb-3 text-xs font-medium md:text-sm">Statut</th>
                    <th className="text-left pb-3 text-xs font-medium md:text-sm">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="py-3 text-xs md:text-sm font-medium">{order.id}</td>
                      <td className="py-3 text-xs md:text-sm">{order.customer}</td>
                      <td className="py-3 text-xs md:text-sm">€{order.amount.toFixed(2)}</td>
                      <td className="py-3">
                        <Badge
                          variant={
                            order.status === "Livré"
                              ? "default"
                              : order.status === "En cours"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-xs md:text-sm text-muted-foreground">{order.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 md:mb-6">
        <h2 className="mb-3 text-lg font-semibold md:mb-4 md:text-xl">Accès rapide</h2>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {dashboardCards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card className="bg-muted/50 transition-colors hover:bg-accent h-full">
                <CardHeader className="pb-3">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg sm:h-12 sm:w-12">
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
