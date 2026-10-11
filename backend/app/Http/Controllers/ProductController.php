<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    protected ProductService $productService;

    public function __construct(ProductService $productService)
    {
        $this->productService = $productService;
    }
    public function index(Request $request)
    {
        $products = $this->productService->index($request, $request->user()->id);
        return ProductResource::collection($products);
    }

    public function store(Request $request)
    {
        try {
            $product = $this->productService->store($request, $request->user()->id);
            return new ProductResource($product->load('shop'));
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function show(Request $request, $id)
    {
        $product = $this->productService->show($request, $id, $request->user()->id);
        return new ProductResource($product);
    }

    public function update(Request $request, $id)
    {
        try {
            $product = $this->productService->update($request, $id, $request->user()->id);
            return new ProductResource($product->load('shop'));
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function destroy(Request $request, $id)
    {
        $this->productService->destroy($id, $request->user()->id);
        return response()->json(['message' => 'Product deleted successfully']);
    }
}
