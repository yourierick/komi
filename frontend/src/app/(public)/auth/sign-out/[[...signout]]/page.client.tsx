"use client";

import { useRouter } from "next/navigation";

import { cn } from "~/lib/cn";
import { useMounted } from "~/lib/hooks/use-mounted";
import { useAuth } from "~/lib/hooks/use-auth";
import { Button, buttonVariants } from "~/ui/primitives/button";
import { Skeleton } from "~/ui/primitives/skeleton";

export function SignOutPageClient() {
  const router = useRouter();
  const mounted = useMounted();
  const { signOut } = useAuth();

  const handlePageBack = async () => {
    router.back();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div
      className={`
        flex w-auto flex-col-reverse justify-center gap-2
        sm:flex-row
      `}
    >
      <Button onClick={handlePageBack} size="default" variant="outline">
        Retour
        <span className="sr-only">Previous page</span>
      </Button>
      {mounted ? (
        <Button onClick={handleSignOut} size="default" variant="secondary">
          Déconnexion
          <span className="sr-only">
            Cette action va vous déconnecter de votre compte.
          </span>
        </Button>
      ) : (
        <Skeleton
          className={cn(
            buttonVariants({ size: "default", variant: "secondary" }),
            "bg-muted text-muted-foreground",
          )}
        >
          Déconnexion
        </Skeleton>
      )}
    </div>
  );
}
