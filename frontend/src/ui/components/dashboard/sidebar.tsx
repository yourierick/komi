"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "~/lib/cn";
import {
  LayoutDashboard,
  Upload,
  BarChart3,
  CreditCard,
  User,
  Settings,
  LogOut,
  Store,
  Package,
  MapPin,
  Wrench,
  HandCoins,
} from "lucide-react";
import { Button } from "~/ui/primitives/button";

const navigation = [
  { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { name: "Magasin", href: "/dashboard/store", icon: Store },
  { name: "Produit", href: "/dashboard/products", icon: Package },
  { name: "Location", href: "/dashboard/rentals", icon: MapPin },
  { name: "Service", href: "/dashboard/services", icon: Wrench },
  { name: "Commandes", href: "/dashboard/orders", icon: CreditCard },
  { name: "Commissions", href: "/dashboard/commissions", icon: HandCoins },
  { name: "Statistiques", href: "/dashboard/stats", icon: BarChart3 },
  { name: "Profil", href: "/dashboard/profile", icon: User },
  { name: "Paramètres", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  onSignOut?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ onSignOut, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay — kept mounted so it fades both ways instead of
          snapping in while the panel slides */}
      <div
        aria-hidden={!isOpen}
        className={cn(
          "fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ease-out",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed md:relative z-50 flex h-full flex-col border-r bg-background transition-transform duration-300 ease-[var(--ease-drawer)]",
          "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-14 md:h-16 items-center border-b px-4 md:px-6">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="Komi" className="h-8 w-auto md:h-10" />
            <span className="text-lg md:text-xl font-bold">omi</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-3 md:p-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center space-x-2 md:space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3 md:p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={onSignOut}
          >
            <LogOut className="mr-2 h-4 w-4 md:h-5 md:w-5" />
            <span className="text-sm">Déconnexion</span>
          </Button>
        </div>
      </div>
    </>
  );
}
