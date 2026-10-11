<?php

namespace Tests\Feature;

use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServiceControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_index_returns_services_for_authenticated_user()
    {
        Service::factory()->count(3)->create(['user_id' => $this->user->id]);
        Service::factory()->count(2)->create(); // Other user's services

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/services');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_index_requires_authentication()
    {
        $response = $this->getJson('/api/v1/services');

        $response->assertStatus(401);
    }

    public function test_store_creates_service_for_authenticated_user()
    {
        $serviceData = [
            'title' => 'Web Development Service',
            'description' => 'Professional web development services',
            'category' => 'software engineering',
            'sub_category' => 'Full Stack',
            'location' => 'Remote',
            'city' => 'Paris',
            'country' => 'France',
            'price' => 50.00,
            'currency' => 'EUR',
            'payment_frequency' => 'hourly',
            'status' => 'available',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/services', $serviceData);

        $response->assertStatus(201)
            ->assertJsonStructure(['data' => [
                'id', 'title', 'description', 'category', 'price', 'currency',
            ]]);

        $this->assertDatabaseHas('services', [
            'title' => 'Web Development Service',
            'user_id' => $this->user->id,
        ]);
    }

    public function test_store_requires_authentication()
    {
        $response = $this->postJson('/api/v1/services', [
            'title' => 'Test Service',
            'category' => 'consulting',
            'price' => 100,
        ]);

        $response->assertStatus(401);
    }

    public function test_store_requires_title()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/services', [
                'category' => 'consulting',
                'price' => 100,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title']);
    }

    public function test_store_requires_category()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/services', [
                'title' => 'Test Service',
                'price' => 100,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['category']);
    }

    public function test_store_requires_price()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/services', [
                'title' => 'Test Service',
                'category' => 'consulting',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['price']);
    }

    public function test_store_validates_category_enum()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/services', [
                'title' => 'Test Service',
                'category' => 'invalid-category',
                'price' => 99.99,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['category']);
    }

    public function test_store_validates_status_enum()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/services', [
                'title' => 'Test Service',
                'category' => 'consulting',
                'price' => 99.99,
                'status' => 'invalid-status',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_store_validates_payment_frequency_enum()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/services', [
                'title' => 'Test Service',
                'category' => 'consulting',
                'price' => 99.99,
                'payment_frequency' => 'invalid-frequency',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['payment_frequency']);
    }

    public function test_show_returns_service_for_authenticated_user()
    {
        $service = Service::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/v1/services/{$service->id}");

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => [
                'id', 'title', 'description', 'category', 'price', 'currency',
            ]]);
    }

    public function test_show_requires_authentication()
    {
        $service = Service::factory()->create();

        $response = $this->getJson("/api/v1/services/{$service->id}");

        $response->assertStatus(401);
    }

    public function test_show_returns_404_for_non_existent_service()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/services/999999');

        $response->assertStatus(404);
    }

    public function test_update_modifies_service_for_authenticated_user()
    {
        $service = Service::factory()->create(['user_id' => $this->user->id]);

        $updateData = [
            'title' => 'Updated Service Title',
            'price' => 150.00,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/v1/services/{$service->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonPath('data.title', 'Updated Service Title')
            ->assertJsonPath('data.price', '150.00');

        $this->assertDatabaseHas('services', [
            'id' => $service->id,
            'title' => 'Updated Service Title',
        ]);
    }

    public function test_update_requires_authentication()
    {
        $service = Service::factory()->create();

        $response = $this->putJson("/api/v1/services/{$service->id}", [
            'title' => 'Updated',
        ]);

        $response->assertStatus(401);
    }

    public function test_delete_removes_service_for_authenticated_user()
    {
        $service = Service::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/v1/services/{$service->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Service deleted successfully']);

        $this->assertDatabaseMissing('services', [
            'id' => $service->id,
        ]);
    }

    public function test_delete_requires_authentication()
    {
        $service = Service::factory()->create();

        $response = $this->deleteJson("/api/v1/services/{$service->id}");

        $response->assertStatus(401);
    }

    public function test_delete_returns_404_for_non_existent_service()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson('/api/v1/services/999999');

        $response->assertStatus(404);
    }
}
