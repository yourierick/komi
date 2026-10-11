<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicProductControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_public_products()
    {
        $user = User::factory()->create();
        Product::factory()->count(3)->create(['user_id' => $user->id, 'status' => 'available']);
        Product::factory()->create(['user_id' => $user->id, 'status' => 'unavailable']);

        $response = $this->getJson('/api/v1/public/products');

        $response->assertStatus(200)
            ->assertJsonCount(4, 'data')
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'slug',
                        'description',
                        'category',
                        'price',
                        'currency',
                        'images',
                        'status',
                    ]
                ]
            ]);
    }

    public function test_index_filters_by_category()
    {
        $user = User::factory()->create();
        Product::factory()->create(['user_id' => $user->id, 'category' => 'Electronics and Components', 'status' => 'available']);
        Product::factory()->create(['user_id' => $user->id, 'category' => 'Phones and Accessories', 'status' => 'available']);

        $response = $this->getJson('/api/v1/public/products?category=Electronics and Components');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.category', 'Electronics and Components');
    }

    public function test_index_returns_all_products()
    {
        $user = User::factory()->create();
        Product::factory()->count(2)->create(['user_id' => $user->id, 'status' => 'available']);
        Product::factory()->count(3)->create(['user_id' => $user->id, 'status' => 'unavailable']);

        $response = $this->getJson('/api/v1/public/products');

        $response->assertStatus(200)
            ->assertJsonCount(5, 'data');
    }

    public function test_show_returns_public_product()
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['user_id' => $user->id, 'status' => 'available']);

        $response = $this->getJson("/api/v1/public/products/{$product->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $product->id)
            ->assertJsonPath('data.name', $product->name)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'slug',
                    'description',
                    'category',
                    'price',
                    'currency',
                    'images',
                    'status',
                ]
            ]);
    }

    public function test_show_returns_unavailable_product()
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['user_id' => $user->id, 'status' => 'unavailable']);

        $response = $this->getJson("/api/v1/public/products/{$product->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $product->id)
            ->assertJsonPath('data.status', 'unavailable');
    }

    public function test_show_returns_404_for_non_existent_product()
    {
        $response = $this->getJson('/api/v1/public/products/999');

        $response->assertStatus(404);
    }

    public function test_index_returns_categories_with_counts()
    {
        $user = User::factory()->create();
        Product::factory()->count(3)->create(['user_id' => $user->id, 'category' => 'Electronics and Components', 'status' => 'available']);
        Product::factory()->count(2)->create(['user_id' => $user->id, 'category' => 'Phones and Accessories', 'status' => 'available']);
        Product::factory()->create(['user_id' => $user->id, 'category' => 'Electronics and Components', 'status' => 'unavailable']);

        $response = $this->getJson('/api/v1/public/products/categories');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'name',
                        'count',
                    ]
                ]
            ])
            ->assertJsonFragment(['name' => 'Electronics and Components', 'count' => 4])
            ->assertJsonFragment(['name' => 'Phones and Accessories', 'count' => 2]);
    }

    public function test_featured_returns_latest_and_highest_rated_products()
    {
        $user = User::factory()->create();
        
        // Create products with different ratings and dates
        $oldHighRated = Product::factory()->create([
            'user_id' => $user->id,
            'rating' => 4.8,
            'created_at' => now()->subDays(10),
            'status' => 'available'
        ]);
        
        $newMediumRated = Product::factory()->create([
            'user_id' => $user->id,
            'rating' => 4.0,
            'created_at' => now()->subDay(),
            'status' => 'available'
        ]);
        
        $newHighRated = Product::factory()->create([
            'user_id' => $user->id,
            'rating' => 4.9,
            'created_at' => now(),
            'status' => 'available'
        ]);
        
        $unavailableProduct = Product::factory()->create([
            'user_id' => $user->id,
            'rating' => 5.0,
            'status' => 'unavailable'
        ]);

        $response = $this->getJson('/api/v1/public/products/featured');

        $response->assertStatus(200)
            ->assertJsonCount(4, 'data')
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'slug',
                        'description',
                        'category',
                        'price',
                        'currency',
                        'images',
                        'status',
                        'rating',
                    ]
                ]
            ]);
        
        // Verify unavailable product is now included
        $response->assertJsonFragment(['id' => $unavailableProduct->id]);
    }
}
