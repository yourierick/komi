<?php

namespace Tests\Feature;

use App\Models\Rental;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicRentalControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_public_rentals()
    {
        $user = User::factory()->create();
        Rental::factory()->count(3)->create(['user_id' => $user->id, 'status' => 'available']);
        Rental::factory()->create(['user_id' => $user->id, 'status' => 'rented']);

        $response = $this->getJson('/api/v1/public/rentals');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'title',
                        'slug',
                        'description',
                        'category',
                        'price',
                        'currency',
                        'payment_frequency',
                        'images',
                        'status',
                    ]
                ]
            ]);
    }

    public function test_index_filters_by_category()
    {
        $user = User::factory()->create();
        Rental::factory()->create(['user_id' => $user->id, 'category' => 'Vehicles', 'status' => 'available']);
        Rental::factory()->create(['user_id' => $user->id, 'category' => 'Electronics', 'status' => 'available']);

        $response = $this->getJson('/api/v1/public/rentals?category=Vehicles');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.category', 'Vehicles');
    }

    public function test_index_only_returns_available_rentals()
    {
        $user = User::factory()->create();
        Rental::factory()->count(2)->create(['user_id' => $user->id, 'status' => 'available']);
        Rental::factory()->count(3)->create(['user_id' => $user->id, 'status' => 'rented']);

        $response = $this->getJson('/api/v1/public/rentals');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_show_returns_public_rental()
    {
        $user = User::factory()->create();
        $rental = Rental::factory()->create(['user_id' => $user->id, 'status' => 'available']);

        $response = $this->getJson("/api/v1/public/rentals/{$rental->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $rental->id)
            ->assertJsonPath('data.title', $rental->title)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'title',
                    'slug',
                    'description',
                    'category',
                    'sub_category',
                    'location',
                    'city',
                    'country',
                    'price',
                    'currency',
                    'payment_frequency',
                    'verified',
                    'rating',
                    'total_reviews',
                    'status',
                    'conditions',
                    'specifications',
                    'images',
                ]
            ]);
    }

    public function test_show_returns_404_for_unavailable_rental()
    {
        $user = User::factory()->create();
        $rental = Rental::factory()->create(['user_id' => $user->id, 'status' => 'rented']);

        $response = $this->getJson("/api/v1/public/rentals/{$rental->id}");

        $response->assertStatus(404);
    }

    public function test_show_returns_404_for_non_existent_rental()
    {
        $response = $this->getJson('/api/v1/public/rentals/999');

        $response->assertStatus(404);
    }

    public function test_index_returns_categories_with_counts()
    {
        $user = User::factory()->create();
        Rental::factory()->count(3)->create(['user_id' => $user->id, 'category' => 'Vehicles', 'status' => 'available']);
        Rental::factory()->count(2)->create(['user_id' => $user->id, 'category' => 'Electronics', 'status' => 'available']);
        Rental::factory()->create(['user_id' => $user->id, 'category' => 'Vehicles', 'status' => 'rented']);

        $response = $this->getJson('/api/v1/public/rentals/categories');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'name',
                        'count',
                    ]
                ]
            ])
            ->assertJsonCount(2, 'data');
    }
}
