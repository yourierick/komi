"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Ban,
  Clock,
  Minus,
  Package,
  ShoppingCart,
  Store,
  Target,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";

import { adminAPI } from "~/lib/api";
import { Badge } from "~/ui/primitives/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/ui/primitives/card";
import { Skeleton } from "~/ui/primitives/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/ui/primitives/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/ui/primitives/tabs";

type RankedItem = {
  id: number;
  name: string;
  orders: number;
  quantity: number;
  revenue: number;
};

type Reseller = {
  id: number;
  name: string;
  total_orders: number;
  concretized_orders: number;
  revenue: number;
  commission_earned: number;
  conversion_rate: number;
};

type Supplier = { id: number; name: string; orders: number; revenue: number };

type SalesStats = {
  period: { days: number; from: string; to: string };
  summary: {
    total_orders: number;
    concretized_orders: number;
    conversion_rate: number;
    revenue: number;
    average_order_value: number;
    pending_orders: number;
    pending_amount: number;
    lost_orders: number;
    lost_amount: number;
    commission_total: number;
    previous: { revenue: number; concretized_orders: number };
    growth: { revenue_pct: number | null; orders_pct: number | null };
  };
  by_status: { status: string; count: number; amount: number }[];
  by_item_type: { type: string; count: number; revenue: number }[];
  timeseries: { date: string; revenue: number; orders: number }[];
  top_products: RankedItem[];
  top_rentals: RankedItem[];
  top_services: RankedItem[];
  top_resellers: Reseller[];
  top_suppliers: Supplier[];
};

const PERIODS = [
  { value: 7, label: "7 jours" },
  { value: 30, label: "30 jours" },
  { value: 90, label: "90 jours" },
  { value: 365, label: "12 mois" },
];

const statusLabels: Record<string, string> = {
  under_negotiation: "En négociation",
  confirmed: "Confirmées",
  paid: "Payées",
  completed: "Terminées",
  cancelled: "Annulées",
  refunded: "Remboursées",
};

const itemTypeLabels: Record<string, { label: string; color: string }> = {
  product: { label: "Produits", color: "#3b82f6" },
  rental: { label: "Locations", color: "#8b5cf6" },
  service: { label: "Services", color: "#f59e0b" },
};

const rankingTabs = [
  { key: "top_products", label: "Produits", icon: Package, unit: "vendus" },
  { key: "top_rentals", label: "Locations", icon: Store, unit: "louées" },
  { key: "top_services", label: "Services", icon: Wrench, unit: "commandés" },
] as const;

const fmt = (value: number) => value.toLocaleString("fr-FR");

const formatAxisDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });

function GrowthBadge({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <Badge className="gap-1" variant="secondary">
        <ArrowUpRight className="h-3 w-3" />
        Nouveau
      </Badge>
    );
  }
  if (value === 0) {
    return (
      <Badge className="gap-1" variant="outline">
        <Minus className="h-3 w-3" />
        Stable
      </Badge>
    );
  }
  const positive = value > 0;
  return (
    <Badge className="gap-1" variant={positive ? "default" : "destructive"}>
      {positive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {positive ? "+" : ""}
      {value}%
    </Badge>
  );
}

