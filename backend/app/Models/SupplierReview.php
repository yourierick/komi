<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'supplier_id',
        'rating',
        'comment',
        'approved',
    ];

    protected $casts = [
        'approved' => 'boolean',
        'rating' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supplier_id');
    }

    protected static function booted(): void
    {
        static::created(function (SupplierReview $review) {
            $review->load('supplier');
            $review->supplier->updateRating();
        });

        static::updated(function (SupplierReview $review) {
            $review->load('supplier');
            $review->supplier->updateRating();
        });

        static::deleted(function (SupplierReview $review) {
            $review->supplier->updateRating();
        });
    }
}
