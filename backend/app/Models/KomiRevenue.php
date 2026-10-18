<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KomiRevenue extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'invoice_id',
        'amount',
        'fee_percentage',
        'currency',
        'status',
        'collected_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'fee_percentage' => 'decimal:2',
        'collected_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}
