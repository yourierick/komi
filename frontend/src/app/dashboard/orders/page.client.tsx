"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { Search, Calendar as CalendarIcon, Package, ShoppingCart, Edit2, Save, X, Eye, DollarSign, CreditCard, Truck, MapPin, FileText, Tag, Printer, User, Mail, Phone, Building2, MoreVertical, Ban, Info, CheckCircle, Smartphone, Shield, RefreshCcw, Wallet, Upload } from "lucide-react";
import { toast } from "sonner";
import { orderAPI, invoiceAPI } from "~/lib/api";
import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Card, CardContent } from "~/ui/primitives/card";
import { ConfirmDialog } from "~/ui/components/confirm-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/ui/primitives/tabs";
import { Badge } from "~/ui/primitives/badge";
import { Skeleton } from "~/ui/primitives/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/ui/primitives/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/ui/primitives/dialog";
import { useAuth } from "~/lib/hooks/use-auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "~/ui/primitives/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "~/ui/primitives/popover";
import { Calendar } from "~/ui/primitives/calendar";

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

interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_method: string;
  unit_selling_price: number;
  quantity: number;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  commission_amount: number;
  currency: string;
  shipping_address?: string;
  billing_address?: string;
  notes?: string;
  specifications?: any;
  options?: any;
  generate_invoice: boolean;
  shipped_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
  product?: {
    id: number;
    name: string;
    image?: string;
    supplier?: {
      id: number;
      name: string;
      email: string;
      phone?: string;
    };
  };
  rental?: {
    id: number;
    title: string;
    image?: string;
    supplier?: {
      id: number;
      name: string;
      email: string;
      phone?: string;
    };
  };
  service?: {
    id: number;
    title: string;
    image?: string;
    supplier?: {
      id: number;
      name: string;
      email: string;
      phone?: string;
    };
  };
  user?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  shop?: {
    id: number;
    name: string;
  };
  reseller?: {
    id: number;
    name: string;
    email: string;
  };
  invoice?: {
    id: number;
    invoice_number: string;
    status: string;
    komi_fees: number;
    sent_at?: string;
    paid_at?: string;
    payment_proof?: {
      id: number;
      status: string;
      reason?: string | null;
      proof_url?: string | null;
      payment_method?: string;
      transaction_reference?: string;
      created_at: string;
    } | null;
  } | null;
}

const STATUS_LABELS: Record<string, string> = {
  under_negotiation: "En négociation",
  confirmed: "Confirmée",
  cancelled: "Annulée",
  completed: "Terminée",
  paid: "Payé",
  refunded: "Remboursé",
};

const STATUS_COLORS: Record<string, string> = {
  under_negotiation: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  refunded: "bg-purple-100 text-purple-800 border-purple-200",
  paid: "bg-teal-100 text-teal-800 border-teal-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  sent: "Envoyée",
  paid: "Payée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  sent: "bg-blue-100 text-blue-800 border-blue-200",
  paid: "bg-teal-100 text-teal-800 border-teal-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  refunded: "bg-purple-100 text-purple-800 border-purple-200",
};

const PAYMENT_PROOF_STATUS_LABELS: Record<string, string> = {
  pending: "En attente de vérification",
  accepted: "Acceptée",
  rejected: "Rejetée",
  refunded: "Remboursée",
};

const PAYMENT_PROOF_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  accepted: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  refunded: "bg-purple-100 text-purple-800 border-purple-200",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash_on_delivery: "Paiement à la livraison",
  payment_in_store: "Paiement en magasin",
  manual_payment_via_mobile_money: "Mobile Money",
  payment_by_bank_transfer: "Virement bancaire",
  payment_by_physical_deposit: "Dépôt physique",
  payment_protected_by_komi: "Paiement protégé par Komi",
};

