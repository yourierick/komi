<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShopResource extends JsonResource
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
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'logo' => $this->logo ? asset('storage/' . $this->logo) : null,
            'banner' => $this->banner ? asset('storage/' . $this->banner) : null,
            'email' => $this->email,
            'phone' => $this->phone,
            'address' => $this->address,
            'city' => $this->city,
            'country' => $this->country,
            'rccm' => $this->rccm,
            'status' => $this->status,
            'verified' => $this->verified,
            'rating' => (float) $this->rating,
            'total_reviews' => $this->total_reviews,
            'social_links' => $this->social_links,
            'business_hours' => $this->business_hours,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
