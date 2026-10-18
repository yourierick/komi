"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

import { adminAPI, initSanctum } from "~/lib/api";
import { useAuth } from "~/lib/hooks/use-auth";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";

export default function AdminLoginPageClient() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.is_admin) {
      router.replace("/admin");
    }
  }, [authLoading, user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await initSanctum();
      await adminAPI.login({ email, password });
      await refreshUser();
      router.replace("/admin");
    } catch (err: any) {
      console.error("Admin login error:", err);

      if (err.isNetworkError) {
        setError(err.message);
      } else if (err.response?.status === 401) {
        setError("Email ou mot de passe incorrect");
      } else if (err.response?.status === 403) {
        setError("Accès réservé aux administrateurs");
      } else {
        setError("Une erreur inattendue est survenue. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      {/* Full-screen background image */}
      <Image
        alt="Background image"
        className="object-cover"
        fill
        priority
        sizes="100vw"
        src="https://images.unsplash.com/photo-1719811059181-09032aef07b8?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70 backdrop-blur-[2px]" />

      {/* Centered login form */}
      <div
        className={`
          relative z-10 w-full max-w-md space-y-5 duration-500 ease-out
          animate-in fade-in
          motion-safe:slide-in-from-bottom-4
        `}
      >
        <div className="space-y-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <img src="/logo.png" alt="Komi" className="h-14 w-auto drop-shadow-lg" />
            <ShieldCheck className="h-7 w-7 text-white drop-shadow" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow">
            Administration
          </h2>
          <p className="text-sm text-white/80">
            Connectez-vous pour accéder au panneau d'administration
          </p>
        </div>

        <Card className="border-none shadow-2xl">
          <CardContent className="pt-6">
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@komi.com"
                  required
                  type="email"
                  value={email}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </div>

              {error && (
                <div
                  className={`
                    rounded-md bg-destructive/10 p-3 text-sm font-medium
                    text-destructive duration-200 ease-out
                    animate-in fade-in
                    motion-safe:slide-in-from-top-1
                  `}
                  role="alert"
                >
                  {error}
                </div>
              )}

              <Button className="w-full" disabled={loading} type="submit">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  "Connexion"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
