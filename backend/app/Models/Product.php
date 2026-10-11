<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'shop_id',
        'name',
        'slug',
        'description',
        'short_description',
        'category',
        'sub_category',
        'location',
        'model',
        'marque',
        'price',
        'old_price',
        'discount_percent',
        'is_on_sale',
        'currency',
        'min_order',
        'verified',
        'status',
        'commission_type',
        'commission_value',
        'features',
        'specifications',
        'images',
        'rating',
    ];

    protected $casts = [
        'verified' => 'boolean',
        'is_on_sale' => 'boolean',
        'price' => 'decimal:2',
        'old_price' => 'decimal:2',
        'discount_percent' => 'decimal:2',
        'commission_value' => 'decimal:2',
        'rating' => 'decimal:2',
        'features' => 'array',
        'specifications' => 'array',
        'images' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(ProductComment::class);
    }

    public function approvedComments(): HasMany
    {
        return $this->hasMany(ProductComment::class)->where('approved', true);
    }

    /**
     * Update product rating based on all comments
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
        // Use comments_count from withCount if available, otherwise query
        return $this->comments_count ?? $this->comments()->count();
    }
}
