<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommissionResource extends JsonResource
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
            'code' => $this->code,
            'order_id' => $this->order_id,
            'commission_amount' => (float) $this->commission_amount,
            'currency' => $this->currency,
            'status' => $this->status,
            'paid_at' => $this->paid_at?->toISOString(),
            'notes' => $this->notes,
            'created_at' => $this->created_at->toISOString(),
            'order' => $this->whenLoaded('order', function () {
                return [
                    'id' => $this->order->id,
                    'order_number' => $this->order->order_number,
                    'total_amount' => (float) $this->order->total_amount,
                    'status' => $this->order->status,
                ];
            }),
        ];
    }
}
