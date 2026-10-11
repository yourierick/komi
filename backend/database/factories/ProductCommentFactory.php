<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductComment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductCommentFactory extends Factory
{
    protected $model = ProductComment::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'product_id' => Product::factory(),
            'comment' => $this->faker->paragraph(),
            'rating' => $this->faker->randomFloat(2, 1, 5),
            'approved' => true,
        ];
    }
}
