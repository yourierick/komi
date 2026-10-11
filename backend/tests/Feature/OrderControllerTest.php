<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\Rental;
use App\Models\Service;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private User $reseller;
    private Shop $shop;
    private Product $product;
    private Rental $rental;
    private Service $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->reseller = User::factory()->create();
        $this->shop = Shop::factory()->create();
        $this->product = Product::factory()->create([
            'price' => 100.00,
            'currency' => 'USD',
        ]);
        $this->rental = Rental::factory()->create([
            'price' => 50.00,
            'currency' => 'USD',
        ]);
        $this->service = Service::factory()->create([
            'price' => 75.00,
            'currency' => 'USD',
        ]);
    }

    public function test_authenticated_user_can_create_order_for_product()
    {
        $orderData = [
            'product_id' => $this->product->id,
            'quantity' => 2,
            'unit_selling_price' => 100.00,
            'subtotal' => 200.00,
            'total_amount' => 200.00,
            'currency' => 'USD',
            'reseller_id' => $this->reseller->id,
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/orders', $orderData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'order_number',
                    'status',
                    'quantity',
                    'total_amount',
                ],
            ]);

        $this->assertDatabaseHas('orders', [
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
            'quantity' => 2,
            'status' => 'under_negotiation',
        ]);
    }

    public function test_authenticated_user_can_create_order_for_rental()
    {
        $orderData = [
            'rental_id' => $this->rental->id,
            'quantity' => 1,
            'unit_selling_price' => 50.00,
            'subtotal' => 50.00,
            'total_amount' => 50.00,
            'currency' => 'USD',
            'reseller_id' => $this->reseller->id,
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/orders', $orderData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'order_number',
                    'status',
                    'quantity',
                    'total_amount',
                ],
            ]);

        $this->assertDatabaseHas('orders', [
            'user_id' => $this->user->id,
            'rental_id' => $this->rental->id,
            'quantity' => 1,
            'status' => 'under_negotiation',
        ]);
    }

    public function test_authenticated_user_can_create_order_for_service()
    {
        $orderData = [
            'service_id' => $this->service->id,
            'quantity' => 1,
            'unit_selling_price' => 75.00,
            'subtotal' => 75.00,
            'total_amount' => 75.00,
            'currency' => 'USD',
            'reseller_id' => $this->reseller->id,
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/orders', $orderData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'order_number',
                    'status',
                    'quantity',
                    'total_amount',
                ],
            ]);

        $this->assertDatabaseHas('orders', [
            'user_id' => $this->user->id,
            'service_id' => $this->service->id,
            'quantity' => 1,
            'status' => 'under_negotiation',
        ]);
    }

    public function test_unauthenticated_user_cannot_create_order()
    {
        $orderData = [
            'product_id' => $this->product->id,
            'quantity' => 1,
            'unit_selling_price' => 100.00,
            'subtotal' => 100.00,
            'total_amount' => 100.00,
            'currency' => 'USD',
        ];

        $response = $this->postJson('/api/v1/orders', $orderData);

        $response->assertStatus(401);
    }

    public function test_order_requires_product_or_rental()
    {
        $orderData = [
            'quantity' => 1,
            'unit_selling_price' => 100.00,
            'subtotal' => 100.00,
            'total_amount' => 100.00,
            'currency' => 'USD',
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/orders', $orderData);

        $response->assertStatus(422);
    }

    public function test_user_can_list_their_orders()
    {
        Order::create([
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
            'rental_id' => null,
            'order_number' => 'ORD-TEST001',
            'status' => 'under_negotiation',
            'unit_selling_price' => 100.00,
            'quantity' => 1,
            'subtotal' => 100.00,
            'total_amount' => 100.00,
            'currency' => 'USD',
        ]);

        Order::create([
            'user_id' => $this->user->id,
            'rental_id' => $this->rental->id,
            'product_id' => null,
            'order_number' => 'ORD-TEST002',
            'status' => 'under_negotiation',
            'unit_selling_price' => 50.00,
            'quantity' => 1,
            'subtotal' => 50.00,
            'total_amount' => 50.00,
            'currency' => 'USD',
        ]);

        Order::create([
            'user_id' => User::factory()->create()->id,
            'product_id' => $this->product->id,
            'rental_id' => null,
            'order_number' => 'ORD-TEST003',
            'unit_selling_price' => 100.00,
            'quantity' => 1,
            'subtotal' => 100.00,
            'total_amount' => 100.00,
            'currency' => 'USD',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/v1/orders');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_user_can_view_their_order()
    {
        $orderData = [
            'product_id' => $this->product->id,
            'quantity' => 1,
            'unit_selling_price' => 100.00,
            'subtotal' => 100.00,
            'total_amount' => 100.00,
            'currency' => 'USD',
        ];

        $createResponse = $this->actingAs($this->user)
            ->postJson('/api/v1/orders', $orderData);

        $createResponse->assertStatus(201);
        $orderId = $createResponse->json('data.id');

        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'user_id' => $this->user->id,
        ]);

        // Check the order exists in DB
        $order = Order::find($orderId);
        $this->assertNotNull($order);
        $this->assertEquals($this->user->id, $order->user_id);

        $response = $this->actingAs($this->user)
            ->getJson("/api/v1/orders/{$orderId}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $orderId,
                ],
            ]);
    }

    public function test_user_cannot_view_other_users_order()
    {
        $otherUser = User::factory()->create();
        $order = Order::create([
            'user_id' => $otherUser->id,
            'product_id' => $this->product->id,
            'rental_id' => null,
            'order_number' => 'ORD-TEST004',
            'unit_selling_price' => 100.00,
            'quantity' => 1,
            'subtotal' => 100.00,
            'total_amount' => 100.00,
            'currency' => 'USD',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/v1/orders/{$order->id}");

        $response->assertStatus(403);
    }

    public function test_order_number_is_unique()
    {
        $existingOrder = Order::create([
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
            'rental_id' => null,
            'order_number' => 'ORD-12345',
            'unit_selling_price' => 100.00,
            'quantity' => 1,
            'subtotal' => 100.00,
            'total_amount' => 100.00,
            'currency' => 'USD',
        ]);

        $orderData = [
            'product_id' => $this->product->id,
            'quantity' => 1,
            'unit_selling_price' => 100.00,
            'subtotal' => 100.00,
            'total_amount' => 100.00,
            'currency' => 'USD',
            'order_number' => 'ORD-12345',
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/orders', $orderData);

        $response->assertStatus(422);
    }

    public function test_supplier_can_list_received_orders()
    {
        $supplier = User::factory()->create();
        $customer = User::factory()->create();
        
        // Create product owned by supplier
        $product = Product::factory()->create([
            'user_id' => $supplier->id,
            'price' => 100.00,
        ]);

        // Create order from customer to supplier
        Order::create([
            'user_id' => $customer->id,
            'product_id' => $product->id,
            'order_number' => 'ORD-REC001',
            'unit_selling_price' => 100.00,
            'quantity' => 1,
            'subtotal' => 100.00,
            'total_amount' => 100.00,
            'currency' => 'USD',
        ]);

        // Create order from another customer (should not appear)
        $otherProduct = Product::factory()->create(['user_id' => User::factory()->create()->id]);
        Order::create([
            'user_id' => $customer->id,
            'product_id' => $otherProduct->id,
            'order_number' => 'ORD-REC002',
            'unit_selling_price' => 50.00,
            'quantity' => 1,
            'subtotal' => 50.00,
            'total_amount' => 50.00,
            'currency' => 'USD',
        ]);

        $response = $this->actingAs($supplier)
            ->getJson('/api/v1/orders/received');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_user_can_search_orders_by_order_number()
    {
        Order::create([
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
            'order_number' => 'ORD-SEARCH123',
            'unit_selling_price' => 100.00,
            'quantity' => 1,
            'subtotal' => 100.00,
            'total_amount' => 100.00,
            'currency' => 'USD',
        ]);

        Order::create([
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
            'order_number' => 'ORD-OTHER456',
            'unit_selling_price' => 50.00,
            'quantity' => 1,
            'subtotal' => 50.00,
            'total_amount' => 50.00,
            'currency' => 'USD',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/v1/orders?search=SEARCH123');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.order_number', 'ORD-SEARCH123');
    }

    public function test_user_can_filter_orders_by_date()
    {
        // Create old order
        $oldOrder = new Order([
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
            'order_number' => 'ORD-OLD001',
            'unit_selling_price' => 100.00,
            'quantity' => 1,
            'subtotal' => 100.00,
            'total_amount' => 100.00,
            'currency' => 'USD',
        ]);
        $oldOrder->created_at = now()->subDays(10);
        $oldOrder->save();

        // Create recent order
        $recentOrder = new Order([
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
            'order_number' => 'ORD-NEW001',
            'unit_selling_price' => 50.00,
            'quantity' => 1,
            'subtotal' => 50.00,
            'total_amount' => 50.00,
            'currency' => 'USD',
        ]);
        $recentOrder->created_at = now()->subDays(2);
        $recentOrder->save();

        $response = $this->actingAs($this->user)
            ->getJson('/api/v1/orders?from=' . now()->subDays(5)->toDateString());

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.order_number', 'ORD-NEW001');
    }

    public function test_customer_can_confirm_and_cancel_own_order()
    {
        $supplier = User::factory()->create();
        $customer = User::factory()->create();

        $product = Product::factory()->create([
            'user_id' => $supplier->id,
        ]);

        $order = Order::create([
            'user_id' => $customer->id,
            'product_id' => $product->id,
            'order_number' => 'ORD-CONFIRM001',
            'status' => 'under_negotiation',
            'unit_selling_price' => 100.00,
            'quantity' => 1,
            'subtotal' => 100.00,
            'total_amount' => 100.00,
            'currency' => 'USD',
        ]);

        $this->actingAs($customer)
            ->patchJson("/api/v1/orders/{$order->id}/status", ['status' => 'confirmed'])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'confirmed');

        $this->actingAs($customer)
            ->patchJson("/api/v1/orders/{$order->id}/status", ['status' => 'cancelled'])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'cancelled');
    }

    public function test_customer_cannot_mark_order_paid_refunded_or_completed()
    {
        $supplier = User::factory()->create();
        $customer = User::factory()->create();

        $product = Product::factory()->create([
            'user_id' => $supplier->id,
        ]);

        $order = Order::create([
            'user_id' => $customer->id,
            'product_id' => $product->id,
            'order_number' => 'ORD-NOPAY001',
            'status' => 'confirmed',
            'unit_selling_price' => 100.00,
            'quantity' => 1,
            'subtotal' => 100.00,
            'total_amount' => 100.00,
            'currency' => 'USD',
        ]);

        foreach (['paid', 'refunded', 'completed'] as $forbiddenStatus) {
            $this->actingAs($customer)
                ->patchJson("/api/v1/orders/{$order->id}/status", ['status' => $forbiddenStatus])
                ->assertStatus(422);
        }

        $this->assertEquals('confirmed', $order->fresh()->status);
    }

    public function test_supplier_cannot_update_received_order_status()
    {
        $supplier = User::factory()->create();
        $customer = User::factory()->create();
        
        $product = Product::factory()->create([
            'user_id' => $supplier->id,
        ]);

        $order = Order::create([
            'user_id' => $customer->id,
            'product_id' => $product->id,
            'order_number' => 'ORD-STATUS001',
            'status' => 'under_negotiation',
            'unit_selling_price' => 100.00,
            'quantity' => 1,
            'subtotal' => 100.00,
            'total_amount' => 100.00,
            'currency' => 'USD',
        ]);

        $response = $this->actingAs($supplier)
            ->putJson("/api/v1/orders/received/{$order->id}", [
                'status' => 'confirmed',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'under_negotiation',
        ]);
    }
}
