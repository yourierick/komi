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

class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->admin()->create();
    }

    // ---------------------------------------------------------------- stats

    public function test_user_stats_require_authentication()
    {
        $this->getJson('/api/v1/admin/users/stats')->assertStatus(401);
    }

    public function test_user_stats_forbidden_for_non_admin()
    {
        $this->actingAs(User::factory()->create())
            ->getJson('/api/v1/admin/users/stats')
            ->assertStatus(403);
    }

    public function test_user_stats_return_registration_counts()
    {
        User::factory()->create(); // maintenant : jour + semaine + mois + année
        User::factory()->create(['created_at' => now()->subMonths(3)]);
        User::factory()->create(['created_at' => now()->subYear()]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/users/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['total', 'today', 'this_week', 'this_month', 'this_year'],
            ])
            ->assertJsonPath('data.total', 4)
            ->assertJsonPath('data.today', 2)
            ->assertJsonPath('data.this_week', 2)
            ->assertJsonPath('data.this_month', 2)
            ->assertJsonPath('data.this_year', 3);
    }

    // ---------------------------------------------------------------- index

    public function test_user_index_forbidden_for_non_admin()
    {
        $this->actingAs(User::factory()->create())
            ->getJson('/api/v1/admin/users')
            ->assertStatus(403);
    }

    public function test_user_index_paginates_at_25_by_default()
    {
        User::factory()->count(30)->create();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/users');

        $response->assertStatus(200)
            ->assertJsonPath('meta.per_page', 25)
            ->assertJsonPath('meta.total', 31)
            ->assertJsonCount(25, 'data');
    }

    public function test_user_index_accepts_allowed_page_sizes()
    {
        User::factory()->count(30)->create();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/users?per_page=10');

        $response->assertStatus(200)
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonCount(10, 'data');
    }

    public function test_user_index_rejects_invalid_page_size()
    {
        $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/users?per_page=15')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['per_page']);
    }

    public function test_user_index_searches_by_name_or_email()
    {
        User::factory()->create(['name' => 'Alice Kabongo']);
        User::factory()->create(['name' => 'Bob Mbuyi']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/users?search=alice');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Alice Kabongo');
    }

    public function test_user_index_returns_catalogue_counts()
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        Product::factory()->count(2)->create(['user_id' => $user->id, 'shop_id' => $shop->id]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/users?search=' . urlencode($user->email));

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.shops_count', 1)
            ->assertJsonPath('data.0.products_count', 2)
            ->assertJsonPath('data.0.rentals_count', 0)
            ->assertJsonPath('data.0.services_count', 0);
    }

    // -------------------------------------------------------------- destroy

    public function test_admin_can_delete_a_user()
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        Product::factory()->create(['user_id' => $user->id, 'shop_id' => $shop->id]);

        $this->actingAs($this->admin)
            ->deleteJson("/api/v1/admin/users/{$user->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseMissing('shops', ['id' => $shop->id]);
        $this->assertDatabaseMissing('products', ['user_id' => $user->id]);
    }

    public function test_admin_cannot_delete_their_own_account()
    {
        $this->actingAs($this->admin)
            ->deleteJson("/api/v1/admin/users/{$this->admin->id}")
            ->assertStatus(403);

        $this->assertDatabaseHas('users', ['id' => $this->admin->id]);
    }

    // --------------------------------------------------------------- status

    public function test_admin_can_deactivate_and_reactivate_a_user()
    {
        $user = User::factory()->create(['status' => 'active']);

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/users/{$user->id}/status", ['status' => 'inactive'])
            ->assertStatus(200);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'status' => 'inactive']);

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/users/{$user->id}/status", ['status' => 'active'])
            ->assertStatus(200);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'status' => 'active']);
    }

    public function test_user_status_rejects_invalid_values()
    {
        $user = User::factory()->create();

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/users/{$user->id}/status", ['status' => 'banned'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_admin_cannot_deactivate_their_own_account()
    {
        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/users/{$this->admin->id}/status", ['status' => 'inactive'])
            ->assertStatus(403);
    }

    // --------------------------------------------------------------- certify

    public function test_admin_can_certify_and_uncertify_a_user()
    {
        $user = User::factory()->create(['certified' => false]);

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/users/{$user->id}/certify", ['certified' => true])
            ->assertStatus(200);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'certified' => true]);

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/users/{$user->id}/certify", ['certified' => false])
            ->assertStatus(200);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'certified' => false]);
    }

    public function test_certify_without_value_toggles()
    {
        $user = User::factory()->create(['certified' => false]);

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/users/{$user->id}/certify")
            ->assertStatus(200);

        $this->assertDatabaseHas('users', ['id' => $user->id, 'certified' => true]);
    }

    // --------------------------------------------------------- reset password

    public function test_admin_can_reset_a_users_password()
    {
        $user = User::factory()->create(['password' => Hash::make('old-password')]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/users/{$user->id}/reset-password");

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => ['password']]);

        $newPassword = $response->json('data.password');
        $this->assertTrue(Hash::check($newPassword, $user->fresh()->password));
        $this->assertFalse(Hash::check('old-password', $user->fresh()->password));
    }

    public function test_reset_password_forbidden_for_non_admin()
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson("/api/v1/admin/users/{$user->id}/reset-password")
            ->assertStatus(403);
    }

    // ------------------------------------------------------------- catalogue

    public function test_admin_can_get_a_users_catalogue_counts()
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        Product::factory()->count(2)->create(['user_id' => $user->id, 'shop_id' => $shop->id]);
        Rental::factory()->create(['user_id' => $user->id]);
        Service::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/admin/users/{$user->id}/catalogue");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'user' => ['id', 'name', 'email'],
                    'counts' => ['shops', 'products', 'rentals', 'services'],
                ],
            ])
            ->assertJsonPath('data.counts.shops', 1)
            ->assertJsonPath('data.counts.products', 2)
            ->assertJsonPath('data.counts.rentals', 1)
            ->assertJsonPath('data.counts.services', 1);
    }

    public function test_catalogue_section_returns_paginated_items()
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        Product::factory()->count(12)->create(['user_id' => $user->id, 'shop_id' => $shop->id]);

        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/admin/users/{$user->id}/catalogue/products?per_page=5&page=2");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [['id', 'name', 'price', 'currency', 'verified', 'status']],
                'meta' => ['current_page', 'last_page', 'total', 'per_page'],
            ])
            ->assertJsonPath('meta.total', 12)
            ->assertJsonPath('meta.per_page', 5)
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.last_page', 3)
            ->assertJsonCount(5, 'data');
    }

    public function test_catalogue_section_searches_items()
    {
        $user = User::factory()->create();
        $shop = Shop::factory()->create(['user_id' => $user->id]);
        Product::factory()->create(['user_id' => $user->id, 'shop_id' => $shop->id, 'name' => 'Chaise en bois']);
        Product::factory()->create(['user_id' => $user->id, 'shop_id' => $shop->id, 'name' => 'Table basse']);

        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/admin/users/{$user->id}/catalogue/products?search=chaise");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Chaise en bois')
            ->assertJsonPath('meta.total', 1);
    }

    public function test_catalogue_section_searches_rentals_by_title()
    {
        $user = User::factory()->create();
        Rental::factory()->create(['user_id' => $user->id, 'title' => 'Appartement centre-ville']);
        Rental::factory()->create(['user_id' => $user->id, 'title' => 'Camionnette utilitaire']);

        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/admin/users/{$user->id}/catalogue/rentals?search=appartement");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Appartement centre-ville');
    }

    public function test_catalogue_section_rejects_unknown_type()
    {
        $user = User::factory()->create();

        $this->actingAs($this->admin)
            ->getJson("/api/v1/admin/users/{$user->id}/catalogue/invoices")
            ->assertStatus(404);
    }

    public function test_catalogue_section_forbidden_for_non_admin()
    {
        $user = User::factory()->create();

        $this->actingAs(User::factory()->create())
            ->getJson("/api/v1/admin/users/{$user->id}/catalogue/products")
            ->assertStatus(403);
    }

    // ---------------------------------------------------------------- verify

    public function test_admin_can_verify_a_shop()
    {
        $shop = Shop::factory()->create(['verified' => false]);

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/shops/{$shop->id}/verify", ['verified' => true])
            ->assertStatus(200);

        $this->assertDatabaseHas('shops', ['id' => $shop->id, 'verified' => true]);
    }

    public function test_shop_verify_without_value_toggles()
    {
        $shop = Shop::factory()->create(['verified' => false]);

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/shops/{$shop->id}/verify")
            ->assertStatus(200);

        $this->assertDatabaseHas('shops', ['id' => $shop->id, 'verified' => true]);
    }

    public function test_admin_can_verify_a_product()
    {
        $product = Product::factory()->create(['verified' => false]);

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/products/{$product->id}/verify", ['verified' => true])
            ->assertStatus(200);

        $this->assertDatabaseHas('products', ['id' => $product->id, 'verified' => true]);
    }

    public function test_admin_can_verify_a_rental()
    {
        $rental = Rental::factory()->create(['verified' => false]);

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/rentals/{$rental->id}/verify", ['verified' => true])
            ->assertStatus(200);

        $this->assertDatabaseHas('rentals', ['id' => $rental->id, 'verified' => true]);
    }

    public function test_admin_can_verify_a_service()
    {
        $service = Service::factory()->create(['verified' => false]);

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/services/{$service->id}/verify", ['verified' => true])
            ->assertStatus(200);

        $this->assertDatabaseHas('services', ['id' => $service->id, 'verified' => true]);
    }

    public function test_verify_forbidden_for_non_admin()
    {
        $shop = Shop::factory()->create(['verified' => false]);

        $this->actingAs(User::factory()->create())
            ->patchJson("/api/v1/admin/shops/{$shop->id}/verify", ['verified' => true])
            ->assertStatus(403);
    }
}
