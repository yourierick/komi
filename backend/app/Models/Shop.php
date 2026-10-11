<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shop extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'description',
        'logo',
        'banner',
        'email',
        'phone',
        'address',
        'city',
        'country',
        'rccm',
        'status',
        'verified',
        'rating',
        'total_reviews',
        'social_links',
        'business_hours',
    ];

    protected $casts = [
        'verified' => 'boolean',
        'rating' => 'decimal:2',
        'social_links' => 'array',
        'business_hours' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(StoreReview::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
