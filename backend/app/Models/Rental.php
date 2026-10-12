<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Rental extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'slug',
        'description',
        'short_description',
        'category',
        'sub_category',
        'location',
        'city',
        'country',
        'price',
        'old_price',
        'discount_percent',
        'currency',
        'payment_frequency',
        'status',
        'verified',
        'rating',
        'commission_type',
        'commission_value',
        'conditions',
        'specifications',
        'images',
    ];

    protected $casts = [
        'verified' => 'boolean',
        'price' => 'decimal:2',
        'old_price' => 'decimal:2',
        'discount_percent' => 'decimal:2',
        'rating' => 'decimal:2',
        'commission_value' => 'decimal:2',
        'conditions' => 'array',
        'specifications' => 'array',
        'images' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(RentalComment::class);
    }

    public function approvedComments(): HasMany
    {
        return $this->hasMany(RentalComment::class)->where('approved', true);
    }

    /**
     * Update rental rating based on all comments
     */
    public function updateRating(): void
    {
        $averageRating = $this->comments()->avg('rating') ?? 0;
        $this->update(['rating' => $averageRating]);
    }

    /**
     * Get total number of comments (reviews)
     */
    public function getTotalReviewsAttribute(): int
    {
        return $this->comments_count ?? $this->comments()->count();
    }

    /**
     * Get number of approved comments (publicly visible reviews)
     */
    public function getApprovedReviewsAttribute(): int
    {
        return $this->approved_comments_count ?? $this->approvedComments()->count();
    }
}
