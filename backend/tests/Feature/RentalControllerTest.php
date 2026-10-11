<?php

namespace Tests\Feature;

use App\Models\Rental;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RentalControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_rentals_for_authenticated_user()
    {
        $user = User::factory()->create();
        Rental::factory()->count(2)->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)
            ->getJson('/api/v1/rentals');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_index_requires_authentication()
    {
        $response = $this->getJson('/api/v1/rentals');

        $response->assertStatus(401);
    }

    public function test_store_creates_rental_for_authenticated_user()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/rentals', [
                'title' => 'Test Rental',
                'slug' => 'test-rental',
                'description' => 'Test description',
                'category' => 'Vehicles',
                'price' => 99.99,
                'currency' => 'USD',
                'payment_frequency' => 'daily',
                'status' => 'available',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'title',
                    'slug',
                    'category',
                    'price',
                ],
            ]);

        $this->assertDatabaseHas('rentals', [
            'user_id' => $user->id,
            'title' => 'Test Rental',
        ]);
    }

    public function test_store_requires_authentication()
    {
        $response = $this->postJson('/api/v1/rentals', [
            'title' => 'Test Rental',
        ]);

        $response->assertStatus(401);
    }

    public function test_store_requires_title()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/rentals', [
                'price' => 99.99,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title']);
    }

    public function test_store_requires_category()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/rentals', [
                'title' => 'Test Rental',
                'price' => 99.99,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['category']);
    }

    public function test_store_requires_price()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/rentals', [
                'title' => 'Test Rental',
                'category' => 'Vehicles',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['price']);
    }

    public function test_store_validates_category_enum()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/rentals', [
                'title' => 'Test Rental',
                'category' => 'invalid-category',
                'price' => 99.99,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['category']);
    }

    public function test_store_validates_status_enum()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/rentals', [
                'title' => 'Test Rental',
                'category' => 'Vehicles',
                'price' => 99.99,
                'status' => 'invalid-status',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_store_validates_payment_frequency_enum()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/rentals', [
                'title' => 'Test Rental',
                'category' => 'Vehicles',
                'price' => 99.99,
                'payment_frequency' => 'invalid-frequency',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['payment_frequency']);
    }

    public function test_show_returns_rental_for_authenticated_user()
    {
        $user = User::factory()->create();
        $rental = Rental::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)
            ->getJson("/api/v1/rentals/{$rental->id}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $rental->id,
                    'title' => $rental->title,
                ],
            ]);
    }

    public function test_show_requires_authentication()
    {
        $rental = Rental::factory()->create();

        $response = $this->getJson("/api/v1/rentals/{$rental->id}");

        $response->assertStatus(401);
    }

    public function test_show_returns_404_for_non_existent_rental()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->getJson('/api/v1/rentals/999');

        $response->assertStatus(404);
    }

    public function test_update_modifies_rental_for_authenticated_user()
    {
        $user = User::factory()->create();
        $rental = Rental::factory()->create(['user_id' => $user->id, 'title' => 'Old Title']);

        $response = $this->actingAs($user)
            ->putJson("/api/v1/rentals/{$rental->id}", [
                'title' => 'Updated Title',
                'price' => 149.99,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $rental->id,
                    'title' => 'Updated Title',
                ],
            ]);

        $this->assertDatabaseHas('rentals', [
            'id' => $rental->id,
            'title' => 'Updated Title',
        ]);
    }

    public function test_update_requires_authentication()
    {
        $rental = Rental::factory()->create();

        $response = $this->putJson("/api/v1/rentals/{$rental->id}", [
            'title' => 'Updated Title',
        ]);

        $response->assertStatus(401);
    }

    public function test_delete_removes_rental_for_authenticated_user()
    {
        $user = User::factory()->create();
        $rental = Rental::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)
            ->deleteJson("/api/v1/rentals/{$rental->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('rentals', [
            'id' => $rental->id,
        ]);
    }

    public function test_delete_requires_authentication()
    {
        $rental = Rental::factory()->create();

        $response = $this->deleteJson("/api/v1/rentals/{$rental->id}");

        $response->assertStatus(401);
    }

    public function test_delete_returns_404_for_non_existent_rental()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->deleteJson('/api/v1/rentals/999');

        $response->assertStatus(404);
    }
}
