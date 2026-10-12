<?php

namespace App\Services;

use App\Models\Rental;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RentalService
{
    public function index(Request $request, $userId)
    {
        return Rental::where('user_id', $userId)->with('user')->withCount('comments')->get();
    }

    public function store(Request $request, $userId): Rental
    {
        $requestData = $request->all();

        // Filter out empty strings for numeric nullable fields
        foreach (['old_price', 'discount_percent', 'commission_value'] as $field) {
            if (isset($requestData[$field]) && $requestData[$field] === '') {
                unset($requestData[$field]);
            }
        }

        if (isset($requestData['conditions']) && is_string($requestData['conditions'])) {
            $requestData['conditions'] = json_decode($requestData['conditions'], true);
        }
        if (isset($requestData['specifications']) && is_string($requestData['specifications'])) {
            $requestData['specifications'] = json_decode($requestData['specifications'], true);
        }

        $validator = Validator::make($requestData, [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string|max:500',
            'category' => 'required|in:real estate,Vehicles,Machinery,Electronics,Events,Leisure,Furniture,Logistics,Agriculture,other',
            'sub_category' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'price' => 'required|numeric|min:0',
            'old_price' => 'nullable|numeric|min:0',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'currency' => 'nullable|string|max:3',
            'payment_frequency' => 'nullable|in:daily,weekly,monthly',
            'status' => 'nullable|in:available,rented,maintenance,unavailable',
            'verified' => 'nullable|boolean',
            'rating' => 'nullable|numeric|min:0|max:5',
            'total_reviews' => 'nullable|integer|min:0',
            'commission_type' => 'nullable|in:none,fixed,percentage',
            'commission_value' => 'nullable|numeric|min:0',
            'conditions' => 'nullable|array',
            'specifications' => 'nullable|array',
            'images' => 'nullable|array|max:6',
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        $this->validateCommissionLimit($validator, $requestData);

        if ($validator->fails()) {
            throw new \Illuminate\Validation\ValidationException($validator);
        }

        $validated = $validator->validated();

        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('rentals', 'public');
                $imagePaths[] = '/storage/' . $path;
            }
        }

        $rentalData = [
            'user_id' => $userId,
            'title' => $validated['title'],
            'slug' => strtolower(str_replace(' ', '-', $validated['title'])) . '-temp',
            'description' => $validated['description'] ?? null,
            'short_description' => $validated['short_description'] ?? null,
            'category' => $validated['category'],
            'sub_category' => $validated['sub_category'] ?? null,
            'location' => $validated['location'] ?? null,
            'city' => $validated['city'] ?? null,
            'country' => $validated['country'] ?? null,
            'price' => $validated['price'],
            'old_price' => $validated['old_price'] ?? null,
            'discount_percent' => $validated['discount_percent'] ?? null,
            'currency' => $validated['currency'] ?? 'USD',
            'payment_frequency' => $validated['payment_frequency'] ?? 'daily',
            'status' => $validated['status'] ?? 'available',
            'verified' => $validated['verified'] ?? false,
            'rating' => $validated['rating'] ?? 0,
            'total_reviews' => $validated['total_reviews'] ?? 0,
            'commission_type' => $validated['commission_type'] ?? 'none',
            'commission_value' => $validated['commission_value'] ?? null,
            'conditions' => $validated['conditions'] ?? null,
            'specifications' => $validated['specifications'] ?? null,
            'images' => !empty($imagePaths) ? $imagePaths : null,
        ];

        $rental = Rental::create($rentalData);

        return $rental;
    }

    public function show($id, $userId): ?Rental
    {
        return Rental::where('user_id', $userId)->with('user')->find($id);
    }

    public function update(Request $request, $id, $userId): Rental
    {
        $rental = Rental::where('user_id', $userId)->find($id);

        if (!$rental) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('Rental not found');
        }

        $requestData = $request->all();

        // Filter out empty strings for numeric nullable fields
        foreach (['old_price', 'discount_percent', 'commission_value'] as $field) {
            if (isset($requestData[$field]) && $requestData[$field] === '') {
                unset($requestData[$field]);
            }
        }

        if (isset($requestData['conditions']) && is_string($requestData['conditions'])) {
            $requestData['conditions'] = json_decode($requestData['conditions'], true);
        }
        if (isset($requestData['specifications']) && is_string($requestData['specifications'])) {
            $requestData['specifications'] = json_decode($requestData['specifications'], true);
        }

        $validator = Validator::make($requestData, [
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string|max:500',
            'category' => 'nullable|in:real estate,Vehicles,Machinery,Electronics,Events,Leisure,Furniture,Logistics,Agriculture,other',
            'sub_category' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'price' => 'nullable|numeric|min:0',
            'old_price' => 'nullable|numeric|min:0',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'currency' => 'nullable|string|max:3',
            'payment_frequency' => 'nullable|in:daily,weekly,monthly',
            'status' => 'nullable|in:available,rented,maintenance,unavailable',
            'verified' => 'nullable|boolean',
            'rating' => 'nullable|numeric|min:0|max:5',
            'total_reviews' => 'nullable|integer|min:0',
            'commission_type' => 'nullable|in:none,fixed,percentage',
            'commission_value' => 'nullable|numeric|min:0',
            'conditions' => 'nullable|array',
            'specifications' => 'nullable|array',
            'images' => 'nullable|array|max:6',
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        $this->validateCommissionLimit($validator, $requestData, $rental);

        if ($validator->fails()) {
            \Log::info($validator->errors());
            throw new \Illuminate\Validation\ValidationException($validator);
        }

        $validated = $validator->validated();

        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('rentals', 'public');
                $imagePaths[] = '/storage/' . $path;
            }
        }

        $updateData = array_merge(
            $validated,
            [
                'short_description' => $validated['short_description'] ?? $rental->short_description,
                'old_price' => $validated['old_price'] ?? $rental->old_price,
                'discount_percent' => $validated['discount_percent'] ?? $rental->discount_percent,
                'commission_type' => $validated['commission_type'] ?? $rental->commission_type,
                'commission_value' => $validated['commission_value'] ?? $rental->commission_value,
                'conditions' => $validated['conditions'] ?? $rental->conditions,
                'specifications' => $validated['specifications'] ?? $rental->specifications,
                'images' => !empty($imagePaths) ? $imagePaths : ($rental->images ?? null),
            ]
        );

        $rental->update($updateData);

        return $rental;
    }

    public function destroy($id, $userId): void
    {
        $rental = Rental::where('user_id', $userId)->find($id);

        if (!$rental) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('Rental not found');
        }

        $rental->delete();
    }

    /**
     * Commission is capped at 20% of the rental price.
     * For "percentage" type the value itself must be <= 20.
     */
    private function validateCommissionLimit($validator, array $requestData, ?Rental $rental = null): void
    {
        $validator->after(function ($validator) use ($requestData, $rental) {
            if (!isset($requestData['commission_value'])) {
                return;
            }

            $commissionType = $requestData['commission_type'] ?? $rental?->commission_type ?? 'none';
            if ($commissionType === 'none') {
                return;
            }

            $value = (float) $requestData['commission_value'];
            $limit = $commissionType === 'percentage'
                ? 20
                : (float) ($requestData['price'] ?? $rental?->price ?? 0) * 0.2;

            if ($value > $limit) {
                $validator->errors()->add('commission_value', 'La commission ne peut pas dépasser 20% du prix de la location.');
            }
        });
    }
}
