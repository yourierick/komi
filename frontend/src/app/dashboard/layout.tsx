"use client";

import { useState } from "react";
import { Navbar } from "~/ui/components/dashboard/navbar";
import { Sidebar } from "~/ui/components/dashboard/sidebar";
import { useAuth } from "~/lib/hooks/use-auth";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh bg-gradient-to-br from-white to-slate-100 dark:from-neutral-950 dark:to-neutral-900 overflow-hidden">
      <Sidebar
        onSignOut={signOut}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar
          user={user || undefined}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onSignOut={signOut}
        />
        <main className="min-h-0 flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
