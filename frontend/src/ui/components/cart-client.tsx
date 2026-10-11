"use client";

import { motion } from "framer-motion";
import { Minus, Plus, ShoppingCart, X, User } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { cn } from "~/lib/cn";
import { useCart } from "~/lib/contexts/cart-context";
import { useMediaQuery } from "~/lib/hooks/use-media-query";
import { useAuth } from "~/lib/hooks/use-auth";
import { orderAPI } from "~/lib/api";
import { useRouter } from "next/navigation";
import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";

/* -------------------------------------------------------------------------- */
/*                         Category labels (translated)                         */
/* -------------------------------------------------------------------------- */

const PRODUCT_CATEGORY_LABELS: Record<string, string> = {
  "Agriculture, Livestock, and Fishing": "Agriculture, élevage et pêche",
  "Applications and New Technologies": "Applications et nouvelles technologies",
  "Books, Media, and Games": "Livres, médias et jeux",
  "Buildings": "Bâtiments",
  "Computers and Accessories": "Ordinateurs et accessoires",
  "Construction and Real Estate": "Construction et immobilier",
  "Electrical Equipment and Supplies": "Matériel électrique et fournitures",
  "Electronics and Components": "Électronique et composants",
  "Food and Beverages": "Aliments et boissons",
  "hardware and home improvement": "Quincaillerie et amélioration de la maison",
  "Home and decor": "Maison et décoration",
  "Home Appliances": "Électroménager",
  "Jewelry, Eyewear, and Watches": "Bijoux, lunettes et montres",
  "Luggage, Bags, Cases": "Bagages, sacs et étuis",
  "Makeup": "Maquillage",
  "Medical and Health": "Médical et santé",
  "office supplies": "Fournitures de bureau",
  "Packaging and Printing": "Emballage et impression",
  "Parents, Children, and Games": "Parents, enfants et jeux",
  "Phones and Accessories": "Téléphones et accessoires",
  "Renewable Energy": "Énergie renouvelable",
  "shoes and accessories": "Chaussures et accessoires",
  "Sports and Fitness": "Sports et fitness",
  "vehicle parts and accessories": "Pièces et accessoires automobiles",
  "Vehicles and Transportation": "Véhicules et transport",
  "Wearables and Accessories": "Vêtements et accessoires",
};

const RENTAL_CATEGORY_LABELS: Record<string, string> = {
  "Agriculture": "Agriculture",
  "Electronics": "Électronique",
  "Events": "Événements",
  "Furniture": "Mobilier",
  "Leisure": "Loisirs",
  "Logistics": "Logistique",
  "Machinery": "Machines",
  "other": "Autre",
  "real estate": "Immobilier",
  "Vehicles": "Véhicules",
};

const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  "beauty": "Beauté",
  "cleaning": "Nettoyage",
  "consulting": "Consulting",
  "delivery": "Livraison",
  "education": "Éducation",
  "electrical": "Électricité",
  "electronic and repair": "Électronique et Réparation",
  "event planning": "Organisation d'événements",
  "health": "Santé",
  "home services": "Services à domicile",
  "it and technology": "IT et Technologie",
  "legal": "Juridique",
  "marketing": "Marketing",
  "other": "Autre",
  "plumbing": "Plomberie",
  "security": "Sécurité",
  "transportation": "Transport",
};

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "~/ui/primitives/drawer";
import { Separator } from "~/ui/primitives/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/ui/primitives/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/ui/primitives/dialog";

export interface CartItem {
  id: string;
  type: 'product' | 'rental' | 'service';
  name: string;
  image: string;
  price: number;
  quantity: number;
  currency?: string;
  category?: string;
  min_order?: number;
  payment_frequency?: string;
  shop_id?: number;
  reseller?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
}

interface CartProps {
  className?: string;
  mockCart?: CartItem[];
}

