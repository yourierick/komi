"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { HandCoins, Clock, CheckCircle, XCircle, QrCode } from "lucide-react";

import { commissionAPI } from "~/lib/api";
import { useAuth } from "~/lib/hooks/use-auth";
import { Badge } from "~/ui/primitives/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/ui/primitives/card";
import { Button } from "~/ui/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/ui/primitives/dialog";
import { Skeleton } from "~/ui/primitives/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/ui/primitives/table";

const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  XAF: "FCFA",
  CDF: "FC",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
  CHF: "CHF",
  CNY: "¥",
};

function getCurrencySymbol(currency: string | undefined): string {
  return currency ? currencySymbols[currency] || currency : "";
}

function formatAmount(amount: number, currency: string): string {
  return `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${getCurrencySymbol(currency)}`;
}

interface Commission {
  id: number;
  code: string;
  order_id: number;
  commission_amount: number;
  currency: string;
  status: "unpaid" | "paid" | "rejected";
  paid_at?: string;
  notes?: string;
  created_at: string;
  order?: {
    id: number;
    order_number: string;
    total_amount: number;
    status: string;
  };
}

const STATUS_LABELS: Record<string, string> = {
  unpaid: "En attente",
  paid: "Versée",
  rejected: "Rejetée",
};

const STATUS_COLORS: Record<string, string> = {
  unpaid: "bg-yellow-100 text-yellow-800 border-yellow-200",
  paid: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

export function CommissionsPageClient() {
  const { loading: authLoading } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrCommission, setQrCommission] = useState<Commission | null>(null);

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const response = await commissionAPI.list();
      setCommissions(response.data.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des commissions");
    } finally {
      setLoading(false);
    }
  };

  const sumByCurrency = (status: string) => {
    const totals = commissions
      .filter((c) => c.status === status)
      .reduce<Record<string, number>>((acc, c) => {
        acc[c.currency] = (acc[c.currency] || 0) + c.commission_amount;
        return acc;
      }, {});
    const entries = Object.entries(totals);
    if (entries.length === 0) return "0.00";
    return entries
      .map(([currency, amount]) => formatAmount(amount, currency))
      .join(" · ");
  };

  if (loading || authLoading) {
    return (
      <div className="container flex-1 p-4 md:p-6">
        <div className="mb-6 space-y-2 md:mb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3 md:mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-5" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="bg-muted/50">
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex-1 p-4 md:p-6">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold md:text-3xl">Commissions</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Commissions générées par vos liens revendeur
        </p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3 md:mb-6">
        <Card className="bg-muted/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium md:text-sm">
              En attente
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600 md:h-5 md:w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold md:text-2xl">{sumByCurrency("unpaid")}</div>
            <p className="text-xs text-muted-foreground">
              {commissions.filter((c) => c.status === "unpaid").length} commission(s)
            </p>
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium md:text-sm">
              Versées
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 md:h-5 md:w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold md:text-2xl">{sumByCurrency("paid")}</div>
            <p className="text-xs text-muted-foreground">
              {commissions.filter((c) => c.status === "paid").length} commission(s)
            </p>
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium md:text-sm">
              Rejetées
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600 md:h-5 md:w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold md:text-2xl">{sumByCurrency("rejected")}</div>
            <p className="text-xs text-muted-foreground">
              {commissions.filter((c) => c.status === "rejected").length} commission(s)
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Historique des commissions</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Commissions versées sur les commandes passées via vos liens
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <HandCoins className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="font-medium">Aucune commission</p>
              <p className="text-sm text-muted-foreground">
                Les commissions apparaîtront ici lorsqu'une commande passée via votre lien sera payée.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Code</TableHead>
                    <TableHead className="font-bold">N° Commande</TableHead>
                    <TableHead className="font-bold">Total commande</TableHead>
                    <TableHead className="font-bold">Commission</TableHead>
                    <TableHead className="font-bold">Statut</TableHead>
                    <TableHead className="font-bold">Date</TableHead>
                    <TableHead className="font-bold">Versée le</TableHead>
                    <TableHead className="font-bold text-center">QR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="py-3 font-mono text-xs font-semibold tracking-wider md:text-sm">
                        {commission.code}
                      </TableCell>
                      <TableCell className="py-3 text-xs font-medium md:text-sm">
                        {commission.order?.order_number ?? `#${commission.order_id}`}
                      </TableCell>
                      <TableCell className="py-3 text-xs md:text-sm">
                        {commission.order
                          ? formatAmount(commission.order.total_amount, commission.currency)
                          : "—"}
                      </TableCell>
                      <TableCell className="py-3 text-xs font-semibold md:text-sm">
                        {formatAmount(commission.commission_amount, commission.currency)}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className={`${STATUS_COLORS[commission.status] || "bg-gray-100"} border text-xs`}>
                          {STATUS_LABELS[commission.status] || commission.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground md:text-sm">
                        {new Date(commission.created_at).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground md:text-sm">
                        {commission.paid_at
                          ? new Date(commission.paid_at).toLocaleDateString("fr-FR")
                          : "—"}
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setQrCommission(commission)}
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      <Dialog open={!!qrCommission} onOpenChange={(open) => !open && setQrCommission(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Code QR de la commission</DialogTitle>
            <DialogDescription>
              {qrCommission?.order?.order_number ?? `Commande #${qrCommission?.order_id}`}
            </DialogDescription>
          </DialogHeader>
          {qrCommission && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="rounded-lg bg-white p-4">
                <QRCode value={qrCommission.code} size={192} />
              </div>
              <p className="font-mono text-xl font-bold tracking-[0.3em]">
                {qrCommission.code}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
