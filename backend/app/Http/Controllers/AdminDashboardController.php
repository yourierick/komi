<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\ProductComment;
use App\Models\Rental;
use App\Models\RentalComment;
use App\Models\Service;
use App\Models\ServiceComment;
use App\Models\Shop;
use App\Models\SupplierReview;
use App\Models\User;

class AdminDashboardController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => [
                'users' => User::count(),
                'shops' => Shop::count(),
                'products' => Product::count(),
                'rentals' => Rental::count(),
                'services' => Service::count(),
                'orders' => Order::count(),
                'pending_comments' => ProductComment::where('approved', false)->count()
                    + RentalComment::where('approved', false)->count()
                    + ServiceComment::where('approved', false)->count(),
                'pending_supplier_reviews' => SupplierReview::where('approved', false)->count(),
            ],
        ]);
    }
}
