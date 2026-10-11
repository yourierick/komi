<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommissionController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentProofController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PublicProductController;
use App\Http\Controllers\PublicRentalController;
use App\Http\Controllers\PublicServiceController;
use App\Http\Controllers\ResellerLinkController;
use App\Http\Controllers\RentalController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\StoreReviewController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\SupplierReviewController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::prefix('v1')->group(function () {
    Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
        return $request->user();
    });

    // Authentication routes
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Public product routes (no authentication required)
    Route::get('/public/products', [PublicProductController::class, 'index']);
    Route::get('/public/products/categories', [PublicProductController::class, 'categories']);
    Route::get('/public/products/featured', [PublicProductController::class, 'featured']);
    Route::get('/public/products/{id}', [PublicProductController::class, 'show']);

    // Public rental routes (no authentication required)
    Route::get('/public/rentals', [PublicRentalController::class, 'index']);
    Route::get('/public/rentals/categories', [PublicRentalController::class, 'categories']);
    Route::get('/public/rentals/{id}', [PublicRentalController::class, 'show']);

    // Public service routes (no authentication required)
    Route::get('/public/services', [PublicServiceController::class, 'index']);
    Route::get('/public/services/categories', [PublicServiceController::class, 'categories']);
    Route::get('/public/services/{id}', [PublicServiceController::class, 'show']);

    // Public reseller link routes (no authentication required)
    Route::get('/public/reseller-links/{code}/reseller', [ResellerLinkController::class, 'getResellerByCode']);

    // Supplier routes (no authentication required)
    Route::get('/suppliers', [SupplierController::class, 'index']);
    Route::get('/suppliers/{id}', [SupplierController::class, 'show']);

    // Supplier review routes (public read, auth write)
    Route::get('/suppliers/{supplier}/reviews', [SupplierReviewController::class, 'index']);

    // User routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/profile', [AuthController::class, 'profile']);
        Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        // Route::get('/user/profile', [UserController::class, 'profile']);
        // Route::put('/user/profile', [UserController::class, 'update']);

        // Shop routes
        Route::get('/shops', [ShopController::class, 'index']);
        Route::post('/shops', [ShopController::class, 'store']);
        Route::get('/shops/{id}', [ShopController::class, 'show']);
        Route::put('/shops/{id}', [ShopController::class, 'update']);
        Route::delete('/shops/{id}', [ShopController::class, 'destroy']);
        Route::get('/shops/{id}/products', [ShopController::class, 'products']);

        // Store review routes
        Route::get('/shops/{shopId}/reviews', [StoreReviewController::class, 'index']);
        Route::post('/shops/{shopId}/reviews', [StoreReviewController::class, 'store']);
        Route::get('/shops/{shopId}/reviews/{id}', [StoreReviewController::class, 'show']);
        Route::put('/shops/{shopId}/reviews/{id}', [StoreReviewController::class, 'update']);
        Route::delete('/shops/{shopId}/reviews/{id}', [StoreReviewController::class, 'destroy']);

        // Product routes
        Route::get('/products', [ProductController::class, 'index']);
        Route::post('/products', [ProductController::class, 'store']);
        Route::get('/products/{id}', [ProductController::class, 'show']);
        Route::put('/products/{id}', [ProductController::class, 'update']);
        Route::delete('/products/{id}', [ProductController::class, 'destroy']);

        // Rental routes
        Route::get('/rentals', [RentalController::class, 'index']);
        Route::post('/rentals', [RentalController::class, 'store']);
        Route::get('/rentals/{id}', [RentalController::class, 'show']);
        Route::put('/rentals/{id}', [RentalController::class, 'update']);
        Route::delete('/rentals/{id}', [RentalController::class, 'destroy']);

        // Service routes
        Route::get('/services', [ServiceController::class, 'index']);
        Route::post('/services', [ServiceController::class, 'store']);
        Route::get('/services/{id}', [ServiceController::class, 'show']);
        Route::put('/services/{id}', [ServiceController::class, 'update']);
        Route::delete('/services/{id}', [ServiceController::class, 'destroy']);

        // Reseller link routes
        Route::post('/reseller-links/product/{productId}', [ResellerLinkController::class, 'createOrGetProductLink']);
        Route::post('/reseller-links/rental/{rentalId}', [ResellerLinkController::class, 'createOrGetRentalLink']);

        // Order routes
        Route::get('/orders', [OrderController::class, 'index']);
        Route::post('/orders', [OrderController::class, 'store']);
        Route::get('/orders/received', [OrderController::class, 'receivedOrders']);
        Route::get('/orders/{order}', [OrderController::class, 'show']);
        Route::put('/orders/{order}', [OrderController::class, 'update']);
        Route::patch('/orders/{order}/cancel', [OrderController::class, 'cancel']);
        Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
        Route::put('/orders/received/{order}', [OrderController::class, 'updateReceivedOrder']);
        Route::delete('/orders/{order}', [OrderController::class, 'destroy']);
        Route::patch('/orders/sendinvoice/{order}', [OrderController::class, 'sendInvoice']);
        Route::get('/orders/{order}/invoice', [InvoiceController::class, 'forOrder']);

        // Invoice routes
        Route::get('/invoices', [InvoiceController::class, 'index']);
        Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);
        Route::post('/invoices/{invoice}/payment-proofs', [PaymentProofController::class, 'store']);

        // Commission routes
        Route::get('/commissions', [CommissionController::class, 'index']);

        // Product comment routes (authenticated)
        Route::post('/products/{product}/comments', [\App\Http\Controllers\ProductCommentController::class, 'store']);
        Route::put('/comments/{comment}', [\App\Http\Controllers\ProductCommentController::class, 'update']);
        Route::delete('/comments/{comment}', [\App\Http\Controllers\ProductCommentController::class, 'destroy']);
        Route::patch('/comments/{comment}/approve', [\App\Http\Controllers\ProductCommentController::class, 'approve']);

        // Rental comment routes (authenticated)
        Route::post('/rentals/{rental}/comments', [\App\Http\Controllers\RentalCommentController::class, 'store']);
        Route::put('/rental-comments/{comment}', [\App\Http\Controllers\RentalCommentController::class, 'update']);
        Route::delete('/rental-comments/{comment}', [\App\Http\Controllers\RentalCommentController::class, 'destroy']);
        Route::patch('/rental-comments/{comment}/approve', [\App\Http\Controllers\RentalCommentController::class, 'approve']);

        // Service comment routes (authenticated)
        Route::post('/services/{service}/comments', [\App\Http\Controllers\ServiceCommentController::class, 'store']);
        Route::put('/service-comments/{comment}', [\App\Http\Controllers\ServiceCommentController::class, 'update']);
        Route::delete('/service-comments/{comment}', [\App\Http\Controllers\ServiceCommentController::class, 'destroy']);
        Route::patch('/service-comments/{comment}/approve', [\App\Http\Controllers\ServiceCommentController::class, 'approve']);

        // Supplier review routes (authenticated)
        Route::post('/suppliers/{supplier}/reviews', [SupplierReviewController::class, 'store']);
        Route::put('/supplier-reviews/{review}', [SupplierReviewController::class, 'update']);
        Route::delete('/supplier-reviews/{review}', [SupplierReviewController::class, 'destroy']);
        Route::patch('/supplier-reviews/{review}/approve', [SupplierReviewController::class, 'approve']);
    });

    // Public comment routes
    Route::get('/products/{product}/comments', [\App\Http\Controllers\ProductCommentController::class, 'index']);
    Route::get('/products/{product}/approvedcomments', [\App\Http\Controllers\ProductCommentController::class, 'approvedComments']);
    Route::get('/rentals/{rental}/comments', [\App\Http\Controllers\RentalCommentController::class, 'index']);
    Route::get('/services/{service}/comments', [\App\Http\Controllers\ServiceCommentController::class, 'index']);
});
