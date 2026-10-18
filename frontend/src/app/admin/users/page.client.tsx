"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BadgeCheck,
  Ban,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Loader2,
  MapPin,
  MoreVertical,
  Package,
  PackageOpen,
  Search,
  ShieldCheck,
  Store,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";

import { adminAPI } from "~/lib/api";
import { useAuth } from "~/lib/hooks/use-auth";
import { ConfirmDialog } from "~/ui/components/confirm-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "~/ui/primitives/avatar";
import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/ui/primitives/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/ui/primitives/tabs";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  status: "active" | "inactive";
  certified: boolean;
  is_admin: boolean;
  picture?: string | null;
  created_at: string;
  shops_count: number;
  products_count: number;
  rentals_count: number;
  services_count: number;
};

type UserStats = {
  total: number;
  today: number;
  this_week: number;
  this_month: number;
  this_year: number;
};

type CatalogueItem = {
  id: number;
  name?: string;
  title?: string;
  price?: number;
  currency?: string;
  verified: boolean;
  status: string;
};

type CatalogueCounts = {
  shops: number;
  products: number;
  rentals: number;
  services: number;
};

type CatalogueSummary = {
  user: { id: number; name: string; email: string };
  counts: CatalogueCounts;
};

type Pagination = {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
};

const PAGE_SIZE_OPTIONS = [10, 20, 25, 30, 50];

const statCards = [
  { key: "today", title: "Aujourd'hui", icon: CalendarDays, color: "text-blue-600 dark:text-blue-400" },
  { key: "this_week", title: "Cette semaine", icon: CalendarDays, color: "text-purple-600 dark:text-purple-400" },
  { key: "this_month", title: "Ce mois", icon: CalendarDays, color: "text-orange-600 dark:text-orange-400" },
  { key: "this_year", title: "Cette année", icon: CalendarDays, color: "text-green-600 dark:text-green-400" },
  { key: "total", title: "Total utilisateurs", icon: Users, color: "text-indigo-600 dark:text-indigo-400" },
] as const;

const catalogueSections = [
  { key: "shops", label: "Magasins", icon: Store },
  { key: "products", label: "Produits", icon: Package },
  { key: "rentals", label: "Locations", icon: MapPin },
  { key: "services", label: "Services", icon: Wrench },
] as const;

