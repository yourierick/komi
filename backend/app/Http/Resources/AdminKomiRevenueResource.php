<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminKomiRevenueResource extends JsonResource
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
            'order_id' => $this->order_id,
            'amount' => (float) $this->amount,
            'fee_percentage' => (float) $this->fee_percentage,
            'currency' => $this->currency,
            'status' => $this->status,
            'collected_at' => $this->collected_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'order' => $this->whenLoaded('order', fn () => $this->order ? [
                'id' => $this->order->id,
                'order_number' => $this->order->order_number,
                'total_amount' => (float) $this->order->total_amount,
                'status' => $this->order->status,
            ] : null),
            'invoice' => $this->whenLoaded('invoice', fn () => $this->invoice ? [
                'id' => $this->invoice->id,
                'invoice_number' => $this->invoice->invoice_number,
                'item_name' => $this->invoice->item_name,
            ] : null),
        ];
    }
}
