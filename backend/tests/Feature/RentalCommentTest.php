<?php

namespace Tests\Feature;

use App\Models\Rental;
use App\Models\RentalComment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RentalCommentTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_comment()
    {
        $user = User::factory()->create();
        $rental = Rental::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/v1/rentals/' . $rental->id . '/comments', [
            'comment' => 'Great rental!',
            'rating' => 4.5,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('rental_comments', [
            'user_id' => $user->id,
            'rental_id' => $rental->id,
            'comment' => 'Great rental!',
            'rating' => 4.5,
            'approved' => true,
        ]);
    }

    public function test_rental_rating_updates_after_comment_creation()
    {
        $user = User::factory()->create();
        $rental = Rental::factory()->create(['rating' => 0]);

        $this->actingAs($user)->postJson('/api/v1/rentals/' . $rental->id . '/comments', [
            'comment' => 'Great rental!',
            'rating' => 4.0,
        ]);

        $rental->refresh();
        $this->assertEquals(4.0, $rental->rating);
    }

    public function test_user_cannot_comment_twice_on_same_rental()
    {
        $user = User::factory()->create();
        $rental = Rental::factory()->create();

        $this->actingAs($user)->postJson('/api/v1/rentals/' . $rental->id . '/comments', [
            'comment' => 'First comment',
            'rating' => 4.0,
        ])->assertStatus(201);

        $response = $this->actingAs($user)->postJson('/api/v1/rentals/' . $rental->id . '/comments', [
            'comment' => 'Second comment',
            'rating' => 5.0,
        ]);

        $response->assertStatus(422);
    }

    public function test_rental_owner_cannot_comment_on_their_own_rental()
    {
        $owner = User::factory()->create();
        $rental = Rental::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($owner)->postJson('/api/v1/rentals/' . $rental->id . '/comments', [
            'comment' => 'My own rental',
            'rating' => 5.0,
        ]);

        $response->assertStatus(403);
    }

    public function test_rental_total_reviews_counts_all_comments()
    {
        $rental = Rental::factory()->create();
        
        RentalComment::factory()->count(3)->create([
            'rental_id' => $rental->id,
            'approved' => true,
        ]);
        
        RentalComment::factory()->count(2)->create([
            'rental_id' => $rental->id,
            'approved' => false,
        ]);

        $rental = Rental::withCount('comments')->find($rental->id);

        $this->assertEquals(5, $rental->total_reviews);
    }
}
