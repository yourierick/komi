<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Service>
 */
class ServiceFactory extends Factory
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
            'title' => fake()->sentence(4),
            'slug' => fake()->slug(),
            'description' => fake()->paragraph(),
            'category' => fake()->randomElement(['consulting', 'maintenance', 'delivery', 'cleaning', 'education', 'health', 'beauty', 'tech', 'legal', 'finance', 'printing', 'software engineering', 'electrical', 'electronic and repair', 'painting', 'musician']),
            'sub_category' => fake()->word(),
            'location' => fake()->address(),
            'city' => fake()->city(),
            'country' => fake()->country(),
            'price' => fake()->randomFloat(2, 10, 1000),
            'currency' => fake()->randomElement(['USD', 'EUR', 'XAF', 'CDF']),
            'payment_frequency' => fake()->randomElement(['hourly', 'daily', 'weekly', 'monthly', 'per_project']),
            'status' => fake()->randomElement(['available', 'unavailable']),
            'verified' => fake()->boolean(),
            'rating' => fake()->randomFloat(2, 0, 5),
            'features' => [
                ['key' => fake()->word(), 'value' => fake()->word()],
                ['key' => fake()->word(), 'value' => fake()->word()],
            ],
            'specifications' => [
                ['key' => fake()->word(), 'value' => fake()->word()],
                ['key' => fake()->word(), 'value' => fake()->word()],
            ],
            'images' => [
                fake()->imageUrl(),
                fake()->imageUrl(),
            ],
            'video' => fake()->url(),
            'availability' => [
                'monday' => ['09:00', '17:00'],
                'tuesday' => ['09:00', '17:00'],
            ],
        ];
    }
}
