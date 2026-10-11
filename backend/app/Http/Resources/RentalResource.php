<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RentalResource extends JsonResource
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
            'user_id' => $this->user_id,
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
            'status' => $this->status,
            'verified' => $this->verified,
            'rating' => $this->rating,
            'total_reviews' => $this->total_reviews,
            'commission_type' => $this->commission_type,
            'commission_value' => $this->commission_value,
            'conditions' => $this->conditions,
            'specifications' => $this->specifications,
            'images' => $this->images ? array_map(function ($image) {
                return $image ? asset($image) : null;
            }, $this->images) : null,
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
