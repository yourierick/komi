<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Shop;
use App\Models\Product;
use App\Models\SupplierReview;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupplierReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_supplier_review()
    {
        $customer = User::factory()->create();
        $supplier = User::factory()->create();
        Shop::factory()->create(['user_id' => $supplier->id]);
        Product::factory()->create(['user_id' => $supplier->id]);

        $response = $this->actingAs($customer)->postJson("/api/v1/suppliers/{$supplier->id}/reviews", [
            'comment' => 'Excellent fournisseur!',
            'rating' => 5,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('supplier_reviews', [
            'user_id' => $customer->id,
            'supplier_id' => $supplier->id,
            'comment' => 'Excellent fournisseur!',
            'rating' => 5,
            'approved' => true,
        ]);
    }

    public function test_supplier_rating_updates_after_review_creation()
    {
        $customer = User::factory()->create();
        $supplier = User::factory()->create(['rating' => 0]);
        Shop::factory()->create(['user_id' => $supplier->id]);
        Product::factory()->create(['user_id' => $supplier->id]);

        $this->actingAs($customer)->postJson("/api/v1/suppliers/{$supplier->id}/reviews", [
            'comment' => 'Great supplier!',
            'rating' => 4,
        ]);

        $supplier->refresh();
        $this->assertEquals(4.0, $supplier->rating);
    }

    public function test_user_cannot_review_same_supplier_twice()
    {
        $customer = User::factory()->create();
        $supplier = User::factory()->create();
        Shop::factory()->create(['user_id' => $supplier->id]);
        Product::factory()->create(['user_id' => $supplier->id]);

        $this->actingAs($customer)->postJson("/api/v1/suppliers/{$supplier->id}/reviews", [
            'comment' => 'First review',
            'rating' => 4,
        ])->assertStatus(201);

        $response = $this->actingAs($customer)->postJson("/api/v1/suppliers/{$supplier->id}/reviews", [
            'comment' => 'Second review',
            'rating' => 5,
        ]);

        $response->assertStatus(422);
    }

    public function test_user_cannot_review_themselves()
    {
        $supplier = User::factory()->create();
        Shop::factory()->create(['user_id' => $supplier->id]);
        Product::factory()->create(['user_id' => $supplier->id]);

        $response = $this->actingAs($supplier)->postJson("/api/v1/suppliers/{$supplier->id}/reviews", [
            'comment' => 'My own review',
            'rating' => 5,
        ]);

        $response->assertStatus(403);
    }

    public function test_can_get_supplier_reviews()
    {
        $supplier = User::factory()->create();
        Shop::factory()->create(['user_id' => $supplier->id]);
        Product::factory()->create(['user_id' => $supplier->id]);
        
        SupplierReview::factory()->count(3)->create([
            'supplier_id' => $supplier->id,
            'approved' => true,
        ]);

        $response = $this->getJson("/api/v1/suppliers/{$supplier->id}/reviews");

        $response->assertStatus(200);
        $response->assertJsonCount(3, 'data');
    }

    public function test_supplier_rating_includes_all_reviews()
    {
        $supplier = User::factory()->create(['rating' => 0]);
        Shop::factory()->create(['user_id' => $supplier->id]);
        Product::factory()->create(['user_id' => $supplier->id]);
        
        SupplierReview::factory()->create([
            'supplier_id' => $supplier->id,
            'rating' => 5,
            'approved' => true,
        ]);
        
        SupplierReview::factory()->create([
            'supplier_id' => $supplier->id,
            'rating' => 3,
            'approved' => false,
        ]);

        $supplier->updateRating();
        $supplier->refresh();

        $this->assertEquals(4.0, $supplier->rating);
    }

    public function test_only_approved_reviews_are_publicly_visible()
    {
        $supplier = User::factory()->create();
        Shop::factory()->create(['user_id' => $supplier->id]);
        Product::factory()->create(['user_id' => $supplier->id]);
        
        SupplierReview::factory()->count(2)->create([
            'supplier_id' => $supplier->id,
            'approved' => true,
        ]);
        
        SupplierReview::factory()->count(3)->create([
            'supplier_id' => $supplier->id,
            'approved' => false,
        ]);

        $response = $this->getJson("/api/v1/suppliers/{$supplier->id}/reviews");

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'data');
    }
}
