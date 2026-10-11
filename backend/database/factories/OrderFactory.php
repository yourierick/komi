<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'rental_id' => null,
            'order_number' => 'ORD-' . strtoupper(fake()->unique()->lexify('????????')),
            'status' => 'under_negotiation',
            'unit_selling_price' => fake()->randomFloat(2, 10, 1000),
            'quantity' => fake()->numberBetween(1, 10),
            'subtotal' => fake()->randomFloat(2, 10, 1000),
            'tax_amount' => 0,
            'shipping_amount' => 0,
            'discount_amount' => 0,
            'total_amount' => fake()->randomFloat(2, 10, 1000),
            'commission_amount' => 0,
            'currency' => 'USD',
            'payment_method' => 'cash_on_delivery',
            'payment_status' => 'pending',
        ];
    }
}
