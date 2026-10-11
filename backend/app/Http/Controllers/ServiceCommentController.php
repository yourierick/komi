<?php

namespace App\Http\Controllers;

use App\Http\Resources\ServiceCommentResource;
use App\Models\Service;
use App\Models\ServiceComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ServiceCommentController extends Controller
{
    public function index(Service $service)
    {
        $comments = $service->approvedComments()
            ->with('user')
            ->latest()
            ->paginate(20);

        return ServiceCommentResource::collection($comments);
    }

    public function store(Request $request, Service $service)
    {
        if ($service->user_id === Auth::id()) {
            return response()->json([
                'message' => 'Vous ne pouvez pas noter votre propre service',
            ], 403);
        }

        $existingComment = ServiceComment::where('user_id', Auth::id())
            ->where('service_id', $service->id)
            ->first();

        if ($existingComment) {
            return response()->json([
                'message' => 'Vous avez déjà laissé un avis pour ce service',
            ], 422);
        }

        $validated = $request->validate([
            'comment' => 'required|string|max:1000',
            'rating' => 'required|numeric|min:0|max:5',
        ]);

        $validated['user_id'] = Auth::id();
        $validated['service_id'] = $service->id;
        $validated['approved'] = true;

        $comment = ServiceComment::create($validated);
        $service->updateRating();

        return new ServiceCommentResource($comment->load('user'));
    }

    public function update(Request $request, ServiceComment $comment)
    {
        if ($comment->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'comment' => 'required|string|max:1000',
            'rating' => 'required|numeric|min:0|max:5',
        ]);

        $comment->update($validated);
        $comment->service->updateRating();

        return new ServiceCommentResource($comment->load('user'));
    }

    public function destroy(ServiceComment $comment)
    {
        if ($comment->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $service = $comment->service;
        $comment->delete();
        $service->updateRating();

        return response()->json(['message' => 'Comment deleted successfully']);
    }

    public function approve(Request $request, ServiceComment $comment)
    {
        $service = $comment->service;

        if ($service->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'approved' => 'required|boolean',
        ]);

        $comment->update($validated);

        return new ServiceCommentResource($comment->load('user'));
    }
}
