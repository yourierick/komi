<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use App\Http\Resources\ShopResource;
use App\Models\Shop;
use App\Services\ShopService;
use Illuminate\Http\Request;

class ShopController extends Controller
{
    protected ShopService $shopService;

    public function __construct(ShopService $shopService)
    {
        $this->shopService = $shopService;
    }
    public function index(Request $request)
    {
        $shops = $this->shopService->index($request, $request->user()->id);
        return ShopResource::collection($shops);
    }

    public function store(Request $request)
    {
        $shop = $this->shopService->store($request, $request->user()->id);
        return new ShopResource($shop);
    }

    public function show(Request $request, $id)
    {
        $shop = $this->shopService->show($id, $request->user()->id);
        return new ShopResource($shop);
    }

    public function update(Request $request, $id)
    {
        $shop = $this->shopService->update($request, $id, $request->user()->id);
        return new ShopResource($shop);
    }

    public function destroy(Request $request, $id)
    {
        $this->shopService->destroy($id, $request->user()->id);
        return response()->json(['message' => 'Shop deleted successfully']);
    }

    public function products(Request $request, $id)
    {
        $products = $this->shopService->products($id, $request->user()->id);
        return ProductResource::collection($products);
    }
}
