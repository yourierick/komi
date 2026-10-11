<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_products_for_authenticated_user()
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $product1 = Product::factory()->create(['user_id' => $user->id, 'shop_id' => $shop->id]);
        $product2 = Product::factory()->create(['user_id' => $user->id, 'shop_id' => $shop->id]);

        $response = $this->actingAs($user)
            ->getJson('/api/v1/products');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_index_requires_authentication()
    {
        $response = $this->getJson('/api/v1/products');

        $response->assertStatus(401);
    }

    public function test_store_creates_product_for_authenticated_user()
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)
            ->postJson('/api/v1/products', [
                'name' => 'Test Product',
                'slug' => 'test-product',
                'description' => 'Test description',
                'category' => 'Electronics and Components',
                'price' => 99.99,
                'currency' => 'USD',
                'min_order' => 1,
                'status' => 'available',
                'shop_id' => $shop->id,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'slug',
                    'category',
                    'price',
                ],
            ]);

        $this->assertDatabaseHas('products', [
            'user_id' => $user->id,
            'shop_id' => $shop->id,
            'name' => 'Test Product',
        ]);
    }

    public function test_store_requires_authentication()
    {
        $response = $this->postJson('/api/v1/products', [
            'name' => 'Test Product',
        ]);

        $response->assertStatus(401);
    }

    public function test_store_requires_name()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/products', [
                'price' => 99.99,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_store_requires_category()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/products', [
                'name' => 'Test Product',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['category']);
    }

    public function test_store_requires_price()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/products', [
                'name' => 'Test Product',
                'category' => 'Electronics and Components',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['price']);
    }

    public function test_store_validates_category_enum()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/products', [
                'name' => 'Test Product',
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
            ->postJson('/api/v1/products', [
                'name' => 'Test Product',
                'category' => 'Electronics and Components',
                'price' => 99.99,
                'status' => 'invalid-status',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_store_accepts_new_fields()
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)
            ->postJson('/api/v1/products', [
                'name' => 'Test Product',
                'description' => 'Test description',
                'short_description' => 'Short desc',
                'category' => 'Electronics and Components',
                'price' => 99.99,
                'old_price' => 149.99,
                'discount_percent' => 33.33,
                'is_on_sale' => true,
                'location' => 'Paris',
                'model' => 'Model X',
                'marque' => 'Brand Y',
                'currency' => 'USD',
                'min_order' => 1,
                'status' => 'available',
                'shop_id' => $shop->id,
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('products', [
            'user_id' => $user->id,
            'shop_id' => $shop->id,
            'name' => 'Test Product',
            'short_description' => 'Short desc',
            'old_price' => 149.99,
            'discount_percent' => 33.33,
            'is_on_sale' => true,
            'model' => 'Model X',
            'marque' => 'Brand Y',
        ]);
    }

    public function test_update_accepts_new_fields()
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $product = Product::factory()->create(['user_id' => $user->id, 'shop_id' => $shop->id, 'name' => 'Old Name']);

        $response = $this->actingAs($user)
            ->putJson("/api/v1/products/{$product->id}", [
                'short_description' => 'Updated short desc',
                'old_price' => 199.99,
                'discount_percent' => 50.00,
                'is_on_sale' => true,
                'model' => 'Updated Model',
                'marque' => 'Updated Brand',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'short_description' => 'Updated short desc',
            'old_price' => 199.99,
            'discount_percent' => 50.00,
            'is_on_sale' => true,
            'model' => 'Updated Model',
            'marque' => 'Updated Brand',
        ]);
    }

    public function test_show_returns_product_for_authenticated_user()
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $product = Product::factory()->create(['user_id' => $user->id, 'shop_id' => $shop->id]);

        $response = $this->actingAs($user)
            ->getJson("/api/v1/products/{$product->id}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $product->id,
                    'name' => $product->name,
                ],
            ]);
    }

    public function test_show_requires_authentication()
    {
        $product = Product::factory()->create();

        $response = $this->getJson("/api/v1/products/{$product->id}");

        $response->assertStatus(401);
    }

    public function test_show_returns_404_for_non_existent_product()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->getJson('/api/v1/products/999');

        $response->assertStatus(404);
    }

    public function test_update_modifies_product_for_authenticated_user()
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $product = Product::factory()->create(['user_id' => $user->id, 'shop_id' => $shop->id, 'name' => 'Old Name']);

        $response = $this->actingAs($user)
            ->putJson("/api/v1/products/{$product->id}", [
                'name' => 'Updated Name',
                'price' => 149.99,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $product->id,
                    'name' => 'Updated Name',
                ],
            ]);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Updated Name',
        ]);
    }

    public function test_update_requires_authentication()
    {
        $product = Product::factory()->create();

        $response = $this->putJson("/api/v1/products/{$product->id}", [
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(401);
    }

    public function test_delete_removes_product_for_authenticated_user()
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $product = Product::factory()->create(['user_id' => $user->id, 'shop_id' => $shop->id]);

        $response = $this->actingAs($user)
            ->deleteJson("/api/v1/products/{$product->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('products', [
            'id' => $product->id,
        ]);
    }

    public function test_delete_requires_authentication()
    {
        $product = Product::factory()->create();

        $response = $this->deleteJson("/api/v1/products/{$product->id}");

        $response->assertStatus(401);
    }

    public function test_delete_returns_404_for_non_existent_product()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->deleteJson('/api/v1/products/999');

        $response->assertStatus(404);
    }
}
