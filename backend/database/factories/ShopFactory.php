<?php

namespace Database\Factories;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<Shop>
 */
class ShopFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Shop::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->company(),
            'slug' => fake()->slug(),
            'description' => fake()->text(),
            'email' => fake()->email(),
            'phone' => fake()->phoneNumber(),
            'address' => fake()->address(),
            'city' => fake()->city(),
            'country' => fake()->country(),
            'rccm' => fake()->regexify('[A-Z]{3}[0-9]{6}'),
            'status' => fake()->randomElement(['active', 'inactive', 'suspended']),
            'verified' => fake()->boolean(),
            'rating' => fake()->randomFloat(1, 0, 5),
            'total_reviews' => fake()->numberBetween(0, 1000),
            'social_links' => [
                'facebook' => fake()->url(),
                'twitter' => fake()->url(),
                'instagram' => fake()->url(),
            ],
            'business_hours' => [
                'monday' => '09:00-18:00',
                'tuesday' => '09:00-18:00',
                'wednesday' => '09:00-18:00',
                'thursday' => '09:00-18:00',
                'friday' => '09:00-18:00',
                'saturday' => '10:00-16:00',
                'sunday' => 'closed',
            ],
        ];
    }
}
