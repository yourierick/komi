<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
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
            'name' => fake()->words(3, true),
            'slug' => fake()->slug(),
            'description' => fake()->paragraph(),
            'category' => fake()->randomElement([
                'Electronics and Components',
                'Applications and New Technologies',
                'Phones and Accessories',
                'Agriculture, Livestock, and Fishing',
                'Wearables and Accessories',
                'Home and decor',
                'Makeup',
                'Parents, Children, and Games',
                'Jewelry, Eyewear, and Watches',
                'Luggage, Bags, Cases',
                'Sports and Fitness',
                'Books, Media, and Games',
                'office supplies',
                'Food and Beverages',
                'Buildings',
                'Home Appliances',
                'shoes and accessories',
                'Vehicles and Transportation',
                'Electrical Equipment and Supplies',
                'Renewable Energy',
                'hardware and home improvement',
                'vehicle parts and accessories',
                'Construction and Real Estate',
                'Medical and Health',
                'Packaging and Printing',
                'Computers and Accessories',
            ]),
            'sub_category' => fake()->word(),
            'location' => fake()->city(),
            'price' => fake()->randomFloat(2, 10, 1000),
            'currency' => 'USD',
            'min_order' => fake()->numberBetween(1, 10),
            'verified' => fake()->boolean(),
            'status' => fake()->randomElement(['available', 'unavailable']),
            'commission_type' => fake()->randomElement(['none', 'fixed', 'percentage']),
            'commission_value' => fake()->randomFloat(2, 0, 50),
            'features' => fake()->words(5),
            'specifications' => fake()->words(5),
            'images' => fake()->numberBetween(0, 1) ? [fake()->imageUrl()] : null,
        ];
    }
}
