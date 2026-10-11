<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'slug',
        'description',
        'category',
        'sub_category',
        'location',
        'city',
        'country',
        'price',
        'currency',
        'payment_frequency',
        'status',
        'verified',
        'rating',
        'features',
        'specifications',
        'images',
        'video',
        'availability',
    ];

    protected $casts = [
        'verified' => 'boolean',
        'price' => 'decimal:2',
        'rating' => 'decimal:2',
        'features' => 'array',
        'specifications' => 'array',
        'images' => 'array',
        'availability' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(ServiceComment::class);
    }

    public function approvedComments(): HasMany
    {
        return $this->hasMany(ServiceComment::class)->where('approved', true);
    }

    /**
     * Update service rating based on all comments
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
}
