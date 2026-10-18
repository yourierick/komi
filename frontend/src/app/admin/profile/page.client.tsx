"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2, Save, Upload, User } from "lucide-react";

import { authAPI } from "~/lib/api";
import { useAuth } from "~/lib/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/ui/primitives/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/ui/primitives/avatar";
import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Skeleton } from "~/ui/primitives/skeleton";

const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL ?? "";

function resolvePicture(path?: string | null) {
  if (!path) return "";
  return path.startsWith("http") ? path : `${STORAGE_URL}/storage/${path}`;
}

export default function AdminProfilePageClient() {
  const { user, loading: authLoading, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [picture, setPicture] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState(resolvePicture(user?.picture));
  const [profileErrors, setProfileErrors] = useState<Record<string, string[]>>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string[]>>({});
  const [savingPassword, setSavingPassword] = useState(false);

  const initials = (name || user?.name || "A")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPicture(file);
    setPicturePreview(URL.createObjectURL(file));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrors({});
    setSavingProfile(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("address", address);
      if (picture) formData.append("picture", picture);

      await authAPI.updateProfile(formData);
      await refreshUser?.();
      toast.success("Profil mis à jour");
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      if (errors) {
        setProfileErrors(errors);
      } else {
        toast.error("Erreur lors de la mise à jour du profil");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});

    if (newPassword !== confirmPassword) {
      setPasswordErrors({ new_password: ["Les mots de passe ne correspondent pas"] });
      return;
    }

    setSavingPassword(true);

    try {
      await authAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });
      toast.success("Mot de passe modifié");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      if (errors) {
        setPasswordErrors(errors);
      } else {
        toast.error("Erreur lors du changement de mot de passe");
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const fieldError = useCallback(
    (errors: Record<string, string[]>, field: string) =>
      errors[field]?.[0] && (
        <p className="text-xs text-destructive" role="alert">
          {errors[field][0]}
        </p>
      ),
    [],
  );

  if (authLoading || !user) {
    return (
      <div className="container flex-1 space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-72 w-full" />
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
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Mon profil</h1>
        <p className="text-sm text-muted-foreground">
          Informations du compte administrateur
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Profil */}
        <form onSubmit={handleProfileSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <User className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                Informations
              </CardTitle>
              <CardDescription>Nom, coordonnées et photo de profil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={picturePreview} alt={name} />
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <input
                    accept="image/*"
                    aria-label="Photo de profil"
                    className="hidden"
                    onChange={handlePictureChange}
                    ref={fileInputRef}
                    type="file"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                    variant="outline"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Changer la photo
                  </Button>
                  {fieldError(profileErrors, "picture")}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  onChange={(e) => setName(e.target.value)}
                  required
                  value={name}
                />
                {fieldError(profileErrors, "name")}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                  value={email}
                />
                {fieldError(profileErrors, "email")}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    value={phone}
                  />
                  {fieldError(profileErrors, "phone")}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    onChange={(e) => setAddress(e.target.value)}
                    value={address}
                  />
                  {fieldError(profileErrors, "address")}
                </div>
              </div>

              <Button disabled={savingProfile} type="submit">
                {savingProfile ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Enregistrer
              </Button>
            </CardContent>
          </Card>
        </form>

        {/* Mot de passe */}
        <form onSubmit={handlePasswordSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <KeyRound className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                Mot de passe
              </CardTitle>
              <CardDescription>
                8 caractères minimum — le mot de passe actuel est requis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="current_password">Mot de passe actuel</Label>
                <Input
                  autoComplete="current-password"
                  id="current_password"
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  type="password"
                  value={currentPassword}
                />
                {fieldError(passwordErrors, "current_password")}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new_password">Nouveau mot de passe</Label>
                <Input
                  autoComplete="new-password"
                  id="new_password"
                  minLength={8}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  type="password"
                  value={newPassword}
                />
                {fieldError(passwordErrors, "new_password")}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm_password">Confirmation</Label>
                <Input
                  autoComplete="new-password"
                  id="confirm_password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  type="password"
                  value={confirmPassword}
                />
              </div>
              <Button disabled={savingPassword} type="submit">
                {savingPassword ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="mr-2 h-4 w-4" />
                )}
                Changer le mot de passe
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
