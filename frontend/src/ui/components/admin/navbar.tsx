"use client";

import Link from "next/link";
import { LogOut, Menu, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/ui/primitives/avatar";
import { ThemeToggle } from "~/ui/components/theme-toggle";
import { Button } from "~/ui/primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/ui/primitives/dropdown-menu";

interface AdminNavbarProps {
  user?: {
    name: string;
    email: string;
    picture?: string;
  };
  onMenuToggle?: () => void;
  onSignOut?: () => void;
}

export function AdminNavbar({ user, onMenuToggle, onSignOut }: AdminNavbarProps) {
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "A";

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
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center space-x-2 rounded-lg border-l pl-2 outline-none transition-colors duration-150 hover-fine:bg-accent md:space-x-3 md:pl-4 focus-visible:ring-2 focus-visible:ring-ring"
              type="button"
            >
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">{user?.name || "Administrateur"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Avatar className="h-8 w-8 md:h-10 md:w-10">
                <AvatarImage src={user?.picture || ""} alt={user?.name} />
                <AvatarFallback className="text-xs md:text-sm">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="sm:hidden">
              <p className="font-medium">{user?.name}</p>
              <p className="text-xs font-normal text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="sm:hidden" />
            <DropdownMenuItem asChild>
              <Link href="/admin/profile">
                <User className="mr-2 h-4 w-4" />
                Mon profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
