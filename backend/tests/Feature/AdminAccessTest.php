<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Rental;
use App\Models\Service;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_login_succeeds_for_admin_user()
    {
        $admin = User::factory()->admin()->create([
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/v1/admin/login', [
            'email' => $admin->email,
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email', 'is_admin'],
            ])
            ->assertJsonPath('user.is_admin', true);
    }

    public function test_admin_login_rejects_non_admin_user()
    {
        $user = User::factory()->create([
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/v1/admin/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertStatus(403);
        $this->assertGuest();
    }

    public function test_admin_login_rejects_invalid_credentials()
    {
        $admin = User::factory()->admin()->create([
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/v1/admin/login', [
            'email' => $admin->email,
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401);
    }

    public function test_admin_login_requires_email_and_password()
    {
        $response = $this->postJson('/api/v1/admin/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_admin_dashboard_requires_authentication()
    {
        $response = $this->getJson('/api/v1/admin/dashboard');

        $response->assertStatus(401);
    }

    public function test_admin_dashboard_forbidden_for_non_admin_user()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->getJson('/api/v1/admin/dashboard');

        $response->assertStatus(403);
    }

    public function test_admin_dashboard_returns_stats_for_admin()
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/admin/dashboard');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'users',
                    'shops',
                    'products',
                    'rentals',
                    'services',
                    'orders',
                    'pending_comments',
                    'pending_supplier_reviews',
                ],
            ]);
    }

    public function test_admin_dashboard_counts_are_accurate()
    {
        $admin = User::factory()->admin()->create();
        $owner = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $owner->id]);

        Product::factory()->count(2)->create([
            'user_id' => $owner->id,
            'shop_id' => $shop->id,
        ]);
        Rental::factory()->create(['user_id' => $owner->id]);
        Service::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/admin/dashboard');

        $response->assertStatus(200)
            ->assertJsonPath('data.users', 2)
            ->assertJsonPath('data.shops', 1)
            ->assertJsonPath('data.products', 2)
            ->assertJsonPath('data.rentals', 1)
            ->assertJsonPath('data.services', 1);
    }

    public function test_registration_cannot_grant_admin_privileges()
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Sneaky User',
            'email' => 'sneaky@example.com',
            'password' => 'password123',
            'is_admin' => true,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', [
            'email' => 'sneaky@example.com',
            'is_admin' => false,
        ]);
    }
}
