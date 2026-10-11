<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ResellerLink;
use App\Models\Rental;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ResellerLinkFactory extends Factory
{
    protected $model = ResellerLink::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'product_id' => null,
            'rental_id' => null,
            'code' => strtoupper(Str::random(8)),
        ];
    }

    public function forProduct(Product $product): self
    {
        return $this->state(fn (array $attributes) => [
            'product_id' => $product->id,
            'rental_id' => null,
        ]);
    }

    public function forRental(Rental $rental): self
    {
        return $this->state(fn (array $attributes) => [
            'product_id' => null,
            'rental_id' => $rental->id,
        ]);
    }
}
