import { Share2, MessageCircle, Mail, Globe } from "lucide-react";
import Link from "next/link";

import { SEO_CONFIG } from "~/app";
import { cn } from "~/lib/cn";
import { Button } from "~/ui/primitives/button";

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("border-t bg-background", className)}>
      <div
        className={`
          container mx-auto max-w-7xl px-4 py-12
          sm:px-6
          lg:px-8
        `}
      >
        <div
          className={`
            grid grid-cols-1 gap-8
            md:grid-cols-4
          `}
        >
          <div className="space-y-4">
            <Link className="flex items-center gap-2" href="/">
              <span
                className={`
                  bg-gradient-to-r from-primary to-primary/70 bg-clip-text
                  text-xl font-bold tracking-tight text-transparent
                `}
              >
                {SEO_CONFIG.name}
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Votre point de rassemblement pour tout ce qui concerne la technologie. Des produits premium à des prix compétitifs.
            </p>
            <div className="flex space-x-4">
              <Button
                className="h-8 w-8 rounded-full"
                size="icon"
                variant="ghost"
              >
                <Share2 className="h-4 w-4" />
                <span className="sr-only">Partager</span>
              </Button>
              <Button
                className="h-8 w-8 rounded-full"
                size="icon"
                variant="ghost"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="sr-only">Conversations</span>
              </Button>
              <Button
                className="h-8 w-8 rounded-full"
                size="icon"
                variant="ghost"
              >
                <Mail className="h-4 w-4" />
                <span className="sr-only">Email</span>
              </Button>
              <Button
                className="h-8 w-8 rounded-full"
                size="icon"
                variant="ghost"
              >
                <Globe className="h-4 w-4" />
                <span className="sr-only">Site web</span>
              </Button>
              <Button
                className="h-8 w-8 rounded-full"
                size="icon"
                variant="ghost"
              >
                <Share2 className="h-4 w-4" />
                <span className="sr-only">Partager</span>
              </Button>
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold">Magasin</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/products"
                >
                  Tous les produits
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/products?category=audio"
                >
                  Audio
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/products?category=wearables"
                >
                  Accessoires
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/products?category=smartphones"
                >
                  Smartphones
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/products?category=laptops"
                >
                  Ordinateurs
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/about"
                >
                  À propos
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/careers"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/blog"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/press"
                >
                  Presse
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/contact"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/help"
                >
                  Centre d'aide
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/shipping"
                >
                  Livraison & Retours
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/warranty"
                >
                  Garantie
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/privacy"
                >
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link
                  className={`
                    text-muted-foreground
                    hover:text-foreground
                  `}
                  href="/terms"
                >
                  Conditions d'utilisation
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t pt-8">
          <div
            className={`
              flex flex-col items-center justify-between gap-4
              md:flex-row
            `}
          >
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} {SEO_CONFIG.name}. All rights
              reserved.
            </p>
            <div
              className={
                "flex items-center gap-4 text-sm text-muted-foreground"
              }
            >
              <Link className="hover:text-foreground" href="/privacy">
                Confidentialité
              </Link>
              <Link className="hover:text-foreground" href="/terms">
                Conditions
              </Link>
              <Link className="hover:text-foreground" href="/cookies">
                Cookies
              </Link>
              <Link className="hover:text-foreground" href="/sitemap">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
