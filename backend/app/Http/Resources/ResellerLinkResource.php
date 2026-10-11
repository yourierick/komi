<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ResellerLinkResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $link = null;
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');

        if ($this->product_id) {
            $link = $frontendUrl . '/products/' . $this->product_id . '?ref=' . $this->code;
        } elseif ($this->rental_id) {
            $link = $frontendUrl . '/rentals/' . $this->rental_id . '?ref=' . $this->code;
        }

        return [
            'id' => $this->id,
            'code' => $this->code,
            'link' => $link,
            'product_id' => $this->product_id,
            'rental_id' => $this->rental_id,
            'user_id' => $this->user_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
