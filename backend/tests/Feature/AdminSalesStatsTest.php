<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\Rental;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminSalesStatsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $buyer;
    private User $supplier;
    private User $reseller;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->admin()->create();
        $this->buyer = User::factory()->create();
        $this->supplier = User::factory()->create(['name' => 'Fournisseur Alpha']);
        $this->reseller = User::factory()->create(['name' => 'Revendeur Beta']);
    }

    private function makeOrder(array $attrs = []): Order
    {
        // created_at n'est pas fillable : on l'applique après la création
        $createdAt = $attrs['created_at'] ?? null;
        unset($attrs['created_at']);

        $order = Order::create(array_merge([
            'user_id' => $this->buyer->id,
            'order_number' => 'ORD-' . strtoupper(uniqid()),
            'status' => 'paid',
            'unit_selling_price' => 100.00,
            'quantity' => 1,
            'subtotal' => 100.00,
            'total_amount' => 100.00,
            'commission_amount' => 0,
            'currency' => 'USD',
        ], $attrs));

        if ($createdAt) {
            $order->forceFill(['created_at' => $createdAt])->saveQuietly();
        }

        return $order;
    }

    private function product(array $attrs = []): Product
    {
        return Product::factory()->create(array_merge(['user_id' => $this->supplier->id], $attrs));
    }

    // ------------------------------------------------------------- access

    public function test_sales_stats_require_authentication()
    {
        $this->getJson('/api/v1/admin/sales/stats')->assertStatus(401);
    }

    public function test_sales_stats_forbidden_for_non_admin()
    {
        $this->actingAs($this->buyer)
            ->getJson('/api/v1/admin/sales/stats')
            ->assertStatus(403);
    }

    public function test_sales_stats_rejects_invalid_period()
    {
        $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/sales/stats?days=13')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['days']);
    }

    public function test_sales_stats_returns_expected_structure()
    {
        $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/sales/stats')
            ->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'period' => ['days', 'from', 'to'],
                    'summary' => [
                        'total_orders', 'concretized_orders', 'conversion_rate',
                        'revenue', 'average_order_value',
                        'pending_orders', 'pending_amount',
                        'lost_orders', 'lost_amount',
                        'commission_total',
                        'previous' => ['revenue', 'concretized_orders'],
                        'growth' => ['revenue_pct', 'orders_pct'],
                    ],
                    'by_status', 'by_item_type', 'timeseries',
                    'top_products', 'top_rentals', 'top_services',
                    'top_resellers', 'top_suppliers',
                ],
            ]);
    }

    // ------------------------------------------------------------ summary

    public function test_revenue_only_counts_paid_and_completed_orders()
    {
        $product = $this->product();
        $this->makeOrder(['product_id' => $product->id, 'status' => 'paid', 'total_amount' => 100]);
        $this->makeOrder(['product_id' => $product->id, 'status' => 'completed', 'total_amount' => 50]);
        $this->makeOrder(['product_id' => $product->id, 'status' => 'confirmed', 'total_amount' => 999]);
        $this->makeOrder(['product_id' => $product->id, 'status' => 'cancelled', 'total_amount' => 777]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/sales/stats');

        $response->assertStatus(200);
        $this->assertEquals(150, $response->json('data.summary.revenue'));
        $this->assertEquals(2, $response->json('data.summary.concretized_orders'));
        $this->assertEquals(4, $response->json('data.summary.total_orders'));
        $this->assertEquals(75, $response->json('data.summary.average_order_value'));
    }

    public function test_summary_splits_pipeline_and_lost_orders()
    {
        $product = $this->product();
        $this->makeOrder(['product_id' => $product->id, 'status' => 'under_negotiation', 'total_amount' => 200]);
        $this->makeOrder(['product_id' => $product->id, 'status' => 'confirmed', 'total_amount' => 100]);
        $this->makeOrder(['product_id' => $product->id, 'status' => 'cancelled', 'total_amount' => 40]);
        $this->makeOrder(['product_id' => $product->id, 'status' => 'refunded', 'total_amount' => 60]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/sales/stats');

        $this->assertEquals(2, $response->json('data.summary.pending_orders'));
        $this->assertEquals(300, $response->json('data.summary.pending_amount'));
        $this->assertEquals(2, $response->json('data.summary.lost_orders'));
        $this->assertEquals(100, $response->json('data.summary.lost_amount'));
    }

    public function test_conversion_rate_is_percentage_of_concretized_orders()
    {
        $product = $this->product();
        $this->makeOrder(['product_id' => $product->id, 'status' => 'paid']);
        $this->makeOrder(['product_id' => $product->id, 'status' => 'cancelled']);
        $this->makeOrder(['product_id' => $product->id, 'status' => 'confirmed']);
        $this->makeOrder(['product_id' => $product->id, 'status' => 'completed']);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/sales/stats');

        $this->assertEquals(50.0, $response->json('data.summary.conversion_rate'));
    }

    public function test_conversion_rate_is_zero_when_no_orders()
    {
        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/sales/stats');

        $this->assertEquals(0, $response->json('data.summary.conversion_rate'));
        $this->assertEquals(0, $response->json('data.summary.average_order_value'));
        $this->assertEquals(0, $response->json('data.summary.revenue'));
    }

    public function test_growth_compares_with_previous_period()
    {
        $product = $this->product();
        // période courante (30 j) : 200
        $this->makeOrder(['product_id' => $product->id, 'total_amount' => 200]);
        // période précédente (j-31 à j-60) : 100
        $this->makeOrder([
            'product_id' => $product->id,
            'total_amount' => 100,
            'created_at' => now()->subDays(45),
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/sales/stats?days=30');

        $this->assertEquals(200, $response->json('data.summary.revenue'));
        $this->assertEquals(100, $response->json('data.summary.previous.revenue'));
        $this->assertEquals(100.0, $response->json('data.summary.growth.revenue_pct'));
    }

    public function test_period_filters_out_older_orders()
    {
        $product = $this->product();
        $this->makeOrder(['product_id' => $product->id, 'total_amount' => 100]);
        $this->makeOrder([
            'product_id' => $product->id,
            'total_amount' => 500,
            'created_at' => now()->subDays(100),
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/sales/stats?days=30');

        $this->assertEquals(100, $response->json('data.summary.revenue'));
    }

    // ---------------------------------------------------------- breakdowns

    public function test_by_status_includes_every_status_even_empty()
    {
        $this->makeOrder(['product_id' => $this->product()->id, 'status' => 'paid']);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/sales/stats');

        $byStatus = collect($response->json('data.by_status'));
        $this->assertCount(6, $byStatus);
        $this->assertEquals(1, $byStatus->firstWhere('status', 'paid')['count']);
        $this->assertEquals(0, $byStatus->firstWhere('status', 'cancelled')['count']);
    }

    public function test_by_item_type_splits_products_rentals_and_services()
    {
        $this->makeOrder(['product_id' => $this->product()->id, 'total_amount' => 100]);
        $this->makeOrder([
            'rental_id' => Rental::factory()->create(['user_id' => $this->supplier->id])->id,
            'total_amount' => 60,
        ]);
        $this->makeOrder([
            'service_id' => Service::factory()->create(['user_id' => $this->supplier->id])->id,
            'total_amount' => 40,
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/sales/stats');

        $byType = collect($response->json('data.by_item_type'))->keyBy('type');
        $this->assertEquals(100, $byType['product']['revenue']);
        $this->assertEquals(60, $byType['rental']['revenue']);
        $this->assertEquals(40, $byType['service']['revenue']);
        $this->assertEquals(1, $byType['product']['count']);
    }

    public function test_timeseries_returns_one_point_per_day_in_period()
    {
        $this->makeOrder(['product_id' => $this->product()->id, 'total_amount' => 120]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/sales/stats?days=7');

        $series = $response->json('data.timeseries');
        $this->assertCount(7, $series);
        $this->assertEquals(today()->toDateString(), $series[6]['date']);
        $this->assertEquals(120, $series[6]['revenue']);
        $this->assertEquals(1, $series[6]['orders']);
        $this->assertEquals(0, $series[0]['revenue']);
    }

    // ------------------------------------------------------------ rankings

    public function test_top_products_are_ranked_by_revenue()
    {
        $best = $this->product(['name' => 'Best Seller']);
        $other = $this->product(['name' => 'Slow Mover']);

        $this->makeOrder(['product_id' => $best->id, 'total_amount' => 300, 'quantity' => 3]);
        $this->makeOrder(['product_id' => $other->id, 'total_amount' => 50]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/sales/stats');

        $top = $response->json('data.top_products');
        $this->assertEquals('Best Seller', $top[0]['name']);
        $this->assertEquals(300, $top[0]['revenue']);
        $this->assertEquals(3, $top[0]['quantity']);
        $this->assertEquals('Slow Mover', $top[1]['name']);
    }

    public function test_top_products_ignore_unconcretized_orders()
    {
        $product = $this->product(['name' => 'Ghost Sales']);
        $this->makeOrder(['product_id' => $product->id, 'status' => 'cancelled', 'total_amount' => 900]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/sales/stats');

        $this->assertCount(0, $response->json('data.top_products'));
    }

    public function test_top_rentals_and_services_are_ranked()
    {
        $rental = Rental::factory()->create(['user_id' => $this->supplier->id, 'title' => 'Appart Gombe']);
        $service = Service::factory()->create(['user_id' => $this->supplier->id, 'title' => 'Plomberie']);

        $this->makeOrder(['rental_id' => $rental->id, 'total_amount' => 400]);
        $this->makeOrder(['service_id' => $service->id, 'total_amount' => 250]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/sales/stats');

        $this->assertEquals('Appart Gombe', $response->json('data.top_rentals.0.name'));
        $this->assertEquals(400, $response->json('data.top_rentals.0.revenue'));
        $this->assertEquals('Plomberie', $response->json('data.top_services.0.name'));
        $this->assertEquals(250, $response->json('data.top_services.0.revenue'));
    }

    public function test_top_resellers_measure_concretized_sales_and_conversion()
    {
        $product = $this->product();
        $weak = User::factory()->create(['name' => 'Revendeur Faible']);

        // Beta : 2 concrétisées sur 3 commandes générées
        $this->makeOrder(['product_id' => $product->id, 'reseller' => $this->reseller->id, 'status' => 'paid', 'total_amount' => 200, 'commission_amount' => 20]);
        $this->makeOrder(['product_id' => $product->id, 'reseller' => $this->reseller->id, 'status' => 'completed', 'total_amount' => 100, 'commission_amount' => 10]);
        $this->makeOrder(['product_id' => $product->id, 'reseller' => $this->reseller->id, 'status' => 'cancelled', 'total_amount' => 500]);
        // Faible : 1 concrétisée sur 1
        $this->makeOrder(['product_id' => $product->id, 'reseller' => $weak->id, 'status' => 'paid', 'total_amount' => 50, 'commission_amount' => 5]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/sales/stats');

        $top = collect($response->json('data.top_resellers'))->keyBy('name');
        $this->assertEquals(300, $top['Revendeur Beta']['revenue']);
        $this->assertEquals(2, $top['Revendeur Beta']['concretized_orders']);
        $this->assertEquals(3, $top['Revendeur Beta']['total_orders']);
        $this->assertEquals(30, $top['Revendeur Beta']['commission_earned']);
        $this->assertEqualsWithDelta(66.67, $top['Revendeur Beta']['conversion_rate'], 0.01);
        $this->assertEquals(100.0, $top['Revendeur Faible']['conversion_rate']);
    }

    public function test_top_suppliers_aggregate_across_products_rentals_and_services()
    {
        $other = User::factory()->create(['name' => 'Fournisseur Omega']);

        // Alpha vend un produit (100) + une location (200) = 300
        $this->makeOrder(['product_id' => $this->product()->id, 'total_amount' => 100]);
        $this->makeOrder([
            'rental_id' => Rental::factory()->create(['user_id' => $this->supplier->id])->id,
            'total_amount' => 200,
        ]);
        // Omega vend un service (150)
        $this->makeOrder([
            'service_id' => Service::factory()->create(['user_id' => $other->id])->id,
            'total_amount' => 150,
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/sales/stats');

        $top = $response->json('data.top_suppliers');
        $this->assertEquals('Fournisseur Alpha', $top[0]['name']);
        $this->assertEquals(300, $top[0]['revenue']);
        $this->assertEquals(2, $top[0]['orders']);
        $this->assertEquals('Fournisseur Omega', $top[1]['name']);
        $this->assertEquals(150, $top[1]['revenue']);
    }
}
