<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminPaymentProofResource extends JsonResource
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
            'status' => $this->status,
            'proof_url' => $this->proof ? asset('storage/' . $this->proof) : null,
            'payment_method' => $this->payment_method,
            'transaction_reference' => $this->transaction_reference,
            'reason' => $this->reason,
            'reviewed_at' => $this->reviewed_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),
            'reviewer' => $this->whenLoaded('reviewer', fn () => $this->reviewer ? [
                'id' => $this->reviewer->id,
                'name' => $this->reviewer->name,
            ] : null),
            'invoice' => $this->whenLoaded('invoice', fn () => [
                'id' => $this->invoice->id,
                'invoice_number' => $this->invoice->invoice_number,
                'status' => $this->invoice->status,
                'total_amount' => (float) $this->invoice->total_amount,
                'currency' => $this->invoice->currency,
                'item_name' => $this->invoice->item_name,
                'item_type' => $this->invoice->item_type,
                'paid_at' => $this->invoice->paid_at?->toISOString(),
                'order' => $this->invoice->relationLoaded('order') && $this->invoice->order ? [
                    'id' => $this->invoice->order->id,
                    'order_number' => $this->invoice->order->order_number,
                    'status' => $this->invoice->order->status,
                ] : null,
            ]),
        ];
    }
}
