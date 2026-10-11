<?php

namespace App\Http\Controllers;

use App\Http\Resources\SupplierReviewResource;
use App\Models\SupplierReview;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SupplierReviewController extends Controller
{
    public function index($supplierId)
    {
        $reviews = SupplierReview::where('supplier_id', $supplierId)
            ->where('approved', true)
            ->with('user')
            ->latest()
            ->get();

        return SupplierReviewResource::collection($reviews);
    }

    public function store(Request $request, $supplierId)
    {
        $supplier = User::findOrFail($supplierId);

        // Check if user is trying to review themselves
        if ($supplier->id === Auth::id()) {
            return response()->json([
                'message' => 'Vous ne pouvez pas vous évaluer vous-même',
            ], 403);
        }

        // Check if user has already reviewed this supplier
        $existingReview = SupplierReview::where('user_id', Auth::id())
            ->where('supplier_id', $supplierId)
            ->first();

        if ($existingReview) {
            return response()->json([
                'message' => 'Vous avez déjà évalué ce fournisseur',
            ], 422);
        }

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $review = SupplierReview::create([
            'user_id' => Auth::id(),
            'supplier_id' => $supplierId,
            'rating' => $validated['rating'],
            'comment' => $validated['comment'] ?? null,
            'approved' => true,
        ]);

        return new SupplierReviewResource($review->load('user'));
    }

    public function update(Request $request, $reviewId)
    {
        $review = SupplierReview::findOrFail($reviewId);

        if ($review->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $review->update($validated);

        return new SupplierReviewResource($review->load('user'));
    }

    public function destroy($reviewId)
    {
        $review = SupplierReview::findOrFail($reviewId);

        if ($review->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $review->delete();

        return response()->json(['message' => 'Review deleted successfully']);
    }

    public function approve($reviewId)
    {
        $review = SupplierReview::findOrFail($reviewId);

        // Only the supplier can approve/disapprove reviews
        if ($review->supplier_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = request()->validate([
            'approved' => 'required|boolean',
        ]);

        $review->update(['approved' => $validated['approved']]);

        return new SupplierReviewResource($review->load('user'));
    }
}
