"use client";

import { Search, Menu } from "lucide-react";
import { useState } from "react";
import { Input } from "~/ui/primitives/input";
import { Avatar, AvatarFallback, AvatarImage } from "~/ui/primitives/avatar";
import { Cart } from "~/ui/components/cart";
import { NotificationsWidget } from "~/ui/components/notifications/notifications-widget";
import { ThemeToggle } from "~/ui/components/theme-toggle";
import { Button } from "~/ui/primitives/button";

interface NavbarProps {
  user?: {
    name: string;
    email: string;
    picture?: string;
  };
  onMenuToggle?: () => void;
}

export function Navbar({ user, onMenuToggle }: NavbarProps) {
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="flex h-14 md:h-16 items-center justify-between border-b bg-background px-3 md:px-6">
      <div className="flex items-center space-x-2 md:space-x-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="relative w-full max-w-[200px] sm:max-w-[250px] md:w-64 hidden sm:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        <Cart className="hidden sm:block" />

        <NotificationsWidget />

        <ThemeToggle />

        <div className="flex items-center space-x-2 md:space-x-3 border-l pl-2 md:pl-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{user?.name || "Utilisateur"}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>

          <Avatar className="h-8 w-8 md:h-10 md:w-10">
            <AvatarImage src={user?.picture || ""} alt={user?.name} />
            <AvatarFallback className="text-xs md:text-sm">{initials}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
