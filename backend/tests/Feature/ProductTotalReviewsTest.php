<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductComment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductTotalReviewsTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_total_reviews_counts_all_comments()
    {
        $product = Product::factory()->create();
        
        // Create 3 approved comments
        ProductComment::factory()->count(3)->create([
            'product_id' => $product->id,
            'approved' => true,
        ]);
        
        // Create 2 unapproved comments
        ProductComment::factory()->count(2)->create([
            'product_id' => $product->id,
            'approved' => false,
        ]);

        // Refresh product and load count
        $product = Product::withCount('comments')->find($product->id);

        $this->assertEquals(5, $product->total_reviews);
    }

    public function test_product_resource_includes_total_reviews()
    {
        $product = Product::factory()->create();
        
        ProductComment::factory()->count(3)->create([
            'product_id' => $product->id,
        ]);

        $response = $this->getJson('/api/v1/public/products/' . $product->id);

        $response->assertStatus(200);
        $response->assertJsonPath('data.total_reviews', 3);
    }

    public function test_total_reviews_is_zero_for_product_without_comments()
    {
        $product = Product::factory()->create();

        $response = $this->getJson('/api/v1/public/products/' . $product->id);

        $response->assertStatus(200);
        $response->assertJsonPath('data.total_reviews', 0);
    }
}
