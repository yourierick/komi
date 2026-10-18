"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CreditCard,
  Loader2,
  Lock,
  MessageSquare,
  Percent,
  Save,
  UserPlus,
} from "lucide-react";

import { adminAPI } from "~/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/ui/primitives/card";
import { Button } from "~/ui/primitives/button";
import { Checkbox } from "~/ui/primitives/checkbox";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Skeleton } from "~/ui/primitives/skeleton";
import { Switch } from "~/ui/primitives/switch";

type Settings = {
  komi_fee_percentage: number;
  max_reseller_commission_percentage: number;
  reviews_auto_approve: boolean;
  registration_enabled: boolean;
  payment_methods_enabled: string[];
};

const MANDATORY_PAYMENT_METHOD = "payment_protected_by_komi";

const PAYMENT_METHODS = [
  { value: MANDATORY_PAYMENT_METHOD, label: "Paiement protégé par Komi" },
  { value: "manual_payment_via_mobile_money", label: "Mobile Money" },
  { value: "payment_by_bank_transfer", label: "Virement bancaire" },
  { value: "payment_by_physical_deposit", label: "Dépôt physique" },
  { value: "cash_on_delivery", label: "Paiement à la livraison" },
  { value: "payment_in_store", label: "Paiement en magasin" },
];

export default function AdminSettingsPageClient() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await adminAPI.settings.get();
        if (!cancelled) {
          setSettings(response.data.data);
        }
      } catch (err) {
        console.error("Error loading settings:", err);
        toast.error("Erreur lors du chargement des paramètres");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(async (section: string, payload: Partial<Settings>) => {
    try {
      setSaving(section);
      const response = await adminAPI.settings.update(payload);
      setSettings(response.data.data);
      toast.success("Paramètres enregistrés");
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      const first = errors ? Object.values(errors).flat()[0] : null;
      toast.error(typeof first === "string" ? first : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(null);
    }
  }, []);

  const patch = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    },
    [],
  );

  const SaveButton = ({ section }: { section: string }) => (
    <Button
      className="mt-4"
      disabled={saving === section}
      type="submit"
      variant="outline"
    >
      {saving === section ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Save className="mr-2 h-4 w-4" />
      )}
      Enregistrer
    </Button>
  );

  if (loading || !settings) {
    return (
      <div className="container flex-1 space-y-6 p-4 md:p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton className="h-56 w-full" key={i} />
          ))}
        </div>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Paramètres</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Configuration globale de la plateforme
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Commissions */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save("fees", {
              komi_fee_percentage: Number(settings.komi_fee_percentage),
              max_reseller_commission_percentage: Number(
                settings.max_reseller_commission_percentage,
              ),
            });
          }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Percent className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                Commissions
              </CardTitle>
              <CardDescription>Taux prélevés sur les ventes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="komi_fee">Commission Komi (%)</Label>
                <Input
                  id="komi_fee"
                  max={100}
                  min={0}
                  onChange={(e) => patch("komi_fee_percentage", Number(e.target.value))}
                  step="0.5"
                  type="number"
                  value={settings.komi_fee_percentage}
                />
                <p className="text-xs text-muted-foreground">
                  Prélevée sur le total de chaque vente payée — snapshotée sur la facture
                  et dans les revenus.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max_reseller">Plafond commission revendeur (%)</Label>
                <Input
                  id="max_reseller"
                  max={100}
                  min={0}
                  onChange={(e) =>
                    patch("max_reseller_commission_percentage", Number(e.target.value))
                  }
                  step="0.5"
                  type="number"
                  value={settings.max_reseller_commission_percentage}
                />
                <p className="text-xs text-muted-foreground">
                  Empêche les fournisseurs de promettre plus de X % du prix aux
                  revendeurs.
                </p>
              </div>
              <SaveButton section="fees" />
            </CardContent>
          </Card>
        </form>

        {/* Paiements */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save("payments", {
              payment_methods_enabled: settings.payment_methods_enabled,
            });
          }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <CreditCard className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
                Méthodes de paiement
              </CardTitle>
              <CardDescription>
                Méthodes proposées sur les commandes reçues par les fournisseurs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {PAYMENT_METHODS.map((method) => {
                const checked = settings.payment_methods_enabled.includes(method.value);
                const mandatory = method.value === MANDATORY_PAYMENT_METHOD;
                return (
                  <label
                    className={`
                      flex items-center gap-3 rounded-lg border p-3
                      transition-colors duration-150
                      ${mandatory ? "cursor-default" : "cursor-pointer"}
                      ${checked ? "border-primary/40 bg-primary/5" : "hover-fine:bg-accent"}
                    `}
                    htmlFor={`pm-${method.value}`}
                    key={method.value}
                  >
                    <Checkbox
                      checked={mandatory || checked}
                      disabled={mandatory}
                      id={`pm-${method.value}`}
                      onCheckedChange={(value) =>
                        patch(
                          "payment_methods_enabled",
                          value === true
                            ? [...settings.payment_methods_enabled, method.value]
                            : settings.payment_methods_enabled.filter(
                                (m) => m !== method.value,
                              ),
                        )
                      }
                    />
                    <span className="flex-1 text-sm font-medium">{method.label}</span>
                    {mandatory && (
                      <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        Obligatoire
                      </span>
                    )}
                  </label>
                );
              })}
              <SaveButton section="payments" />
            </CardContent>
          </Card>
        </form>

        {/* Modération & inscriptions */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <MessageSquare className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              Modération & accès
            </CardTitle>
            <CardDescription>Avis publics et inscriptions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium" htmlFor="reviews_auto">
                  Approbation automatique des avis
                </Label>
                <p className="text-xs text-muted-foreground">
                  Désactivée, chaque avis client ou fournisseur attend la modération
                  avant publication.
                </p>
              </div>
              <Switch
                checked={settings.reviews_auto_approve}
                id="reviews_auto"
                onCheckedChange={(checked) =>
                  save("moderation", { reviews_auto_approve: checked === true })
                }
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-1.5 text-sm font-medium" htmlFor="registration">
                  <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                  Inscriptions ouvertes
                </Label>
                <p className="text-xs text-muted-foreground">
                  Fermée, la création de compte public renvoie une erreur 403.
                </p>
              </div>
              <Switch
                checked={settings.registration_enabled}
                id="registration"
                onCheckedChange={(checked) =>
                  save("moderation", { registration_enabled: checked === true })
                }
              />
            </div>
            {saving === "moderation" && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Enregistrement...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
