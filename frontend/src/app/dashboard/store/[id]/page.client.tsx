"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "~/lib/hooks/use-auth";
import { shopAPI, storeReviewAPI } from "~/lib/api";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Skeleton } from "~/ui/primitives/skeleton";
import { ArrowLeft, MapPin, Phone, Mail, Building2, Star, CheckCircle, Loader2, Package as PackageIcon } from "lucide-react";

type Shop = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  rccm?: string;
  status: "active" | "inactive" | "suspended";
  verified: boolean;
  rating: number;
  total_reviews: number;
  social_links?: Record<string, string>;
  business_hours?: Record<string, string>;
  created_at: string;
  updated_at: string;
};

type Review = {
  id: number;
  rating: number;
  comment?: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  shop: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
};

type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  currency: string;
  images?: string[];
  status: "available" | "unavailable";
  created_at: string;
};

export default function ShopDetailPageClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const shopId = params.id;

  const [shop, setShop] = useState<Shop | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showProducts, setShowProducts] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");


  const [formData, setFormData] = useState({
    name: "",
    description: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    rccm: "",
    status: "active" as "active" | "inactive" | "suspended",
    logo: null as File | null,
    banner: null as File | null,
  });

  const [logoPreview, setLogoPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/sign-in");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user && shopId) {
      loadShop();
      loadReviews();
    }
  }, [user, shopId]);

  const loadShop = async () => {
    try {
      setLoading(true);
      const response = await shopAPI.get(shopId as string);
      const shopData: Shop = response.data.data;
      setShop(shopData);
      setFormData({
        name: shopData.name,
        description: shopData.description || "",
        email: shopData.email || "",
        phone: shopData.phone || "",
        address: shopData.address || "",
        city: shopData.city || "",
        country: shopData.country || "",
        rccm: shopData.rccm || "",
        status: shopData.status,
        logo: null,
        banner: null,
      });
      setLogoPreview(shopData.logo || "");
      setBannerPreview(shopData.banner || "");
    } catch (err) {
      setError("Erreur lors du chargement du magasin");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await storeReviewAPI.list(shopId as string);
      setReviews(response.data.data);
    } catch (err) {
      console.error("Erreur lors du chargement des avis", err);
    }
  };

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await shopAPI.products(shopId as string);
      setProducts(response.data.data);
    } catch (err) {
      console.error("Erreur lors du chargement des produits", err);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleShowProducts = () => {
    if (!showProducts) {
      loadProducts();
    }
    setShowProducts(!showProducts);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setMessage("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("description", formData.description);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("address", formData.address);
      data.append("city", formData.city);
      data.append("country", formData.country);
      data.append("rccm", formData.rccm);
      data.append("status", formData.status);

      if (formData.logo) {
        data.append("logo", formData.logo);
      }

      if (formData.banner) {
        data.append("banner", formData.banner);
      }

      await shopAPI.update(shopId as string, data);
      setMessage("Magasin mis à jour avec succès");
      await loadShop();
      setIsEditing(false);
    } catch (err: any) {
      setError("Erreur lors de la mise à jour du magasin");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, logo: file });
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, banner: file });
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-24" />
            <div className="space-y-2">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>

        <Skeleton className="h-48 w-full rounded-lg" />

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-20 w-20 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
              <div className="flex items-center gap-4 border-t pt-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="border-t pt-4">
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 2 }, (_, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-4">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-28" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Magasin non trouvé</h1>
          <Button onClick={() => router.push("/dashboard/store")} className="mt-4">
            Retour aux magasins
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/dashboard/store")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{shop.name}</h1>
            <p className="text-muted-foreground">{shop.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/store/products")}>
            <PackageIcon className="mr-2 h-4 w-4" />
            Voir les produits
          </Button>
          <Button onClick={handleEdit}>
            Modifier
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-md bg-green-100 p-4 text-sm text-green-800">
          {message}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nom du magasin *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Entrez le nom de votre magasin"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Décrivez votre magasin..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="logo">Logo</Label>
                  {logoPreview && (
                    <div className="mt-2">
                      <img
                        alt="Logo"
                        className="h-20 w-20 rounded-md object-cover"
                        src={logoPreview}
                      />
                    </div>
                  )}
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="banner">Bannière</Label>
                  {bannerPreview && (
                    <div className="mt-2">
                      <img
                        alt="Bannière"
                        className="h-32 w-full rounded-md object-cover"
                        src={bannerPreview}
                      />
                    </div>
                  )}
                  <Input
                    id="banner"
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@magasin.com"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Rue Principale"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Paris"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="country">Pays</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="France"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Informations légales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="rccm">RCCM</Label>
                  <Input
                    id="rccm"
                    value={formData.rccm}
                    onChange={(e) => setFormData({ ...formData, rccm: e.target.value })}
                    placeholder="RCCM123456"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status">Statut</Label>
                  <select
                    id="status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" | "suspended" })}
                  >
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="suspended">Suspendu</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="outline" onClick={handleCancelEdit}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                "Mettre à jour"
              )}
            </Button>
          </div>
        </form>
      ) : (
        <>
          {shop.banner && (
        <div className="rounded-lg overflow-hidden">
          <img
            alt="Bannière"
            className="w-full h-48 object-cover"
            src={shop.banner}
          />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              {shop.logo && (
                <img
                  alt="Logo"
                  className="h-20 w-20 rounded-md object-cover"
                  src={shop.logo}
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{shop.name}</h3>
                {shop.description && (
                  <p className="text-muted-foreground mt-2">{shop.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{shop.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">({shop.total_reviews} avis)</span>
              </div>
              {shop.verified && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Vérifié</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-4 border-t">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  shop.status === "active"
                    ? "bg-green-100 text-green-800"
                    : shop.status === "inactive"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {shop.status === "active"
                  ? "Actif"
                  : shop.status === "inactive"
                  ? "Inactif"
                  : "Suspendu"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {shop.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <a
                  href={`mailto:${shop.email}`}
                  className="text-sm hover:underline"
                >
                  {shop.email}
                </a>
              </div>
            )}
            {shop.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <a
                  href={`tel:${shop.phone}`}
                  className="text-sm hover:underline"
                >
                  {shop.phone}
                </a>
              </div>
            )}
            {shop.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <p>{shop.address}</p>
                  {shop.city && <p>{shop.city}</p>}
                  {shop.country && <p>{shop.country}</p>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Informations légales</CardTitle>
          </CardHeader>
          <CardContent>
            {shop.rccm && (
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">RCCM</p>
                  <p className="text-sm text-muted-foreground">{shop.rccm}</p>
                </div>
              </div>
            )}
            {!shop.rccm && (
              <p className="text-sm text-muted-foreground">Aucune information légale disponible</p>
            )}
          </CardContent>
        </Card>

        {shop.business_hours && (
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Horaires d'ouverture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                {Object.entries(shop.business_hours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between text-sm">
                    <span className="capitalize font-medium">{day}</span>
                    <span className="text-muted-foreground">{hours}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {shop.social_links && Object.keys(shop.social_links).length > 0 && (
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Réseaux sociaux</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {Object.entries(shop.social_links).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline capitalize"
                  >
                    {platform}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Avis clients</CardTitle>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun avis pour le moment</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-medium">{review.user.name}</span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </>
      )}
    </div>
  );
}

export { ShopDetailPageClient };
