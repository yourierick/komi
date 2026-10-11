<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupplierResource extends JsonResource
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
            'email' => $this->email,
            'phone' => $this->phone,
            'address' => $this->address,
            'picture' => $this->picture ? asset('storage/' . $this->picture) : null,
            'rating' => (float) $this->rating,
            'total_reviews' => $this->supplier_reviews_count ?? 0,
            'products_count' => $this->products_count ?? 0,
            'rentals_count' => $this->rentals_count ?? 0,
            'services_count' => $this->services_count ?? 0,
            'shops_count' => $this->shops_count ?? 0,
            'certified' => $this->certified,
            'created_at' => $this->created_at,
        ];
    }
}
