<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'shop_id',
        'reseller',
        'product_id',
        'rental_id',
        'service_id',
        'order_number',
        'status',
        'unit_selling_price',
        'quantity',
        'subtotal',
        'tax_amount',
        'shipping_amount',
        'discount_amount',
        'total_amount',
        'commission_amount',
        'currency',
        'payment_method',
        'payment_status',
        'shipping_address',
        'billing_address',
        'notes',
        'specifications',
        'options',
        'generate_invoice',
        'shipped_at',
        'delivered_at',
    ];

    protected $casts = [
        'unit_selling_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'shipping_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'specifications' => 'array',
        'options' => 'array',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
        'generate_invoice' => 'boolean'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function resellerUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reseller');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function rental(): BelongsTo
    {
        return $this->belongsTo(Rental::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class);
    }

    public function komiRevenue(): HasOne
    {
        return $this->hasOne(KomiRevenue::class);
    }

    public function item(): Product|Rental|Service|null
    {
        return $this->product ?? $this->rental ?? $this->service;
    }

    public function supplierId(): ?int
    {
        return $this->item()?->user_id;
    }
}