const itemName = (item: CatalogueItem) => item.name ?? item.title ?? `#${item.id}`;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function AdminUsersPageClient() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [meta, setMeta] = useState<Pagination | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [actionBusy, setActionBusy] = useState<number | null>(null);
  const [catalogueUser, setCatalogueUser] = useState<AdminUser | null>(null);
  const [catalogueSummary, setCatalogueSummary] = useState<CatalogueSummary | null>(null);
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<keyof CatalogueCounts>("shops");
  const [sectionItems, setSectionItems] = useState<CatalogueItem[]>([]);
  const [sectionMeta, setSectionMeta] = useState<Pagination | null>(null);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [sectionPage, setSectionPage] = useState(1);
  const [sectionSearchInput, setSectionSearchInput] = useState("");
  const [sectionSearch, setSectionSearch] = useState("");
  const [resetResult, setResetResult] = useState<{ user: AdminUser; password: string } | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const response = await adminAPI.users.stats();
      setStats(response.data.data);
    } catch (err) {
      console.error("Error loading user stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.users.list({
        page,
        per_page: perPage,
        ...(search ? { search } : {}),
      });
      setUsers(response.data.data);
      setMeta(response.data.meta);
    } catch (err) {
      console.error("Error loading users:", err);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // la recherche déclenche un rechargement, avec délai pour ne pas tirer
  // une requête à chaque frappe
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const updateUserInList = (updated: AdminUser) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setActionBusy(deleteTarget.id);
      await adminAPI.users.delete(deleteTarget.id);
      toast.success(`${deleteTarget.name} a été supprimé`);
      await Promise.all([loadUsers(), loadStats()]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de la suppression");
    } finally {
      setActionBusy(null);
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const next = user.status === "active" ? "inactive" : "active";
    try {
      setActionBusy(user.id);
      const response = await adminAPI.users.setStatus(user.id, next);
      updateUserInList(response.data.data);
      toast.success(next === "inactive" ? `${user.name} désactivé` : `${user.name} réactivé`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors du changement de statut");
    } finally {
      setActionBusy(null);
    }
  };

  const handleToggleCertified = async (user: AdminUser) => {
    try {
      setActionBusy(user.id);
      const response = await adminAPI.users.certify(user.id);
      updateUserInList(response.data.data);
      toast.success(
        response.data.data.certified
          ? `${user.name} est maintenant certifié`
          : `Certification retirée pour ${user.name}`,
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de la certification");
    } finally {
      setActionBusy(null);
    }
  };

  const handleResetPassword = async (user: AdminUser) => {
    try {
      setActionBusy(user.id);
      const response = await adminAPI.users.resetPassword(user.id);
      setResetResult({ user, password: response.data.data.password });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de la réinitialisation");
    } finally {
      setActionBusy(null);
    }
  };

  const openCatalogue = async (user: AdminUser) => {
    setCatalogueUser(user);
    setCatalogueSummary(null);
    setSectionItems([]);
    setSectionMeta(null);
    setActiveSection("shops");
    setSectionPage(1);
    setSectionSearchInput("");
    setSectionSearch("");
    setCatalogueLoading(true);
    try {
      const response = await adminAPI.users.catalogue(user.id);
      setCatalogueSummary(response.data.data);
    } catch (err) {
      console.error("Error loading catalogue:", err);
      toast.error("Erreur lors du chargement du catalogue");
      setCatalogueUser(null);
    } finally {
      setCatalogueLoading(false);
    }
  };

  const closeCatalogue = () => setCatalogueUser(null);

  // la recherche dans la section active déclenche un rechargement,
  // avec délai pour ne pas tirer une requête à chaque frappe
  useEffect(() => {
    const timer = setTimeout(() => {
      setSectionSearch(sectionSearchInput.trim());
      setSectionPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [sectionSearchInput]);

  useEffect(() => {
    if (!catalogueUser) return;

    let cancelled = false;
    const loadSection = async () => {
      setSectionLoading(true);
      try {
        const response = await adminAPI.users.catalogueSection(
          catalogueUser.id,
          activeSection,
          {
            page: sectionPage,
            per_page: 10,
            ...(sectionSearch ? { search: sectionSearch } : {}),
          },
        );
        if (!cancelled) {
          setSectionItems(response.data.data);
          setSectionMeta(response.data.meta);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error loading catalogue section:", err);
          toast.error("Erreur lors du chargement des éléments");
        }
      } finally {
        if (!cancelled) setSectionLoading(false);
      }
    };
    loadSection();
    return () => {
      cancelled = true;
    };
  }, [catalogueUser, activeSection, sectionPage, sectionSearch]);

  const handleSectionChange = (value: string) => {
    setActiveSection(value as keyof CatalogueCounts);
    setSectionPage(1);
    setSectionSearchInput("");
    setSectionSearch("");
    setSectionItems([]);
    setSectionMeta(null);
  };

  const verifyApiFor = (kind: keyof CatalogueCounts) =>
    kind === "shops"
      ? adminAPI.verify.shop
      : kind === "products"
        ? adminAPI.verify.product
        : kind === "rentals"
          ? adminAPI.verify.rental
          : adminAPI.verify.service;

  const handleVerify = async (item: CatalogueItem) => {
    try {
      const response = await verifyApiFor(activeSection)(item.id, !item.verified);
      const verified = response.data.data.verified;
      setSectionItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, verified } : i)),
      );
      toast.success(verified ? "Élément vérifié" : "Vérification retirée");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de la vérification");
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
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Utilisateurs</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Gérez les comptes, certifications et catalogues de la plateforme
        </p>
      </div>

      {/* Inscription stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card className="bg-muted/50" key={stat.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium md:text-sm">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 shrink-0 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-7 w-14" />
              ) : (
                <div className="text-xl font-bold tabular-nums md:text-2xl">
                  {stats?.[stat.key] ?? 0}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users table */}
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base md:text-lg">Tous les utilisateurs</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Rechercher par nom ou email..."
                type="search"
                value={searchInput}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton className="h-12 w-full" key={i} />
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucun utilisateur trouvé{search ? ` pour « ${search} »` : ""}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Catalogue</TableHead>
                    <TableHead>Inscrit le</TableHead>
                    <TableHead className="w-12 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage alt={u.name} src={u.picture || ""} />
                              <AvatarFallback className="text-xs">
                                {u.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="truncate text-sm font-medium">{u.name}</p>
                                {u.is_admin && (
                                  <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                                )}
                                {u.certified && (
                                  <BadgeCheck className="h-4 w-4 shrink-0 text-green-600" />
                                )}
                              </div>
                              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.status === "active" ? "default" : "secondary"}>
                            {u.status === "active" ? "Actif" : "Inactif"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1" title="Magasins">
                              <Store className="h-3.5 w-3.5" />
                              <span className="tabular-nums">{u.shops_count}</span>
                            </span>
                            <span className="flex items-center gap-1" title="Produits">
                              <Package className="h-3.5 w-3.5" />
                              <span className="tabular-nums">{u.products_count}</span>
                            </span>
                            <span className="flex items-center gap-1" title="Locations">
                              <MapPin className="h-3.5 w-3.5" />
                              <span className="tabular-nums">{u.rentals_count}</span>
                            </span>
                            <span className="flex items-center gap-1" title="Services">
                              <Wrench className="h-3.5 w-3.5" />
                              <span className="tabular-nums">{u.services_count}</span>
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(u.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                disabled={actionBusy === u.id}
                                size="icon"
                                variant="ghost"
                              >
                                {actionBusy === u.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openCatalogue(u)}>
                                <PackageOpen className="mr-2 h-4 w-4" />
                                Catalogue
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleCertified(u)}>
                                <BadgeCheck className="mr-2 h-4 w-4" />
                                {u.certified ? "Retirer la certification" : "Certifier"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResetPassword(u)}>
                                <KeyRound className="mr-2 h-4 w-4" />
                                Réinitialiser le mot de passe
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                disabled={isSelf}
                                onClick={() => handleToggleStatus(u)}
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                {u.status === "active" ? "Désactiver" : "Réactiver"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                disabled={isSelf}
                                onClick={() => setDeleteTarget(u)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
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

          {/* Pagination */}
          {meta && !loading && users.length > 0 && (
            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Page <span className="font-medium tabular-nums">{meta.current_page}</span> sur{" "}
                <span className="tabular-nums">{meta.last_page}</span> —{" "}
                <span className="tabular-nums">{meta.total}</span> utilisateurs
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

      {/* Delete confirmation */}
      <ConfirmDialog
        confirmText="Supprimer"
        description={`Supprimer définitivement ${deleteTarget?.name} ? Ses magasins, produits, locations et services seront également supprimés.`}
        onConfirm={handleDelete}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        open={!!deleteTarget}
        title="Supprimer l'utilisateur"
        variant="destructive"
      />

      {/* Catalogue dialog */}
      <Dialog
        onOpenChange={(open) => !open && closeCatalogue()}
        open={!!catalogueUser}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Catalogue de {catalogueUser?.name}</DialogTitle>
            <DialogDescription>
              Magasins, produits, locations et services — cliquez pour vérifier ou retirer la vérification
            </DialogDescription>
          </DialogHeader>

          {catalogueLoading || !catalogueSummary ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton className="h-12 w-full" key={i} />
              ))}
            </div>
          ) : (
            <Tabs onValueChange={handleSectionChange} value={activeSection}>
              <TabsList className="w-full">
                {catalogueSections.map((section) => (
                  <TabsTrigger className="flex-1" key={section.key} value={section.key}>
                    {section.label}
                    <span className="ml-1.5 rounded-full bg-muted px-1.5 text-xs tabular-nums">
                      {catalogueSummary.counts[section.key]}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="relative mt-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(e) => setSectionSearchInput(e.target.value)}
                  placeholder={`Rechercher dans ${catalogueSections.find((s) => s.key === activeSection)?.label.toLowerCase()}...`}
                  type="search"
                  value={sectionSearchInput}
                />
              </div>

              {catalogueSections.map((section) => (
                <TabsContent className="mt-3" key={section.key} value={section.key}>
                  {sectionLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton className="h-14 w-full" key={i} />
                      ))}
                    </div>
                  ) : sectionItems.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      {sectionSearch
                        ? `Aucun résultat pour « ${sectionSearch} »`
                        : "Aucun élément dans cette catégorie"}
                    </p>
                  ) : (
                    <div className="max-h-80 space-y-2 overflow-y-auto">
                      {sectionItems.map((item) => (
                        <div
                          className="flex items-center justify-between gap-3 rounded-lg border p-3"
                          key={item.id}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-sm font-medium">{itemName(item)}</p>
                              {item.verified && (
                                <BadgeCheck className="h-4 w-4 shrink-0 text-green-600" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {item.price !== null && item.price !== undefined && (
                                <span className="tabular-nums">{item.price} {item.currency}</span>
                              )}
                              {item.price !== null && item.price !== undefined && " · "}
                              {item.status}
                            </p>
                          </div>
                          <Button
                            onClick={() => handleVerify(item)}
                            size="sm"
                            variant={item.verified ? "outline" : "default"}
                          >
                            {item.verified ? "Dévérifier" : "Vérifier"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {sectionMeta && sectionMeta.last_page > 1 && !sectionLoading && (
                    <div className="mt-3 flex items-center justify-between border-t pt-3">
                      <p className="text-xs text-muted-foreground">
                        Page <span className="tabular-nums">{sectionMeta.current_page}</span> sur{" "}
                        <span className="tabular-nums">{sectionMeta.last_page}</span> —{" "}
                        <span className="tabular-nums">{sectionMeta.total}</span> éléments
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          disabled={sectionMeta.current_page <= 1}
                          onClick={() => setSectionPage((p) => Math.max(1, p - 1))}
                          size="icon"
                          variant="ghost"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          disabled={sectionMeta.current_page >= sectionMeta.last_page}
                          onClick={() => setSectionPage((p) => p + 1)}
                          size="icon"
                          variant="ghost"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Password reset result */}
      <Dialog onOpenChange={(open) => !open && setResetResult(null)} open={!!resetResult}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mot de passe réinitialisé</DialogTitle>
            <DialogDescription>
              Nouveau mot de passe pour {resetResult?.user.name} — transmettez-le à l'utilisateur, il ne sera plus affiché.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
            <code className="flex-1 break-all font-mono text-sm">{resetResult?.password}</code>
            <Button
              onClick={() => {
                if (resetResult) {
                  navigator.clipboard.writeText(resetResult.password);
                  toast.success("Mot de passe copié");
                }
              }}
              size="sm"
              variant="outline"
            >
              Copier
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
