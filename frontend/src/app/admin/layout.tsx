"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { authAPI } from "~/lib/api";
import { useAuth } from "~/lib/hooks/use-auth";
import { AdminNavbar } from "~/ui/components/admin/navbar";
import { AdminSidebar } from "~/ui/components/admin/sidebar";
import { Skeleton } from "~/ui/primitives/skeleton";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (loading || isLoginPage) return;

    if (!user) {
      router.replace("/admin/login");
    } else if (!user.is_admin) {
      router.replace("/");
    }
  }, [loading, user, isLoginPage, router]);

  const handleSignOut = async () => {
    try {
      await authAPI.logout();
    } finally {
      window.location.href = "/admin/login";
    }
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  // le squelette reprend la forme du shell (sidebar + navbar + contenu) pour
  // que la résolution du guard ne produise pas de saut de layout
  if (loading || !user?.is_admin) {
    return (
      <div className="flex h-dvh overflow-hidden bg-background">
        <div className="hidden w-64 flex-col border-r p-4 md:flex">
          <Skeleton className="mb-6 h-10 w-32" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton className="h-9 w-full" key={i} />
            ))}
          </div>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex h-14 items-center justify-between border-b px-4 md:h-16 md:px-6">
            <Skeleton className="h-4 w-32" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
          <div className="flex-1 space-y-6 p-4 md:p-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-72" />
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton className="h-28 w-full rounded-xl" key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh bg-gradient-to-br from-white to-slate-100 dark:from-neutral-950 dark:to-neutral-900 overflow-hidden">
      <AdminSidebar
        onSignOut={handleSignOut}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminNavbar
          user={user}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onSignOut={handleSignOut}
        />
        <main className="min-h-0 flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
