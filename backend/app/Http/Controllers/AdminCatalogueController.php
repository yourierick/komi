<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Rental;
use App\Models\Service;
use App\Models\Shop;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AdminCatalogueController extends Controller
{
    public function verifyShop(Request $request, Shop $shop)
    {
        return $this->verify($request, $shop);
    }

    public function verifyProduct(Request $request, Product $product)
    {
        return $this->verify($request, $product);
    }

    public function verifyRental(Request $request, Rental $rental)
    {
        return $this->verify($request, $rental);
    }

    public function verifyService(Request $request, Service $service)
    {
        return $this->verify($request, $service);
    }

    private function verify(Request $request, Model $model)
    {
        $validated = $request->validate([
            'verified' => 'sometimes|boolean',
        ]);

        $model->update([
            'verified' => $validated['verified'] ?? !$model->verified,
        ]);

        return response()->json([
            'message' => 'Verification status updated',
            'data' => [
                'id' => $model->id,
                'verified' => $model->verified,
            ],
        ]);
    }
}
