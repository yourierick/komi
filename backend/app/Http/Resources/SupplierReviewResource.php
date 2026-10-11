<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupplierReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'picture' => $this->user->picture ? asset('storage/' . $this->user->picture) : null,
            ],
            'rating' => $this->rating,
            'comment' => $this->comment,
            'approved' => $this->approved,
            'created_at' => $this->created_at,
        ];
    }
}
