<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductComment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductCommentTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_comment()
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/v1/products/' . $product->id . '/comments', [
            'comment' => 'Great product!',
            'rating' => 4.5,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('product_comments', [
            'user_id' => $user->id,
            'product_id' => $product->id,
            'comment' => 'Great product!',
            'rating' => 4.5,
            'approved' => true,
        ]);
    }

    public function test_unauthenticated_user_cannot_create_comment()
    {
        $product = Product::factory()->create();

        $response = $this->postJson('/api/v1/products/' . $product->id . '/comments', [
            'comment' => 'Great product!',
            'rating' => 4.5,
        ]);

        $response->assertStatus(401);
    }

    public function test_comment_requires_valid_rating()
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/v1/products/' . $product->id . '/comments', [
            'comment' => 'Great product!',
            'rating' => 6, // Invalid: should be between 0 and 5
        ]);

        $response->assertStatus(422);
    }

    public function test_product_rating_updates_after_comment_creation()
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['rating' => 0]);

        $this->actingAs($user)->postJson('/api/v1/products/' . $product->id . '/comments', [
            'comment' => 'Great product!',
            'rating' => 4.0,
        ]);

        $product->refresh();
        $this->assertEquals(4.0, $product->rating);
    }

    public function test_product_rating_is_average_of_all_comments()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $product = Product::factory()->create(['rating' => 0]);

        $this->actingAs($user1)->postJson('/api/v1/products/' . $product->id . '/comments', [
            'comment' => 'Good',
            'rating' => 4.0,
        ]);

        $this->actingAs($user2)->postJson('/api/v1/products/' . $product->id . '/comments', [
            'comment' => 'Excellent',
            'rating' => 5.0,
        ]);

        $product->refresh();
        $this->assertEquals(4.5, $product->rating);
    }

    public function test_user_can_list_all_comments_for_product()
    {
        $product = Product::factory()->create();
        ProductComment::factory()->create([
            'product_id' => $product->id,
            'approved' => true,
        ]);
        ProductComment::factory()->create([
            'product_id' => $product->id,
            'approved' => false,
        ]);

        $response = $this->getJson('/api/v1/products/' . $product->id . '/comments');

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'data');
    }

    public function test_approved_comments_endpoint_returns_only_approved()
    {
        $product = Product::factory()->create();
        ProductComment::factory()->create([
            'product_id' => $product->id,
            'approved' => true,
        ]);
        ProductComment::factory()->create([
            'product_id' => $product->id,
            'approved' => false,
        ]);

        $response = $this->getJson('/api/v1/products/' . $product->id . '/approvedcomments');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
    }

    public function test_product_owner_can_approve_comment()
    {
        $owner = User::factory()->create();
        $product = Product::factory()->create(['user_id' => $owner->id]);
        $comment = ProductComment::factory()->create([
            'product_id' => $product->id,
            'approved' => false,
        ]);

        $response = $this->actingAs($owner)->patchJson('/api/v1/comments/' . $comment->id . '/approve', [
            'approved' => true,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('product_comments', [
            'id' => $comment->id,
            'approved' => true,
        ]);
    }

    public function test_non_owner_cannot_approve_comment()
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $product = Product::factory()->create(['user_id' => $owner->id]);
        $comment = ProductComment::factory()->create([
            'product_id' => $product->id,
            'approved' => false,
        ]);

        $response = $this->actingAs($otherUser)->patchJson('/api/v1/comments/' . $comment->id . '/approve', [
            'approved' => true,
        ]);

        $response->assertStatus(403);
    }

    public function test_user_can_update_their_own_comment()
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();
        $comment = ProductComment::factory()->create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'comment' => 'Original comment',
            'rating' => 3.0,
        ]);

        $response = $this->actingAs($user)->putJson('/api/v1/comments/' . $comment->id, [
            'comment' => 'Updated comment',
            'rating' => 4.5,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('product_comments', [
            'id' => $comment->id,
            'comment' => 'Updated comment',
            'rating' => 4.5,
        ]);
    }

    public function test_user_cannot_update_others_comment()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $product = Product::factory()->create();
        $comment = ProductComment::factory()->create([
            'user_id' => $user1->id,
            'product_id' => $product->id,
        ]);

        $response = $this->actingAs($user2)->putJson('/api/v1/comments/' . $comment->id, [
            'comment' => 'Hacked comment',
            'rating' => 1.0,
        ]);

        $response->assertStatus(403);
    }

    public function test_user_can_delete_their_own_comment()
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();
        $comment = ProductComment::factory()->create([
            'user_id' => $user->id,
            'product_id' => $product->id,
        ]);

        $response = $this->actingAs($user)->deleteJson('/api/v1/comments/' . $comment->id);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('product_comments', [
            'id' => $comment->id,
        ]);
    }

    public function test_product_rating_updates_after_comment_deletion()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $product = Product::factory()->create(['rating' => 0]);

        $comment1 = ProductComment::factory()->create([
            'user_id' => $user1->id,
            'product_id' => $product->id,
            'rating' => 4.0,
        ]);

        ProductComment::factory()->create([
            'user_id' => $user2->id,
            'product_id' => $product->id,
            'rating' => 5.0,
        ]);

        $product->updateRating();
        $this->assertEquals(4.5, $product->rating);

        $this->actingAs($user1)->deleteJson('/api/v1/comments/' . $comment1->id);

        $product->refresh();
        $this->assertEquals(5.0, $product->rating);
    }

    public function test_user_cannot_comment_twice_on_same_product()
    {
        $user = User::factory()->create();
        $product = Product::factory()->create();

        // First comment should succeed
        $this->actingAs($user)->postJson('/api/v1/products/' . $product->id . '/comments', [
            'comment' => 'First comment',
            'rating' => 4.0,
        ])->assertStatus(201);

        // Second comment should fail
        $response = $this->actingAs($user)->postJson('/api/v1/products/' . $product->id . '/comments', [
            'comment' => 'Second comment',
            'rating' => 5.0,
        ]);

        $response->assertStatus(422);
        $response->assertJson([
            'message' => 'Vous avez déjà laissé un avis pour ce produit',
        ]);

        // Verify only one comment exists
        $this->assertEquals(1, ProductComment::where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->count());
    }

    public function test_product_owner_cannot_comment_on_their_own_product()
    {
        $owner = User::factory()->create();
        $product = Product::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($owner)->postJson('/api/v1/products/' . $product->id . '/comments', [
            'comment' => 'My own product',
            'rating' => 5.0,
        ]);

        $response->assertStatus(403);
        $response->assertJson([
            'message' => 'Vous ne pouvez pas noter votre propre produit',
        ]);

        // Verify no comment was created
        $this->assertEquals(0, ProductComment::where('product_id', $product->id)->count());
    }
}
