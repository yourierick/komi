<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentProofResource extends JsonResource
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
            'invoice_id' => $this->invoice_id,
            'status' => $this->status,
            'reason' => $this->reason,
            'proof_url' => $this->proof ? asset('storage/' . $this->proof) : null,
            'payment_method' => $this->payment_method,
            'transaction_reference' => $this->transaction_reference,
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
