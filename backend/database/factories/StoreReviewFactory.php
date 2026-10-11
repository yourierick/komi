<?php

namespace Database\Factories;

use App\Models\StoreReview;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StoreReview>
 */
class StoreReviewFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'shop_id' => \App\Models\Shop::factory(),
            'rating' => fake()->numberBetween(1, 5),
            'comment' => fake()->paragraph(),
        ];
    }
}
