<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductCommentResource;
use App\Models\Product;
use App\Models\ProductComment;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProductCommentController extends Controller
{
    /**
     * List approved comments for a product
     */
    public function index(Product $product)
    {
        $comments = $product->comments()
            ->with('user')
            ->latest()
            ->paginate(20);

        return ProductCommentResource::collection($comments);
    }

    /**
     * List approved comments for a product
     */
    public function approvedComments(Product $product)
    {
        $comments = $product->approvedComments()
            ->with('user')
            ->latest()
            ->paginate(20);

        return ProductCommentResource::collection($comments);
    }

    /**
     * Store a new comment
     */
    public function store(Request $request, Product $product)
    {
        // Check if user is the product owner
        if ($product->user_id === Auth::id()) {
            return response()->json([
                'message' => 'Vous ne pouvez pas noter votre propre produit',
            ], 403);
        }

        // Check if user has already commented on this product
        $existingComment = ProductComment::where('user_id', Auth::id())
            ->where('product_id', $product->id)
            ->first();

        if ($existingComment) {
            return response()->json([
                'message' => 'Vous avez déjà laissé un avis pour ce produit',
            ], 422);
        }

        $validated = $request->validate([
            'comment' => 'required|string|max:1000',
            'rating' => 'required|numeric|min:0|max:5',
        ]);

        $validated['user_id'] = Auth::id();
        $validated['product_id'] = $product->id;
        $validated['approved'] = Setting::reviewsAutoApprove();

        $comment = ProductComment::create($validated);

        // Update product rating
        $product->updateRating();

        return new ProductCommentResource($comment->load('user'));
    }

    /**
     * Update a comment
     */
    public function update(Request $request, ProductComment $comment)
    {
        if ($comment->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $validated = $request->validate([
            'comment' => 'required|string|max:1000',
            'rating' => 'required|numeric|min:0|max:5',
        ]);

        $comment->update($validated);

        // Update product rating
        $comment->product->updateRating();

        return new ProductCommentResource($comment->load('user'));
    }

    /**
     * Delete a comment
     */
    public function destroy(ProductComment $comment)
    {
        if ($comment->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $product = $comment->product;
        $comment->delete();

        // Update product rating
        $product->updateRating();

        return response()->json([
            'message' => 'Comment deleted successfully',
        ]);
    }

    /**
     * Approve/disapprove a comment (product owner only)
     */
    public function approve(Request $request, ProductComment $comment)
    {
        $product = $comment->product;

        if ($product->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $validated = $request->validate([
            'approved' => 'required|boolean',
        ]);

        $comment->update($validated);

        return new ProductCommentResource($comment->load('user'));
    }
}
