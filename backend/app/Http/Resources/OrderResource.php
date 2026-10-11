<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
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
            'order_number' => $this->order_number,
            'status' => $this->status,
            'unit_selling_price' => (float) $this->unit_selling_price,
            'quantity' => $this->quantity,
            'subtotal' => (float) $this->subtotal,
            'tax_amount' => (float) $this->tax_amount,
            'shipping_amount' => (float) $this->shipping_amount,
            'discount_amount' => (float) $this->discount_amount,
            'total_amount' => (float) $this->total_amount,
            'commission_amount' => (float) $this->commission_amount,
            'currency' => $this->currency,
            'payment_method' => $this->payment_method,
            'shipping_address' => $this->shipping_address,
            'billing_address' => $this->billing_address,
            'notes' => $this->notes,
            'specifications' => $this->specifications,
            'generate_invoice' => $this->generate_invoice,
            'options' => $this->options,
            'shipped_at' => $this->shipped_at?->toISOString(),
            'delivered_at' => $this->delivered_at?->toISOString(),
            'invoice' => new InvoiceResource($this->whenLoaded('invoice')),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                    'picture' => $this->user->picture ? asset('storage/' . $this->user->picture) : null,
                ];
            }),
            'shop' => $this->whenLoaded('shop', function () {
                return [
                    'id' => $this->shop->id,
                    'name' => $this->shop->name,
                ];
            }),
            'reseller' => $this->whenLoaded('resellerUser', function () {
                return [
                    'id' => $this->resellerUser->id,
                    'name' => $this->resellerUser->name,
                    'email' => $this->resellerUser->email,
                ];
            }),
            'product' => $this->whenLoaded('product', function () {
                $productData = [
                    'id' => $this->product->id,
                    'name' => $this->product->name,
                    'image' => (!empty($this->product->images) && isset($this->product->images[0]))
                        ? asset($this->product->images[0])
                        : null,
                    'category' => $this->product->category,
                ];

                if ($this->product->relationLoaded('user') && $this->product->user) {
                    $productData['supplier'] = [
                        'id' => $this->product->user->id,
                        'name' => $this->product->user->name,
                        'email' => $this->product->user->email,
                        'phone' => $this->product->user->phone ?? null,
                    ];
                }

                return $productData;
            }),
            'rental' => $this->whenLoaded('rental', function () {
                $rentalData = [
                    'id' => $this->rental->id,
                    'title' => $this->rental->title,
                    'image' => (!empty($this->rental->images) && isset($this->rental->images[0]))
                        ? asset('storage/' . $this->rental->images[0])
                        : null,
                    'category' => $this->rental->category,
                    'payment_frequency' => $this->rental->payment_frequency,
                ];

                if ($this->rental->relationLoaded('user') && $this->rental->user) {
                    $rentalData['supplier'] = [
                        'id' => $this->rental->user->id,
                        'name' => $this->rental->user->name,
                        'email' => $this->rental->user->email,
                        'phone' => $this->rental->user->phone ?? null,
                    ];
                }

                return $rentalData;
            }),
            'service' => $this->whenLoaded('service', function () {
                $serviceData = [
                    'id' => $this->service->id,
                    'title' => $this->service->title,
                    'image' => (!empty($this->service->images) && isset($this->service->images[0]))
                        ? asset($this->service->images[0])
                        : null,
                    'category' => $this->service->category,
                    'payment_frequency' => $this->service->payment_frequency ?? null,
                ];

                if ($this->service->relationLoaded('user') && $this->service->user) {
                    $serviceData['supplier'] = [
                        'id' => $this->service->user->id,
                        'name' => $this->service->user->name,
                        'email' => $this->service->user->email,
                        'phone' => $this->service->user->phone ?? null,
                    ];
                }

                return $serviceData;
            }),
        ];
    }
}