export function OrdersPageClient() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"my-orders" | "received-orders">("my-orders");
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [receivedOrders, setReceivedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState("");
  const [isDateFromOpen, setIsDateFromOpen] = useState(false);
  const [isDateToOpen, setIsDateToOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [editData, setEditData] = useState<{
    status: string;
    quantity: number;
    unit_selling_price: number;
    tax_amount: number;
    shipping_amount: number;
    discount_amount: number;
    payment_method: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [paymentInfoOpen, setPaymentInfoOpen] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofMethod, setProofMethod] = useState("");
  const [proofReference, setProofReference] = useState("");
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);
  const [orderToCancel, setOrderToCancel] = useState<number | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Commande-${viewOrder?.order_number}`,
  });
  const [detailsEditData, setDetailsEditData] = useState<{
    shipping_address: string;
    billing_address: string;
    notes: string;
    specifications: Array<{ key: string; value: string }>;
    options: Array<{ key: string; value: string }>;
    shipped_at: string;
    delivered_at: string;
  } | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [activeTab, searchQuery, dateFrom, dateTo, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (dateFrom) params.from = dateFrom.toISOString().split('T')[0];
      if (dateTo) params.to = dateTo.toISOString().split('T')[0];
      if (statusFilter) params.status = statusFilter;

      if (activeTab === "my-orders") {
        const response = await orderAPI.list(params);
        setMyOrders(response.data.data);
      } else {
        const response = await orderAPI.receivedOrders(params);
        setReceivedOrders(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  };

  const getItemName = (order: Order) => {
    if (order.product) return order.product.name;
    if (order.rental) return order.rental.title;
    if (order.service) return order.service.title;
    return "N/A";
  };

  const getSupplierOrCustomer = (order: Order) => {
    if (activeTab === "my-orders") {
      if (order.product?.supplier) return order.product.supplier;
      if (order.rental?.supplier) return order.rental.supplier;
      if (order.service?.supplier) return order.service.supplier;
    } else {
      return order.user;
    }
    return null;
  };

  const isSupplier = (order: Order) => {
    if (!user) return false;
    const supplierId = order.product?.supplier?.id || order.rental?.supplier?.id || order.service?.supplier?.id;
    return supplierId === user.id;
  };

  const loadOrders = async () => {
      if (activeTab === "my-orders") {
        const response = await orderAPI.list();
        setMyOrders(response.data.data);
      } else {
        const response = await orderAPI.receivedOrders();
        setReceivedOrders(response.data.data);
      }
  }

  const handleSendInvoice = async (orderId: number) => {
     if (orderId === undefined) {
      toast.error("Impossible d'envoyer la facture : ID manquant");
      return;
    }

    setIsSending(true);
    try {
      await orderAPI.sendInvoice(orderId);
      toast.success("Facture envoyée avec succès");
      loadOrders();
    } catch (error) {
      toast.error("Erreur lors de l'envoi de la facture");
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmInvoice = async (orderId: number) => {
    setIsSending(true);
    try {
      await orderAPI.updateStatus(orderId, 'confirmed');
      toast.success("Commande confirmée avec succès");
      const response = await orderAPI.get(orderId);
      setInvoiceOrder(response.data.data);
      loadOrders();
      setPaymentInfoOpen(true);
    } catch (error) {
      toast.error("Erreur lors de la confirmation de la commande");
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmitPaymentProof = async () => {
    if (!proofFile || !invoiceOrder?.invoice) return;

    setIsUploadingProof(true);
    try {
      const formData = new FormData();
      formData.append("proof", proofFile);
      if (proofMethod) formData.append("payment_method", proofMethod);
      if (proofReference) formData.append("transaction_reference", proofReference);

      await invoiceAPI.uploadPaymentProof(invoiceOrder.invoice.id, formData);
      toast.success("Preuve de paiement envoyée");

      const response = await orderAPI.get(invoiceOrder.id);
      setInvoiceOrder(response.data.data);
      setProofFile(null);
      setProofMethod("");
      setProofReference("");
    } catch (error) {
      toast.error("Erreur lors de l'envoi de la preuve de paiement");
    } finally {
      setIsUploadingProof(false);
    }
  };

  // For testing: allow editing in received orders tab
  const canEditOrder = (order: Order) => {
    let activeTab = "received-orders";
    let status = false;
    if (order.status === 'under_negotiation') {
       status = true;
    }
    return status && activeTab === "received-orders";
  };

  const startEditing = (order: Order) => {
    setEditingOrderId(order.id);
    setEditData({
      status: order.status,
      quantity: order.quantity,
      unit_selling_price: order.unit_selling_price,
      tax_amount: order.tax_amount || 0,
      shipping_amount: order.shipping_amount || 0,
      discount_amount: order.discount_amount || 0,
      payment_method: order.payment_method,
    });
  };

  const openDetailsModal = (order: Order) => {
    setCurrentOrder(order);
    
    // Convert JSON objects to key-value arrays
    const jsonToKeyValue = (json: any): Array<{ key: string; value: string }> => {
      if (!json) return [];
      if (typeof json === 'string') {
        try {
          const parsed = JSON.parse(json) as Record<string, any>;
          return Object.entries(parsed).map(([key, value]) => ({ key, value: String(value) }));
        } catch {
          return [];
        }
      }
      return Object.entries(json as Record<string, any>).map(([key, value]) => ({ key, value: String(value) }));
    };
    
    setDetailsEditData({
      shipping_address: order.shipping_address || "",
      billing_address: order.billing_address || "",
      notes: order.notes || "",
      specifications: jsonToKeyValue(order.specifications),
      options: jsonToKeyValue(order.options),
      shipped_at: order.shipped_at || "",
      delivered_at: order.delivered_at || "",
    });
    setIsDetailsModalOpen(true);
  };

  function formatDateForInput(dateString: string) {
    // les commandes sans date d'expédition/livraison arrivent avec "":
    // datetime-local attend "" pour un champ vide, pas une date invalide
    if (!dateString) return "";
    const date = new Date(dateString); // parse la date ISO avec Z
    if (isNaN(date.getTime())) return "";
    // toISOString donne "2026-09-25T11:18:00.000Z"
    // on coupe à la minute
    return date.toISOString().slice(0,16);
  }

  const openViewModal = async (order: Order) => {
    setLoading(true);
    try {
      const response = await orderAPI.get(order.id);
      setViewOrder(response.data.data);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Erreur lors du chargement des détails");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = (id: number) => {
    setOrderToCancel(id);
    setConfirmOpen(true);
  };

  const confirmCancel = async () => {
    try {
      if (orderToCancel === null) return;

      await orderAPI.cancel(orderToCancel);
      toast.success("Commande annulée avec succès");
      fetchOrders();
    } catch (error) {
      toast.error("Erreur lors de l'annulation de la commande");
    } finally {
      setIsSending(false);
    }
  };

  const openInvoiceModal = async (order: Order) => {
    setLoading(true);
    try {
      const response = await orderAPI.get(order.id);
      setInvoiceOrder(response.data.data);
      setIsInvoiceModalOpen(true);
    } catch (error) {
      console.error("Error fetching order for invoice:", error);
      toast.error("Erreur lors du chargement de la facture");
    } finally {
      setLoading(false);
    }
  };

  const saveDetailsEdit = async () => {
    if (!detailsEditData || !currentOrder) return;

    setIsSaving(true);
    try {
      // Convert key-value arrays to JSON objects
      const keyValueToJson = (array: Array<{ key: string; value: string }>) => {
        const obj: Record<string, string> = {};
        array.forEach(({ key, value }) => {
          if (key.trim()) {
            obj[key] = value;
          }
        });
        return Object.keys(obj).length > 0 ? obj : null;
      };

      const updateData = {
        shipping_address: detailsEditData.shipping_address,
        billing_address: detailsEditData.billing_address,
        notes: detailsEditData.notes,
        specifications: keyValueToJson(detailsEditData.specifications),
        options: keyValueToJson(detailsEditData.options),
        shipped_at: detailsEditData.shipped_at,
        delivered_at: detailsEditData.delivered_at,
      };

      const response = await orderAPI.updateReceivedOrder(currentOrder.id, updateData);
      
      // Update local state
      const updatedOrders = receivedOrders.map(o => 
        o.id === currentOrder.id ? response.data.data : o
      );
      setReceivedOrders(updatedOrders);
      
      setIsDetailsModalOpen(false);
      setDetailsEditData(null);
      setCurrentOrder(null);
      toast.success("Détails mis à jour avec succès");
    } catch (error) {
      console.error("Error updating order details:", error);
      toast.error("Erreur lors de la mise à jour des détails");
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEditing = () => {
    setEditingOrderId(null);
    setEditData(null);
  };

  const saveEdit = async (order: Order) => {
    if (!editData) return;

    setIsSaving(true);
    try {
      const updateData = {
        ...editData,
      };

      const response = await orderAPI.updateReceivedOrder(order.id, updateData);
      
      // Update local state
      const updatedOrders = receivedOrders.map(o => 
        o.id === order.id ? response.data.data : o
      );
      setReceivedOrders(updatedOrders);
      
      setEditingOrderId(null);
      setEditData(null);
      toast.success("Commande mise à jour avec succès");
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Erreur lors de la mise à jour de la commande");
    } finally {
      setIsSaving(false);
    }
  };

  const orders = activeTab === "my-orders" ? myOrders : receivedOrders;

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Mes Commandes</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Gérez vos commandes passées et reçues
        </p>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Annuler la commande"
        description="Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible."
        confirmText="Annuler"
        cancelText="Annuler"
        variant="destructive"
        onConfirm={confirmCancel}
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full sm:max-w-md grid-cols-2">
          <TabsTrigger value="my-orders" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span className="truncate">Mes Commandes</span>
          </TabsTrigger>
          <TabsTrigger value="received-orders" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <Package className="w-4 h-4 shrink-0" />
            <span className="truncate">Commandes Reçues</span>
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par N°..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Popover open={isDateFromOpen} onOpenChange={setIsDateFromOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? dateFrom.toLocaleDateString("fr-FR") : "Date début"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                  />
                </PopoverContent>
              </Popover>

              <Popover open={isDateToOpen} onOpenChange={setIsDateToOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? dateTo.toLocaleDateString("fr-FR") : "Date fin"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                  />
                </PopoverContent>
              </Popover>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Tous les statuts</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="my-orders" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4 items-center">
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
                <p className="text-muted-foreground">
                  Vous n'avez pas encore passé de commandes
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {orders.map((order) => {
                  const itemName = getItemName(order);
                  const contact = getSupplierOrCustomer(order);

                  return (
                    <Card key={order.id} className="border-2">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-mono font-semibold text-blue-600 text-xs">{order.order_number}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Package className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                              <span className="font-medium text-sm truncate">{itemName}</span>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openViewModal(order)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Voir la commande
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openInvoiceModal(order)}>
                                <FileText className="w-4 h-4 mr-2" />
                                Voir la facture
                              </DropdownMenuItem>
                              {order.status === 'under_negotiation' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleCancelOrder(order.id)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Ban className="w-4 h-4 mr-2" />
                                    Annuler la commande
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span className="truncate">{contact?.name || "N/A"}</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge className={`${STATUS_COLORS[order.status] || "bg-gray-100"} border font-medium text-xs`}>
                            {STATUS_LABELS[order.status] || order.status}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t text-sm">
                          <span className="text-muted-foreground">Qté: <span className="font-semibold text-foreground">{order.quantity}</span></span>
                          <span className="font-semibold text-foreground">
                            {order.unit_selling_price.toFixed(2)} {getCurrencySymbol(order.currency)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop table */}
              <Card className="border-2 hidden md:block">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted border-b-2">
                        <TableHead className="font-bold">N°</TableHead>
                        <TableHead className="font-bold">Article</TableHead>
                        <TableHead className="font-bold">Fournisseur</TableHead>
                        <TableHead className="font-bold">Statut</TableHead>
                        <TableHead className="font-bold">Quantité</TableHead>
                        <TableHead className="font-bold">Prix</TableHead>
                        <TableHead className="font-bold text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order, index) => {
                        const itemName = getItemName(order);
                        const contact = getSupplierOrCustomer(order);
                        
                        return (
                          <TableRow 
                            key={order.id}
                            className={`
                              hover:bg-muted/50 transition-colors
                              ${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}
                            `}
                          >
                            <TableCell className="font-mono font-semibold text-blue-600 text-xs">
                              {order.order_number}
                            </TableCell>
                            <TableCell className="max-w-[150px]">
                              <div className="flex items-center gap-1">
                                <Package className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                <span className="truncate font-medium text-xs">{itemName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="flex items-center gap-1">
                                <ShoppingCart className="w-3 h-3 text-muted-foreground" />
                                <span className="truncate max-w-[100px]">{contact?.name || "N/A"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${STATUS_COLORS[order.status] || "bg-gray-100"} border font-medium text-xs`}>
                                {STATUS_LABELS[order.status] || order.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center font-semibold text-xs">
                              {order.quantity}
                            </TableCell>
                            <TableCell className="font-medium text-foreground text-xs">
                              {order.unit_selling_price.toFixed(2)} {getCurrencySymbol(order.currency)}
                            </TableCell>
                            <TableCell className="text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openViewModal(order)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Voir la commande
                                  </DropdownMenuItem>
                                  {order.generate_invoice && (
                                    <DropdownMenuItem onClick={() => openInvoiceModal(order)}>
                                      <FileText className="w-4 h-4 mr-2" />
                                      Voir la facture
                                    </DropdownMenuItem>
                                  )}
                                  {order.status === 'under_negotiation' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleCancelOrder(order.id)}
                                        className="text-red-600 focus:text-red-600"
                                      >
                                        <Ban className="w-4 h-4 mr-2" />
                                        Annuler la commande
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="received-orders" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4 items-center">
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucune commande reçue</h3>
                <p className="text-muted-foreground">
                  Vous n'avez pas encore reçu de commandes
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {orders.map((order) => {
                  const itemName = getItemName(order);
                  const contact = getSupplierOrCustomer(order);
                  const isEditing = editingOrderId === order.id;
                  const canEdit = canEditOrder(order);

                  return (
                    <Card key={order.id} className={`border-2 ${isEditing ? 'ring-2 ring-blue-400' : ''}`}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-mono font-semibold text-emerald-600 text-xs">{order.order_number}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Package className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                              <span className="font-medium text-sm truncate">{itemName}</span>
                            </div>
                          </div>
                          {isEditing && canEdit ? (
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => saveEdit(order)}
                                disabled={isSaving}
                                className="hover:bg-green-500/10 hover:text-green-600 h-8 w-8 p-0"
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelEditing}
                                disabled={isSaving}
                                className="hover:bg-red-500/10 hover:text-red-600 h-8 w-8 p-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openViewModal(order)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Voir la commande
                                </DropdownMenuItem>
                                {canEdit && (
                                  <>
                                    <DropdownMenuItem onClick={() => startEditing(order)}>
                                      <Edit2 className="w-4 h-4 mr-2" />
                                      Modifier le statut
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openDetailsModal(order)}>
                                      <FileText className="w-4 h-4 mr-2" />
                                      Éditer les détails
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span className="truncate">{contact?.name || "N/A"}</span>
                        </div>

                        {isEditing && canEdit ? (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-2">
                              <label className="text-xs text-muted-foreground mb-1 block">Statut</label>
                              <select
                                value={editData?.status || order.status}
                                onChange={(e) => setEditData(prev => prev ? { ...prev, status: e.target.value } : null)}
                                className="flex h-9 w-full rounded border border-blue-300 bg-background px-2 py-1 text-xs font-medium"
                              >
                                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                  <option key={value} value={value}>{label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Quantité</label>
                              <Input
                                type="number"
                                value={editData?.quantity || order.quantity}
                                onChange={(e) => setEditData(prev => prev ? { ...prev, quantity: parseInt(e.target.value) || 0 } : null)}
                                className="h-9 text-xs"
                                min="1"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Prix unitaire</label>
                              <Input
                                type="number"
                                value={editData?.unit_selling_price || order.unit_selling_price}
                                onChange={(e) => setEditData(prev => prev ? { ...prev, unit_selling_price: parseFloat(e.target.value) || 0 } : null)}
                                className="h-9 text-xs"
                                step="0.01"
                                min="0"
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-wrap gap-2">
                              <Badge className={`${STATUS_COLORS[order.status] || "bg-gray-100"} border font-medium text-xs`}>
                                {STATUS_LABELS[order.status] || order.status}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t text-sm">
                              <span className="text-muted-foreground">Qté: <span className="font-semibold text-foreground">{order.quantity}</span></span>
                              <span className="font-bold text-foreground">
                                {order.total_amount.toFixed(2)} {getCurrencySymbol(order.currency)}
                              </span>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop table */}
              <Card className="border-2 hidden md:block">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted border-b-2">
                        <TableHead className="font-bold">N°</TableHead>
                        <TableHead className="font-bold">Article</TableHead>
                        <TableHead className="font-bold">Client</TableHead>
                        <TableHead className="font-bold">Statut</TableHead>
                        <TableHead className="font-bold">Méthode</TableHead>
                        <TableHead className="font-bold">Qté</TableHead>
                        <TableHead className="font-bold">Prix</TableHead>
                        <TableHead className="font-bold">Taxe</TableHead>
                        <TableHead className="font-bold">Livraison</TableHead>
                        <TableHead className="font-bold">Remise</TableHead>
                        <TableHead className="font-bold">Total</TableHead>
                        <TableHead className="font-bold">Comm.</TableHead>
                        <TableHead className="font-bold text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order, index) => {
                        const itemName = getItemName(order);
                        const contact = getSupplierOrCustomer(order);
                        const isEditing = editingOrderId === order.id;
                        const canEdit = canEditOrder(order);

                        return (
                          <TableRow 
                            key={order.id}
                            className={`
                              hover:bg-muted/50 transition-colors
                              ${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}
                              ${isEditing ? 'ring-2 ring-blue-400 bg-blue-500/10' : ''}
                            `}
                          >
                            <TableCell className="font-mono font-semibold text-emerald-600 text-xs">
                              {order.order_number}
                            </TableCell>
                            <TableCell className="max-w-[150px]">
                              <div className="flex items-center gap-1">
                                <Package className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                <span className="truncate font-medium text-xs">{itemName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="flex items-center gap-1">
                                <ShoppingCart className="w-3 h-3 text-muted-foreground" />
                                <span className="font-medium truncate max-w-[100px]">{contact?.name || "N/A"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${STATUS_COLORS[order.status] || "bg-gray-100"} border font-medium text-xs`}>
                                {STATUS_LABELS[order.status] || order.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              <span className="truncate max-w-[80px]">{PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}</span>
                            </TableCell>
                            <TableCell>
                              {isEditing && canEdit ? (
                                <Input
                                  type="number"
                                  value={editData?.quantity ?? order.quantity}
                                  onChange={(e) => setEditData(prev => prev ? { ...prev, quantity: parseInt(e.target.value) || 0 } : null)}
                                  className="h-8 w-16 border border-blue-300 font-semibold text-center text-xs"
                                  min="1"
                                />
                              ) : (
                                <span className="font-semibold text-center block text-xs">{order.quantity}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium text-foreground text-xs">
                                {order.unit_selling_price.toFixed(2)} {getCurrencySymbol(order.currency)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {isEditing && canEdit ? (
                                <Input
                                  type="number"
                                  value={editData?.tax_amount ?? order.tax_amount}
                                  onChange={(e) => setEditData(prev => prev ? { ...prev, tax_amount: parseFloat(e.target.value) || 0 } : null)}
                                  className="h-8 w-16 border border-blue-300 font-semibold text-center text-xs"
                                  step="0.01"
                                  min="0"
                                />
                              ) : (
                                <span className="text-xs text-muted-foreground">{order.tax_amount.toFixed(2)} {getCurrencySymbol(order.currency)}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing && canEdit ? (
                                <Input
                                  type="number"
                                  value={editData?.shipping_amount ?? order.shipping_amount}
                                  onChange={(e) => setEditData(prev => prev ? { ...prev, shipping_amount: parseFloat(e.target.value) || 0 } : null)}
                                  className="h-8 w-16 border border-blue-300 font-semibold text-center text-xs"
                                  step="0.01"
                                  min="0"
                                />
                              ) : (
                                <span className="text-xs text-muted-foreground">{order.shipping_amount.toFixed(2)} {getCurrencySymbol(order.currency)}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing && canEdit ? (
                                <Input
                                  type="number"
                                  value={editData?.discount_amount ?? order.discount_amount}
                                  onChange={(e) => setEditData(prev => prev ? { ...prev, discount_amount: parseFloat(e.target.value) || 0 } : null)}
                                  className="h-8 w-16 border border-blue-300 font-semibold text-center text-xs"
                                  step="0.01"
                                  min="0"
                                />
                              ) : (
                                <span className="text-xs text-green-600">{order.discount_amount.toFixed(2)} {getCurrencySymbol(order.currency)}</span>
                              )}
                            </TableCell>
                            <TableCell className="font-bold text-foreground text-xs">
                              {order.total_amount.toFixed(2)} {getCurrencySymbol(order.currency)}
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-amber-600">{order.commission_amount.toFixed(2)} {getCurrencySymbol(order.currency)}</span>
                            </TableCell>
                            <TableCell>
                              {isEditing && canEdit ? (
                                <div className="flex gap-1 justify-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => saveEdit(order)}
                                    disabled={isSaving}
                                    className="hover:bg-green-500/10 hover:text-green-600"
                                  >
                                    <Save className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={cancelEditing}
                                    disabled={isSaving}
                                    className="hover:bg-red-500/10 hover:text-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex justify-center">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => openViewModal(order)}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        Voir la commande
                                      </DropdownMenuItem>
                                      {canEdit && (
                                        <>
                                          <DropdownMenuItem onClick={() => startEditing(order)}>
                                            <Edit2 className="w-4 h-4 mr-2" />
                                            Modifier la commande
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => openDetailsModal(order)}>
                                            <Info className="w-4 h-4 mr-2" />
                                            Info supplémentaires
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                      <DropdownMenuItem onClick={() => openInvoiceModal(order)}>
                                        <FileText className="w-4 h-4 mr-2" />
                                        Voir la facture
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Éditer les détails de la commande</DialogTitle>
            <DialogDescription>
              Modifiez les informations de livraison, les notes et les dates
            </DialogDescription>
          </DialogHeader>
          
          {detailsEditData && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Adresse de livraison</label>
                  <Input
                    value={detailsEditData.shipping_address}
                    onChange={(e) => setDetailsEditData(prev => prev ? { ...prev, shipping_address: e.target.value } : null)}
                    placeholder="Adresse de livraison"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Adresse de facturation</label>
                  <Input
                    value={detailsEditData.billing_address}
                    onChange={(e) => setDetailsEditData(prev => prev ? { ...prev, billing_address: e.target.value } : null)}
                    placeholder="Adresse de facturation"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Notes</label>
                  <textarea
                    value={detailsEditData.notes}
                    onChange={(e) => setDetailsEditData(prev => prev ? { ...prev, notes: e.target.value } : null)}
                    placeholder="Notes supplémentaires"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-foreground"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Spécifications</label>
                  <div className="space-y-2">
                    {Array.isArray(detailsEditData.specifications) && detailsEditData.specifications.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item.key}
                          onChange={(e) => {
                            const newSpecs = [...detailsEditData.specifications];
                            newSpecs[index].key = e.target.value;
                            setDetailsEditData(prev => prev ? { ...prev, specifications: newSpecs } : null);
                          }}
                          placeholder="Clé"
                          className="flex-1"
                        />
                        <Input
                          value={item.value}
                          onChange={(e) => {
                            const newSpecs = [...detailsEditData.specifications];
                            newSpecs[index].value = e.target.value;
                            setDetailsEditData(prev => prev ? { ...prev, specifications: newSpecs } : null);
                          }}
                          placeholder="Valeur"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newSpecs = detailsEditData.specifications.filter((_, i) => i !== index);
                            setDetailsEditData(prev => prev ? { ...prev, specifications: newSpecs } : null);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDetailsEditData(prev => prev ? { ...prev, specifications: [...(Array.isArray(prev.specifications) ? prev.specifications : []), { key: '', value: '' }] } : null);
                      }}
                      className="w-full"
                    >
                      + Ajouter une spécification
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Options</label>
                  <div className="space-y-2">
                    {Array.isArray(detailsEditData.options) && detailsEditData.options.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item.key}
                          onChange={(e) => {
                            const newOptions = [...detailsEditData.options];
                            newOptions[index].key = e.target.value;
                            setDetailsEditData(prev => prev ? { ...prev, options: newOptions } : null);
                          }}
                          placeholder="Clé"
                          className="flex-1"
                        />
                        <Input
                          value={item.value}
                          onChange={(e) => {
                            const newOptions = [...detailsEditData.options];
                            newOptions[index].value = e.target.value;
                            setDetailsEditData(prev => prev ? { ...prev, options: newOptions } : null);
                          }}
                          placeholder="Valeur"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newOptions = detailsEditData.options.filter((_, i) => i !== index);
                            setDetailsEditData(prev => prev ? { ...prev, options: newOptions } : null);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDetailsEditData(prev => prev ? { ...prev, options: [...(Array.isArray(prev.options) ? prev.options : []), { key: '', value: '' }] } : null);
                      }}
                      className="w-full"
                    >
                      + Ajouter une option
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Date d'expédition</label>
                    <Input
                      type="datetime-local"
                      value={formatDateForInput(detailsEditData.shipped_at)}
                      onChange={(e) => setDetailsEditData(prev => prev ? { ...prev, shipped_at: e.target.value } : null)}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Date de livraison</label>
                    <Input
                      type="datetime-local"
                      value={formatDateForInput(detailsEditData.delivered_at)}
                      onChange={(e) => setDetailsEditData(prev => prev ? { ...prev, delivered_at: e.target.value } : null)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailsModalOpen(false)}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button
              onClick={saveDetailsEdit}
              disabled={isSaving}
            >
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Order Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 print:max-h-none print:h-auto">
          <DialogHeader className="p-4 sm:p-6 pb-2">
            <DialogTitle className="text-xl sm:text-2xl font-bold">Détails de la commande</DialogTitle>
            <DialogDescription>
              {viewOrder?.order_number}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2 print:overflow-visible print:h-auto">
          {viewOrder && (
            <div ref={printRef} className="space-y-4 mt-0 relative print-content-padding">
              {/* Komi watermark - print only, subtle seal + fine texture */}
              <div
                className="print-only hidden print:block fixed inset-0 pointer-events-none"
                style={{
                  zIndex: 0,
                  backgroundImage: `
                    repeating-linear-gradient(
                      135deg,
                      transparent,
                      transparent 10px,
                      rgba(234, 88, 12, 0.05) 10px,
                      rgba(234, 88, 12, 0.05) 11px
                    ),
                    radial-gradient(rgba(15, 23, 42, 0.05) 0.6px, transparent 0.6px)
                  `,
                  backgroundSize: "auto, 14px 14px",
                }}
              />
              <div
                className="print-only hidden print:flex fixed inset-0 pointer-events-none items-center justify-center"
                style={{ zIndex: 0 }}
              >
                <div
                  className="flex items-center justify-center rounded-full border-[3px]"
                  style={{
                    width: "260px",
                    height: "260px",
                    borderColor: "rgba(15, 23, 42, 0.05)",
                    transform: "rotate(-12deg)",
                  }}
                >
                  <span
                    className="font-serif font-bold tracking-wide"
                    style={{ fontSize: "72px", color: "rgba(15, 23, 42, 0.05)" }}
                  >
                    K
                  </span>
                </div>
              </div>

              {/* Print-only header */}
              <div className="print-only hidden print:block">
                <div className="border-b-4 border-slate-800 pb-6 mb-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-800">BON DE COMMANDE</h1>
                      <p className="text-slate-500 mt-1">Document officiel</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-mono font-bold text-slate-800">{viewOrder.order_number}</p>
                      <p className="text-slate-500 mt-1">
                        {new Date(viewOrder.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex gap-4 print-hide items-end justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Statut</p>
                  <div className="flex mt-4">
                    <Badge className={`${STATUS_COLORS[viewOrder.status] || "bg-gray-100"} border`}>
                      {STATUS_LABELS[viewOrder.status] || viewOrder.status}
                    </Badge>
                  </div>
                </div>

              </div>

              {/* Print-only status */}
              <div className="print-only hidden print:flex gap-4 mb-8">
                <div className="bg-slate-100 px-4 py-2 rounded">
                  <p className="text-xs text-slate-500">Statut</p>
                  <p className="font-semibold">{STATUS_LABELS[viewOrder.status] || viewOrder.status}</p>
                </div>
              </div>

              {/* Customer & Supplier Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {viewOrder.user && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Client
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">{viewOrder.user.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{viewOrder.user.email}</span>
                      </div>
                      {viewOrder.user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{viewOrder.user.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {(viewOrder.product?.supplier || viewOrder.rental?.supplier || viewOrder.service?.supplier) && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Fournisseur
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {viewOrder.product?.supplier?.name || viewOrder.rental?.supplier?.name || viewOrder.service?.supplier?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {viewOrder.product?.supplier?.email || viewOrder.rental?.supplier?.email || viewOrder.service?.supplier?.email}
                        </span>
                      </div>
                      {(viewOrder.product?.supplier?.phone || viewOrder.rental?.supplier?.phone || viewOrder.service?.supplier?.phone) && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {viewOrder.product?.supplier?.phone || viewOrder.rental?.supplier?.phone || viewOrder.service?.supplier?.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Item Details */}
              <div className="border rounded-lg p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Article
                </h3>
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
                    {viewOrder.product?.image || viewOrder.rental?.image || viewOrder.service?.image ? (
                      <img 
                        src={viewOrder.product?.image || viewOrder.rental?.image || viewOrder.service?.image} 
                        alt="Article" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{viewOrder.product?.name || viewOrder.rental?.title || viewOrder.service?.title || "N/A"}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Quantité</p>
                        <p className="font-semibold">{viewOrder.quantity}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Prix unitaire</p>
                        <p className="font-semibold">{viewOrder.unit_selling_price.toFixed(2)} {getCurrencySymbol(viewOrder.currency)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Sous-total</p>
                        <p className="font-semibold text-blue-600">{viewOrder.subtotal.toFixed(2)} {getCurrencySymbol(viewOrder.currency)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Addresses */}
              {(viewOrder.shipping_address || viewOrder.billing_address) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {viewOrder.shipping_address && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Livraison
                      </h3>
                      <p className="text-sm whitespace-pre-line">{viewOrder.shipping_address}</p>
                    </div>
                  )}
                  {viewOrder.billing_address && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Facturation
                      </h3>
                      <p className="text-sm whitespace-pre-line">{viewOrder.billing_address}</p>
                    </div>
                  )}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                      Date
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Créée:</span> {new Date(viewOrder.created_at).toLocaleString("fr-FR")}</p>
                    </div>
                  </div>
                  {viewOrder.shipped_at && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Date d'expédition
                      </h3>
                      <p className="text-sm whitespace-pre-line">{new Date((viewOrder.shipped_at)).toLocaleString("fr-FR")}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {viewOrder.delivered_at && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Date de livraison
                    </h3>
                    <p className="text-sm whitespace-pre-line">{new Date((viewOrder.delivered_at)).toLocaleString("fr-FR")}</p>
                  </div>
                )}
                <div className="border rounded-lg p-4">
                  <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Paiement
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Méthode:</span> {PAYMENT_METHOD_LABELS[viewOrder.payment_method] || viewOrder.payment_method}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewOrder.notes && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Notes
                  </h3>
                  <p className="text-sm whitespace-pre-line">{viewOrder.notes}</p>
                </div>
              )}

              {/* Specifications & Options */}
              {(viewOrder.specifications || viewOrder.options) && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Détails supplémentaires
                  </h3>
                  <div className="space-y-4">
                    {viewOrder.specifications && typeof viewOrder.specifications === 'object' && (
                      <div>
                        <p className="text-xs font-semibold mb-2 text-muted-foreground">Spécifications</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(viewOrder.specifications).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              <span className="font-bold text-blue-600">{key}</span>
                              <span className="mx-1">:</span>
                              <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {viewOrder.options && typeof viewOrder.options === 'object' && (
                      <div>
                        <p className="text-xs font-semibold mb-2 text-muted-foreground">Options</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(viewOrder.options).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              <span className="font-bold text-purple-600">{key}</span>
                              <span className="mx-1">:</span>
                              <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Print-only footer */}
              <div className="print-only hidden print:block border-t pt-6 mt-8 text-center text-slate-500 text-sm">
                <p>Document généré automatiquement par Komi</p>
                <p className="mt-1">{new Date().toLocaleString("fr-FR")}</p>
              </div>
            </div>
          )}
          </div>

          <DialogFooter className="print-hide p-4 sm:p-6 border-t">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
            <Button onClick={() => setIsViewModalOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

     {/* Invoice Modal */}
      <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 print:max-h-none print:h-auto">
          <DialogHeader className="p-4 sm:p-6 pb-2 flex flex-row items-start justify-between">
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-bold">Facture</DialogTitle>
              <DialogDescription>
                {invoiceOrder?.invoice?.invoice_number || invoiceOrder?.order_number}
              </DialogDescription>
            </div>
            <Button title="informations de paiement" variant="outline" size="icon" className="mt-6" onClick={() => setPaymentInfoOpen(true)} disabled={isSending}>
              <Info className="w-4 h-4" />
            </Button>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2 print:overflow-visible print:h-auto">
          {invoiceOrder && (
            <div ref={printRef} className="space-y-4 mt-0 relative print-content-padding">
              {/* Komi watermark - print only, subtle seal + fine texture */}
              <div
                className="print-only hidden print:block fixed inset-0 pointer-events-none"
                style={{
                  zIndex: 0,
                  backgroundImage: `
                    repeating-linear-gradient(
                      135deg,
                      transparent,
                      transparent 10px,
                      rgba(234, 88, 12, 0.05) 10px,
                      rgba(234, 88, 12, 0.05) 11px
                    ),
                    radial-gradient(rgba(15, 23, 42, 0.05) 0.6px, transparent 0.6px)
                  `,
                  backgroundSize: "auto, 14px 14px",
                }}
              />
              <div
                className="print-only hidden print:flex fixed inset-0 pointer-events-none items-center justify-center"
                style={{ zIndex: 0 }}
              >
                <div
                  className="flex items-center justify-center rounded-full border-[3px]"
                  style={{
                    width: "260px",
                    height: "260px",
                    borderColor: "rgba(15, 23, 42, 0.05)",
                    transform: "rotate(-12deg)",
                  }}
                >
                  <span
                    className="font-serif font-bold tracking-wide"
                    style={{ fontSize: "72px", color: "rgba(15, 23, 42, 0.05)" }}
                  >
                    K
                  </span>
                </div>
              </div>

              {/* Print-only header */}
              <div className="print-only hidden print:block">
                <div className="border-b-4 border-slate-800 pb-6 mb-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-800">FACTURE</h1>
                      <p className="text-slate-500 mt-1">Document officiel</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-mono font-bold text-slate-800">{invoiceOrder.invoice?.invoice_number || invoiceOrder.order_number}</p>
                      <p className="text-slate-500 mt-1">
                        {new Date(invoiceOrder.invoice?.sent_at || invoiceOrder.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex gap-4 print-hide">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Statut</p>
                  <Badge className={`${STATUS_COLORS[invoiceOrder.status] || "bg-gray-100"} border`}>
                    {STATUS_LABELS[invoiceOrder.status] || invoiceOrder.status}
                  </Badge>
                </div>
                {invoiceOrder.invoice && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Facture</p>
                    <Badge className={`${INVOICE_STATUS_COLORS[invoiceOrder.invoice.status] || "bg-gray-100"} border`}>
                      {INVOICE_STATUS_LABELS[invoiceOrder.invoice.status] || invoiceOrder.invoice.status}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Print-only status */}
              <div className="print-only hidden print:flex gap-4 mb-8">
                <div className="bg-slate-100 px-4 py-2 rounded">
                  <p className="text-xs text-slate-500">Statut</p>
                  <p className="font-semibold">{STATUS_LABELS[invoiceOrder.status] || invoiceOrder.status}</p>
                </div>
                {invoiceOrder.invoice && (
                  <div className="bg-slate-100 px-4 py-2 rounded">
                    <p className="text-xs text-slate-500">Facture</p>
                    <p className="font-semibold">{INVOICE_STATUS_LABELS[invoiceOrder.invoice.status] || invoiceOrder.invoice.status}</p>
                  </div>
                )}
              </div>

              {/* Customer & Supplier Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {invoiceOrder.user && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Client
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">{invoiceOrder.user.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{invoiceOrder.user.email}</span>
                      </div>
                      {invoiceOrder.user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{invoiceOrder.user.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {(invoiceOrder.product?.supplier || invoiceOrder.rental?.supplier || invoiceOrder.service?.supplier) && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Fournisseur
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {invoiceOrder.product?.supplier?.name || invoiceOrder.rental?.supplier?.name || invoiceOrder.service?.supplier?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {invoiceOrder.product?.supplier?.email || invoiceOrder.rental?.supplier?.email || invoiceOrder.service?.supplier?.email}
                        </span>
                      </div>
                      {(invoiceOrder.product?.supplier?.phone || invoiceOrder.rental?.supplier?.phone || invoiceOrder.service?.supplier?.phone) && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {invoiceOrder.product?.supplier?.phone || invoiceOrder.rental?.supplier?.phone || invoiceOrder.service?.supplier?.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Item Details */}
              <div className="border rounded-lg p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Article
                </h3>
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
                    {invoiceOrder.product?.image || invoiceOrder.rental?.image || invoiceOrder.service?.image ? (
                      <img 
                        src={invoiceOrder.product?.image || invoiceOrder.rental?.image || invoiceOrder.service?.image} 
                        alt="Article" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{invoiceOrder.product?.name || invoiceOrder.rental?.title || invoiceOrder.service?.title || "N/A"}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Quantité</p>
                        <p className="font-semibold">{invoiceOrder.quantity}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Prix unitaire</p>
                        <p className="font-semibold">{invoiceOrder.unit_selling_price.toFixed(2)} {getCurrencySymbol(invoiceOrder.currency)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Sous-total</p>
                        <p className="font-semibold text-blue-600">{invoiceOrder.subtotal.toFixed(2)} {getCurrencySymbol(invoiceOrder.currency)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Details */}
              <div className="border rounded-lg p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Détails financiers
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Sous-total</span>
                    <span className="font-semibold">{invoiceOrder.subtotal.toFixed(2)} {getCurrencySymbol(invoiceOrder.currency)}</span>
                  </div>
                  {invoiceOrder.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm">Taxes</span>
                      <span className="font-semibold">+{invoiceOrder.tax_amount.toFixed(2)} {getCurrencySymbol(invoiceOrder.currency)}</span>
                    </div>
                  )}
                  {invoiceOrder.shipping_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm">Livraison</span>
                      <span className="font-semibold">+{invoiceOrder.shipping_amount.toFixed(2)} {getCurrencySymbol(invoiceOrder.currency)}</span>
                    </div>
                  )}
                  {invoiceOrder.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm">Remise</span>
                      <span className="font-semibold text-green-600">-{invoiceOrder.discount_amount.toFixed(2)} {getCurrencySymbol(invoiceOrder.currency)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{invoiceOrder.total_amount.toFixed(2)} {getCurrencySymbol(invoiceOrder.currency)}</span>
                  </div>
                  {invoiceOrder.commission_amount > 0 && isSupplier(invoiceOrder) && (
                    <div className="flex justify-between text-amber-600">
                      <span className="text-sm">Commission</span>
                      <span className="font-semibold">{invoiceOrder.commission_amount.toFixed(2)} {getCurrencySymbol(invoiceOrder.currency)}</span>
                    </div>
                  )}
                  {(invoiceOrder.invoice?.komi_fees ?? 0) > 0 && isSupplier(invoiceOrder) && (
                    <div className="flex justify-between text-amber-600">
                      <span className="text-sm">Frais Komi</span>
                      <span className="font-semibold">-{invoiceOrder.invoice!.komi_fees.toFixed(2)} {getCurrencySymbol(invoiceOrder.currency)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Addresses */}
              {(invoiceOrder.shipping_address || invoiceOrder.billing_address) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {invoiceOrder.shipping_address && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Livraison
                      </h3>
                      <p className="text-sm whitespace-pre-line">{invoiceOrder.shipping_address}</p>
                    </div>
                  )}
                  {invoiceOrder.billing_address && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Facturation
                      </h3>
                      <p className="text-sm whitespace-pre-line">{invoiceOrder.billing_address}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                    Dates
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Créée:</span> {new Date(invoiceOrder.created_at).toLocaleString("fr-FR")}</p>
                    {invoiceOrder.invoice?.sent_at && (
                      <p><span className="text-muted-foreground">Facture envoyée:</span> {new Date(invoiceOrder.invoice.sent_at).toLocaleString("fr-FR")}</p>
                    )}
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Paiement
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Méthode:</span> {PAYMENT_METHOD_LABELS[invoiceOrder.payment_method] || invoiceOrder.payment_method}</p>
                    {invoiceOrder.invoice?.paid_at && (
                      <p><span className="text-muted-foreground">Payée le:</span> {new Date(invoiceOrder.invoice.paid_at).toLocaleString("fr-FR")}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoiceOrder.notes && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Notes
                  </h3>
                  <p className="text-sm whitespace-pre-line">{invoiceOrder.notes}</p>
                </div>
              )}

              {/* Specifications & Options */}
              {(invoiceOrder.specifications || invoiceOrder.options) && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Détails supplémentaires
                  </h3>
                  <div className="space-y-4">
                    {invoiceOrder.specifications && typeof invoiceOrder.specifications === 'object' && (
                      <div>
                        <p className="text-xs font-semibold mb-2 text-muted-foreground">Spécifications</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(invoiceOrder.specifications).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              <span className="font-bold text-blue-600">{key}</span>
                              <span className="mx-1">:</span>
                              <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {invoiceOrder.options && typeof invoiceOrder.options === 'object' && (
                      <div>
                        <p className="text-xs font-semibold mb-2 text-muted-foreground">Options</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(invoiceOrder.options).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              <span className="font-bold text-purple-600">{key}</span>
                              <span className="mx-1">:</span>
                              <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Print-only footer */}
              <div className="print-only hidden print:block border-t pt-6 mt-8 text-center text-slate-500 text-sm">
                <p>Document généré automatiquement par Komi</p>
                <p className="mt-1">{new Date().toLocaleString("fr-FR")}</p>
              </div>
            </div>
          )}
          </div>

          <DialogFooter className="p-4 sm:p-6 border-t">
            {invoiceOrder?.status === "under_negotiation" && invoiceOrder?.user?.id !== user?.id && (
              <Button variant="outline" onClick={() => handleSendInvoice(invoiceOrder!.id)} disabled={isSending}>
                {invoiceOrder.generate_invoice ? <RefreshCcw className="w-4 h-4 mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                {isSending ? "Envoi en cours..." : invoiceOrder.generate_invoice ? "Renvoyer la facture au client" : "Envoyer la facture au client"}
              </Button>
            )}
            {invoiceOrder?.status === "under_negotiation" && invoiceOrder?.user?.id === user?.id && (
              <Button variant="outline" onClick={() => handleConfirmInvoice(invoiceOrder!.id)} disabled={isSending}>
                <CheckCircle className="w-4 h-4 mr-2" />
                {isSending ? "Confirmation en cours..." : "Confirmer la commande et payer"}
              </Button>
            )}
            {invoiceOrder?.status === "confirmed" && invoiceOrder?.user?.id === user?.id && (
              <Button variant="outline" onClick={() => setPaymentInfoOpen(true)} disabled={isSending}>
                <Wallet className="w-4 h-4 mr-2" />
                Payer
              </Button>
            )}

            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
            <Button onClick={() => setIsInvoiceModalOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>

      {/* nested inside the invoice content so radix treats it as a child layer: closing it keeps the invoice open */}
      <Dialog open={paymentInfoOpen} onOpenChange={setPaymentInfoOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-4 sm:p-6 pb-2">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-emerald-500" />
              Paiement sécurisé par Komi
            </DialogTitle>
            <DialogDescription>
              Commande {invoiceOrder?.order_number} — Total : {invoiceOrder ? `${invoiceOrder.total_amount.toFixed(2)} ${getCurrencySymbol(invoiceOrder.currency)}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="px-4 sm:px-6 py-2 space-y-6">
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex gap-3">
              <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-emerald-800">Votre argent est protégé</p>
                <p className="text-emerald-700">Ne payez jamais directement le fournisseur. Komi sécurise les fonds jusqu'à la livraison.</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Mobile Money
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-3 flex items-center gap-3">
                    <img src="/icons-mobil-money/airtel.png" alt="Airtel Money" className="w-10 h-10 object-contain" />
                    <div>
                      <p className="font-semibold text-sm">Airtel Money</p>
                      <p className="text-xs text-muted-foreground">Nom : Komi SARL</p>
                      <p className="font-mono text-sm">+243 99 000 0001</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 flex items-center gap-3">
                    <img src="/icons-mobil-money/orange.png" alt="Orange Money" className="w-10 h-10 object-contain" />
                    <div>
                      <p className="font-semibold text-sm">Orange Money</p>
                      <p className="text-xs text-muted-foreground">Nom : Komi SARL</p>
                      <p className="font-mono text-sm">+243 84 000 0002</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 flex items-center gap-3">
                    <img src="/icons-mobil-money/mpesa.png" alt="M-Pesa" className="w-10 h-10 object-contain" />
                    <div>
                      <p className="font-semibold text-sm">M-Pesa (Vodacom)</p>
                      <p className="text-xs text-muted-foreground">Nom : Komi SARL</p>
                      <p className="font-mono text-sm">+243 82 000 0003</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 flex items-center gap-3">
                    <img src="/icons-mobil-money/afrimoney.png" alt="AfriMoney" className="w-10 h-10 object-contain" />
                    <div>
                      <p className="font-semibold text-sm">AfriMoney (Africell)</p>
                      <p className="text-xs text-muted-foreground">Nom : Komi SARL</p>
                      <p className="font-mono text-sm">+243 97 000 0004</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Cartes bancaires
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-3 flex items-center gap-3">
                    <img src="/icons-mobil-money/mastercard.png" alt="MasterCard" className="w-10 h-10 object-contain" />
                    <div>
                      <p className="font-semibold text-sm">MasterCard</p>
                      <p className="font-mono text-sm">5500 0000 0000 0004</p>
                      <p className="text-xs text-muted-foreground">Exemple — utiliser votre propre carte</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 flex items-center gap-3">
                    <img src="/icons-mobil-money/visa.png" alt="Visa" className="w-10 h-10 object-contain" />
                    <div>
                      <p className="font-semibold text-sm">Visa</p>
                      <p className="font-mono text-sm">4111 1111 1111 1111</p>
                      <p className="text-xs text-muted-foreground">Exemple — utiliser votre propre carte</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Déroulement du paiement
              </h4>
              <ol className="space-y-2 text-sm">
                <li className="flex gap-2"><span className="font-bold text-emerald-600">1.</span> Envoyez le montant exact à l’un des numéros Komi ci-dessus ou par carte.</li>
                <li className="flex gap-2"><span className="font-bold text-emerald-600">2.</span> Komi bloque les fonds : le fournisseur ne les reçoit pas immédiatement.</li>
                <li className="flex gap-2"><span className="font-bold text-emerald-600">3.</span> Le fournisseur dépose la marchandise ou fournit le service.</li>
                <li className="flex gap-2"><span className="font-bold text-emerald-600">4.</span> Vous confirmez la réception depuis votre espace.</li>
                <li className="flex gap-2"><span className="font-bold text-emerald-600">5.</span> Komi libère alors le paiement au fournisseur.</li>
              </ol>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3">
              <RefreshCcw className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-800">Remboursement</p>
                <p className="text-amber-700">Si la commande n’est pas livrée ou en cas de litige, Komi examine la demande et procède au remboursement sous 5 jours ouvrés après validation.</p>
              </div>
            </div>

            {invoiceOrder?.invoice?.payment_proof && (
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Votre preuve de paiement
                </h4>
                <div className="flex items-center gap-2">
                  <Badge className={`${PAYMENT_PROOF_STATUS_COLORS[invoiceOrder.invoice.payment_proof.status] || "bg-gray-100"} border`}>
                    {PAYMENT_PROOF_STATUS_LABELS[invoiceOrder.invoice.payment_proof.status] || invoiceOrder.invoice.payment_proof.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(invoiceOrder.invoice.payment_proof.created_at).toLocaleString("fr-FR")}
                  </span>
                </div>
                {invoiceOrder.invoice.payment_proof.proof_url && (
                  <a href={invoiceOrder.invoice.payment_proof.proof_url} target="_blank" rel="noreferrer">
                    <img
                      src={invoiceOrder.invoice.payment_proof.proof_url}
                      alt="Preuve de paiement"
                      className="w-full max-h-64 object-contain rounded-lg border bg-muted"
                    />
                  </a>
                )}
                {invoiceOrder.invoice.payment_proof.status === "rejected" && invoiceOrder.invoice.payment_proof.reason && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">
                    Motif du rejet : {invoiceOrder.invoice.payment_proof.reason}
                  </p>
                )}
              </div>
            )}

            {invoiceOrder?.invoice && (!invoiceOrder.invoice.payment_proof || invoiceOrder.invoice.payment_proof.status === "rejected") && (
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Envoyer votre preuve de paiement
                </h4>
                <p className="text-xs text-muted-foreground">
                  Après avoir effectué le paiement, téléversez une photo bien visible de la confirmation (capture d'écran ou reçu).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={proofMethod}
                    onChange={(e) => setProofMethod(e.target.value)}
                  >
                    <option value="">Méthode utilisée (optionnel)</option>
                    <option value="airtel_money">Airtel Money</option>
                    <option value="orange_money">Orange Money</option>
                    <option value="mpesa">M-Pesa (Vodacom)</option>
                    <option value="afrimoney">AfriMoney (Africell)</option>
                    <option value="mastercard">MasterCard</option>
                    <option value="visa">Visa</option>
                  </select>
                  <Input
                    placeholder="Référence de transaction (optionnel)"
                    value={proofReference}
                    onChange={(e) => setProofReference(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="text-xs"
                  />
                  <Button onClick={handleSubmitPaymentProof} disabled={!proofFile || isUploadingProof}>
                    {isUploadingProof ? "Envoi en cours..." : "Envoyer"}
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="p-4 sm:p-6 border-t">
            <Button variant="outline" onClick={() => setPaymentInfoOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
            </Dialog>
            </DialogContent>
      </Dialog> 

      <style>{`
        @media print {
          @page {
            size: A4;
            margin-top: 10mm;   /* marge en haut de chaque page */
            margin-right: 0mm;
            margin-bottom: 10mm;
            margin-left: 0mm;
          }

          .print-content-padding {
            padding: 10mm !important;
          }

          body {
            background: white !important;
          }

          .print-hide {
            display: none !important;
          }

          .print-only {
            display: block !important;
          }

          .border.rounded-lg,
          .grid.grid-cols-2 > div {
            break-inside: avoid;
            page-break-inside: avoid;
            position: relative;
            z-index: 1;
            background: white;
          }

          html, body {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          [role="dialog"] {
            position: static !important;
            transform: none !important;
            max-width: 100% !important;
            max-height: none !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
