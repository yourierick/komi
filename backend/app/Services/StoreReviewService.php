<?php

namespace App\Services;

use App\Models\Shop;
use App\Models\StoreReview;
use Illuminate\Http\Request;

class StoreReviewService
{
    public function index($shopId, $userId)
    {
        $shop = Shop::where('user_id', $userId)->findOrFail($shopId);
        return $shop->reviews()->with('user')->get();
    }

    public function store(Request $request, $shopId, $userId): StoreReview
    {
        $shop = Shop::where('user_id', $userId)->findOrFail($shopId);

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
        ]);

        $review = StoreReview::create([
            'user_id' => $userId,
            'shop_id' => $shop->id,
            'rating' => $validated['rating'],
            'comment' => $validated['comment'] ?? null,
        ]);

        return $review;
    }

    public function show($shopId, $id, $userId): StoreReview
    {
        $shop = Shop::where('user_id', $userId)->findOrFail($shopId);
        return $shop->reviews()->with('user')->findOrFail($id);
    }

    public function update(Request $request, $shopId, $id, $userId): StoreReview
    {
        $shop = Shop::findOrFail($shopId);
        $review = $shop->reviews()->findOrFail($id);

        if ($review->user_id !== $userId) {
            throw new \Illuminate\Auth\Access\AuthorizationException('Unauthorized');
        }

        $validated = $request->validate([
            'rating' => 'sometimes|integer|min:1|max:5',
            'comment' => 'nullable|string',
        ]);

        if ($request->has('rating')) {
            $review->rating = $validated['rating'];
        }

        if ($request->has('comment')) {
            $review->comment = $validated['comment'];
        }

        $review->save();

        return $review;
    }

    public function destroy($shopId, $id, $userId): void
    {
        $shop = Shop::findOrFail($shopId);
        $review = $shop->reviews()->findOrFail($id);

        if ($review->user_id !== $userId) {
            throw new \Illuminate\Auth\Access\AuthorizationException('Unauthorized');
        }

        $review->delete();
    }
}
