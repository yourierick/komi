<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\Order;
use App\Models\Product;
use App\Models\Rental;
use App\Models\User;
use App\Services\InvoiceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceTest extends TestCase
{
    use RefreshDatabase;

    private User $buyer;
    private User $supplier;
    private User $otherUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->buyer = User::factory()->create();
        $this->supplier = User::factory()->create();
        $this->otherUser = User::factory()->create();
    }

    private function createProductOrder(array $orderAttrs = [], ?Product $product = null): Order
    {
        $product ??= Product::factory()->create([
            'user_id' => $this->supplier->id,
        ]);

        return Order::create(array_merge([
            'user_id' => $this->buyer->id,
            'product_id' => $product->id,
            'order_number' => 'ORD-' . strtoupper(uniqid()),
            'status' => 'under_negotiation',
            'unit_selling_price' => 100.00,
            'quantity' => 2,
            'subtotal' => 200.00,
            'tax_amount' => 10.00,
            'shipping_amount' => 5.00,
            'discount_amount' => 15.00,
            'total_amount' => 200.00,
            'currency' => 'USD',
            'payment_method' => 'payment_protected_by_komi',
            'shipping_address' => "12 avenue de la paix\nKinshasa",
            'billing_address' => "12 avenue de la paix\nKinshasa",
            'notes' => 'Livrer le matin',
            'specifications' => ['color' => 'red'],
            'options' => ['warranty' => '1 year'],
        ], $orderAttrs));
    }

    public function test_invoice_is_created_when_supplier_sends_invoice()
    {
        $order = $this->createProductOrder();

        $this->actingAs($this->supplier)
            ->patchJson("/api/v1/orders/sendinvoice/{$order->id}")
            ->assertStatus(200);

        $this->assertDatabaseHas('invoices', [
            'order_id' => $order->id,
            'user_id' => $this->buyer->id,
            'supplier_id' => $this->supplier->id,
            'status' => 'sent',
        ]);
    }

    public function test_invoice_snapshots_order_data_for_printing()
    {
        $order = $this->createProductOrder();

        $this->actingAs($this->supplier)
            ->patchJson("/api/v1/orders/sendinvoice/{$order->id}");

        $this->assertDatabaseHas('invoices', [
            'order_id' => $order->id,
            'item_type' => 'product',
            'item_name' => $order->product->name,
            'quantity' => 2,
            'unit_selling_price' => 100.00,
            'subtotal' => 200.00,
            'tax_amount' => 10.00,
            'shipping_amount' => 5.00,
            'discount_amount' => 15.00,
            'total_amount' => 200.00,
            'currency' => 'USD',
            'payment_method' => 'payment_protected_by_komi',
            'shipping_address' => "12 avenue de la paix\nKinshasa",
            'billing_address' => "12 avenue de la paix\nKinshasa",
            'notes' => 'Livrer le matin',
            'customer_name' => $this->buyer->name,
            'customer_email' => $this->buyer->email,
            'supplier_name' => $this->supplier->name,
            'supplier_email' => $this->supplier->email,
        ]);

        $invoice = Invoice::where('order_id', $order->id)->first();
        $this->assertEquals(['color' => 'red'], $invoice->specifications);
        $this->assertEquals(['warranty' => '1 year'], $invoice->options);
        $this->assertNotNull($invoice->sent_at);
    }

    public function test_invoice_number_is_unique_and_formatted()
    {
        $order1 = $this->createProductOrder();
        $order2 = $this->createProductOrder();

        $this->actingAs($this->supplier)->patchJson("/api/v1/orders/sendinvoice/{$order1->id}");
        $this->actingAs($this->supplier)->patchJson("/api/v1/orders/sendinvoice/{$order2->id}");

        $number1 = Invoice::where('order_id', $order1->id)->value('invoice_number');
        $number2 = Invoice::where('order_id', $order2->id)->value('invoice_number');

        $this->assertMatchesRegularExpression('/^INV-[A-Z0-9]{8}$/', $number1);
        $this->assertMatchesRegularExpression('/^INV-[A-Z0-9]{8}$/', $number2);
        $this->assertNotEquals($number1, $number2);
    }

    public function test_sending_invoice_twice_does_not_create_duplicate()
    {
        $order = $this->createProductOrder();

        $this->actingAs($this->supplier)->patchJson("/api/v1/orders/sendinvoice/{$order->id}");
        $this->actingAs($this->supplier)->patchJson("/api/v1/orders/sendinvoice/{$order->id}");

        $this->assertEquals(1, Invoice::where('order_id', $order->id)->count());
    }

    public function test_sending_invoice_again_refreshes_snapshot_after_renegotiation()
    {
        $order = $this->createProductOrder();

        $this->actingAs($this->supplier)->patchJson("/api/v1/orders/sendinvoice/{$order->id}");

        $this->actingAs($this->supplier)
            ->putJson("/api/v1/orders/received/{$order->id}", ['unit_selling_price' => 150.00])
            ->assertStatus(200);

        $this->actingAs($this->supplier)->patchJson("/api/v1/orders/sendinvoice/{$order->id}");

        $invoice = Invoice::where('order_id', $order->id)->first();
        $this->assertEquals(1, Invoice::where('order_id', $order->id)->count());
        $this->assertEquals(300.00, (float) $invoice->total_amount);
        $this->assertEquals(150.00, (float) $invoice->unit_selling_price);
    }

    public function test_buyer_cannot_send_invoice()
    {
        $order = $this->createProductOrder();

        $this->actingAs($this->buyer)
            ->patchJson("/api/v1/orders/sendinvoice/{$order->id}")
            ->assertStatus(403);

        $this->assertEquals(0, Invoice::count());
    }

    public function test_unrelated_user_cannot_send_invoice()
    {
        $order = $this->createProductOrder();

        $this->actingAs($this->otherUser)
            ->patchJson("/api/v1/orders/sendinvoice/{$order->id}")
            ->assertStatus(403);
    }

    public function test_unauthenticated_user_cannot_send_invoice()
    {
        $order = $this->createProductOrder();

        $this->patchJson("/api/v1/orders/sendinvoice/{$order->id}")->assertStatus(401);
    }

    public function test_invoice_is_marked_paid_when_order_is_paid()
    {
        $order = $this->createProductOrder();

        $this->actingAs($this->supplier)->patchJson("/api/v1/orders/sendinvoice/{$order->id}");

        $order->update(['status' => 'paid']);

        $invoice = Invoice::where('order_id', $order->id)->first();
        $this->assertEquals('paid', $invoice->status);
        $this->assertNotNull($invoice->paid_at);
    }

    public function test_invoice_is_marked_cancelled_when_order_is_cancelled()
    {
        $order = $this->createProductOrder();

        $this->actingAs($this->supplier)->patchJson("/api/v1/orders/sendinvoice/{$order->id}");

        $this->actingAs($this->buyer)
            ->patchJson("/api/v1/orders/{$order->id}/cancel")
            ->assertStatus(200);

        $this->assertDatabaseHas('invoices', [
            'order_id' => $order->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_invoice_is_marked_refunded_when_order_is_refunded()
    {
        $order = $this->createProductOrder();

        $this->actingAs($this->supplier)->patchJson("/api/v1/orders/sendinvoice/{$order->id}");

        $order->update(['status' => 'refunded']);

        $this->assertDatabaseHas('invoices', [
            'order_id' => $order->id,
            'status' => 'refunded',
        ]);
    }

    public function test_buyer_can_view_invoice()
    {
        $order = $this->createProductOrder();

        $this->actingAs($this->supplier)->patchJson("/api/v1/orders/sendinvoice/{$order->id}");

        $invoice = Invoice::where('order_id', $order->id)->first();

        $this->actingAs($this->buyer)
            ->getJson("/api/v1/invoices/{$invoice->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.invoice_number', $invoice->invoice_number)
            ->assertJsonPath('data.order_id', $order->id)
            ->assertJsonPath('data.status', 'sent')
            ->assertJsonPath('data.item_name', $order->product->name)
            ->assertJsonPath('data.total_amount', 200)
            ->assertJsonPath('data.customer.email', $this->buyer->email)
            ->assertJsonPath('data.supplier.email', $this->supplier->email)
            ->assertJsonPath('data.specifications.color', 'red')
            ->assertJsonPath('data.options.warranty', '1 year');
    }

    public function test_supplier_can_view_invoice()
    {
        $order = $this->createProductOrder();

        $this->actingAs($this->supplier)->patchJson("/api/v1/orders/sendinvoice/{$order->id}");

        $invoice = Invoice::where('order_id', $order->id)->first();

        $this->actingAs($this->supplier)
            ->getJson("/api/v1/invoices/{$invoice->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.invoice_number', $invoice->invoice_number);
    }

    public function test_unrelated_user_cannot_view_invoice()
    {
        $order = $this->createProductOrder();

        $this->actingAs($this->supplier)->patchJson("/api/v1/orders/sendinvoice/{$order->id}");

        $invoice = Invoice::where('order_id', $order->id)->first();

        $this->actingAs($this->otherUser)
            ->getJson("/api/v1/invoices/{$invoice->id}")
            ->assertStatus(403);
    }

    public function test_unauthenticated_user_cannot_view_invoice()
    {
        $order = $this->createProductOrder();

        $invoice = app(InvoiceService::class)->createInvoiceForOrder($order);

        $this->getJson("/api/v1/invoices/{$invoice->id}")->assertStatus(401);
    }

    public function test_invoice_is_accessible_through_its_order()
    {
        $order = $this->createProductOrder();

        $this->actingAs($this->supplier)->patchJson("/api/v1/orders/sendinvoice/{$order->id}");

        $this->actingAs($this->buyer)
            ->getJson("/api/v1/orders/{$order->id}/invoice")
            ->assertStatus(200)
            ->assertJsonPath('data.order_id', $order->id);
    }

    public function test_order_invoice_endpoint_returns_404_when_no_invoice_exists()
    {
        $order = $this->createProductOrder();

        $this->actingAs($this->buyer)
            ->getJson("/api/v1/orders/{$order->id}/invoice")
            ->assertStatus(404);
    }

    public function test_user_can_list_their_invoices_as_buyer()
    {
        $order = $this->createProductOrder();

        $this->actingAs($this->supplier)->patchJson("/api/v1/orders/sendinvoice/{$order->id}");

        $this->actingAs($this->buyer)
            ->getJson('/api/v1/invoices')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.order_id', $order->id);
    }

    public function test_supplier_can_list_invoices_they_sent()
    {
        $order = $this->createProductOrder();

        $this->actingAs($this->supplier)->patchJson("/api/v1/orders/sendinvoice/{$order->id}");

        $this->actingAs($this->supplier)
            ->getJson('/api/v1/invoices')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');

        $this->actingAs($this->otherUser)
            ->getJson('/api/v1/invoices')
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    public function test_order_data_cannot_be_edited_after_customer_confirms()
    {
        $order = $this->createProductOrder();

        $this->actingAs($this->supplier)->patchJson("/api/v1/orders/sendinvoice/{$order->id}");

        $this->actingAs($this->buyer)
            ->patchJson("/api/v1/orders/{$order->id}/status", ['status' => 'confirmed'])
            ->assertStatus(200);

        $this->actingAs($this->supplier)
            ->putJson("/api/v1/orders/received/{$order->id}", ['unit_selling_price' => 1.00])
            ->assertStatus(422);

        $this->assertEquals(100.00, (float) $order->fresh()->unit_selling_price);
    }

    public function test_supplier_cannot_edit_data_or_status_after_confirmation()
    {
        $order = $this->createProductOrder();

        $this->actingAs($this->supplier)->patchJson("/api/v1/orders/sendinvoice/{$order->id}");

        $this->actingAs($this->buyer)
            ->patchJson("/api/v1/orders/{$order->id}/status", ['status' => 'confirmed']);

        $this->actingAs($this->supplier)
            ->putJson("/api/v1/orders/received/{$order->id}", [
                'quantity' => 5,
                'tax_amount' => 99,
                'discount_amount' => 99,
                'payment_method' => 'cash_on_delivery',
                'notes' => 'modified after confirm',
            ])
            ->assertStatus(422);

        $fresh = $order->fresh();
        $this->assertEquals(2, $fresh->quantity);
        $this->assertEquals('payment_protected_by_komi', $fresh->payment_method);

        $this->actingAs($this->supplier)
            ->putJson("/api/v1/orders/received/{$order->id}", ['status' => 'paid'])
            ->assertStatus(200);

        $this->assertEquals('confirmed', $order->fresh()->status);
    }

    public function test_invoice_cannot_be_sent_again_after_customer_confirms()
    {
        $order = $this->createProductOrder();

        $this->actingAs($this->supplier)->patchJson("/api/v1/orders/sendinvoice/{$order->id}");

        $this->actingAs($this->buyer)
            ->patchJson("/api/v1/orders/{$order->id}/status", ['status' => 'confirmed']);

        $this->actingAs($this->supplier)
            ->patchJson("/api/v1/orders/sendinvoice/{$order->id}")
            ->assertStatus(422);
    }

    public function test_invoice_snapshot_stays_frozen_once_order_is_confirmed()
    {
        $order = $this->createProductOrder();

        $this->actingAs($this->supplier)->patchJson("/api/v1/orders/sendinvoice/{$order->id}");

        $this->actingAs($this->buyer)
            ->patchJson("/api/v1/orders/{$order->id}/status", ['status' => 'confirmed']);

        $this->actingAs($this->supplier)
            ->putJson("/api/v1/orders/received/{$order->id}", ['unit_selling_price' => 500.00]);

        $invoice = Invoice::where('order_id', $order->id)->first();
        $this->assertEquals(200.00, (float) $invoice->total_amount);
    }

    public function test_invoice_has_komi_fees_defaulting_to_zero()
    {
        $order = $this->createProductOrder();

        $this->actingAs($this->supplier)
            ->patchJson("/api/v1/orders/sendinvoice/{$order->id}");

        $this->assertDatabaseHas('invoices', [
            'order_id' => $order->id,
            'komi_fees' => 0,
        ]);

        $invoice = Invoice::where('order_id', $order->id)->first();

        $this->actingAs($this->buyer)
            ->getJson("/api/v1/invoices/{$invoice->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.komi_fees', 0);
    }

    public function test_invoice_works_for_rental_order()
    {
        $rental = Rental::factory()->create(['user_id' => $this->supplier->id]);

        $order = Order::create([
            'user_id' => $this->buyer->id,
            'rental_id' => $rental->id,
            'order_number' => 'ORD-' . strtoupper(uniqid()),
            'status' => 'under_negotiation',
            'unit_selling_price' => 50.00,
            'quantity' => 1,
            'subtotal' => 50.00,
            'total_amount' => 50.00,
            'currency' => 'USD',
        ]);

        $this->actingAs($this->supplier)
            ->patchJson("/api/v1/orders/sendinvoice/{$order->id}")
            ->assertStatus(200);

        $this->assertDatabaseHas('invoices', [
            'order_id' => $order->id,
            'item_type' => 'rental',
            'item_name' => $rental->title,
        ]);
    }
}
