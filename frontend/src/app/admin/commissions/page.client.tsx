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
  Ban,
  CalendarDays,
  CheckCircle2,
  DollarSign,
  Loader2,
  Mail,
  Package,
  Search,
  ShieldQuestion,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";

import { adminAPI } from "~/lib/api";
import { ConfirmDialog } from "~/ui/components/confirm-dialog";
import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/ui/primitives/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/ui/primitives/dialog";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Skeleton } from "~/ui/primitives/skeleton";

type Commission = {
  id: number;
  code: string;
  commission_amount: number;
  currency: string;
  status: "unpaid" | "paid" | "rejected";
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  user: { id: number; name: string; email: string };
  order: { id: number; order_number: string; total_amount: number; status: string };
};

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

type CommissionStats = {
  statuses: {
    unpaid: { count: number; amount: number };
    paid: { count: number; amount: number };
    rejected: { count: number; amount: number };
  };
  paid_totals: { today: number; this_week: number; this_month: number; this_year: number };
  daily: { date: string; amount: number; count: number }[];
};

const statusConfig = {
  unpaid: { label: "En attente", variant: "secondary" as const, icon: ShieldQuestion },
  paid: { label: "Payée", variant: "default" as const, icon: CheckCircle2 },
  rejected: { label: "Rejetée", variant: "destructive" as const, icon: XCircle },
};

const statusCards = [
  { key: "unpaid", title: "En attente", icon: ShieldQuestion, color: "text-orange-600 dark:text-orange-400" },
  { key: "paid", title: "Payées", icon: CheckCircle2, color: "text-green-600 dark:text-green-400" },
  { key: "rejected", title: "Rejetées", icon: XCircle, color: "text-red-600 dark:text-red-400" },
] as const;

const paidTotalCards = [
  { key: "today", title: "Aujourd'hui" },
  { key: "this_week", title: "Cette semaine" },
  { key: "this_month", title: "Ce mois" },
  { key: "this_year", title: "Cette année" },
] as const;

