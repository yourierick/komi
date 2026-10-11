<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProductService
{
    public function index(Request $request, $userId)
    {
        return Product::where('user_id', $userId)->with('shop')->withCount('comments')->get();
    }

    public function store(Request $request, $userId): Product
    {
        $requestData = $request->all();

        // Filter out empty strings for old_price and discount_percent
        if (isset($requestData['old_price']) && $requestData['old_price'] === '') {
            unset($requestData['old_price']);
        }
        if (isset($requestData['discount_percent']) && $requestData['discount_percent'] === '') {
            unset($requestData['discount_percent']);
        }

        if (isset($requestData['features']) && is_string($requestData['features'])) {
            $requestData['features'] = json_decode($requestData['features'], true);
        }
        if (isset($requestData['specifications']) && is_string($requestData['specifications'])) {
            $requestData['specifications'] = json_decode($requestData['specifications'], true);
        }

        $validator = Validator::make($requestData, [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string|max:500',
            'category' => 'required|in:Electronics and Components,Applications and New Technologies,Phones and Accessories,Agriculture, Livestock, and Fishing,Wearables and Accessories,Home and decor,Makeup,Parents, Children, and Games,Jewelry, Eyewear, and Watches,Luggage, Bags, Cases,Sports and Fitness,Books, Media, and Games,office supplies,Food and Beverages,Buildings,Home Appliances,shoes and accessories,Vehicles and Transportation,Electrical Equipment and Supplies,Renewable Energy,hardware and home improvement,vehicle parts and accessories,Construction and Real Estate,Medical and Health,Packaging and Printing,Computers and Accessories',
            'sub_category' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'marque' => 'nullable|string|max:255',
            'price' => 'required|numeric|min:0',
            'old_price' => 'nullable|numeric|min:0',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'is_on_sale' => 'nullable|boolean',
            'currency' => 'nullable|string|max:3',
            'min_order' => 'nullable|integer|min:1',
            'verified' => 'nullable|boolean',
            'status' => 'nullable|in:available,unavailable',
            'commission_type' => 'nullable|in:none,fixed,percentage',
            'commission_value' => 'nullable|numeric|min:0',
            'features' => 'nullable|array',
            'specifications' => 'nullable|array',
            'images' => 'nullable|array|max:6',
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            'shop_id' => 'nullable|integer|exists:shops,id',
        ]);

        if ($validator->fails()) {
            \Log::info($validator->errors());
            throw new \Illuminate\Validation\ValidationException($validator);
        }

        $validated = $validator->validated();

        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('products', 'public');
                $imagePaths[] = '/storage/' . $path;
            }
        }

        $productData = [
            'user_id' => $userId,
            'shop_id' => $validated['shop_id'] ?? null,
            'name' => $validated['name'],
            'slug' => strtolower(str_replace(' ', '-', $validated['name'])) . '-temp',
            'description' => $validated['description'] ?? null,
            'short_description' => $validated['short_description'] ?? null,
            'category' => $validated['category'],
            'sub_category' => $validated['sub_category'] ?? null,
            'location' => $validated['location'] ?? null,
            'model' => $validated['model'] ?? null,
            'marque' => $validated['marque'] ?? null,
            'price' => $validated['price'],
            'old_price' => $validated['old_price'] ?? null,
            'discount_percent' => $validated['discount_percent'] ?? null,
            'is_on_sale' => $validated['is_on_sale'] ?? false,
            'currency' => $validated['currency'] ?? 'USD',
            'min_order' => $validated['min_order'] ?? 1,
            'verified' => $validated['verified'] ?? false,
            'status' => $validated['status'] ?? 'available',
            'commission_type' => $validated['commission_type'] ?? 'none',
            'commission_value' => $validated['commission_value'] ?? null,
            'features' => $validated['features'] ?? null,
            'specifications' => $validated['specifications'] ?? null,
            'images' => !empty($imagePaths) ? $imagePaths : null,
        ];

        $product = Product::create($productData);

        $product->slug = strtolower(str_replace(' ', '-', $product->name)) . '-' . $product->id;
        $product->save();

        return $product;
    }

    public function show(Request $request, $id, $userId): Product
    {
        return Product::where('user_id', $userId)->with('shop')->withCount('comments')->findOrFail($id);
    }

    public function update(Request $request, $id, $userId): Product
    {
        $product = Product::where('user_id', $userId)->findOrFail($id);

        $requestData = $request->all();

        // Filter out empty strings for old_price and discount_percent
        if (isset($requestData['old_price']) && $requestData['old_price'] === '') {
            unset($requestData['old_price']);
        }
        if (isset($requestData['discount_percent']) && $requestData['discount_percent'] === '') {
            unset($requestData['discount_percent']);
        }

        if (isset($requestData['features']) && is_string($requestData['features'])) {
            $requestData['features'] = json_decode($requestData['features'], true);
        }
        if (isset($requestData['specifications']) && is_string($requestData['specifications'])) {
            $requestData['specifications'] = json_decode($requestData['specifications'], true);
        }

        $validator = Validator::make($requestData, [
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string|max:500',
            'category' => 'sometimes|in:Electronics and Components,Applications and New Technologies,Phones and Accessories,Agriculture, Livestock, and Fishing,Wearables and Accessories,Home and decor,Makeup,Parents, Children, and Games,Jewelry, Eyewear, and Watches,Luggage, Bags, Cases,Sports and Fitness,Books, Media, and Games,office supplies,Food and Beverages,Buildings,Home Appliances,shoes and accessories,Vehicles and Transportation,Electrical Equipment and Supplies,Renewable Energy,hardware and home improvement,vehicle parts and accessories,Construction and Real Estate,Medical and Health,Packaging and Printing,Computers and Accessories',
            'sub_category' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'marque' => 'nullable|string|max:255',
            'price' => 'sometimes|numeric|min:0',
            'old_price' => 'nullable|numeric|min:0',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'is_on_sale' => 'nullable|boolean',
            'currency' => 'nullable|string|max:3',
            'min_order' => 'nullable|integer|min:1',
            'verified' => 'nullable|boolean',
            'status' => 'nullable|in:available,unavailable',
            'commission_type' => 'nullable|in:none,fixed,percentage',
            'commission_value' => 'nullable|numeric|min:0',
            'features' => 'nullable|array',
            'specifications' => 'nullable|array',
            'images' => 'nullable|array|max:6',
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            'shop_id' => 'nullable|integer|exists:shops,id',
        ]);

        if ($validator->fails()) {
            \Log::info($validator->errors());
            throw new \Illuminate\Validation\ValidationException($validator);
        }

        $validated = $validator->validated();

        $imagePaths = [];
        if ($request->hasFile('images')) {
            if ($product->images && is_array($product->images)) {
                foreach ($product->images as $oldImagePath) {
                    $fullPath = public_path($oldImagePath);
                    if (file_exists($fullPath)) {
                        unlink($fullPath);
                    }
                }
            }

            foreach ($request->file('images') as $image) {
                $path = $image->store('products', 'public');
                $imagePaths[] = '/storage/' . $path;
            }
        }

        $productData = [
            'name' => $validated['name'] ?? $product->name,
            'description' => $validated['description'] ?? $product->description,
            'short_description' => $validated['short_description'] ?? $product->short_description,
            'category' => $validated['category'] ?? $product->category,
            'sub_category' => $validated['sub_category'] ?? $product->sub_category,
            'location' => $validated['location'] ?? $product->location,
            'model' => $validated['model'] ?? $product->model,
            'marque' => $validated['marque'] ?? $product->marque,
            'price' => $validated['price'] ?? $product->price,
            'old_price' => $validated['old_price'] ?? $product->old_price,
            'discount_percent' => $validated['discount_percent'] ?? $product->discount_percent,
            'is_on_sale' => $validated['is_on_sale'] ?? $product->is_on_sale,
            'currency' => $validated['currency'] ?? $product->currency,
            'min_order' => $validated['min_order'] ?? $product->min_order,
            'verified' => $validated['verified'] ?? $product->verified,
            'status' => $validated['status'] ?? $product->status,
            'commission_type' => $validated['commission_type'] ?? $product->commission_type,
            'commission_value' => $validated['commission_value'] ?? $product->commission_value,
            'features' => $validated['features'] ?? $product->features,
            'specifications' => $validated['specifications'] ?? $product->specifications,
            'images' => !empty($imagePaths) ? $imagePaths : $product->images,
        ];

        if (isset($validated['name']) && $validated['name'] !== $product->name) {
            $productData['slug'] = strtolower(str_replace(' ', '-', $validated['name'])) . '-' . $product->id;
        }

        $product->update($productData);

        return $product;
    }

    public function destroy($id, $userId): void
    {
        $product = Product::where('user_id', $userId)->findOrFail($id);
        $product->delete();
    }
}
