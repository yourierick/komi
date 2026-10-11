<?php

namespace Tests\Feature;

use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicServiceControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_public_services()
    {
        $user = User::factory()->create();
        Service::factory()->count(3)->create(['user_id' => $user->id, 'status' => 'available']);
        Service::factory()->create(['user_id' => $user->id, 'status' => 'unavailable']);

        $response = $this->getJson('/api/v1/public/services');

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
                        'sub_category',
                        'location',
                        'city',
                        'country',
                        'price',
                        'currency',
                        'payment_frequency',
                        'status',
                        'verified',
                        'rating',
                        'total_reviews',
                        'features',
                        'specifications',
                        'images',
                        'video',
                        'availability',
                        'created_at',
                        'updated_at',
                    ]
                ]
            ]);
    }

    public function test_index_filters_by_category()
    {
        $user = User::factory()->create();
        Service::factory()->create(['user_id' => $user->id, 'category' => 'consulting', 'status' => 'available']);
        Service::factory()->create(['user_id' => $user->id, 'category' => 'cleaning', 'status' => 'available']);

        $response = $this->getJson('/api/v1/public/services?category=consulting');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.category', 'consulting');
    }

    public function test_index_only_returns_available_services()
    {
        $user = User::factory()->create();
        Service::factory()->count(2)->create(['user_id' => $user->id, 'status' => 'available']);
        Service::factory()->count(3)->create(['user_id' => $user->id, 'status' => 'unavailable']);

        $response = $this->getJson('/api/v1/public/services');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_show_returns_public_service()
    {
        $user = User::factory()->create();
        $service = Service::factory()->create(['user_id' => $user->id, 'status' => 'available']);

        $response = $this->getJson("/api/v1/public/services/{$service->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $service->id)
            ->assertJsonPath('data.title', $service->title)
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
                    'status',
                    'verified',
                    'rating',
                    'total_reviews',
                    'features',
                    'specifications',
                    'images',
                    'video',
                    'availability',
                    'created_at',
                    'updated_at',
                ]
            ]);
    }

    public function test_show_returns_404_for_unavailable_service()
    {
        $user = User::factory()->create();
        $service = Service::factory()->create(['user_id' => $user->id, 'status' => 'unavailable']);

        $response = $this->getJson("/api/v1/public/services/{$service->id}");

        $response->assertStatus(404);
    }

    public function test_show_returns_404_for_non_existent_service()
    {
        $response = $this->getJson('/api/v1/public/services/999');

        $response->assertStatus(404);
    }

    public function test_index_returns_categories_with_counts()
    {
        $user = User::factory()->create();
        Service::factory()->count(3)->create(['user_id' => $user->id, 'category' => 'consulting', 'status' => 'available']);
        Service::factory()->count(2)->create(['user_id' => $user->id, 'category' => 'cleaning', 'status' => 'available']);
        Service::factory()->create(['user_id' => $user->id, 'category' => 'consulting', 'status' => 'unavailable']);

        $response = $this->getJson('/api/v1/public/services/categories');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'name',
                        'count',
                    ]
                ]
            ])
            ->assertJsonFragment(['name' => 'consulting', 'count' => 3])
            ->assertJsonFragment(['name' => 'cleaning', 'count' => 2]);
    }
}
