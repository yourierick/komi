<?php

namespace App\Http\Controllers;

use App\Http\Resources\SupplierResource;
use App\Models\User;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    /**
     * Get list of suppliers (users with at least one shop and at least one product/rental/service)
     */
    public function index(Request $request)
    {
        $query = User::query()
            ->has('shops')
            ->where(function ($q) {
                $q->has('products')
                    ->orHas('rentals')
                    ->orHas('services');
            })
            ->withCount(['products', 'rentals', 'services', 'shops', 'supplierReviews']);

        // Search by name, email, phone, or address
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            });
        }

        $suppliers = $query->get();

        return SupplierResource::collection($suppliers);
    }

    /**
     * Get supplier details
     */
    public function show($id)
    {
        $supplier = User::query()
            ->has('shops')
            ->where('id', $id)
            ->where(function ($q) {
                $q->has('products')
                    ->orHas('rentals')
                    ->orHas('services');
            })
            ->withCount(['products', 'rentals', 'services', 'shops', 'supplierReviews'])
            ->first();

        if (!$supplier) {
            return response()->json(['message' => 'Supplier not found'], 404);
        }

        return new SupplierResource($supplier);
    }
}
