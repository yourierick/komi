<?php

namespace App\Services;

use App\Models\Shop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ShopService
{
    public function index(Request $request, $userId)
    {
        return Shop::where('user_id', $userId)->get();
    }

    public function store(Request $request, $userId): Shop
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'logo' => 'nullable|image|max:2048',
            'banner' => 'nullable|image|max:2048',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'rccm' => 'nullable|string|max:255',
            'status' => 'nullable|in:active,inactive,suspended',
            'verified' => 'nullable|boolean',
            'rating' => 'nullable|numeric|min:0|max:5',
            'total_reviews' => 'nullable|integer|min:0',
            'social_links' => 'nullable|array',
            'business_hours' => 'nullable|array',
        ]);

        $shopData = [
            'user_id' => $userId,
            'name' => $validated['name'],
            'slug' => strtolower(str_replace(' ', '-', $validated['name'])) . '-temp',
            'description' => $validated['description'] ?? null,
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'city' => $validated['city'] ?? null,
            'country' => $validated['country'] ?? null,
            'rccm' => $validated['rccm'] ?? null,
            'status' => $validated['status'] ?? 'active',
            'verified' => $validated['verified'] ?? false,
            'rating' => $validated['rating'] ?? 0,
            'total_reviews' => $validated['total_reviews'] ?? 0,
            'social_links' => $validated['social_links'] ?? null,
            'business_hours' => $validated['business_hours'] ?? null,
        ];

        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('shop-logos', 'public');
            $shopData['logo'] = $logoPath;
        }

        if ($request->hasFile('banner')) {
            $bannerPath = $request->file('banner')->store('shop-banners', 'public');
            $shopData['banner'] = $bannerPath;
        }

        $shop = Shop::create($shopData);

        $shop->slug = strtolower(str_replace(' ', '-', $shop->name)) . '-' . $shop->id;
        $shop->save();

        return $shop;
    }

    public function show($id, $userId): Shop
    {
        return Shop::where('user_id', $userId)->findOrFail($id);
    }

    public function update(Request $request, $id, $userId): Shop
    {
        $shop = Shop::where('user_id', $userId)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255|unique:shops,slug,' . $shop->id,
            'description' => 'nullable|string',
            'logo' => 'nullable|image|max:2048',
            'banner' => 'nullable|image|max:2048',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'rccm' => 'nullable|string|max:255',
            'status' => 'nullable|in:active,inactive,suspended',
            'verified' => 'nullable|boolean',
            'rating' => 'nullable|numeric|min:0|max:5',
            'total_reviews' => 'nullable|integer|min:0',
            'social_links' => 'nullable|array',
            'business_hours' => 'nullable|array',
        ]);

        if ($request->has('name')) {
            $shop->name = $validated['name'];
        }

        if ($request->has('slug')) {
            $shop->slug = $validated['slug'];
        }

        if ($request->has('description')) {
            $shop->description = $validated['description'];
        }

        if ($request->hasFile('logo')) {
            if ($shop->logo) {
                Storage::disk('public')->delete($shop->logo);
            }
            $logoPath = $request->file('logo')->store('shop-logos', 'public');
            $shop->logo = $logoPath;
        }

        if ($request->hasFile('banner')) {
            if ($shop->banner) {
                Storage::disk('public')->delete($shop->banner);
            }
            $bannerPath = $request->file('banner')->store('shop-banners', 'public');
            $shop->banner = $bannerPath;
        }

        if ($request->has('email')) {
            $shop->email = $validated['email'];
        }

        if ($request->has('phone')) {
            $shop->phone = $validated['phone'];
        }

        if ($request->has('address')) {
            $shop->address = $validated['address'];
        }

        if ($request->has('city')) {
            $shop->city = $validated['city'];
        }

        if ($request->has('country')) {
            $shop->country = $validated['country'];
        }

        if ($request->has('rccm')) {
            $shop->rccm = $validated['rccm'];
        }

        if ($request->has('status')) {
            $shop->status = $validated['status'];
        }

        if ($request->has('verified')) {
            $shop->verified = $validated['verified'];
        }

        if ($request->has('rating')) {
            $shop->rating = $validated['rating'];
        }

        if ($request->has('total_reviews')) {
            $shop->total_reviews = $validated['total_reviews'];
        }

        if ($request->has('social_links')) {
            $shop->social_links = $validated['social_links'];
        }

        if ($request->has('business_hours')) {
            $shop->business_hours = $validated['business_hours'];
        }

        $shop->save();

        return $shop;
    }

    public function destroy($id, $userId): void
    {
        $shop = Shop::where('user_id', $userId)->findOrFail($id);

        if ($shop->logo) {
            Storage::disk('public')->delete($shop->logo);
        }

        if ($shop->banner) {
            Storage::disk('public')->delete($shop->banner);
        }

        $shop->delete();
    }

    public function products($id, $userId)
    {
        $shop = Shop::where('user_id', $userId)->findOrFail($id);
        return $shop->products()->with('user')->get();
    }
}
