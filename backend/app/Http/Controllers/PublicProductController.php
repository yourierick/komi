<?php

namespace App\Http\Controllers;

use App\Http\Resources\PublicProductResource;
use App\Models\Product;
use Illuminate\Http\Request;

class PublicProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query();

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('supplier')) {
            $query->where('user_id', $request->supplier);
        }

        $products = $query->with('shop')->withCount('approvedComments')->get();

        return PublicProductResource::collection($products);
    }

    public function show($id)
    {
        $product = Product::with('shop')->withCount('approvedComments')->find($id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        return new PublicProductResource($product);
    }

    public function categories()
    {
        $categories = Product::selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->category,
                    'count' => $item->count,
                ];
            });

        return response()->json(['data' => $categories]);
    }

    public function featured()
    {
        $latestProducts = Product::with('shop')
            ->withCount('approvedComments')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        $highestRatedProducts = Product::with('shop')
            ->withCount('approvedComments')
            ->orderBy('rating', 'desc')
            ->take(5)
            ->get();

        // Merge and remove duplicates, keeping only 3 unique products
        $featured = $latestProducts->concat($highestRatedProducts)
            ->unique('id')
            ->take(5);

        return PublicProductResource::collection($featured);
    }
}
