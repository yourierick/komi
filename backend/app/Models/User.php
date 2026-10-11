<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'address',
        'phone',
        'nationality',
        'picture',
        'rating',
        'status',
        'identity_card_type',
        'identity_card',
        'id_card_number'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'certified' => 'boolean',
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'rating' => 'decimal:2',
        ];
    }

    public function shops()
    {
        return $this->hasMany(Shop::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(StoreReview::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function rentals(): HasMany
    {
        return $this->hasMany(Rental::class);
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    public function supplierReviews(): HasMany
    {
        return $this->hasMany(SupplierReview::class, 'supplier_id');
    }

    public function approvedSupplierReviews(): HasMany
    {
        return $this->hasMany(SupplierReview::class, 'supplier_id')->where('approved', true);
    }

    public function givenSupplierReviews(): HasMany
    {
        return $this->hasMany(SupplierReview::class, 'user_id');
    }

    public function updateRating(): void
    {
        $averageRating = $this->supplierReviews()->avg('rating');
        $this->update(['rating' => $averageRating ?? 0]);
    }

    public function getTotalSupplierReviewsAttribute(): int
    {
        return $this->supplier_reviews_count ?? $this->supplierReviews()->count();
    }
}
