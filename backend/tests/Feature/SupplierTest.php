<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Shop;
use App\Models\Product;
use App\Models\Rental;
use App\Models\Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupplierTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_get_list_of_suppliers()
    {
        // Create users with shops and products
        $supplier1 = User::factory()->create(['name' => 'Supplier One']);
        $shop1 = Shop::factory()->create(['user_id' => $supplier1->id]);
        Product::factory()->create(['user_id' => $supplier1->id, 'shop_id' => $shop1->id]);

        $supplier2 = User::factory()->create(['name' => 'Supplier Two']);
        $shop2 = Shop::factory()->create(['user_id' => $supplier2->id]);
        Rental::factory()->create(['user_id' => $supplier2->id]);

        // User without shop or products (not a supplier)
        User::factory()->create(['name' => 'Regular User']);

        $response = $this->getJson('/api/v1/suppliers');

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'data');
    }

    public function test_can_get_supplier_details()
    {
        $supplier = User::factory()->create(['name' => 'Test Supplier']);
        $shop = Shop::factory()->create(['user_id' => $supplier->id]);
        Product::factory()->count(3)->create(['user_id' => $supplier->id, 'shop_id' => $shop->id]);
        Rental::factory()->count(2)->create(['user_id' => $supplier->id]);
        Service::factory()->count(1)->create(['user_id' => $supplier->id]);

        $response = $this->getJson("/api/v1/suppliers/{$supplier->id}");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'name',
                'email',
                'phone',
                'address',
                'picture',
                'products_count',
                'rentals_count',
                'services_count',
                'shops_count',
            ]
        ]);
        $this->assertEquals(3, $response->json('data.products_count'));
        $this->assertEquals(2, $response->json('data.rentals_count'));
        $this->assertEquals(1, $response->json('data.services_count'));
    }

    public function test_can_search_suppliers_by_name()
    {
        $supplier1 = User::factory()->create(['name' => 'John Supplier']);
        $shop1 = Shop::factory()->create(['user_id' => $supplier1->id]);
        Product::factory()->create(['user_id' => $supplier1->id, 'shop_id' => $shop1->id]);

        $supplier2 = User::factory()->create(['name' => 'Jane Supplier']);
        $shop2 = Shop::factory()->create(['user_id' => $supplier2->id]);
        Product::factory()->create(['user_id' => $supplier2->id, 'shop_id' => $shop2->id]);

        $response = $this->getJson('/api/v1/suppliers?search=John');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $this->assertEquals('John Supplier', $response->json('data.0.name'));
    }

    public function test_non_supplier_returns_404()
    {
        $user = User::factory()->create();

        $response = $this->getJson("/api/v1/suppliers/{$user->id}");

        $response->assertStatus(404);
    }

    public function test_supplier_must_have_at_least_one_shop()
    {
        $userWithoutShop = User::factory()->create();
        Product::factory()->create(['user_id' => $userWithoutShop->id]);

        $response = $this->getJson('/api/v1/suppliers');

        $response->assertStatus(200);
        $response->assertJsonCount(0, 'data');
    }

    public function test_supplier_must_have_at_least_one_item()
    {
        $userWithShopOnly = User::factory()->create();
        Shop::factory()->create(['user_id' => $userWithShopOnly->id]);

        $response = $this->getJson('/api/v1/suppliers');

        $response->assertStatus(200);
        $response->assertJsonCount(0, 'data');
    }
}