export function CartClient({ className, mockCart }: CartProps) {
  const { isOpen, setIsOpen, item, setItem } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cartItems, setCartItems] = React.useState<CartItem[]>(mockCart || []);
  const [isMounted, setIsMounted] = React.useState(false);
  const [contactDialogOpen, setContactDialogOpen] = React.useState(false);
  const [supplierInfo, setSupplierInfo] = React.useState<any>(null);
  const [orderDetails, setOrderDetails] = React.useState<any>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const PENDING_ORDER_KEY = 'komi_pending_order';

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Use item from context if available, otherwise use cartItems
  const displayItem = item || (cartItems.length > 0 ? cartItems[0] : null);
  const totalItems = displayItem ? displayItem.quantity : cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = displayItem ? displayItem.price * displayItem.quantity : cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    const currentItem = item || cartItems.find(i => i.id === id);
    const minOrder = currentItem?.min_order || 1;
    if (newQuantity < minOrder) return;
    if (item && item.id === id) {
      setItem({ ...item, quantity: newQuantity });
    } else {
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item,
        ),
      );
    }
  };

  const handleCreateOrderForItem = React.useCallback(async (item: CartItem) => {
    if (!item) return;

    if (!user) {
      try {
        localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(item));
      } catch (e) {
        console.error('Failed to save pending order:', e);
      }
      setIsOpen(false);
      toast.info('Veuillez vous connecter pour finaliser la commande');
      router.push('/auth/sign-in');
      return;
    }

    setItem(item);
    setIsOpen(false);

    try {
      const orderData: any = {
        quantity: item.quantity,
        unit_selling_price: item.price,
        subtotal: item.price * item.quantity,
        total_amount: item.price * item.quantity,
        currency: item.currency || 'USD',
      };

      if (item.type === 'product') {
        orderData.product_id = item.id;
        if (item.shop_id) {
          orderData.shop_id = item.shop_id;
        }
      } else if (item.type === 'rental') {
        orderData.rental_id = item.id;
      } else {
        orderData.service_id = item.id;
      }

      if (item.reseller && item.reseller.id !== user.id) {
        orderData.reseller_id = item.reseller.id;
      }

      const response = await orderAPI.create(orderData);
      const orderDataResponse = response.data.data;
      toast.success('Commande créée avec succès !');
      setItem(null);

      const supplier = orderDataResponse.product?.supplier || orderDataResponse.rental?.supplier || orderDataResponse.service?.supplier;

      if (supplier) {
        const imageUrl = orderDataResponse.product?.image || orderDataResponse.rental?.image || orderDataResponse.service?.image;
        const itemPath = item.type === 'product' ? 'products' : (item.type === 'rental' ? 'rentals' : 'services');
        const productUrl = `${window.location.origin}/${itemPath}/${item.id}`;
        const fullImageUrl = imageUrl?.startsWith('http') ? imageUrl : `${window.location.origin}${imageUrl}`;

        setSupplierInfo({
          ...supplier,
          imageUrl,
          productUrl,
          fullImageUrl,
        });
        setOrderDetails(orderDataResponse);
        setContactDialogOpen(true);
      }
    } catch (error: any) {
      console.error('Error creating order:', error);

      if (error.response?.status === 409) {
        const errorData = error.response.data;
        toast.error(errorData.message);
        setItem(null);

        if (errorData.existing_order) {
          const existingOrderData = errorData.existing_order;
          const supplier = existingOrderData.product?.supplier || existingOrderData.rental?.supplier || existingOrderData.service?.supplier;

          if (supplier && existingOrderData.status === 'under_negotiation') {
            const imageUrl = existingOrderData.product?.image || existingOrderData.rental?.image || existingOrderData.service?.image;
            const itemPath = item.type === 'product' ? 'products' : (item.type === 'rental' ? 'rentals' : 'services');
            const productUrl = `${window.location.origin}/${itemPath}/${item.id}`;
            const fullImageUrl = imageUrl?.startsWith('http') ? imageUrl : `${window.location.origin}${imageUrl}`;

            setSupplierInfo({
              ...supplier,
              imageUrl,
              productUrl,
              fullImageUrl,
            });
            setOrderDetails(existingOrderData);
            setContactDialogOpen(true);
          }
        }
      } else {
        toast.error('Erreur lors de la création de la commande');
      }
    }
  }, [user, router, PENDING_ORDER_KEY, setIsOpen, setItem, setContactDialogOpen, setSupplierInfo, setOrderDetails]);

  React.useEffect(() => {
    if (authLoading || !user) return;
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/')) return;

    const pendingRaw = localStorage.getItem(PENDING_ORDER_KEY);
    if (!pendingRaw) return;

    try {
      const pendingItem = JSON.parse(pendingRaw) as CartItem;
      localStorage.removeItem(PENDING_ORDER_KEY);
      handleCreateOrderForItem(pendingItem);
    } catch (e) {
      console.error('Failed to process pending order:', e);
      localStorage.removeItem(PENDING_ORDER_KEY);
    }
  }, [authLoading, user, handleCreateOrderForItem]);

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const contactViaWhatsApp = () => {
    if (!supplierInfo?.phone) {
      alert("Numéro de téléphone non disponible");
      return;
    }
    const itemName = orderDetails?.product?.name || orderDetails?.rental?.title;
    const itemType = displayItem?.type === 'product' ? 'produit ' : 'location ';
    const message = encodeURIComponent(
      `Bonjour ${supplierInfo.name},\n\nJe suis intéressé par votre ${itemType}${itemName}.\n\nDétails de la commande :\n- Numéro : ${orderDetails?.order_number}\n- Quantité : ${orderDetails?.quantity}\n- Prix unitaire : ${orderDetails?.unit_selling_price} ${orderDetails?.currency}\n- Sous-total : ${orderDetails?.subtotal} ${orderDetails?.currency}\n- Total : ${orderDetails?.total_amount} ${orderDetails?.currency}\n\nLien du produit : ${supplierInfo.productUrl}\n${supplierInfo.imageUrl ? `Image : ${supplierInfo.fullImageUrl}` : ''}\n\nMerci de votre réponse.`
    );
    window.open(`https://wa.me/${supplierInfo.phone}?text=${message}`, '_blank');
    setContactDialogOpen(false);
  };

  const contactViaEmail = () => {
    if (!supplierInfo?.email) {
      alert("Email non disponible");
      return;
    }
    const itemName = orderDetails?.product?.name || orderDetails?.rental?.title;
    const subject = encodeURIComponent(`Commande n°${orderDetails?.order_number} - ${itemName}`);
    const itemType = displayItem?.type === 'product' ? 'produit ' : 'location ';
    const body = encodeURIComponent(
      `Bonjour ${supplierInfo.name},\n\nJe suis intéressé par votre ${itemType}${itemName}.\n\nDétails de la commande :\n- Numéro : ${orderDetails?.order_number}\n- Quantité : ${orderDetails?.quantity}\n- Prix unitaire : ${orderDetails?.unit_selling_price} ${orderDetails?.currency}\n- Sous-total : ${orderDetails?.subtotal} ${orderDetails?.currency}\n- Total : ${orderDetails?.total_amount} ${orderDetails?.currency}\n\nLien du produit : ${supplierInfo.productUrl}\n${supplierInfo.imageUrl ? `Image : ${supplierInfo.fullImageUrl}` : ''}\n\nMerci de votre réponse.\n\nCordialement.`
    );
    window.location.href = `mailto:${supplierInfo.email}?subject=${subject}&body=${body}`;
    setContactDialogOpen(false);
  };

  const CartTrigger = (
    <Button
      aria-label="Open cart"
      className="relative h-9 w-9 rounded-full"
      size="icon"
      variant="outline"
    >
      <ShoppingCart className="h-4 w-4" />
      {totalItems > 0 && (
        <Badge
          className={`
            absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-[10px]
          `}
          variant="default"
        >
          {totalItems}
        </Badge>
      )}
    </Button>
  );

  const CartContent = (
    <>
      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <div className="text-xl font-semibold">Détails de la commande</div>
            <div className="text-sm text-muted-foreground">
              {displayItem
                ? `${displayItem.type === 'product' ? 'Produit' : 'Location'}: ${displayItem.name}`
                : "Votre panier est vide"}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {displayItem && (
            <div className="space-y-4 py-4">
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className={`
                  group relative flex rounded-lg border bg-card p-2
                  shadow-sm transition-colors
                  hover:bg-accent/50
                `}
                exit={{ opacity: 0, y: -10 }}
                initial={{ opacity: 0, y: 10 }}
                layout
                transition={{ duration: 0.15 }}
              >
                <div className="relative h-20 w-20 overflow-hidden rounded">
                  {displayItem.image ? (
                    <img
                      alt={displayItem.name}
                      className="h-full w-full object-cover"
                      src={displayItem.image}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="ml-4 flex flex-1 flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <Link
                        className={`
                          line-clamp-2 text-sm font-medium
                          group-hover:text-primary
                        `}
                        href={`/${displayItem.type}s/${displayItem.id}`}
                        onClick={() => setIsOpen(false)}
                      >
                        {displayItem.name}
                      </Link>
                    </div>
                    {displayItem.category && (
                      <p className="text-xs text-muted-foreground">
                        {displayItem.type === 'product'
                          ? PRODUCT_CATEGORY_LABELS[displayItem.category] || displayItem.category
                          : displayItem.type === 'rental'
                          ? RENTAL_CATEGORY_LABELS[displayItem.category] || displayItem.category
                          : SERVICE_CATEGORY_LABELS[displayItem.category] || displayItem.category}
                      </p>
                    )}
                  </div>
                  {displayItem.type === 'product' && (
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-md border">
                        <button
                          className={`
                            flex h-7 w-7 items-center justify-center
                            rounded-l-md border-r text-muted-foreground
                            transition-colors
                            hover:bg-muted hover:text-foreground
                          `}
                          disabled={displayItem.quantity <= (displayItem.min_order || 1)}
                          onClick={() =>
                            handleUpdateQuantity(displayItem.id, displayItem.quantity - 1)
                          }
                          type="button"
                        >
                          <Minus className="h-3 w-3" />
                          <span className="sr-only">Diminuer la quantité</span>
                        </button>
                        <span
                          className={`
                            flex h-7 w-7 items-center justify-center text-xs
                            font-medium
                          `}
                        >
                          {displayItem.quantity}
                        </span>
                        <button
                          className={`
                            flex h-7 w-7 items-center justify-center
                            rounded-r-md border-l text-muted-foreground
                            transition-colors
                            hover:bg-muted hover:text-foreground
                          `}
                          onClick={() =>
                            handleUpdateQuantity(displayItem.id, displayItem.quantity + 1)
                          }
                          type="button"
                        >
                          <Plus className="h-3 w-3" />
                          <span className="sr-only">Augmenter la quantité</span>
                        </button>
                      </div>
                      <div className="text-sm font-medium">
                        ${(displayItem.price * displayItem.quantity).toFixed(2)}
                      </div>
                    </div>
                  )}
                  {displayItem.type === 'rental' && (
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-md border">
                        <button
                          className={`
                            flex h-7 w-7 items-center justify-center
                            rounded-l-md border-r text-muted-foreground
                            transition-colors
                            hover:bg-muted hover:text-foreground
                          `}
                          disabled={displayItem.quantity <= 1}
                          onClick={() =>
                            handleUpdateQuantity(displayItem.id, displayItem.quantity - 1)
                          }
                          type="button"
                        >
                          <Minus className="h-3 w-3" />
                          <span className="sr-only">Diminuer la quantité</span>
                        </button>
                        <span
                          className={`
                            flex h-7 w-7 items-center justify-center text-xs
                            font-medium
                          `}
                        >
                          {displayItem.quantity}
                        </span>
                        <button
                          className={`
                            flex h-7 w-7 items-center justify-center
                            rounded-r-md border-l text-muted-foreground
                            transition-colors
                            hover:bg-muted hover:text-foreground
                          `}
                          onClick={() =>
                            handleUpdateQuantity(displayItem.id, displayItem.quantity + 1)
                          }
                          type="button"
                        >
                          <Plus className="h-3 w-3" />
                          <span className="sr-only">Augmenter la quantité</span>
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          ${(displayItem.price * displayItem.quantity).toFixed(2)}
                        </div>
                        {displayItem.payment_frequency && (
                          <div className="text-xs text-muted-foreground">
                            {displayItem.quantity} {displayItem.payment_frequency === 'daily' ? 'jour(s)' : displayItem.payment_frequency === 'weekly' ? 'semaine(s)' : displayItem.payment_frequency === 'monthly' ? 'mois' : displayItem.payment_frequency === 'yearly' ? 'an(s)' : displayItem.payment_frequency}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Reseller info */}
              {displayItem.reseller && (
                <motion.div
                  animate={{ opacity: 1 }}
                  className={`
                    rounded-lg border border-gray-200 bg-muted p-4
                  `}
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0 }}
                >
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Revendeur</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{displayItem.reseller.name}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {displayItem && (
          <div className="border-t px-6 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Livraison</span>
                <span className="font-medium">Calculée au paiement</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">Total</span>
                <span className="text-base font-semibold">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                En cliquant sur ce bouton, une précommande sera créée. Une conversation WhatsApp s'ouvrira ensuite avec {displayItem?.type === 'service' ? 'le prestataire' : 'le fournisseur'} pour discuter avec lui.
              </p>
              <Button className="w-full" size="lg" onClick={() => displayItem && handleCreateOrderForItem(displayItem)}>
                Discuter avec {displayItem?.type === 'service' ? 'le prestataire' : 'le fournisseur'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  if (!isMounted) {
    return (
      <div className={cn("relative", className)}>
        <Button
          aria-label="Open cart"
          className="relative h-9 w-9 rounded-full"
          size="icon"
          variant="outline"
        >
          <ShoppingCart className="h-4 w-4" />
          {totalItems > 0 && (
            <Badge
              className={`
                absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-[10px]
              `}
              variant="default"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {isDesktop ? (
        <Sheet onOpenChange={setIsOpen} open={isOpen}>
          <SheetTrigger asChild>{CartTrigger}</SheetTrigger>
          <SheetContent className="flex w-[400px] flex-col p-0">
            <SheetHeader>
              <SheetTitle>PRECOMMANDEZ ET DISCUTEZ</SheetTitle>
            </SheetHeader>
            {CartContent}
          </SheetContent>
        </Sheet>
      ) : (
        <Drawer onOpenChange={setIsOpen} open={isOpen}>
          <DrawerTrigger asChild>{CartTrigger}</DrawerTrigger>
          <DrawerContent>{CartContent}</DrawerContent>
        </Drawer>
      )}

      {/* Contact Choice Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choisir le moyen de contact</DialogTitle>
            <DialogDescription>
              Comment souhaitez-vous contacter le fournisseur "{supplierInfo?.name}" ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {supplierInfo?.phone && (
              <Button 
                onClick={contactViaWhatsApp}
                className="w-full sm:w-auto bg-green-500 hover:bg-green-600"
              >
                WhatsApp
              </Button>
            )}
            {supplierInfo?.email && (
              <Button 
                onClick={contactViaEmail}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Email
              </Button>
            )}
            <Button 
              variant="ghost" 
              onClick={() => setContactDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
