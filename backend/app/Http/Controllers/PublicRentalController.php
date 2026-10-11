<?php

namespace App\Http\Controllers;

use App\Http\Resources\PublicRentalResource;
use App\Models\Rental;
use Illuminate\Http\Request;

class PublicRentalController extends Controller
{
    public function index(Request $request)
    {
        $query = Rental::where('status', 'available');

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('supplier')) {
            $query->where('user_id', $request->supplier);
        }

        $rentals = $query->withCount('comments')->get();

        return PublicRentalResource::collection($rentals);
    }

    public function show($id)
    {
        $rental = Rental::where('status', 'available')->withCount('comments')->find($id);

        if (!$rental) {
            return response()->json(['message' => 'Rental not found'], 404);
        }

        return new PublicRentalResource($rental);
    }

    public function categories()
    {
        $categories = Rental::where('status', 'available')
            ->selectRaw('category, COUNT(*) as count')
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
}
