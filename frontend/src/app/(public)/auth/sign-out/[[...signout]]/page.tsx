import type { Metadata } from "next";

import { SignOutPageClient } from "./page.client";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "~/ui/components/page-header";
import { Shell } from "~/ui/primitives/shell";

export const metadata: Metadata = {
  description: "Sign out of your account",
  metadataBase: new URL(
    process.env.NEXT_SERVER_APP_URL || "http://localhost:3000",
  ),
  title: "Sign out",
};

export default function SignOutPage() {
  return (
    <Shell>
      <PageHeader>
        <PageHeaderHeading>Déconnexion</PageHeaderHeading>
        <PageHeaderDescription>
          Etes-vous sûr de vouloir vous déconnecter ?
        </PageHeaderDescription>
      </PageHeader>
      <SignOutPageClient />
    </Shell>
  );
}
