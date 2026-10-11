<?php

namespace App\Http\Controllers;

use App\Http\Resources\ResellerLinkResource;
use App\Models\Product;
use App\Models\ResellerLink;
use App\Models\Rental;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class ResellerLinkController extends Controller
{
    public function createOrGetProductLink(Request $request, $productId)
    {
        $user = Auth::user();
        
        $product = Product::find($productId);
        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        // Check if product has commission enabled
        if ($product->commission_type === 'none' || !$product->commission_value || $product->commission_value <= 0) {
            return response()->json(['message' => 'Product does not have commission enabled'], 400);
        }

        // Check if user already has a link for this product
        $existingLink = ResellerLink::where('user_id', $user->id)
            ->where('product_id', $productId)
            ->first();

        if ($existingLink) {
            return response()->json([
                'data' => new ResellerLinkResource($existingLink)
            ], 200);
        }

        // Create new link
        $code = strtoupper(Str::random(8));
        
        $link = ResellerLink::create([
            'user_id' => $user->id,
            'product_id' => $productId,
            'rental_id' => null,
            'code' => $code,
        ]);

        return response()->json([
            'data' => new ResellerLinkResource($link)
        ], 200);
    }

    public function createOrGetRentalLink(Request $request, $rentalId)
    {
        $user = Auth::user();
        
        $rental = Rental::find($rentalId);
        if (!$rental) {
            return response()->json(['message' => 'Rental not found'], 404);
        }

        // Check if rental has commission enabled
        if ($rental->commission_type === 'none' || !$rental->commission_value || $rental->commission_value <= 0) {
            return response()->json(['message' => 'Rental does not have commission enabled'], 400);
        }

        // Check if user already has a link for this rental
        $existingLink = ResellerLink::where('user_id', $user->id)
            ->where('rental_id', $rentalId)
            ->first();

        if ($existingLink) {
            return response()->json([
                'data' => new ResellerLinkResource($existingLink)
            ], 200);
        }

        // Create new link
        $code = strtoupper(Str::random(8));
        
        $link = ResellerLink::create([
            'user_id' => $user->id,
            'product_id' => null,
            'rental_id' => $rentalId,
            'code' => $code,
        ]);

        return response()->json([
            'data' => new ResellerLinkResource($link)
        ], 200);
    }

    public function getResellerByCode(Request $request, $code)
    {
        $link = ResellerLink::where('code', $code)->first();

        if (!$link) {
            return response()->json(['message' => 'Reseller link not found'], 404);
        }

        $reseller = $link->user;

        return response()->json([
            'data' => [
                'id' => $reseller->id,
                'name' => $reseller->name,
                'email' => $reseller->email,
            ]
        ], 200);
    }
}
