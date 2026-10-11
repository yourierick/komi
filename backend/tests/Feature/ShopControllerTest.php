<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ShopControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_all_shops_for_authenticated_user()
    {
        $user = User::factory()->create();
        $shop1 = Shop::factory()->create(['user_id' => $user->id]);
        $shop2 = Shop::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)
            ->getJson('/api/v1/shops');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_index_requires_authentication()
    {
        $response = $this->getJson('/api/v1/shops');

        $response->assertStatus(401);
    }

    public function test_store_creates_shop_for_authenticated_user()
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/shops', [
                'name' => 'My Shop',
                'description' => 'A great shop',
                'email' => 'shop@example.com',
                'phone' => '+1234567890',
                'address' => '123 Main St',
                'city' => 'Paris',
                'country' => 'France',
                'rccm' => 'RCCM123456',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'slug',
                    'description',
                ],
            ]);

        $this->assertDatabaseHas('shops', [
            'user_id' => $user->id,
            'name' => 'My Shop',
        ]);
    }

    public function test_store_requires_authentication()
    {
        $response = $this->postJson('/api/v1/shops', [
            'name' => 'My Shop',
        ]);

        $response->assertStatus(401);
    }

    public function test_store_requires_name()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/shops', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_store_generates_unique_slug()
    {
        $user = User::factory()->create();
        $shop1 = Shop::factory()->create(['user_id' => $user->id, 'name' => 'My Shop']);

        $response = $this->actingAs($user)
            ->postJson('/api/v1/shops', [
                'name' => 'My Shop',
            ]);

        $response->assertStatus(201);

        $shop2 = Shop::where('user_id', $user->id)->where('name', 'My Shop')->where('id', '!=', $shop1->id)->first();
        $this->assertNotNull($shop2);
        $this->assertNotEquals($shop1->slug, $shop2->slug);
    }

    public function test_store_validates_status_enum()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/shops', [
                'name' => 'My Shop',
                'status' => 'invalid_status',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_show_returns_shop_for_authenticated_user()
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)
            ->getJson("/api/v1/shops/{$shop->id}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $shop->id,
                    'name' => $shop->name,
                    'slug' => $shop->slug,
                ],
            ]);
    }

    public function test_show_requires_authentication()
    {
        $shop = Shop::factory()->create();

        $response = $this->getJson("/api/v1/shops/{$shop->id}");

        $response->assertStatus(401);
    }

    public function test_show_returns_404_for_non_existent_shop()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->getJson('/api/v1/shops/999');

        $response->assertStatus(404);
    }

    public function test_update_modifies_shop_for_authenticated_user()
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id, 'name' => 'Old Name']);

        $response = $this->actingAs($user)
            ->putJson("/api/v1/shops/{$shop->id}", [
                'name' => 'Updated Name',
                'description' => 'Updated description',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $shop->id,
                    'name' => 'Updated Name',
                ],
            ]);

        $this->assertDatabaseHas('shops', [
            'id' => $shop->id,
            'name' => 'Updated Name',
        ]);
    }

    public function test_update_requires_authentication()
    {
        $shop = Shop::factory()->create();

        $response = $this->putJson("/api/v1/shops/{$shop->id}", [
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(401);
    }

    public function test_update_validates_unique_slug_excluding_current()
    {
        $user = User::factory()->create();
        $shop1 = Shop::factory()->create(['user_id' => $user->id, 'slug' => 'shop-1']);
        $shop2 = Shop::factory()->create(['user_id' => $user->id, 'slug' => 'shop-2']);

        $response = $this->actingAs($user)
            ->putJson("/api/v1/shops/{$shop1->id}", [
                'slug' => 'shop-2',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['slug']);
    }

    public function test_delete_removes_shop_for_authenticated_user()
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)
            ->deleteJson("/api/v1/shops/{$shop->id}");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Shop deleted successfully',
            ]);

        $this->assertDatabaseMissing('shops', [
            'id' => $shop->id,
        ]);
    }

    public function test_delete_requires_authentication()
    {
        $shop = Shop::factory()->create();

        $response = $this->deleteJson("/api/v1/shops/{$shop->id}");

        $response->assertStatus(401);
    }

    public function test_delete_returns_404_for_non_existent_shop()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->deleteJson('/api/v1/shops/999');

        $response->assertStatus(404);
    }

    public function test_products_returns_products_for_authenticated_user_shop()
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $product1 = Product::factory()->create(['user_id' => $user->id, 'shop_id' => $shop->id]);
        $product2 = Product::factory()->create(['user_id' => $user->id, 'shop_id' => $shop->id]);

        $response = $this->actingAs($user)
            ->getJson("/api/v1/shops/{$shop->id}/products");

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['id' => $product1->id, 'name' => $product1->name])
            ->assertJsonFragment(['id' => $product2->id, 'name' => $product2->name]);
    }

    public function test_products_requires_authentication()
    {
        $shop = Shop::factory()->create();

        $response = $this->getJson("/api/v1/shops/{$shop->id}/products");

        $response->assertStatus(401);
    }

    public function test_products_returns_404_for_non_existent_shop()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->getJson('/api/v1/shops/999/products');

        $response->assertStatus(404);
    }

    public function test_products_does_not_return_products_from_other_shops()
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        $otherShop = Shop::factory()->create(['user_id' => $user->id]);
        Product::factory()->create(['user_id' => $user->id, 'shop_id' => $shop->id]);
        Product::factory()->create(['user_id' => $user->id, 'shop_id' => $otherShop->id]);

        $response = $this->actingAs($user)
            ->getJson("/api/v1/shops/{$shop->id}/products");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }
}
