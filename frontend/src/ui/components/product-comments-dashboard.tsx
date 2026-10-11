"use client";

import { Check, MessageSquare, Star, Trash2, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { productCommentAPI } from "~/lib/api";
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

interface ProductCommentsDashboardProps {
  productId: string;
}

export function ProductCommentsDashboard({ productId }: ProductCommentsDashboardProps) {
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<'all' | 'approved' | 'pending'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [commentToDelete, setCommentToDelete] = React.useState<number | null>(null);

  const fetchComments = React.useCallback(async () => {
    try {
      const response = await productCommentAPI.list(productId);
      setComments(response.data.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  React.useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleApprove = async (commentId: number, approved: boolean) => {
    try {
      await productCommentAPI.approve(commentId, approved);
      toast.success(approved ? "Commentaire approuvé" : "Commentaire désapprouvé");
      fetchComments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la modification");
    }
  };

  const handleDelete = async (commentId: number) => {
    setCommentToDelete(commentId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!commentToDelete) return;

    try {
      await productCommentAPI.delete(commentToDelete);
      toast.success("Commentaire supprimé");
      fetchComments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la suppression");
    } finally {
      setCommentToDelete(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const starValue = i + 1;
          const isFilled = starValue <= rating;

          return (
            <Star
              key={i}
              className={`h-4 w-4 ${
                isFilled
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          );
        })}
      </div>
    );
  };

  const filteredComments = React.useMemo(() => {
    if (filter === 'all') return comments;
    if (filter === 'approved') return comments.filter(c => c.approved);
    return comments.filter(c => !c.approved);
  }, [comments, filter]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Commentaires et avis ({comments.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Tous
              </Button>
              <Button
                variant={filter === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('approved')}
              >
                Approuvés
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
              >
                Désapprouvés
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">
              Chargement des commentaires...
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {filter === 'all' 
                ? "Aucun commentaire pour ce produit"
                : filter === 'approved'
                ? "Aucun commentaire approuvé"
                : "Aucun commentaire en désapprouvé"}
            </div>
          ) : (
            filteredComments.map((comment) => (
              <Card key={comment.id} className={comment.approved ? "bg-muted/50" : "bg-yellow-50 dark:bg-yellow-950/20"}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{comment.user.name}</span>
                        {renderStars(comment.rating)}
                        {!comment.approved && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                            Désapprouvés
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-sm">{comment.comment}</p>
                    </div>
                    <div className="flex gap-2">
                      {comment.approved ? (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleApprove(comment.id, false)}
                          title="Désapprouver"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleApprove(comment.id, true)}
                          title="Approuver"
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(comment.id)}
                        className="text-destructive hover:text-destructive"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
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
