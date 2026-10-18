<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminUserResource extends JsonResource
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
            'status' => $this->status,
            'certified' => $this->certified,
            'is_admin' => $this->is_admin,
            'picture' => $this->picture ? asset('storage/' . $this->picture) : null,
            'created_at' => $this->created_at,
            'shops_count' => $this->shops_count ?? 0,
            'products_count' => $this->products_count ?? 0,
            'rentals_count' => $this->rentals_count ?? 0,
            'services_count' => $this->services_count ?? 0,
        ];
    }
}
