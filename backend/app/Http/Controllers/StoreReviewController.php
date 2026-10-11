<?php

namespace App\Http\Controllers;

use App\Http\Resources\StoreReviewResource;
use App\Models\Shop;
use App\Models\StoreReview;
use App\Services\StoreReviewService;
use Illuminate\Http\Request;

class StoreReviewController extends Controller
{
    protected StoreReviewService $storeReviewService;

    public function __construct(StoreReviewService $storeReviewService)
    {
        $this->storeReviewService = $storeReviewService;
    }
    public function index(Request $request, $shopId)
    {
        $reviews = $this->storeReviewService->index($shopId, $request->user()->id);
        return StoreReviewResource::collection($reviews);
    }

    public function store(Request $request, $shopId)
    {
        $review = $this->storeReviewService->store($request, $shopId, $request->user()->id);
        return new StoreReviewResource($review->load('user'));
    }

    public function show(Request $request, $shopId, $id)
    {
        $review = $this->storeReviewService->show($shopId, $id, $request->user()->id);
        return new StoreReviewResource($review);
    }

    public function update(Request $request, $shopId, $id)
    {
        try {
            $review = $this->storeReviewService->update($request, $shopId, $id, $request->user()->id);
            return new StoreReviewResource($review->load('user'));
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
    }

    public function destroy(Request $request, $shopId, $id)
    {
        try {
            $this->storeReviewService->destroy($shopId, $id, $request->user()->id);
            return response()->json(['message' => 'Review deleted successfully']);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
    }
}
