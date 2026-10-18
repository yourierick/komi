<?php

namespace Tests\Feature;

use App\Models\Commission;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCommissionTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $reseller;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->admin()->create();
        $this->reseller = User::factory()->create(['name' => 'Reseller Kabila']);
    }

    private function createCommission(array $attrs = []): Commission
    {
        $supplier = User::factory()->create();
        $product = Product::factory()->create(['user_id' => $supplier->id]);
        $order = Order::create([
            'user_id' => User::factory()->create()->id,
            'product_id' => $product->id,
            'reseller' => $this->reseller->id,
            'order_number' => 'ORD-' . strtoupper(uniqid()),
            'status' => 'paid',
            'unit_selling_price' => 100.00,
            'quantity' => 1,
            'subtotal' => 100.00,
            'total_amount' => 100.00,
            'currency' => 'USD',
        ]);

        return Commission::create(array_merge([
            'code' => 'TEST1234',
            'user_id' => $this->reseller->id,
            'order_id' => $order->id,
            'commission_amount' => 500,
            'currency' => 'USD',
            'status' => 'unpaid',
        ], $attrs));
    }

    // ---------------------------------------------------------------- lookup

    public function test_lookup_requires_authentication()
    {
        $this->getJson('/api/v1/admin/commissions/lookup/TEST1234')->assertStatus(401);
    }

    public function test_lookup_forbidden_for_non_admin()
    {
        $commission = $this->createCommission();

        $this->actingAs($this->reseller)
            ->getJson("/api/v1/admin/commissions/lookup/{$commission->code}")
            ->assertStatus(403);
    }

    public function test_lookup_returns_commission_with_reseller_and_order_details()
    {
        $commission = $this->createCommission();

        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/admin/commissions/lookup/{$commission->code}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id', 'code', 'commission_amount', 'currency', 'status',
                    'paid_at', 'notes', 'created_at',
                    'user' => ['id', 'name', 'email'],
                    'order' => ['id', 'order_number', 'total_amount', 'status'],
                ],
            ])
            ->assertJsonPath('data.code', 'TEST1234')
            ->assertJsonPath('data.status', 'unpaid')
            ->assertJsonPath('data.user.name', 'Reseller Kabila')
            ->assertJsonPath('data.order.order_number', $commission->order->order_number);
    }

    public function test_lookup_returns_404_for_unknown_code()
    {
        $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/commissions/lookup/NOPE0000')
            ->assertStatus(404);
    }

    public function test_lookup_normalizes_lowercase_code()
    {
        $commission = $this->createCommission(['code' => 'ABCD2345']);

        $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/commissions/lookup/abcd2345')
            ->assertStatus(200)
            ->assertJsonPath('data.id', $commission->id);
    }

    // -------------------------------------------------------------------- pay

    public function test_admin_can_mark_unpaid_commission_as_paid()
    {
        $commission = $this->createCommission();

        $response = $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/commissions/{$commission->id}/pay");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'paid')
            ->assertJsonPath('data.id', $commission->id);

        $commission->refresh();
        $this->assertEquals('paid', $commission->status);
        $this->assertNotNull($commission->paid_at);
    }

    public function test_pay_rejects_already_paid_commission()
    {
        $commission = $this->createCommission(['status' => 'paid', 'paid_at' => now()]);

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/commissions/{$commission->id}/pay")
            ->assertStatus(422);
    }

    public function test_pay_rejects_rejected_commission()
    {
        $commission = $this->createCommission(['status' => 'rejected', 'notes' => 'Faux lien']);

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/commissions/{$commission->id}/pay")
            ->assertStatus(422);
    }

    public function test_pay_forbidden_for_non_admin()
    {
        $commission = $this->createCommission();

        $this->actingAs($this->reseller)
            ->patchJson("/api/v1/admin/commissions/{$commission->id}/pay")
            ->assertStatus(403);
    }

    // ----------------------------------------------------------------- reject

    public function test_admin_can_reject_unpaid_commission_with_note()
    {
        $commission = $this->createCommission();

        $response = $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/commissions/{$commission->id}/reject", [
                'notes' => 'Commande annulée par le client',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.notes', 'Commande annulée par le client');

        $this->assertDatabaseHas('commissions', [
            'id' => $commission->id,
            'status' => 'rejected',
            'notes' => 'Commande annulée par le client',
        ]);
    }

    public function test_reject_requires_a_note()
    {
        $commission = $this->createCommission();

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/commissions/{$commission->id}/reject", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['notes']);
    }

    public function test_reject_rejects_empty_note()
    {
        $commission = $this->createCommission();

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/commissions/{$commission->id}/reject", ['notes' => ''])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['notes']);
    }

    public function test_reject_rejects_already_paid_commission()
    {
        $commission = $this->createCommission(['status' => 'paid', 'paid_at' => now()]);

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/commissions/{$commission->id}/reject", [
                'notes' => 'Trop tard',
            ])
            ->assertStatus(422);
    }

    public function test_reject_forbidden_for_non_admin()
    {
        $commission = $this->createCommission();

        $this->actingAs($this->reseller)
            ->patchJson("/api/v1/admin/commissions/{$commission->id}/reject", [
                'notes' => 'x',
            ])
            ->assertStatus(403);
    }

    // ----------------------------------------------------------------- stats

    public function test_stats_requires_authentication()
    {
        $this->getJson('/api/v1/admin/commissions/stats')->assertStatus(401);
    }

    public function test_stats_forbidden_for_non_admin()
    {
        $this->actingAs($this->reseller)
            ->getJson('/api/v1/admin/commissions/stats')
            ->assertStatus(403);
    }

    public function test_stats_return_status_totals()
    {
        $this->createCommission(['code' => 'AAA10001', 'commission_amount' => 40, 'status' => 'unpaid']);
        $this->createCommission(['code' => 'AAA10002', 'commission_amount' => 30, 'status' => 'unpaid']);
        $this->createCommission(['code' => 'BBB20001', 'commission_amount' => 50, 'status' => 'paid', 'paid_at' => now()]);
        $this->createCommission(['code' => 'CCC30001', 'commission_amount' => 15, 'status' => 'rejected', 'notes' => 'x']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/commissions/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'statuses' => [
                        'unpaid' => ['count', 'amount'],
                        'paid' => ['count', 'amount'],
                        'rejected' => ['count', 'amount'],
                    ],
                    'paid_totals' => ['today', 'this_week', 'this_month', 'this_year'],
                    'daily',
                ],
            ])
            ->assertJsonPath('data.statuses.unpaid.count', 2)
            ->assertJsonPath('data.statuses.unpaid.amount', 70)
            ->assertJsonPath('data.statuses.paid.count', 1)
            ->assertJsonPath('data.statuses.paid.amount', 50)
            ->assertJsonPath('data.statuses.rejected.count', 1)
            ->assertJsonPath('data.statuses.rejected.amount', 15);
    }

    public function test_stats_return_paid_totals_by_period()
    {
        $this->createCommission(['code' => 'PAID0001', 'commission_amount' => 50, 'status' => 'paid', 'paid_at' => now()]);
        $this->createCommission(['code' => 'PAID0002', 'commission_amount' => 30, 'status' => 'paid', 'paid_at' => now()->subMonths(3)]);
        $this->createCommission(['code' => 'PAID0003', 'commission_amount' => 20, 'status' => 'paid', 'paid_at' => now()->subYear()]);
        // ne doit pas compter : non payée
        $this->createCommission(['code' => 'WAIT0001', 'commission_amount' => 999, 'status' => 'unpaid']);

        $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/commissions/stats')
            ->assertStatus(200)
            ->assertJsonPath('data.paid_totals.today', 50)
            ->assertJsonPath('data.paid_totals.this_week', 50)
            ->assertJsonPath('data.paid_totals.this_month', 50)
            ->assertJsonPath('data.paid_totals.this_year', 80);
    }

    public function test_stats_return_daily_paid_series()
    {
        $this->createCommission(['code' => 'DAILY001', 'commission_amount' => 50, 'status' => 'paid', 'paid_at' => now()]);
        $this->createCommission(['code' => 'DAILY002', 'commission_amount' => 25, 'status' => 'paid', 'paid_at' => now()->subDays(2)]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/commissions/stats');

        $response->assertStatus(200)
            ->assertJsonCount(30, 'data.daily')
            ->assertJsonPath('data.daily.29.date', today()->toDateString())
            ->assertJsonPath('data.daily.29.amount', 50)
            ->assertJsonPath('data.daily.29.count', 1);
    }
}
