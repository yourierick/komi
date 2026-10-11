<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicServiceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'category' => $this->category,
            'sub_category' => $this->sub_category,
            'location' => $this->location,
            'city' => $this->city,
            'country' => $this->country,
            'price' => $this->price,
            'currency' => $this->currency,
            'payment_frequency' => $this->payment_frequency,
            'status' => $this->status,
            'verified' => $this->verified,
            'rating' => $this->rating ?? 0,
            'total_reviews' => $this->total_reviews ?? 0,
            'features' => $this->features,
            'specifications' => $this->specifications,
            'images' => $this->images ? array_map(function ($image) {
                return $image ? asset($image) : null;
            }, $this->images) : null,
            'video' => $this->video ? asset($this->video) : null,
            'availability' => $this->availability,
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                    'phone' => $this->user->phone,
                    'rating' => (float) $this->user->rating,
                    'certified' => $this->user->certified,
                ];
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
