<?php

namespace Tests\Feature;

use App\Models\Commission;
use App\Models\Order;
use App\Models\Product;
use App\Models\Rental;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommissionTest extends TestCase
{
    use RefreshDatabase;

    private User $buyer;
    private User $supplier;
    private User $reseller;

    protected function setUp(): void
    {
        parent::setUp();

        $this->buyer = User::factory()->create();
        $this->supplier = User::factory()->create();
        $this->reseller = User::factory()->create();
    }

    private function createProductOrder(array $orderAttrs = [], ?Product $product = null): Order
    {
        $product ??= Product::factory()->create([
            'user_id' => $this->supplier->id,
            'commission_type' => 'none',
            'commission_value' => null,
        ]);

        return Order::create(array_merge([
            'user_id' => $this->buyer->id,
            'product_id' => $product->id,
            'reseller' => $this->reseller->id,
            'order_number' => 'ORD-' . strtoupper(uniqid()),
            'status' => 'confirmed',
            'unit_selling_price' => 100.00,
            'quantity' => 2,
            'subtotal' => 200.00,
            'total_amount' => 200.00,
            'currency' => 'USD',
        ], $orderAttrs));
    }

    public function test_commission_is_created_when_percentage_order_is_marked_paid()
    {
        $product = Product::factory()->create([
            'user_id' => $this->supplier->id,
            'commission_type' => 'percentage',
            'commission_value' => 10,
        ]);
        $order = $this->createProductOrder(product: $product);

        $order->update(['status' => 'paid']);

        $this->assertDatabaseHas('commissions', [
            'user_id' => $this->reseller->id,
            'order_id' => $order->id,
            'commission_amount' => 20.00,
            'currency' => 'USD',
            'status' => 'unpaid',
            'paid_at' => null,
        ]);
    }

    public function test_commission_is_created_with_fixed_amount_when_order_marked_paid()
    {
        $product = Product::factory()->create([
            'user_id' => $this->supplier->id,
            'commission_type' => 'fixed',
            'commission_value' => 15.50,
        ]);
        $order = $this->createProductOrder(product: $product);

        $order->update(['status' => 'paid']);

        $this->assertDatabaseHas('commissions', [
            'order_id' => $order->id,
            'user_id' => $this->reseller->id,
            'commission_amount' => 15.50,
            'status' => 'unpaid',
        ]);
    }

    public function test_no_commission_when_order_has_no_reseller()
    {
        $product = Product::factory()->create([
            'user_id' => $this->supplier->id,
            'commission_type' => 'percentage',
            'commission_value' => 10,
        ]);
        $order = $this->createProductOrder(['reseller' => null], $product);

        $order->update(['status' => 'paid']);

        $this->assertEquals(0, Commission::count());
    }

    public function test_no_commission_when_commission_type_is_none()
    {
        $order = $this->createProductOrder();

        $order->update(['status' => 'paid']);

        $this->assertEquals(0, Commission::count());
    }

    public function test_commission_is_calculated_on_updated_total_amount()
    {
        $product = Product::factory()->create([
            'user_id' => $this->supplier->id,
            'commission_type' => 'percentage',
            'commission_value' => 10,
        ]);
        $order = $this->createProductOrder(['status' => 'under_negotiation'], $product);

        // supplier renegotiates the price while still under negotiation: total becomes 300 (qty 2 x 150)
        $this->actingAs($this->supplier)
            ->putJson("/api/v1/orders/received/{$order->id}", ['unit_selling_price' => 150.00])
            ->assertStatus(200);

        $order->refresh()->update(['status' => 'paid']);

        $this->assertDatabaseHas('commissions', [
            'order_id' => $order->id,
            'commission_amount' => 30.00,
        ]);
    }

    public function test_commission_is_not_duplicated_when_order_marked_paid_twice()
    {
        $product = Product::factory()->create([
            'user_id' => $this->supplier->id,
            'commission_type' => 'percentage',
            'commission_value' => 10,
        ]);
        $order = $this->createProductOrder(product: $product);

        $order->update(['status' => 'paid']);
        $order->update(['status' => 'confirmed']);
        $order->update(['status' => 'paid']);

        $this->assertEquals(1, Commission::where('order_id', $order->id)->count());
    }

    public function test_buyer_cannot_mark_order_paid_via_status_endpoint()
    {
        $product = Product::factory()->create([
            'user_id' => $this->supplier->id,
            'commission_type' => 'percentage',
            'commission_value' => 10,
        ]);
        $order = $this->createProductOrder(product: $product);

        $this->actingAs($this->buyer)
            ->patchJson("/api/v1/orders/{$order->id}/status", ['status' => 'paid'])
            ->assertStatus(422);

        $this->assertEquals(0, Commission::count());
    }

    public function test_commission_is_created_for_rental_order()
    {
        $rental = Rental::factory()->create([
            'user_id' => $this->supplier->id,
            'commission_type' => 'percentage',
            'commission_value' => 20,
        ]);

        $order = Order::create([
            'user_id' => $this->buyer->id,
            'rental_id' => $rental->id,
            'reseller' => $this->reseller->id,
            'order_number' => 'ORD-' . strtoupper(uniqid()),
            'status' => 'confirmed',
            'unit_selling_price' => 100.00,
            'quantity' => 1,
            'subtotal' => 100.00,
            'total_amount' => 100.00,
            'currency' => 'USD',
        ]);

        $order->update(['status' => 'paid']);

        $this->assertDatabaseHas('commissions', [
            'order_id' => $order->id,
            'user_id' => $this->reseller->id,
            'commission_amount' => 20.00,
        ]);
    }

    public function test_commission_has_unique_8_char_uppercase_alphanumeric_code()
    {
        $product = Product::factory()->create([
            'user_id' => $this->supplier->id,
            'commission_type' => 'percentage',
            'commission_value' => 10,
        ]);
        $order = $this->createProductOrder(product: $product);

        $order->update(['status' => 'paid']);

        $commission = Commission::where('order_id', $order->id)->first();

        $this->assertNotNull($commission->code);
        $this->assertMatchesRegularExpression('/^[A-Z0-9]{8}$/', $commission->code);
    }

    public function test_commission_codes_are_unique_across_orders()
    {
        $product = Product::factory()->create([
            'user_id' => $this->supplier->id,
            'commission_type' => 'percentage',
            'commission_value' => 10,
        ]);
        $order1 = $this->createProductOrder(product: $product);
        $order2 = $this->createProductOrder(product: $product);

        $order1->update(['status' => 'paid']);
        $order2->update(['status' => 'paid']);

        $code1 = Commission::where('order_id', $order1->id)->value('code');
        $code2 = Commission::where('order_id', $order2->id)->value('code');

        $this->assertNotNull($code1);
        $this->assertNotNull($code2);
        $this->assertNotEquals($code1, $code2);
    }

    public function test_commission_code_is_returned_in_api()
    {
        $product = Product::factory()->create([
            'user_id' => $this->supplier->id,
            'commission_type' => 'percentage',
            'commission_value' => 10,
        ]);
        $order = $this->createProductOrder(product: $product);

        $order->update(['status' => 'paid']);

        $response = $this->actingAs($this->reseller)->getJson('/api/v1/commissions');

        $response->assertStatus(200)
            ->assertJsonPath('data.0.code', Commission::where('order_id', $order->id)->value('code'));
    }

    public function test_reseller_can_list_their_commissions()
    {
        $product = Product::factory()->create([
            'user_id' => $this->supplier->id,
            'commission_type' => 'percentage',
            'commission_value' => 10,
        ]);
        $order = $this->createProductOrder(product: $product);

        $order->update(['status' => 'paid']);

        $response = $this->actingAs($this->reseller)->getJson('/api/v1/commissions');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.order_id', $order->id)
            ->assertJsonPath('data.0.status', 'unpaid');
    }

    public function test_user_does_not_see_other_resellers_commissions()
    {
        $product = Product::factory()->create([
            'user_id' => $this->supplier->id,
            'commission_type' => 'percentage',
            'commission_value' => 10,
        ]);
        $order = $this->createProductOrder(product: $product);

        $order->update(['status' => 'paid']);

        $response = $this->actingAs($this->buyer)->getJson('/api/v1/commissions');

        $response->assertStatus(200)->assertJsonCount(0, 'data');
    }

    public function test_unauthenticated_user_cannot_list_commissions()
    {
        $this->getJson('/api/v1/commissions')->assertStatus(401);
    }
}
