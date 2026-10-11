<?php

namespace Database\Factories;

use App\Models\Rental;
use App\Models\RentalComment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class RentalCommentFactory extends Factory
{
    protected $model = RentalComment::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'rental_id' => Rental::factory(),
            'comment' => $this->faker->paragraph(),
            'rating' => $this->faker->randomFloat(2, 1, 5),
            'approved' => true,
        ];
    }
}
