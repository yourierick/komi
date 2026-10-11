"use client";

import { MessageSquare, Star, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { useAuth } from "~/lib/hooks/use-auth";
import { ConfirmDialog } from "~/ui/components/confirm-dialog";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";

interface Comment {
  id: number;
  comment: string;
  rating: number;
  approved: boolean;
  created_at: string;
  user: {
    id: number;
    name: string;
  };
}

interface CommentsProps {
  itemId: string;
  itemOwnerId?: number;
  itemType: 'product' | 'rental' | 'service';
  commentAPI: {
    list: (id: string) => Promise<any>;
    create: (id: string, data: any) => Promise<any>;
    delete: (commentId: number) => Promise<any>;
  };
}

export function Comments({ itemId, itemOwnerId, itemType, commentAPI }: CommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [newComment, setNewComment] = React.useState("");
  const [newRating, setNewRating] = React.useState(5);
  const [hoveredStar, setHoveredStar] = React.useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [commentToDelete, setCommentToDelete] = React.useState<number | null>(null);

  const userHasCommented = React.useMemo(() => {
    return user ? comments.some(comment => comment.user.id === user.id) : false;
  }, [comments, user]);

  const isItemOwner = React.useMemo(() => {
    return user && itemOwnerId ? user.id === itemOwnerId : false;
  }, [user, itemOwnerId]);

  const fetchComments = React.useCallback(async () => {
    try {
      const response = await commentAPI.list(itemId);
      setComments(response.data.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  }, [itemId, commentAPI]);

  React.useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Veuillez vous connecter pour laisser un commentaire");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Veuillez entrer un commentaire");
      return;
    }

    setSubmitting(true);
    try {
      await commentAPI.create(itemId, {
        comment: newComment,
        rating: newRating,
      });
      toast.success("Commentaire ajouté avec succès");
      setNewComment("");
      setNewRating(5);
      fetchComments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de l'ajout du commentaire");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    setCommentToDelete(commentId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!commentToDelete) return;

    try {
      await commentAPI.delete(commentToDelete);
      toast.success("Commentaire supprimé");
      fetchComments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la suppression");
    } finally {
      setCommentToDelete(null);
    }
  };

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const starValue = i + 1;
          const isFilled = interactive 
            ? (hoveredStar > 0 ? starValue <= hoveredStar : starValue <= rating)
            : starValue <= rating;

          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => onRate?.(starValue)}
              onMouseEnter={() => interactive && setHoveredStar(starValue)}
              onMouseLeave={() => interactive && setHoveredStar(0)}
              className={interactive ? "cursor-pointer transition-transform duration-160 ease-out hover-fine:scale-110 active:scale-95" : ""}
            >
              <Star
                className={`h-5 w-5 ${
                  isFilled
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          );
        })}
      </div>
    );
  };

  const itemTypeLabel = itemType === 'product' ? 'produit' : itemType === 'rental' ? 'location' : 'service';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Avis et commentaires ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {user && !isItemOwner && !userHasCommented && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Votre note
                </label>
                {renderStars(newRating, true, setNewRating)}
              </div>
              <div>
                <label htmlFor="comment" className="text-sm font-medium mb-2 block">
                  Votre commentaire
                </label>
                <textarea
                  id="comment"
                  value={newComment}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
                  placeholder={`Partagez votre expérience avec ce ${itemTypeLabel}...`}
                  rows={4}
                  disabled={submitting}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Envoi..." : "Publier le commentaire"}
              </Button>
            </form>
          )}

          {!user && (
            <div className="text-center py-4 text-muted-foreground">
              Connectez-vous pour laisser un commentaire
            </div>
          )}

          {user && isItemOwner && (
            <div className="text-center py-4 text-muted-foreground">
              Vous ne pouvez pas noter votre propre {itemTypeLabel}
            </div>
          )}

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">
                Chargement des commentaires...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun commentaire pour le moment. Soyez le premier à donner votre avis !
              </div>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id} className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold">{comment.user.name}</span>
                          {renderStars(comment.rating)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {new Date(comment.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-sm">{comment.comment}</p>
                      </div>
                      {user?.id === comment.user.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(comment.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Supprimer le commentaire"
        description="Êtes-vous sûr de vouloir supprimer ce commentaire ?"
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
