<?php

namespace App\Services;

use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ServiceService
{
    public function index(Request $request, $userId)
    {
        return Service::where('user_id', $userId)->with('user')->get();
    }

    public function store(Request $request, $userId): Service
    {
        $requestData = $request->all();

        if (isset($requestData['features']) && is_string($requestData['features'])) {
            $requestData['features'] = json_decode($requestData['features'], true);
        }
        if (isset($requestData['specifications']) && is_string($requestData['specifications'])) {
            $requestData['specifications'] = json_decode($requestData['specifications'], true);
        }
        if (isset($requestData['availability']) && is_string($requestData['availability'])) {
            $requestData['availability'] = json_decode($requestData['availability'], true);
        }

        $validator = Validator::make($requestData, [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|in:consulting,maintenance,delivery,cleaning,education,health,beauty,tech,legal,finance,printing,software engineering,electrical,electronic and repair,painting,musician',
            'sub_category' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'price' => 'required|numeric|min:0',
            'currency' => 'nullable|string|max:3',
            'payment_frequency' => 'nullable|in:hourly,daily,weekly,monthly,per_project',
            'status' => 'nullable|in:available,unavailable',
            'verified' => 'nullable|boolean',
            'rating' => 'nullable|numeric|min:0|max:5',
            'total_reviews' => 'nullable|integer|min:0',
            'features' => 'nullable|array',
            'specifications' => 'nullable|array',
            'images' => 'nullable|array|max:6',
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            'video' => 'nullable|file|mimes:mp4,webm,ogg,mov,avi|max:10240',
            'availability' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            throw new \Illuminate\Validation\ValidationException($validator);
        }

        $validated = $validator->validated();

        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('services', 'public');
                $imagePaths[] = '/storage/' . $path;
            }
        }

        $videoPath = null;
        if ($request->hasFile('video')) {
            $path = $request->file('video')->store('services', 'public');
            $videoPath = '/storage/' . $path;
        }

        $serviceData = [
            'user_id' => $userId,
            'title' => $validated['title'],
            'slug' => strtolower(str_replace(' ', '-', $validated['title'])) . '-temp',
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'],
            'sub_category' => $validated['sub_category'] ?? null,
            'location' => $validated['location'] ?? null,
            'city' => $validated['city'] ?? null,
            'country' => $validated['country'] ?? null,
            'price' => $validated['price'],
            'currency' => $validated['currency'] ?? 'USD',
            'payment_frequency' => $validated['payment_frequency'] ?? 'hourly',
            'status' => $validated['status'] ?? 'available',
            'verified' => $validated['verified'] ?? false,
            'rating' => $validated['rating'] ?? 0,
            'total_reviews' => $validated['total_reviews'] ?? 0,
            'features' => $validated['features'] ?? null,
            'specifications' => $validated['specifications'] ?? null,
            'images' => !empty($imagePaths) ? $imagePaths : null,
            'video' => $videoPath ?? null,
            'availability' => $validated['availability'] ?? null,
        ];

        $service = Service::create($serviceData);

        return $service;
    }

    public function show($id, $userId): ?Service
    {
        return Service::where('user_id', $userId)->with('user')->find($id);
    }

    public function update(Request $request, $id, $userId): Service
    {
        $service = Service::where('user_id', $userId)->find($id);

        if (!$service) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('Service not found');
        }

        $requestData = $request->all();

        if (isset($requestData['features']) && is_string($requestData['features'])) {
            $requestData['features'] = json_decode($requestData['features'], true);
        }
        if (isset($requestData['specifications']) && is_string($requestData['specifications'])) {
            $requestData['specifications'] = json_decode($requestData['specifications'], true);
        }
        if (isset($requestData['availability']) && is_string($requestData['availability'])) {
            $requestData['availability'] = json_decode($requestData['availability'], true);
        }

        $validator = Validator::make($requestData, [
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|in:consulting,maintenance,delivery,cleaning,education,health,beauty,tech,legal,finance,printing,software engineering,electrical,electronic and repair,painting,musician',
            'sub_category' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'price' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:3',
            'payment_frequency' => 'nullable|in:hourly,daily,weekly,monthly,per_project',
            'status' => 'nullable|in:available,unavailable',
            'verified' => 'nullable|boolean',
            'rating' => 'nullable|numeric|min:0|max:5',
            'total_reviews' => 'nullable|integer|min:0',
            'features' => 'nullable|array',
            'specifications' => 'nullable|array',
            'images' => 'nullable|array|max:6',
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            'video' => 'nullable|file|mimes:mp4,webm,ogg,mov,avi|max:10240',
            'availability' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            throw new \Illuminate\Validation\ValidationException($validator);
        }

        $validated = $validator->validated();

        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('services', 'public');
                $imagePaths[] = '/storage/' . $path;
            }
        }

        $videoPath = null;
        if ($request->hasFile('video')) {
            $path = $request->file('video')->store('services', 'public');
            $videoPath = '/storage/' . $path;
        }

        $updateData = array_merge(
            $validated,
            [
                'features' => $validated['features'] ?? $service->features,
                'specifications' => $validated['specifications'] ?? $service->specifications,
                'images' => !empty($imagePaths) ? $imagePaths : ($service->images ?? null),
                'video' => $videoPath ?? $service->video,
                'availability' => $validated['availability'] ?? $service->availability,
            ]
        );

        $service->update($updateData);

        return $service;
    }

    public function destroy($id, $userId): void
    {
        $service = Service::where('user_id', $userId)->find($id);

        if (!$service) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('Service not found');
        }

        $service->delete();
    }
}
