"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Loader2,
  MoreVertical,
  RotateCcw,
  Search,
} from "lucide-react";

import { adminAPI } from "~/lib/api";
import { ConfirmDialog } from "~/ui/components/confirm-dialog";
import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/ui/primitives/dropdown-menu";
import { Input } from "~/ui/primitives/input";
import { Skeleton } from "~/ui/primitives/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/ui/primitives/table";

type PaymentProof = {
  id: number;
  status: "pending" | "accepted" | "rejected" | "refunded";
  proof_url: string | null;
  payment_method: string | null;
  transaction_reference: string | null;
  reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  user: { id: number; name: string; email: string } | null;
  reviewer: { id: number; name: string } | null;
  invoice: {
    id: number;
    invoice_number: string;
    status: "sent" | "paid" | "cancelled" | "refunded";
    total_amount: number;
    currency: string;
    item_name: string | null;
    item_type: string | null;
    paid_at: string | null;
    order: { id: number; order_number: string; status: string } | null;
  } | null;
};

type Pagination = {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
};

const PAGE_SIZE_OPTIONS = [10, 20, 25, 30, 50];

const proofStatusConfig = {
  pending: { label: "En attente", variant: "secondary" as const },
  accepted: { label: "Acceptée", variant: "default" as const },
  rejected: { label: "Rejetée", variant: "destructive" as const },
  refunded: { label: "Remboursée", variant: "outline" as const },
};

const invoiceStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  sent: { label: "Envoyée", variant: "secondary" },
  paid: { label: "Payée", variant: "default" },
  cancelled: { label: "Annulée", variant: "outline" },
  refunded: { label: "Remboursée", variant: "outline" },
};

const statusFilters = [
  { value: "", label: "Toutes" },
  { value: "pending", label: "En attente" },
  { value: "accepted", label: "Acceptées" },
  { value: "rejected", label: "Rejetées" },
  { value: "refunded", label: "Remboursées" },
];

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function AdminPaymentsPageClient() {
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [meta, setMeta] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [actionBusy, setActionBusy] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    proof: PaymentProof;
    status: "paid" | "refunded";
  } | null>(null);

  const loadProofs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.paymentProofs.list({
        page,
        per_page: perPage,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(search ? { search } : {}),
      });
      setProofs(response.data.data);
      setMeta(response.data.meta);
    } catch (err) {
      console.error("Error loading payment proofs:", err);
      toast.error("Erreur lors du chargement des preuves de paiement");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, statusFilter, search]);

  useEffect(() => {
    loadProofs();
  }, [loadProofs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleInvoiceStatus = async () => {
    if (!confirmAction) return;
    const { proof, status } = confirmAction;
    const invoiceId = proof.invoice?.id;
    if (!invoiceId) return;

    try {
      setActionBusy(proof.id);
      const response = await adminAPI.invoices.setStatus(invoiceId, status);
      const updated = response.data.data;

      setProofs((prev) =>
        prev.map((p) =>
          p.id === proof.id
            ? {
                ...p,
                status: status === "paid" ? "accepted" : "refunded",
                invoice: p.invoice
                  ? {
                      ...p.invoice,
                      status: updated.status,
                      paid_at: updated.paid_at,
                      order: p.invoice.order
                        ? { ...p.invoice.order, status: updated.order.status }
                        : null,
                    }
                  : p.invoice,
              }
            : p,
        ),
      );
      toast.success(
        status === "paid"
          ? `Facture ${updated.invoice_number} marquée payée — commande mise à jour`
          : `Facture ${updated.invoice_number} remboursée — commande mise à jour`,
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de la mise à jour");
    } finally {
      setActionBusy(null);
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
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Commandes et paiements
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Vérifiez les preuves de paiement et mettez à jour les factures
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-base md:text-lg">Preuves de paiement</CardTitle>
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
                {statusFilters.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 sm:w-64"
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="N° facture ou référence..."
                  type="search"
                  value={searchInput}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton className="h-14 w-full" key={i} />
              ))}
            </div>
          ) : proofs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucune preuve de paiement{statusFilter || search ? " pour ces critères" : ""}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preuve</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Facture / Commande</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Reçue le</TableHead>
                    <TableHead className="w-12 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proofs.map((proof) => {
                    const invoice = proof.invoice;
                    const invoiceStatus = invoice ? invoiceStatusConfig[invoice.status] : null;
                    const canPay = invoice?.status === "sent";
                    const canRefund = invoice?.status === "paid";

                    return (
                      <TableRow key={proof.id}>
                        <TableCell>
                          {proof.proof_url ? (
                            <a
                              className="group relative block h-11 w-16 overflow-hidden rounded-md border"
                              href={proof.proof_url}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              <img
                                alt={`Preuve de ${proof.user?.name ?? "client"}`}
                                className="h-full w-full object-cover transition-transform duration-200 hover-fine:group-hover:scale-105"
                                src={proof.proof_url}
                              />
                              <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-150 hover-fine:group-hover:opacity-100">
                                <ExternalLink className="h-4 w-4 text-white" />
                              </span>
                            </a>
                          ) : (
                            <div className="flex h-11 w-16 items-center justify-center rounded-md border bg-muted">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{proof.user?.name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">
                            {proof.user?.email ?? ""}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="font-mono text-sm">{invoice?.invoice_number ?? "—"}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {invoice?.order?.order_number ?? ""}
                          </p>
                          {proof.transaction_reference && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Réf. {proof.transaction_reference}
                              {proof.payment_method ? ` · ${proof.payment_method}` : ""}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-semibold tabular-nums">
                            {invoice?.total_amount} {invoice?.currency}
                          </p>
                          {invoiceStatus && (
                            <Badge className="mt-1" variant={invoiceStatus.variant}>
                              {invoiceStatus.label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={proofStatusConfig[proof.status].variant}>
                            {proofStatusConfig[proof.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(proof.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                disabled={actionBusy === proof.id}
                                size="icon"
                                variant="ghost"
                              >
                                {actionBusy === proof.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {proof.proof_url && (
                                <DropdownMenuItem asChild>
                                  <a
                                    href={proof.proof_url}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                  >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Voir la preuve
                                  </a>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                disabled={!canPay}
                                onClick={() => setConfirmAction({ proof, status: "paid" })}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Marquer la facture payée
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                disabled={!canRefund}
                                onClick={() => setConfirmAction({ proof, status: "refunded" })}
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Marquer la facture remboursée
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {meta && !loading && proofs.length > 0 && (
            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Page <span className="font-medium tabular-nums">{meta.current_page}</span> sur{" "}
                <span className="tabular-nums">{meta.last_page}</span> —{" "}
                <span className="tabular-nums">{meta.total}</span> preuves
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

      <ConfirmDialog
        confirmText={
          confirmAction?.status === "paid" ? "Confirmer le paiement" : "Confirmer le remboursement"
        }
        description={
          confirmAction?.status === "paid"
            ? `Marquer la facture ${confirmAction?.proof.invoice?.invoice_number} comme payée ? La commande passera aussi à « payée » et la commission revendeur sera créée.`
            : `Marquer la facture ${confirmAction?.proof.invoice?.invoice_number} comme remboursée ? La commande passera aussi à « remboursée ».`
        }
        onConfirm={handleInvoiceStatus}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        open={!!confirmAction}
        title={
          confirmAction?.status === "paid" ? "Confirmer le paiement" : "Confirmer le remboursement"
        }
        variant={confirmAction?.status === "refunded" ? "destructive" : "default"}
      />
    </div>
  );
}
