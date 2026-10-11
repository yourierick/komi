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
    <div className="flex h-screen bg-gradient-to-br from-white to-slate-100 dark:from-neutral-950 dark:to-neutral-900 overflow-hidden">
      <Sidebar
        onSignOut={signOut}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          user={user || undefined}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
