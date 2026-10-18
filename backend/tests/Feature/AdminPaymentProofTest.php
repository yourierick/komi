<?php

namespace Tests\Feature;

use App\Models\Commission;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\PaymentProof;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminPaymentProofTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $customer;
    private User $supplier;
    private User $reseller;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->admin()->create();
        $this->customer = User::factory()->create(['name' => 'Client Mukendi']);
        $this->supplier = User::factory()->create();
        $this->reseller = User::factory()->create();
    }

    private function createProof(array $proofAttrs = [], array $invoiceAttrs = [], array $orderAttrs = []): PaymentProof
    {
        $product = Product::factory()->create(['user_id' => $this->supplier->id]);

        $order = Order::create(array_merge([
            'user_id' => $this->customer->id,
            'product_id' => $product->id,
            'reseller' => $this->reseller->id,
            'order_number' => 'ORD-' . strtoupper(uniqid()),
            'status' => 'confirmed',
            'unit_selling_price' => 100.00,
            'quantity' => 1,
            'subtotal' => 100.00,
            'total_amount' => 100.00,
            'currency' => 'USD',
        ], $orderAttrs));

        $invoice = Invoice::create(array_merge([
            'order_id' => $order->id,
            'user_id' => $order->user_id,
            'supplier_id' => $this->supplier->id,
            'invoice_number' => 'INV-' . strtoupper(uniqid()),
            'status' => 'sent',
            'item_name' => $product->name,
            'quantity' => 1,
            'unit_selling_price' => 100.00,
            'total_amount' => 100.00,
            'currency' => 'USD',
            'sent_at' => now(),
        ], $invoiceAttrs));

        return $invoice->paymentProofs()->create(array_merge([
            'user_id' => $this->customer->id,
            'proof' => 'payment-proofs/test.png',
            'status' => 'pending',
            'payment_method' => 'mobile_money',
            'transaction_reference' => 'TXN-001',
        ], $proofAttrs));
    }

    // ----------------------------------------------------------------- index

    public function test_proofs_index_requires_authentication()
    {
        $this->getJson('/api/v1/admin/payment-proofs')->assertStatus(401);
    }

    public function test_proofs_index_forbidden_for_non_admin()
    {
        $this->actingAs($this->customer)
            ->getJson('/api/v1/admin/payment-proofs')
            ->assertStatus(403);
    }

    public function test_proofs_index_returns_invoice_order_and_customer()
    {
        $proof = $this->createProof();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/payment-proofs');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [[
                    'id', 'status', 'proof_url', 'payment_method', 'transaction_reference',
                    'created_at',
                    'user' => ['id', 'name', 'email'],
                    'invoice' => [
                        'id', 'invoice_number', 'status', 'total_amount', 'currency',
                        'order' => ['id', 'order_number', 'status'],
                    ],
                ]],
            ])
            ->assertJsonPath('data.0.id', $proof->id)
            ->assertJsonPath('data.0.user.name', 'Client Mukendi')
            ->assertJsonPath('data.0.invoice.invoice_number', $proof->invoice->invoice_number)
            ->assertJsonPath('data.0.invoice.order.order_number', $proof->invoice->order->order_number);
    }

    public function test_proofs_index_filters_by_status()
    {
        $this->createProof(['status' => 'pending']);
        $this->createProof(['status' => 'accepted']);

        $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/payment-proofs?status=pending')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'pending');
    }

    public function test_proofs_index_rejects_invalid_status_filter()
    {
        $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/payment-proofs?status=bogus')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    // ------------------------------------------------- invoice status actions

    public function test_marking_invoice_paid_updates_order_and_proof()
    {
        $proof = $this->createProof();
        $invoice = $proof->invoice;

        $response = $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/invoices/{$invoice->id}/status", ['status' => 'paid']);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'paid');

        $this->assertDatabaseHas('invoices', ['id' => $invoice->id, 'status' => 'paid']);
        $this->assertNotNull($invoice->fresh()->paid_at);
        $this->assertDatabaseHas('orders', ['id' => $invoice->order_id, 'status' => 'paid']);
        $this->assertDatabaseHas('payment_proofs', [
            'id' => $proof->id,
            'status' => 'accepted',
            'reviewed_by' => $this->admin->id,
        ]);
        $this->assertNotNull($proof->fresh()->reviewed_at);
    }

    public function test_marking_invoice_paid_creates_reseller_commission()
    {
        $proof = $this->createProof([], [], [
            'total_amount' => 100.00,
            'subtotal' => 100.00,
        ]);
        // le produit doit avoir une commission configurée
        Product::where('id', $proof->invoice->order->product_id)
            ->update(['commission_type' => 'percentage', 'commission_value' => 10]);

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/invoices/{$proof->invoice_id}/status", ['status' => 'paid'])
            ->assertStatus(200);

        $this->assertDatabaseHas('commissions', [
            'order_id' => $proof->invoice->order_id,
            'user_id' => $this->reseller->id,
            'commission_amount' => 10.00,
            'status' => 'unpaid',
        ]);
    }

    public function test_marking_invoice_refunded_updates_order_and_proof()
    {
        $proof = $this->createProof([], [], ['status' => 'paid']);
        $invoice = $proof->invoice;
        $invoice->update(['status' => 'paid', 'paid_at' => now()]);

        $response = $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/invoices/{$invoice->id}/status", ['status' => 'refunded']);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'refunded');

        $this->assertDatabaseHas('invoices', ['id' => $invoice->id, 'status' => 'refunded']);
        $this->assertDatabaseHas('orders', ['id' => $invoice->order_id, 'status' => 'refunded']);
        $this->assertDatabaseHas('payment_proofs', [
            'id' => $proof->id,
            'status' => 'refunded',
            'reviewed_by' => $this->admin->id,
        ]);
    }

    public function test_invoice_status_rejects_invalid_values()
    {
        $invoice = $this->createProof()->invoice;

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/invoices/{$invoice->id}/status", ['status' => 'cancelled'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_invoice_cannot_be_paid_twice()
    {
        $invoice = $this->createProof()->invoice;

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/invoices/{$invoice->id}/status", ['status' => 'paid'])
            ->assertStatus(200);

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/invoices/{$invoice->id}/status", ['status' => 'paid'])
            ->assertStatus(422);
    }

    public function test_invoice_cannot_be_refunded_before_being_paid()
    {
        $invoice = $this->createProof()->invoice; // status 'sent'

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/invoices/{$invoice->id}/status", ['status' => 'refunded'])
            ->assertStatus(422);
    }

    public function test_invoice_status_forbidden_for_non_admin()
    {
        $invoice = $this->createProof()->invoice;

        $this->actingAs($this->customer)
            ->patchJson("/api/v1/admin/invoices/{$invoice->id}/status", ['status' => 'paid'])
            ->assertStatus(403);
    }
}
