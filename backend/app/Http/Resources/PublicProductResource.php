<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicProductResource extends JsonResource
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
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'category' => $this->category,
            'sub_category' => $this->sub_category,
            'location' => $this->location,
            'price' => $this->price,
            'currency' => $this->currency,
            'min_order' => $this->min_order,
            'verified' => $this->verified,
            'status' => $this->status,
            'rating' => $this->rating ?? 0,
            'total_reviews' => $this->total_reviews ?? 0,
            'features' => $this->features,
            'specifications' => $this->specifications,
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'rating' => (float) $this->user->rating,
                'certified' => $this->user->certified,
            ],
            'shop' => $this->shop ? [
                'id' => $this->shop->id,
                'name' => $this->shop->name,
            ] : null,
            'images' => $this->images ? array_map(function ($image) {
                return $image ? asset($image) : null;
            }, $this->images) : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