export default function AdminCommissionsPageClient() {
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [code, setCode] = useState("");
  const [commission, setCommission] = useState<Commission | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [payConfirmOpen, setPayConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const response = await adminAPI.commissions.stats();
      setStats(response.data.data);
    } catch (err) {
      console.error("Error loading commission stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleLookup = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;

    setSearching(true);
    setNotFound(false);
    setCommission(null);
    try {
      const response = await adminAPI.commissions.lookup(trimmed);
      setCommission(response.data.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error("Erreur lors de la vérification du code");
      }
    } finally {
      setSearching(false);
    }
  };

  const handlePay = async () => {
    if (!commission) return;
    setActionBusy(true);
    try {
      const response = await adminAPI.commissions.pay(commission.id);
      setCommission(response.data.data);
      toast.success("Commission marquée comme payée");
      loadStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors du paiement");
    } finally {
      setActionBusy(false);
    }
  };

  const handleReject = async () => {
    if (!commission) return;
    if (rejectNote.trim().length < 3) {
      setRejectError("La note est obligatoire (3 caractères minimum)");
      return;
    }
    setActionBusy(true);
    try {
      const response = await adminAPI.commissions.reject(commission.id, rejectNote.trim());
      setCommission(response.data.data);
      setRejectOpen(false);
      setRejectNote("");
      setRejectError(null);
      toast.success("Commission rejetée");
      loadStats();
    } catch (err: any) {
      setRejectError(
        err.response?.data?.errors?.notes?.[0] ||
          err.response?.data?.message ||
          "Erreur lors du rejet",
      );
    } finally {
      setActionBusy(false);
    }
  };

  const status = commission ? statusConfig[commission.status] : null;
  const canProcess = commission?.status === "unpaid";

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
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Commissions</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Vérifiez le code d'un revendeur avant de verser sa commission
        </p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statusCards.map((stat) => (
          <Card className="bg-muted/50" key={stat.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 shrink-0 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="mt-2 h-4 w-24" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold tabular-nums">
                    {stats?.statuses[stat.key].count ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="tabular-nums">
                      {stats?.statuses[stat.key].amount.toLocaleString("fr-FR") ?? 0}
                    </span>{" "}
                    au total
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Paid totals + chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <CardTitle className="text-base md:text-lg">Commissions versées</CardTitle>
          </div>
          <CardDescription>
            Montants payés aux revendeurs sur les 30 derniers jours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {paidTotalCards.map((stat) => (
              <div className="rounded-lg border bg-muted/50 p-3" key={stat.key}>
                <p className="text-xs text-muted-foreground">{stat.title}</p>
                {statsLoading ? (
                  <Skeleton className="mt-1 h-7 w-20" />
                ) : (
                  <p className="mt-1 text-xl font-bold tabular-nums">
                    {(stats?.paid_totals[stat.key] ?? 0).toLocaleString("fr-FR")}
                  </p>
                )}
              </div>
            ))}
          </div>

          {statsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer height={280} width="100%">
              <AreaChart data={stats?.daily ?? []}>
                <defs>
                  <linearGradient id="paidGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value: string) =>
                    new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                    })
                  }
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [Number(value).toLocaleString("fr-FR"), "Versé"]}
                  labelFormatter={(label) =>
                    new Date(`${String(label)}T00:00:00`).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                    })
                  }
                />
                <Area
                  dataKey="amount"
                  fill="url(#paidGradient)"
                  name="Montant versé"
                  stroke="#16a34a"
                  strokeWidth={2}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Code lookup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Vérifier une commission</CardTitle>
          <CardDescription>
            Saisissez le code à 8 caractères présenté par le revendeur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              className="font-mono uppercase tracking-widest sm:max-w-xs"
              maxLength={8}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              placeholder="EX : AB12CD34"
              value={code}
            />
            <Button
              className="sm:w-auto"
              disabled={!code.trim() || searching}
              onClick={handleLookup}
            >
              {searching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Vérifier le code
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lookup result */}
      {searching && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </CardContent>
        </Card>
      )}

      {notFound && !searching && (
        <Card className="border-destructive/50 animate-in fade-in duration-300">
          <CardContent className="flex items-center gap-3 pt-6">
            <XCircle className="h-5 w-5 shrink-0 text-destructive" />
            <p className="text-sm">
              Aucune commission trouvée avec le code{" "}
              <span className="font-mono font-medium uppercase">{code.trim()}</span>. Vérifiez
              le code auprès du revendeur.
            </p>
          </CardContent>
        </Card>
      )}

      {commission && status && !searching && (
        <Card className="animate-in fade-in duration-300 motion-safe:slide-in-from-bottom-2">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
              <CardDescription>Code de la commission</CardDescription>
              <CardTitle className="font-mono text-xl tracking-widest">
                {commission.code}
              </CardTitle>
            </div>
            <Badge variant={status.variant}>
              <status.icon className="mr-1 h-3 w-3" />
              {status.label}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">Montant à verser</p>
              <p className="text-3xl font-bold tabular-nums">
                {commission.commission_amount} {commission.currency}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Revendeur
                </p>
                <div className="space-y-1.5 text-sm">
                  <p className="flex items-center gap-2">
                    <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {commission.user.name}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {commission.user.email}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Commande d'origine
                </p>
                <div className="space-y-1.5 text-sm">
                  <p className="flex items-center gap-2">
                    <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {commission.order.order_number} —{" "}
                    <span className="tabular-nums">
                      {commission.order.total_amount} {commission.currency}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                    Générée le {formatDate(commission.created_at)}
                  </p>
                  {commission.paid_at && (
                    <p className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      Payée le {formatDate(commission.paid_at)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {commission.status === "rejected" && commission.notes && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-destructive">
                  Motif du rejet
                </p>
                <p className="mt-1 text-sm">{commission.notes}</p>
              </div>
            )}

            {canProcess && (
              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row">
                <Button
                  className="flex-1"
                  disabled={actionBusy}
                  onClick={() => setPayConfirmOpen(true)}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Marquer comme payée
                </Button>
                <Button
                  className="flex-1"
                  disabled={actionBusy}
                  onClick={() => setRejectOpen(true)}
                  variant="destructive"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Rejeter la commission
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pay confirmation */}
      <ConfirmDialog
        confirmText="Confirmer le paiement"
        description={`Confirmez le versement de ${commission?.commission_amount} ${commission?.currency} à ${commission?.user.name}. Cette action est irréversible.`}
        onConfirm={handlePay}
        onOpenChange={setPayConfirmOpen}
        open={payConfirmOpen}
        title="Marquer la commission comme payée"
      />

      {/* Reject dialog */}
      <Dialog onOpenChange={setRejectOpen} open={rejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la commission</DialogTitle>
            <DialogDescription>
              Expliquez au revendeur pourquoi la commission{" "}
              <span className="font-mono">{commission?.code}</span> est rejetée. La note est
              obligatoire.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="reject-note">Motif du rejet</Label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              id="reject-note"
              onChange={(e) => {
                setRejectNote(e.target.value);
                setRejectError(null);
              }}
              placeholder="Ex : commande annulée par le client, fraude détectée..."
              rows={4}
              value={rejectNote}
            />
            {rejectError && <p className="text-sm text-destructive">{rejectError}</p>}
          </div>
          <DialogFooter>
            <Button onClick={() => setRejectOpen(false)} variant="outline">
              Annuler
            </Button>
            <Button
              disabled={actionBusy || rejectNote.trim().length < 3}
              onClick={handleReject}
              variant="destructive"
            >
              {actionBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
