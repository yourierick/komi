<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
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
            'short_description' => $this->short_description,
            'category' => $this->category,
            'sub_category' => $this->sub_category,
            'location' => $this->location,
            'model' => $this->model,
            'marque' => $this->marque,
            'price' => $this->price,
            'old_price' => $this->old_price,
            'discount_percent' => $this->discount_percent,
            'is_on_sale' => $this->is_on_sale,
            'currency' => $this->currency,
            'min_order' => $this->min_order,
            'verified' => $this->verified,
            'status' => $this->status,
            'rating' => (float) ($this->rating ?? 0),
            'total_reviews' => $this->total_reviews,
            'commission_type' => $this->commission_type,
            'commission_value' => $this->commission_value,
            'features' => $this->features,
            'specifications' => $this->specifications,
            'images' => $this->images ? array_map(function ($image) {
                return $image ? asset($image) : null;
            }, $this->images) : null,
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
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
