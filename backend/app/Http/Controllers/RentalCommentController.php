<?php

namespace App\Http\Controllers;

use App\Http\Resources\RentalCommentResource;
use App\Models\Rental;
use App\Models\RentalComment;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RentalCommentController extends Controller
{
    public function index(Rental $rental)
    {
        $comments = $rental->approvedComments()
            ->with('user')
            ->latest()
            ->paginate(20);

        return RentalCommentResource::collection($comments);
    }

    public function store(Request $request, Rental $rental)
    {
        if ($rental->user_id === Auth::id()) {
            return response()->json([
                'message' => 'Vous ne pouvez pas noter votre propre location',
            ], 403);
        }

        $existingComment = RentalComment::where('user_id', Auth::id())
            ->where('rental_id', $rental->id)
            ->first();

        if ($existingComment) {
            return response()->json([
                'message' => 'Vous avez déjà laissé un avis pour cette location',
            ], 422);
        }

        $validated = $request->validate([
            'comment' => 'required|string|max:1000',
            'rating' => 'required|numeric|min:0|max:5',
        ]);

        $validated['user_id'] = Auth::id();
        $validated['rental_id'] = $rental->id;
        $validated['approved'] = Setting::reviewsAutoApprove();

        $comment = RentalComment::create($validated);
        $rental->updateRating();

        return new RentalCommentResource($comment->load('user'));
    }

    public function update(Request $request, RentalComment $comment)
    {
        if ($comment->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'comment' => 'required|string|max:1000',
            'rating' => 'required|numeric|min:0|max:5',
        ]);

        $comment->update($validated);
        $comment->rental->updateRating();

        return new RentalCommentResource($comment->load('user'));
    }

    public function destroy(RentalComment $comment)
    {
        if ($comment->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $rental = $comment->rental;
        $comment->delete();
        $rental->updateRating();

        return response()->json(['message' => 'Comment deleted successfully']);
    }

    public function approve(Request $request, RentalComment $comment)
    {
        $rental = $comment->rental;

        if ($rental->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'approved' => 'required|boolean',
        ]);

        $comment->update($validated);

        return new RentalCommentResource($comment->load('user'));
    }
}
