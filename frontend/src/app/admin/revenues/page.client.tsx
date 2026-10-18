"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Percent,
  RotateCcw,
  Search,
  TrendingUp,
} from "lucide-react";

import { adminAPI } from "~/lib/api";
import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Skeleton } from "~/ui/primitives/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/ui/primitives/table";

type KomiRevenue = {
  id: number;
  order_id: number;
  amount: number;
  fee_percentage: number;
  currency: string;
  status: "collected" | "refunded";
  collected_at: string | null;
  created_at: string;
  order: { id: number; order_number: string; total_amount: number; status: string } | null;
  invoice: { id: number; invoice_number: string; item_name: string | null } | null;
};

type RevenueStats = {
  statuses: {
    collected: { count: number; amount: number };
    refunded: { count: number; amount: number };
  };
  collected_totals: {
    today: number;
    this_week: number;
    this_month: number;
    this_year: number;
  };
  daily: { date: string; amount: number; count: number }[];
  current_fee_percentage: number;
};

type Pagination = {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
};

const PAGE_SIZE_OPTIONS = [10, 20, 25, 30, 50];

const periodCards = [
  { key: "today", label: "Aujourd'hui" },
  { key: "this_week", label: "Cette semaine" },
  { key: "this_month", label: "Ce mois" },
  { key: "this_year", label: "Cette année" },
] as const;

const fmt = (value: number) => value.toLocaleString("fr-FR");

const formatAxisDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });

export default function AdminRevenuesPageClient() {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [revenues, setRevenues] = useState<KomiRevenue[]>([]);
  const [meta, setMeta] = useState<Pagination | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [feeInput, setFeeInput] = useState("");
  const [savingFee, setSavingFee] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await adminAPI.revenues.stats();
      setStats(response.data.data);
      setFeeInput(String(response.data.data.current_fee_percentage));
    } catch (err) {
      console.error("Error loading revenue stats:", err);
      toast.error("Erreur lors du chargement des statistiques");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadRevenues = useCallback(async () => {
    try {
      setListLoading(true);
      const response = await adminAPI.revenues.list({
        page,
        per_page: perPage,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(search ? { search } : {}),
      });
      setRevenues(response.data.data);
      setMeta(response.data.meta);
    } catch (err) {
      console.error("Error loading revenues:", err);
      toast.error("Erreur lors du chargement des revenus");
    } finally {
      setListLoading(false);
    }
  }, [page, perPage, statusFilter, search]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadRevenues();
  }, [loadRevenues]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const saveFee = async () => {
    const value = Number(feeInput);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      toast.error("Le taux doit être compris entre 0 et 100");
      return;
    }

    try {
      setSavingFee(true);
      const response = await adminAPI.settings.update({ komi_fee_percentage: value });
      setStats((prev) =>
        prev ? { ...prev, current_fee_percentage: response.data.data.komi_fee_percentage } : prev,
      );
      toast.success(`Taux de commission Komi mis à jour : ${value}%`);
    } catch (err: any) {
      const message = err.response?.data?.errors?.komi_fee_percentage?.[0];
      toast.error(message || "Erreur lors de la mise à jour du taux");
    } finally {
      setSavingFee(false);
    }
  };

  return (
    <div
      className={`
        container flex-1 space-y-6 p-4 duration-300 ease-out
        animate-in fade-in
        motion-safe:slide-in-from-bottom-2
        md:p-6
      `}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Revenus Komi</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Commissions de la plateforme prélevées sur chaque vente payée
        </p>
      </div>

      {/* Status + fee rate cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total collecté</CardTitle>
            <TrendingUp className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-2xl font-bold tabular-nums">
                  {fmt(stats?.statuses.collected.amount ?? 0)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="tabular-nums">{stats?.statuses.collected.count ?? 0}</span>{" "}
                  ventes prélevées
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-red-500/40 bg-red-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus remboursés</CardTitle>
            <RotateCcw className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-2xl font-bold tabular-nums">
                  {fmt(stats?.statuses.refunded.amount ?? 0)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="tabular-nums">{stats?.statuses.refunded.count ?? 0}</span>{" "}
                  ventes remboursées
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de commission</CardTitle>
            <Percent className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs" htmlFor="komi-fee">
                    Pourcentage prélevé par vente
                  </Label>
                  <Input
                    id="komi-fee"
                    max={100}
                    min={0}
                    onChange={(e) => setFeeInput(e.target.value)}
                    step="0.5"
                    type="number"
                    value={feeInput}
                  />
                </div>
                <Button disabled={savingFee} onClick={saveFee} type="button">
                  {savingFee && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enregistrer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Period totals */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {periodCards.map((period) => (
          <Card className="bg-muted/50" key={period.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{period.label}</CardTitle>
              <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <div className="text-xl font-bold tabular-nums">
                  {fmt(stats?.collected_totals[period.key] ?? 0)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 30-day trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Encaissements des 30 derniers jours</CardTitle>
          <CardDescription>Montants de commission collectés par jour</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer height={260} width="100%">
              <AreaChart data={stats?.daily ?? []}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={formatAxisDate} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [
                    fmt(Number(value)),
                    name === "amount" ? "Revenus" : "Ventes",
                  ]}
                  labelFormatter={(label) =>
                    new Date(`${String(label)}T00:00:00`).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                    })
                  }
                />
                <Area
                  dataKey="amount"
                  fill="url(#revenueGradient)"
                  stroke="#16a34a"
                  strokeWidth={2}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Revenues table */}
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-base md:text-lg">Revenus par vente</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                aria-label="Filtrer par statut"
                className="flex h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                value={statusFilter}
              >
                <option value="">Tous les statuts</option>
                <option value="collected">Collectés</option>
                <option value="refunded">Remboursés</option>
              </select>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 sm:w-64"
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="N° commande ou facture..."
                  type="search"
                  value={searchInput}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {listLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton className="h-12 w-full" key={i} />
              ))}
            </div>
          ) : revenues.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucun revenu enregistré{statusFilter || search ? " pour ces critères" : ""}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Commande</TableHead>
                    <TableHead>Facture</TableHead>
                    <TableHead>Article</TableHead>
                    <TableHead className="text-right">Montant vente</TableHead>
                    <TableHead className="text-right">Taux</TableHead>
                    <TableHead className="text-right">Revenu Komi</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Encaissé le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenues.map((revenue) => (
                    <TableRow key={revenue.id}>
                      <TableCell className="font-mono text-sm">
                        {revenue.order?.order_number ?? `#${revenue.order_id}`}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {revenue.invoice?.invoice_number ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-48 truncate text-sm">
                        {revenue.invoice?.item_name ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {revenue.order ? fmt(revenue.order.total_amount) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {revenue.fee_percentage}%
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {fmt(revenue.amount)} {revenue.currency}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={revenue.status === "collected" ? "default" : "destructive"}
                        >
                          {revenue.status === "collected" ? "Collecté" : "Remboursé"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {revenue.collected_at
                          ? new Date(revenue.collected_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {meta && !listLoading && revenues.length > 0 && (
            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Page <span className="font-medium tabular-nums">{meta.current_page}</span> sur{" "}
                <span className="tabular-nums">{meta.last_page}</span> —{" "}
                <span className="tabular-nums">{meta.total}</span> revenus
              </p>
              <div className="flex items-center gap-2">
                <select
                  aria-label="Éléments par page"
                  className="flex h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  value={perPage}
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size} / page
                    </option>
                  ))}
                </select>
                <Button
                  disabled={meta.current_page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  size="icon"
                  variant="outline"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => setPage((p) => p + 1)}
                  size="icon"
                  variant="outline"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
