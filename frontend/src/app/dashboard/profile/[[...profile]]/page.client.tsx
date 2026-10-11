"use client";

import { Shield, User } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useState } from "react";

import { useAuth } from "~/lib/hooks/use-auth";
import { requireAuth, authAPI } from "~/lib/api";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/ui/primitives/tabs";

export function ProfilePageClient() {
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      requireAuth("/auth/sign-in");
    }
  }, [authLoading, user]);

  console.log(user);

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState("");
  const [secret, setSecret] = useState("");

  const [address, setAddress] = useState(user?.address || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [nationality, setNationality] = useState(user?.nationality || "");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(user?.picture || "");
  const [identityCardType, setIdentityCardType] = useState<"passport" | "id_card" | "other" | null>(user?.identity_card_type || null);
  const [identityCard, setIdentityCard] = useState<File | null>(null);
  const [identityCardPreview, setIdentityCardPreview] = useState(user?.identity_card || "");
  const [idCardNumber, setIdCardNumber] = useState(user?.id_card_number || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      </div>
    );
  }

  const handleEnableTwoFactor = () => {
    if (!password) {
      setError("Password is required");
      return;
    }

    setError("");
    setLoading(true);

    // twoFactor
    //   .enable({
    //     password,
    //   })
    //   .then((result) => {
    //     if ("data" in result && result.data) {
    //       const uri = result.data.totpURI;
    //       setQrCodeData(uri);

    //       if (typeof uri === "string" && uri.includes("secret=")) {
    //         const secretMatch = uri.split("secret=")[1];
    //         if (secretMatch) {
    //           const extractedSecret = secretMatch.split("&")[0];
    //           if (extractedSecret) {
    //             setSecret(extractedSecret);
    //           }
    //         }
    //       }

    //       setShowQrCode(true);
    //       setMessage("Scan the QR code with your authenticator app");
    //     } else {
    //       setError(
    //         "Failed to enable two-factor authentication. Unexpected response format.",
    //       );
    //     }
    //   })
    //   .catch((err: unknown) => {
    //     setError(
    //       "Failed to enable two-factor authentication. Please try again.",
    //     );
    //     console.error(err);
    //   })
    //   .finally(() => {
    //     setLoading(false);
    //   });
  };

  const handleDisableTwoFactor = () => {
    if (!password) {
      setError("Password is required");
      return;
    }

    setError("");
    setLoading(true);

    // twoFactor
    //   .disable({
    //     password,
    //   })
    //   .then(() => {
    //     setMessage("Two-factor authentication has been disabled");
    //     setShowQrCode(false);
    //   })
    //   .catch((err: unknown) => {
    //     setError(
    //       "Failed to disable two-factor authentication. Please try again.",
    //     );
    //     console.error(err);
    //   })
    //   .finally(() => {
    //     setLoading(false);
    //   });
  };

  const handlePasswordChange = () => {
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError("Le mot de passe actuel est requis");
      return;
    }

    if (!newPassword) {
      setPasswordError("Le nouveau mot de passe est requis");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError("Le mot de passe doit contenir au moins une majuscule");
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      setPasswordError("Le mot de passe doit contenir au moins une minuscule");
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setPasswordError("Le mot de passe doit contenir au moins un chiffre");
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setPasswordError("Le mot de passe doit contenir au moins un caractère spécial");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    // API call to change password would go here
    // .then(() => {
    //   setMessage("Mot de passe modifié avec succès");
    //   setCurrentPassword("");
    //   setNewPassword("");
    //   setConfirmPassword("");
    // })
    // .catch((err: unknown) => {
    //   setPasswordError("Échec de la modification du mot de passe");
    //   console.error(err);
    // })
    // .finally(() => {
    //   setLoading(false);
    // });
  };

  const handleProfileUpdate = async () => {
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", user?.name || "");
      formData.append("email", user?.email || "");
      formData.append("address", address);
      formData.append("phone", phone);
      formData.append("nationality", nationality);

      if (profilePicture) {
        formData.append("picture", profilePicture);
      }

      if (identityCardType) {
        formData.append("identity_card_type", identityCardType);
      }
      formData.append("id_card_number", idCardNumber);

      if (identityCard) {
        formData.append("identity_card", identityCard);
      }

      await authAPI.updateProfile(formData);
      setMessage("Profil mis à jour avec succès");
      setProfilePicture(null);
      setIdentityCard(null);
    } catch (err: unknown) {
      setError("Échec de la mise à jour du profil");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`
        container space-y-6 p-4
        md:p-8
      `}
    >
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
        <p className="text-muted-foreground">
          Gérer votre profile et les paramètres de sécurité.
        </p>
      </div>

      <Tabs className="space-y-4" defaultValue="general">
        <TabsList>
          <TabsTrigger className="flex items-center gap-2" value="general">
            <User className="h-4 w-4" />
            Général
          </TabsTrigger>
          <TabsTrigger className="flex items-center gap-2" value="security">
            <Shield className="h-4 w-4" />
            Sécurité
          </TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="general">
          {message && (
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
              {message}
            </div>
          )}

          {error && (
            <div
              className={`
                rounded-md bg-destructive/10 p-4 text-sm text-destructive
              `}
            >
              {error}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Photo de profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {profilePicturePreview && (
                  <img
                    alt="Photo de profile"
                    className="h-24 w-24 rounded-full object-cover"
                    src={profilePicturePreview}
                  />
                )}
                <div className="grid gap-2">
                  <Label htmlFor="profilePicture">Changer la photo</Label>
                  <Input
                    accept="image/*"
                    id="profilePicture"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setProfilePicture(file);
                        setProfilePicturePreview(URL.createObjectURL(file));
                      }
                    }}
                    type="file"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informations du profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom</Label>
                <Input
                  defaultValue={user?.name || ""}
                  id="name"
                  placeholder="Entrez votre nom"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  defaultValue={user?.email || ""}
                  id="email"
                  placeholder="Entrez votre email"
                  type="email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Entrez votre adresse"
                  value={address}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Entrez votre numéro de téléphone"
                  type="tel"
                  value={phone}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nationality">Nationalité</Label>
                <Input
                  id="nationality"
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="Entrez votre nationalité"
                  value={nationality}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Carte d'identité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="identityCardType">Type de carte d'identité</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  id="identityCardType"
                  onChange={(e) => setIdentityCardType(e.target.value as "passport" | "id_card" | "other" | null)}
                  value={identityCardType || ""}
                >
                  <option value="">Sélectionnez un type</option>
                  <option value="passport">Passeport</option>
                  <option value="id_card">Carte d'identité</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="idCardNumber">Numéro de carte d'identité</Label>
                <Input
                  id="idCardNumber"
                  onChange={(e) => setIdCardNumber(e.target.value)}
                  placeholder="Entrez le numéro de votre carte d'identité"
                  value={idCardNumber}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="identityCard">Carte d'identité (document)</Label>
                {identityCardPreview && (
                  <div className="mt-2">
                    {identityCardPreview.endsWith('.pdf') ? (
                      <a
                        href={identityCardPreview}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Voir le document PDF
                      </a>
                    ) : (
                      <img
                        alt="Carte d'identité"
                        className="h-32 w-auto rounded-md object-cover"
                        src={identityCardPreview}
                      />
                    )}
                  </div>
                )}
                <Input
                  accept="image/*,.pdf"
                  id="identityCard"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setIdentityCard(file);
                      setIdentityCardPreview(URL.createObjectURL(file));
                    }
                  }}
                  type="file"
                />
              </div>
            </CardContent>
          </Card>

          <Button disabled={loading} onClick={handleProfileUpdate} className="w-full">
            {loading ? "Traitement..." : "Enregistrer tout le profil"}
          </Button>
        </TabsContent>

        <TabsContent className="space-y-4" value="security">
          {error && (
            <div
              className={`
                rounded-md bg-destructive/10 p-4 text-sm text-destructive
              `}
            >
              {error}
            </div>
          )}

          {passwordError && (
            <div
              className={`
                rounded-md bg-destructive/10 p-4 text-sm text-destructive
              `}
            >
              {passwordError}
            </div>
          )}

          {message && (
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
              {message}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Changer le mot de passe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <Input
                  id="currentPassword"
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe actuel"
                  type="password"
                  value={currentPassword}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Entrez votre nouveau mot de passe"
                  type="password"
                  value={newPassword}
                />
                <p className="text-xs text-muted-foreground">
                  Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmez votre nouveau mot de passe"
                  type="password"
                  value={confirmPassword}
                />
              </div>
              <Button disabled={loading} onClick={handlePasswordChange}>
                {loading ? "Traitement..." : "Changer le mot de passe"}
              </Button>
            </CardContent>
          </Card>

          {showQrCode && qrCodeData && (
            <Card>
              <CardHeader>
                <CardTitle>Scanner le QR Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center">
                  <img
                    alt="QR Code pour l'authentification à deux facteurs"
                    className="h-48 w-48"
                    src={qrCodeData}
                  />
                  <p className="mt-4 text-center text-sm text-muted-foreground">
                    Scannez ce QR code avec votre application d'authentification (Google
                    Authenticator, Authy, etc.)
                  </p>
                  {secret && (
                    <div className="mt-6 w-full">
                      <p className="text-sm font-medium">Code d'entrée manuel:</p>
                      <p
                        className={`
                          mt-2 rounded-md bg-muted p-4 font-mono text-sm
                          break-all
                        `}
                      >
                        {secret}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Authentification à deux facteurs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="password">Votre mot de passe</Label>
                <Input
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  type="password"
                  value={password}
                />
                <p className="text-sm text-muted-foreground">
                  Requis pour modifier vos paramètres d'authentification à deux facteurs
                </p>
              </div>

              <div className="flex space-x-4">
                <Button disabled={loading} onClick={handleEnableTwoFactor}>
                  {loading ? "Traitement..." : "Activer l'authentification à deux facteurs"}
                </Button>

                <Button
                  disabled={loading}
                  onClick={handleDisableTwoFactor}
                  variant="destructive"
                >
                  {loading ? "Traitement..." : "Désactiver l'authentification à deux facteurs"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Codes de sauvegarde</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/auth/mfa">Gérer les codes de sauvegarde</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
