<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\Service;
use App\Models\Setting;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminSettingsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->admin()->create();
        $this->user = User::factory()->create();
    }

    // ------------------------------------------------------------ defaults

    public function test_settings_return_all_keys_with_defaults()
    {
        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/settings');

        $response->assertStatus(200)->assertJsonPath('data.komi_fee_percentage', 0);
        $data = $response->json('data');

        $this->assertEquals(20, $data['max_reseller_commission_percentage']);
        $this->assertTrue($data['reviews_auto_approve']);
        $this->assertTrue($data['registration_enabled']);
        $this->assertCount(6, $data['payment_methods_enabled']);
        $this->assertContains('payment_protected_by_komi', $data['payment_methods_enabled']);
    }

    public function test_settings_expose_only_known_keys()
    {
        $data = $this->actingAs($this->admin)->getJson('/api/v1/admin/settings')->json('data');

        $this->assertEqualsCanonicalizing([
            'komi_fee_percentage',
            'max_reseller_commission_percentage',
            'reviews_auto_approve',
            'registration_enabled',
            'payment_methods_enabled',
        ], array_keys($data));
    }

    public function test_settings_forbidden_for_non_admin()
    {
        $this->actingAs($this->user)->getJson('/api/v1/admin/settings')->assertStatus(403);
        $this->actingAs($this->user)
            ->patchJson('/api/v1/admin/settings', ['registration_enabled' => false])
            ->assertStatus(403);
    }

    // -------------------------------------------------------------- update

    public function test_admin_can_update_multiple_settings_at_once()
    {
        $response = $this->actingAs($this->admin)->patchJson('/api/v1/admin/settings', [
            'registration_enabled' => false,
            'reviews_auto_approve' => false,
            'max_reseller_commission_percentage' => 15,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.registration_enabled', false)
            ->assertJsonPath('data.reviews_auto_approve', false)
            ->assertJsonPath('data.max_reseller_commission_percentage', 15);

        $this->assertDatabaseHas('settings', ['key' => 'registration_enabled', 'value' => '0']);
        $this->assertDatabaseHas('settings', ['key' => 'reviews_auto_approve', 'value' => '0']);
    }

    public function test_update_rejects_unknown_setting_keys()
    {
        $this->actingAs($this->admin)
            ->patchJson('/api/v1/admin/settings', ['not_a_real_setting' => 'x'])
            ->assertStatus(422);
    }

    public function test_update_validates_each_setting_type()
    {
        $this->actingAs($this->admin)
            ->patchJson('/api/v1/admin/settings', ['reviews_auto_approve' => 'banana'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['reviews_auto_approve']);

        $this->actingAs($this->admin)
            ->patchJson('/api/v1/admin/settings', [
                'payment_methods_enabled' => ['crypto', 'payment_protected_by_komi'],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['payment_methods_enabled.0']);
    }

    // ------------------------------------------- komi protected is mandatory

    public function test_komi_protected_payment_cannot_be_disabled()
    {
        $this->actingAs($this->admin)
            ->patchJson('/api/v1/admin/settings', [
                'payment_methods_enabled' => ['cash_on_delivery'],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['payment_methods_enabled']);
    }

    public function test_komi_protected_payment_stays_enabled_even_if_removed_in_storage()
    {
        Setting::set('payment_methods_enabled', ['cash_on_delivery']);

        $this->assertContains('payment_protected_by_komi', Setting::enabledPaymentMethods());
    }

    // -------------------------------------------------- registration gate

    public function test_registration_is_blocked_when_disabled()
    {
        Setting::set('registration_enabled', '0');

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Nouveau',
            'email' => 'nouveau@test.com',
            'password' => 'password123',
        ])->assertStatus(403);

        $this->assertDatabaseMissing('users', ['email' => 'nouveau@test.com']);
    }

    public function test_registration_works_when_enabled()
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Nouveau',
            'email' => 'nouveau@test.com',
            'password' => 'password123',
        ])->assertStatus(201);
    }

    // --------------------------------------------------- review moderation

    public function test_comments_are_pending_moderation_when_auto_approve_is_off()
    {
        Setting::set('reviews_auto_approve', '0');

        $supplier = User::factory()->create();
        $product = Product::factory()->create(['user_id' => $supplier->id]);

        $this->actingAs($this->user)
            ->postJson("/api/v1/products/{$product->id}/comments", [
                'comment' => 'Super produit',
                'rating' => 5,
            ])
            ->assertStatus(201);

        $this->assertDatabaseHas('product_comments', [
            'product_id' => $product->id,
            'approved' => false,
        ]);
    }

    public function test_comments_are_approved_by_default()
    {
        $supplier = User::factory()->create();
        $product = Product::factory()->create(['user_id' => $supplier->id]);

        $this->actingAs($this->user)
            ->postJson("/api/v1/products/{$product->id}/comments", [
                'comment' => 'Super produit',
                'rating' => 5,
            ])
            ->assertStatus(201);

        $this->assertDatabaseHas('product_comments', [
            'product_id' => $product->id,
            'approved' => true,
        ]);
    }

    public function test_supplier_reviews_follow_auto_approve_setting()
    {
        Setting::set('reviews_auto_approve', '0');

        $supplier = User::factory()->create();
        Shop::factory()->create(['user_id' => $supplier->id]);

        $this->actingAs($this->user)
            ->postJson("/api/v1/suppliers/{$supplier->id}/reviews", [
                'comment' => 'Bon fournisseur',
                'rating' => 4,
            ]);

        $this->assertDatabaseHas('supplier_reviews', [
            'supplier_id' => $supplier->id,
            'approved' => false,
        ]);
    }

    // ----------------------------------------------------- payment methods

    public function test_disabled_payment_method_is_rejected_on_order_update()
    {
        Setting::set('payment_methods_enabled', ['payment_protected_by_komi', 'cash_on_delivery']);

        // payment_method est géré côté fournisseur (commande reçue)
        $supplier = User::factory()->create();
        $order = Order::create([
            'user_id' => $this->user->id,
            'product_id' => Product::factory()->create(['user_id' => $supplier->id])->id,
            'order_number' => 'ORD-' . strtoupper(uniqid()),
            'status' => 'under_negotiation',
            'unit_selling_price' => 100,
            'quantity' => 1,
            'subtotal' => 100,
            'total_amount' => 100,
            'currency' => 'USD',
        ]);

        $this->actingAs($supplier)
            ->putJson("/api/v1/orders/received/{$order->id}", [
                'payment_method' => 'payment_by_bank_transfer',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['payment_method']);
    }

    public function test_enabled_payment_method_is_accepted()
    {
        Setting::set('payment_methods_enabled', ['payment_protected_by_komi', 'cash_on_delivery']);

        $supplier = User::factory()->create();
        $order = Order::create([
            'user_id' => $this->user->id,
            'product_id' => Product::factory()->create(['user_id' => $supplier->id])->id,
            'order_number' => 'ORD-' . strtoupper(uniqid()),
            'status' => 'under_negotiation',
            'unit_selling_price' => 100,
            'quantity' => 1,
            'subtotal' => 100,
            'total_amount' => 100,
            'currency' => 'USD',
        ]);

        $this->actingAs($supplier)
            ->putJson("/api/v1/orders/received/{$order->id}", [
                'payment_method' => 'cash_on_delivery',
            ])
            ->assertStatus(200);
    }

    // --------------------------------------------------- commission cap

    public function test_reseller_commission_cap_follows_setting()
    {
        Setting::set('max_reseller_commission_percentage', '10');

        $this->actingAs($this->user)
            ->postJson('/api/v1/products', [
                'name' => 'Produit Test',
                'price' => 100,
                'category' => 'Electronics and Components',
                'commission_type' => 'percentage',
                'commission_value' => 15,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['commission_value']);
    }

    public function test_service_orders_never_carry_a_reseller_commission()
    {
        // les services n'ont pas de colonnes commission_type/commission_value
        $supplier = User::factory()->create();
        $reseller = User::factory()->create();
        $service = Service::factory()->create(['user_id' => $supplier->id]);

        $order = $this->actingAs($this->user)
            ->postJson('/api/v1/orders', [
                'service_id' => $service->id,
                'reseller_id' => $reseller->id,
                'quantity' => 1,
                'unit_selling_price' => 100,
                'currency' => 'USD',
            ])
            ->assertStatus(201);

        $this->assertEquals(0, (float) $order->json('data.commission_amount'));
    }

    public function test_commission_under_cap_is_accepted()
    {
        Setting::set('max_reseller_commission_percentage', '10');

        $this->actingAs($this->user)
            ->postJson('/api/v1/products', [
                'name' => 'Produit OK',
                'price' => 100,
                'category' => 'Electronics and Components',
                'commission_type' => 'percentage',
                'commission_value' => 8,
            ])
            ->assertStatus(201);
    }
}
