<?php

namespace Tests\Feature;

use App\Models\Service;
use App\Models\ServiceComment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServiceCommentTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_comment()
    {
        $user = User::factory()->create();
        $service = Service::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/v1/services/' . $service->id . '/comments', [
            'comment' => 'Great service!',
            'rating' => 4.5,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('service_comments', [
            'user_id' => $user->id,
            'service_id' => $service->id,
            'comment' => 'Great service!',
            'rating' => 4.5,
            'approved' => true,
        ]);
    }

    public function test_service_rating_updates_after_comment_creation()
    {
        $user = User::factory()->create();
        $service = Service::factory()->create(['rating' => 0]);

        $this->actingAs($user)->postJson('/api/v1/services/' . $service->id . '/comments', [
            'comment' => 'Great service!',
            'rating' => 4.0,
        ]);

        $service->refresh();
        $this->assertEquals(4.0, $service->rating);
    }

    public function test_user_cannot_comment_twice_on_same_service()
    {
        $user = User::factory()->create();
        $service = Service::factory()->create();

        $this->actingAs($user)->postJson('/api/v1/services/' . $service->id . '/comments', [
            'comment' => 'First comment',
            'rating' => 4.0,
        ])->assertStatus(201);

        $response = $this->actingAs($user)->postJson('/api/v1/services/' . $service->id . '/comments', [
            'comment' => 'Second comment',
            'rating' => 5.0,
        ]);

        $response->assertStatus(422);
    }

    public function test_service_owner_cannot_comment_on_their_own_service()
    {
        $owner = User::factory()->create();
        $service = Service::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($owner)->postJson('/api/v1/services/' . $service->id . '/comments', [
            'comment' => 'My own service',
            'rating' => 5.0,
        ]);

        $response->assertStatus(403);
    }

    public function test_service_total_reviews_counts_all_comments()
    {
        $service = Service::factory()->create();
        
        ServiceComment::factory()->count(3)->create([
            'service_id' => $service->id,
            'approved' => true,
        ]);
        
        ServiceComment::factory()->count(2)->create([
            'service_id' => $service->id,
            'approved' => false,
        ]);

        $service = Service::withCount('comments')->find($service->id);

        $this->assertEquals(5, $service->total_reviews);
    }
}
