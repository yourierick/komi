<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'user_id',
        'supplier_id',
        'invoice_number',
        'status',
        'item_type',
        'item_name',
        'item_image',
        'quantity',
        'unit_selling_price',
        'subtotal',
        'tax_amount',
        'shipping_amount',
        'discount_amount',
        'total_amount',
        'commission_amount',
        'komi_fees',
        'currency',
        'payment_method',
        'shipping_address',
        'billing_address',
        'notes',
        'specifications',
        'options',
        'customer_name',
        'customer_email',
        'customer_phone',
        'supplier_name',
        'supplier_email',
        'supplier_phone',
        'sent_at',
        'paid_at',
    ];

    protected $casts = [
        'unit_selling_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'shipping_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'komi_fees' => 'decimal:2',
        'specifications' => 'array',
        'options' => 'array',
        'sent_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supplier_id');
    }

    public function paymentProofs(): HasMany
    {
        return $this->hasMany(PaymentProof::class);
    }

    public function paymentProof(): HasOne
    {
        return $this->hasOne(PaymentProof::class)->latestOfMany();
    }
}
