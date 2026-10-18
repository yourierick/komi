<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'is_admin' => $this->is_admin,
            'phone' => $this->phone,
            'address' => $this->address,
            'nationality' => $this->nationality,
            'picture' => $this->picture ? asset('storage/' . $this->picture) : null,
            'identity_card_type' => $this->identity_card_type,
            'identity_card' => $this->identity_card ? asset('storage/' . $this->identity_card) : null,
            'id_card_number' => $this->id_card_number,
        ];
    }
}
