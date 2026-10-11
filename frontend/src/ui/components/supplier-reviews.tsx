"use client";

import { Star } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { supplierReviewAPI } from "~/lib/api";
import { useAuth } from "~/lib/hooks/use-auth";
import { Button } from "~/ui/primitives/button";

interface Review {
  id: number;
  user: {
    id: number;
    name: string;
    picture?: string;
  };
  rating: number;
  comment: string;
  approved: boolean;
  created_at: string;
}

interface SupplierReviewsProps {
  supplierId: number;
  supplierName: string;
}

export function SupplierReviews({ supplierId, supplierName }: SupplierReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [supplierId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await supplierReviewAPI.list(supplierId);
      setReviews(response.data.data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Vous devez être connecté pour laisser un avis");
      return;
    }

    try {
      setSubmitting(true);
      await supplierReviewAPI.create(supplierId, {
        rating,
        comment: comment.trim() || null,
      });
      
      toast.success("Votre avis a été ajouté avec succès !");
      setComment("");
      setRating(5);
      setShowForm(false);
      fetchReviews();
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error("Vous ne pouvez pas vous évaluer vous-même");
      } else if (error.response?.status === 422) {
        toast.error("Vous avez déjà évalué ce fournisseur");
      } else {
        toast.error("Erreur lors de l'ajout de votre avis");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (count: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= count
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            } ${interactive ? "cursor-pointer transition-colors hover:text-yellow-400" : ""}`}
            onClick={() => interactive && onRate && onRate(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Avis clients</h2>
        {user && user.id !== supplierId && !showForm && (
          <Button onClick={() => setShowForm(true)}>
            Laisser un avis
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Votre note
            </label>
            {renderStars(rating, true, setRating)}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Votre commentaire (optionnel)
            </label>
            <textarea
              value={comment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
              placeholder={`Partagez votre expérience avec ${supplierName}...`}
              rows={4}
              maxLength={1000}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length}/1000 caractères
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Envoi..." : "Publier l'avis"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setComment("");
                setRating(5);
              }}
            >
              Annuler
            </Button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg border bg-card p-6 transition-shadow duration-200 ease-out hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {review.user.picture ? (
                    <img
                      src={review.user.picture}
                      alt={review.user.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-lg font-semibold">
                        {review.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{review.user.name}</h4>
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>

                  {renderStars(review.rating)}

                  {review.comment && (
                    <p className="mt-3 text-muted-foreground whitespace-pre-wrap">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 rounded-lg border bg-card">
          <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun avis pour le moment</h3>
          <p className="text-muted-foreground">
            Soyez le premier à laisser un avis sur ce fournisseur
          </p>
        </div>
      )}
    </div>
  );
}
