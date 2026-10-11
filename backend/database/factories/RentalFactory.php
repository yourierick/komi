<?php

namespace Database\Factories;

use App\Models\Rental;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Rental>
 */
class RentalFactory extends Factory
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
            'title' => fake()->words(3, true),
            'slug' => fake()->slug(),
            'description' => fake()->paragraph(),
            'category' => fake()->randomElement([
                'real estate',
                'Vehicles',
                'Machinery',
                'Electronics',
                'Events',
                'Leisure',
                'Furniture',
                'Logistics',
                'Agriculture',
                'other',
            ]),
            'sub_category' => fake()->word(),
            'location' => fake()->city(),
            'city' => fake()->city(),
            'country' => fake()->country(),
            'price' => fake()->randomFloat(2, 10, 1000),
            'currency' => 'USD',
            'payment_frequency' => fake()->randomElement(['daily', 'weekly', 'monthly']),
            'status' => fake()->randomElement(['available', 'rented', 'maintenance', 'unavailable']),
            'verified' => fake()->boolean(),
            'rating' => fake()->randomFloat(2, 0, 5),
            'conditions' => fake()->words(5),
            'specifications' => fake()->words(5),
            'images' => fake()->numberBetween(0, 1) ? [fake()->imageUrl()] : null,
        ];
    }
}
