<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicRentalResource extends JsonResource
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
            'short_description' => $this->short_description,
            'category' => $this->category,
            'sub_category' => $this->sub_category,
            'location' => $this->location,
            'city' => $this->city,
            'country' => $this->country,
            'price' => $this->price,
            'old_price' => $this->old_price,
            'discount_percent' => $this->discount_percent,
            'currency' => $this->currency,
            'payment_frequency' => $this->payment_frequency,
            'verified' => $this->verified,
            'rating' => $this->rating,
            'total_reviews' => $this->approved_reviews ?? 0,
            'commission_type' => $this->commission_type,
            'commission_value' => $this->commission_value,
            'status' => $this->status,
            'conditions' => $this->conditions,
            'specifications' => $this->specifications,
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'rating' => (float) $this->user->rating,
                'certified' => $this->user->certified,
            ],
            'images' => $this->images ? array_map(function ($image) {
                return $image ? asset($image) : null;
            }, $this->images) : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
