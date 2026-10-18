<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\KomiRevenue;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use App\Services\InvoiceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminRevenueTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $buyer;
    private User $supplier;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->admin()->create();
        $this->buyer = User::factory()->create();
        $this->supplier = User::factory()->create();
        Setting::set('komi_fee_percentage', 10);
    }

    private function makeOrder(array $attrs = []): Order
    {
        $product = Product::factory()->create(['user_id' => $this->supplier->id]);

        return Order::create(array_merge([
            'user_id' => $this->buyer->id,
            'product_id' => $product->id,
            'order_number' => 'ORD-' . strtoupper(uniqid()),
            'status' => 'confirmed',
            'unit_selling_price' => 100.00,
            'quantity' => 1,
            'subtotal' => 100.00,
            'total_amount' => 100.00,
            'currency' => 'USD',
        ], $attrs));
    }

    private function makeInvoice(Order $order): Invoice
    {
        // le service réel : il snapshot komi_fees depuis le taux settings
        return app(InvoiceService::class)->createInvoiceForOrder($order);
    }

    // ---------------------------------------------------- revenue recording

    public function test_paying_an_order_records_a_komi_revenue_from_settings_rate()
    {
        $order = $this->makeOrder(['total_amount' => 200]);
        $invoice = $this->makeInvoice($order);

        $order->update(['status' => 'paid']);

        $this->assertDatabaseHas('komi_revenues', [
            'order_id' => $order->id,
            'invoice_id' => $invoice->id,
            'status' => 'collected',
        ]);

        $revenue = KomiRevenue::where('order_id', $order->id)->first();
        $this->assertEquals(20.0, (float) $revenue->amount);
        $this->assertEquals(10.0, (float) $revenue->fee_percentage);
        $this->assertEquals('USD', $revenue->currency);
        $this->assertNotNull($revenue->collected_at);
    }

    public function test_paying_an_order_without_invoice_still_records_revenue()
    {
        $order = $this->makeOrder(['total_amount' => 300]);

        $order->update(['status' => 'paid']);

        $revenue = KomiRevenue::where('order_id', $order->id)->first();
        $this->assertNotNull($revenue);
        $this->assertNull($revenue->invoice_id);
        $this->assertEquals(30.0, (float) $revenue->amount);
    }

    public function test_revenue_is_not_duplicated_on_repeated_paid_status()
    {
        $order = $this->makeOrder(['total_amount' => 100]);

        $order->update(['status' => 'paid']);
        $order->update(['status' => 'completed']);
        $order->update(['status' => 'paid']);

        $this->assertEquals(1, KomiRevenue::where('order_id', $order->id)->count());
    }

    public function test_refunding_an_order_marks_revenue_refunded()
    {
        $order = $this->makeOrder();
        $order->update(['status' => 'paid']);

        $order->update(['status' => 'refunded']);

        $this->assertDatabaseHas('komi_revenues', [
            'order_id' => $order->id,
            'status' => 'refunded',
        ]);
    }

    public function test_changing_fee_rate_only_affects_new_revenues()
    {
        $order = $this->makeOrder(['total_amount' => 100]);
        $order->update(['status' => 'paid']);

        Setting::set('komi_fee_percentage', 25);
        $order2 = $this->makeOrder(['total_amount' => 100]);
        $order2->update(['status' => 'paid']);

        $this->assertEquals(
            10.0,
            (float) KomiRevenue::where('order_id', $order->id)->first()->fee_percentage,
        );
        $this->assertEquals(
            25.0,
            (float) KomiRevenue::where('order_id', $order2->id)->first()->fee_percentage,
        );
    }

    // ------------------------------------------------------------- listing

    public function test_revenues_index_requires_admin()
    {
        $this->getJson('/api/v1/admin/revenues')->assertStatus(401);
        $this->actingAs($this->buyer)->getJson('/api/v1/admin/revenues')->assertStatus(403);
    }

    public function test_revenues_index_returns_order_and_invoice()
    {
        $order = $this->makeOrder(['total_amount' => 200]);
        $invoice = $this->makeInvoice($order);
        $order->update(['status' => 'paid']);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/revenues');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [[
                    'id', 'amount', 'fee_percentage', 'currency', 'status', 'collected_at',
                    'order' => ['id', 'order_number', 'total_amount'],
                    'invoice' => ['id', 'invoice_number'],
                ]],
            ])
            ->assertJsonPath('data.0.order.order_number', $order->order_number)
            ->assertJsonPath('data.0.invoice.invoice_number', $invoice->invoice_number);
    }

    public function test_revenues_index_filters_by_status()
    {
        $order1 = $this->makeOrder();
        $order2 = $this->makeOrder();
        $order1->update(['status' => 'paid']);
        $order2->update(['status' => 'paid']);
        $order1->update(['status' => 'refunded']);

        $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/revenues?status=collected')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.order_id', $order2->id);
    }

    // --------------------------------------------------------------- stats

    public function test_revenues_stats_require_admin()
    {
        $this->getJson('/api/v1/admin/revenues/stats')->assertStatus(401);
        $this->actingAs($this->buyer)->getJson('/api/v1/admin/revenues/stats')->assertStatus(403);
    }

    public function test_revenues_stats_return_status_and_period_totals()
    {
        $order1 = $this->makeOrder(['total_amount' => 1000]);
        $order2 = $this->makeOrder(['total_amount' => 500]);
        $order1->update(['status' => 'paid']);
        $order2->update(['status' => 'paid']);
        $order2->update(['status' => 'refunded']);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/revenues/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'statuses' => ['collected' => ['count', 'amount'], 'refunded' => ['count', 'amount']],
                    'collected_totals' => ['today', 'this_week', 'this_month', 'this_year'],
                    'daily',
                    'current_fee_percentage',
                ],
            ]);

        $this->assertEquals(1, $response->json('data.statuses.collected.count'));
        $this->assertEquals(100, $response->json('data.statuses.collected.amount'));
        $this->assertEquals(50, $response->json('data.statuses.refunded.amount'));
        $this->assertEquals(100, $response->json('data.collected_totals.today'));
        $this->assertEquals(10.0, $response->json('data.current_fee_percentage'));
        $this->assertCount(30, $response->json('data.daily'));
    }

    // ------------------------------------------------------------ settings

    public function test_admin_can_read_current_fee_percentage()
    {
        $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/settings')
            ->assertStatus(200)
            ->assertJsonPath('data.komi_fee_percentage', 10);
    }

    public function test_admin_can_update_fee_percentage()
    {
        $this->actingAs($this->admin)
            ->patchJson('/api/v1/admin/settings', ['komi_fee_percentage' => 12.5])
            ->assertStatus(200)
            ->assertJsonPath('data.komi_fee_percentage', 12.5);

        $this->assertDatabaseHas('settings', ['key' => 'komi_fee_percentage', 'value' => '12.5']);
    }

    public function test_fee_percentage_is_validated()
    {
        $this->actingAs($this->admin)
            ->patchJson('/api/v1/admin/settings', ['komi_fee_percentage' => 150])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['komi_fee_percentage']);

        $this->actingAs($this->admin)
            ->patchJson('/api/v1/admin/settings', ['komi_fee_percentage' => -1])
            ->assertStatus(422);
    }

    public function test_settings_forbidden_for_non_admin()
    {
        $this->actingAs($this->buyer)->getJson('/api/v1/admin/settings')->assertStatus(403);
        $this->actingAs($this->buyer)
            ->patchJson('/api/v1/admin/settings', ['komi_fee_percentage' => 5])
            ->assertStatus(403);
    }
}
