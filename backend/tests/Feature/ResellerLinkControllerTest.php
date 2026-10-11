<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ResellerLink;
use App\Models\Rental;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResellerLinkControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_or_get_product_link_requires_authentication()
    {
        $product = Product::factory()->create();

        $response = $this->postJson('/api/v1/reseller-links/product/' . $product->id);

        $response->assertStatus(401);
    }

    public function test_create_or_get_rental_link_requires_authentication()
    {
        $rental = Rental::factory()->create();

        $response = $this->postJson('/api/v1/reseller-links/rental/' . $rental->id);

        $response->assertStatus(401);
    }

    public function test_create_or_get_product_link_creates_new_link_for_user()
    {
        $user = User::factory()->create();
        $product = Product::factory()->create([
            'commission_type' => 'percentage',
            'commission_value' => 10,
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/v1/reseller-links/product/' . $product->id);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'code',
                    'link',
                    'product_id',
                    'rental_id',
                    'user_id',
                ]
            ]);

        $this->assertDatabaseHas('reseller_links', [
            'user_id' => $user->id,
            'product_id' => $product->id,
            'rental_id' => null,
        ]);
    }

    public function test_create_or_get_rental_link_creates_new_link_for_user()
    {
        $user = User::factory()->create();
        $rental = Rental::factory()->create([
            'commission_type' => 'fixed',
            'commission_value' => 50,
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/v1/reseller-links/rental/' . $rental->id);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'code',
                    'link',
                    'product_id',
                    'rental_id',
                    'user_id',
                ]
            ]);

        $this->assertDatabaseHas('reseller_links', [
            'user_id' => $user->id,
            'product_id' => null,
            'rental_id' => $rental->id,
        ]);
    }

    public function test_create_or_get_product_link_returns_existing_link()
    {
        $user = User::factory()->create();
        $product = Product::factory()->create([
            'commission_type' => 'percentage',
            'commission_value' => 10,
        ]);

        $existingLink = ResellerLink::factory()->create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'rental_id' => null,
            'code' => 'EXISTING_CODE',
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/v1/reseller-links/product/' . $product->id);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $existingLink->id,
                    'code' => 'EXISTING_CODE',
                ]
            ]);

        $this->assertDatabaseCount('reseller_links', 1);
    }

    public function test_create_or_get_rental_link_returns_existing_link()
    {
        $user = User::factory()->create();
        $rental = Rental::factory()->create([
            'commission_type' => 'fixed',
            'commission_value' => 50,
        ]);

        $existingLink = ResellerLink::factory()->create([
            'user_id' => $user->id,
            'product_id' => null,
            'rental_id' => $rental->id,
            'code' => 'EXISTING_CODE',
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/v1/reseller-links/rental/' . $rental->id);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $existingLink->id,
                    'code' => 'EXISTING_CODE',
                ]
            ]);

        $this->assertDatabaseCount('reseller_links', 1);
    }

    public function test_create_or_get_product_link_fails_for_non_existent_product()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/reseller-links/product/99999');

        $response->assertStatus(404);
    }

    public function test_create_or_get_rental_link_fails_for_non_existent_rental()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/reseller-links/rental/99999');

        $response->assertStatus(404);
    }

    public function test_create_or_get_product_link_fails_when_product_has_no_commission()
    {
        $user = User::factory()->create();
        $product = Product::factory()->create([
            'commission_type' => 'none',
            'commission_value' => 0,
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/v1/reseller-links/product/' . $product->id);

        $response->assertStatus(400);
    }

    public function test_create_or_get_rental_link_fails_when_rental_has_no_commission()
    {
        $user = User::factory()->create();
        $rental = Rental::factory()->create([
            'commission_type' => 'none',
            'commission_value' => 0,
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/v1/reseller-links/rental/' . $rental->id);

        $response->assertStatus(400);
    }

    public function test_get_reseller_by_code_returns_reseller_info()
    {
        $user = User::factory()->create([
            'name' => 'Test Reseller',
            'email' => 'reseller@example.com',
        ]);
        $product = Product::factory()->create([
            'commission_type' => 'percentage',
            'commission_value' => 10,
        ]);

        $link = ResellerLink::factory()->create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'rental_id' => null,
            'code' => 'TESTCODE',
        ]);

        $response = $this->getJson('/api/v1/public/reseller-links/TESTCODE/reseller');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $user->id,
                    'name' => 'Test Reseller',
                    'email' => 'reseller@example.com',
                ]
            ]);
    }

    public function test_get_reseller_by_code_fails_for_non_existent_code()
    {
        $response = $this->getJson('/api/v1/public/reseller-links/NONEXISTENT/reseller');

        $response->assertStatus(404);
    }

    public function test_code_must_be_unique()
    {
        $user = User::factory()->create();
        $product = Product::factory()->create([
            'commission_type' => 'percentage',
            'commission_value' => 10,
        ]);

        ResellerLink::factory()->create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'rental_id' => null,
            'code' => 'DUPLICATE',
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);

        ResellerLink::factory()->create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'rental_id' => null,
            'code' => 'DUPLICATE',
        ]);
    }
}
