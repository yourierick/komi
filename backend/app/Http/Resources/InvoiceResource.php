<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
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
            'invoice_number' => $this->invoice_number,
            'status' => $this->status,
            'item_type' => $this->item_type,
            'item_name' => $this->item_name,
            'item_image' => $this->item_image ? asset($this->item_image) : null,
            'quantity' => $this->quantity,
            'unit_selling_price' => (float) $this->unit_selling_price,
            'subtotal' => (float) $this->subtotal,
            'tax_amount' => (float) $this->tax_amount,
            'shipping_amount' => (float) $this->shipping_amount,
            'discount_amount' => (float) $this->discount_amount,
            'total_amount' => (float) $this->total_amount,
            'commission_amount' => (float) $this->commission_amount,
            'komi_fees' => (float) $this->komi_fees,
            'currency' => $this->currency,
            'payment_method' => $this->payment_method,
            'shipping_address' => $this->shipping_address,
            'billing_address' => $this->billing_address,
            'notes' => $this->notes,
            'specifications' => $this->specifications,
            'options' => $this->options,
            'customer' => [
                'name' => $this->customer_name,
                'email' => $this->customer_email,
                'phone' => $this->customer_phone,
            ],
            'supplier' => [
                'name' => $this->supplier_name,
                'email' => $this->supplier_email,
                'phone' => $this->supplier_phone,
            ],
            'sent_at' => $this->sent_at?->toISOString(),
            'paid_at' => $this->paid_at?->toISOString(),
            'payment_proof' => new PaymentProofResource($this->whenLoaded('paymentProof')),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