export default function AdminSalesPageClient() {
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.sales.stats(days);
      setStats(response.data.data);
    } catch (err) {
      console.error("Error loading sales stats:", err);
      toast.error("Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const summary = stats?.summary;

  const kpis = [
    {
      title: "Chiffre d'affaires",
      value: summary ? fmt(summary.revenue) : "0",
      sub: summary ? `${fmt(summary.previous.revenue)} période précédente` : "",
      growth: summary?.growth.revenue_pct,
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Ventes concrétisées",
      value: summary ? fmt(summary.concretized_orders) : "0",
      sub: summary ? `sur ${fmt(summary.total_orders)} commandes` : "",
      growth: summary?.growth.orders_pct,
      icon: ShoppingCart,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Taux de conversion",
      value: summary ? `${summary.conversion_rate}%` : "0%",
      sub: "commandes converties en ventes",
      icon: Target,
      color: "text-indigo-600 dark:text-indigo-400",
    },
    {
      title: "Panier moyen",
      value: summary ? fmt(summary.average_order_value) : "0",
      sub: "par vente concrétisée",
      icon: Package,
      color: "text-purple-600 dark:text-purple-400",
    },
  ];

  const secondaryKpis = [
    {
      title: "En cours",
      value: summary ? fmt(summary.pending_amount) : "0",
      sub: summary ? `${summary.pending_orders} commandes en négociation` : "",
      icon: Clock,
      tone: "border-amber-500/40 bg-amber-500/5",
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "Ventes perdues",
      value: summary ? fmt(summary.lost_amount) : "0",
      sub: summary ? `${summary.lost_orders} annulées ou remboursées` : "",
      icon: Ban,
      tone: "border-red-500/40 bg-red-500/5",
      color: "text-red-600 dark:text-red-400",
    },
    {
      title: "Commissions générées",
      value: summary ? fmt(summary.commission_total) : "0",
      sub: "sur les ventes concrétisées",
      icon: Users,
      tone: "",
      color: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div
      className={`
        container flex-1 space-y-6 p-4 duration-300 ease-out
        animate-in fade-in
        motion-safe:slide-in-from-bottom-2
        md:p-6
      `}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Statistiques des ventes
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            {stats
              ? `Du ${new Date(`${stats.period.from}T00:00:00`).toLocaleDateString("fr-FR")} à aujourd'hui`
              : "Analyse des commandes, produits et partenaires"}
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          {PERIODS.map((p) => (
            <button
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                days === p.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover-fine:bg-accent hover-fine:text-accent-foreground"
              }`}
              key={p.value}
              onClick={() => setDays(p.value)}
              type="button"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card className="bg-muted/50" key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className={`h-4 w-4 shrink-0 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <>
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="mt-2 h-4 w-32" />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold tabular-nums">{kpi.value}</span>
                    {"growth" in kpi && kpi.growth !== undefined && (
                      <GrowthBadge value={kpi.growth} />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{kpi.sub}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {secondaryKpis.map((kpi) => (
          <Card className={kpi.tone} key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className={`h-4 w-4 shrink-0 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <>
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="mt-2 h-4 w-28" />
                </>
              ) : (
                <>
                  <div className="text-xl font-bold tabular-nums">{kpi.value}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{kpi.sub}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Évolution du chiffre d'affaires</CardTitle>
          <CardDescription>
            Ventes concrétisées (payées et terminées) sur la période
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <ResponsiveContainer height={300} width="100%">
              <AreaChart data={stats?.timeseries ?? []}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={formatAxisDate} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [
                    fmt(Number(value)),
                    name === "revenue" ? "Chiffre d'affaires" : "Commandes",
                  ]}
                  labelFormatter={(label) =>
                    new Date(`${String(label)}T00:00:00`).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                    })
                  }
                />
                <Area
                  dataKey="revenue"
                  fill="url(#revenueGradient)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Status + item type breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Commandes par statut</CardTitle>
            <CardDescription>Répartition du volume sur la période</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer height={280} width="100%">
                <BarChart
                  data={(stats?.by_status ?? []).map((s) => ({
                    ...s,
                    label: statusLabels[s.status] ?? s.status,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    angle={-20}
                    dataKey="label"
                    height={60}
                    textAnchor="end"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [fmt(Number(value)), "Commandes"]} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">
              Chiffre d'affaires par type d'offre
            </CardTitle>
            <CardDescription>Produits, locations et services</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (stats?.by_item_type ?? []).every((t) => t.revenue === 0) ? (
              <p className="py-20 text-center text-sm text-muted-foreground">
                Aucune vente concrétisée sur la période
              </p>
            ) : (
              <ResponsiveContainer height={280} width="100%">
                <PieChart>
                  <Pie
                    cx="50%"
                    cy="50%"
                    data={(stats?.by_item_type ?? []).map((t) => ({
                      ...t,
                      name: itemTypeLabels[t.type]?.label ?? t.type,
                    }))}
                    dataKey="revenue"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {(stats?.by_item_type ?? []).map((t) => (
                      <Cell fill={itemTypeLabels[t.type]?.color ?? "#94a3b8"} key={t.type} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => fmt(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Offres les plus performantes</CardTitle>
          <CardDescription>Classées par chiffre d'affaires généré</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton className="h-12 w-full" key={i} />
              ))}
            </div>
          ) : (
            <Tabs defaultValue="top_products">
              <TabsList className="w-full">
                {rankingTabs.map((tab) => (
                  <TabsTrigger className="flex-1" key={tab.key} value={tab.key}>
                    <tab.icon className="mr-1.5 h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {rankingTabs.map((tab) => {
                const items = stats?.[tab.key] ?? [];
                return (
                  <TabsContent className="mt-4" key={tab.key} value={tab.key}>
                    {items.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        Aucune vente sur la période
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">#</TableHead>
                              <TableHead>Nom</TableHead>
                              <TableHead className="text-right">Ventes</TableHead>
                              <TableHead className="text-right">Quantité</TableHead>
                              <TableHead className="text-right">CA</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map((item, index) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium tabular-nums text-muted-foreground">
                                  {index + 1}
                                </TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {item.orders}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {item.quantity}
                                </TableCell>
                                <TableCell className="text-right font-semibold tabular-nums">
                                  {fmt(item.revenue)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Partners */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Meilleurs revendeurs</CardTitle>
            <CardDescription>
              Reventes concrétisées, taux de conversion et commissions générées
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton className="h-12 w-full" key={i} />
                ))}
              </div>
            ) : (stats?.top_resellers.length ?? 0) === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucune revente sur la période
              </p>
            ) : (
              <div className="space-y-2">
                {stats?.top_resellers.map((reseller, index) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                    key={reseller.id}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{reseller.name}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="tabular-nums">{reseller.concretized_orders}</span>/
                          <span className="tabular-nums">{reseller.total_orders}</span> converties
                          · <span className="tabular-nums">{reseller.conversion_rate}%</span>
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {fmt(reseller.revenue)}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {fmt(reseller.commission_earned)} de commission
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Meilleurs fournisseurs</CardTitle>
            <CardDescription>
              Chiffre d'affaires cumulé sur produits, locations et services
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton className="h-12 w-full" key={i} />
                ))}
              </div>
            ) : (stats?.top_suppliers.length ?? 0) === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucune vente sur la période
              </p>
            ) : (
              <div className="space-y-2">
                {stats?.top_suppliers.map((supplier, index) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                    key={supplier.id}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{supplier.name}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="tabular-nums">{supplier.orders}</span> ventes
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums">
                      {fmt(supplier.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
