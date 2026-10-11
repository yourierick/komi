<?php

namespace Database\Factories;

use App\Models\Service;
use App\Models\ServiceComment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ServiceCommentFactory extends Factory
{
    protected $model = ServiceComment::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'service_id' => Service::factory(),
            'comment' => $this->faker->paragraph(),
            'rating' => $this->faker->randomFloat(2, 1, 5),
            'approved' => true,
        ];
    }
}
