<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\Order;
use App\Models\PaymentProof;
use App\Models\Product;
use App\Models\User;
use App\Services\InvoiceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PaymentProofTest extends TestCase
{
    use RefreshDatabase;

    private User $buyer;
    private User $supplier;
    private User $otherUser;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $this->buyer = User::factory()->create();
        $this->supplier = User::factory()->create();
        $this->otherUser = User::factory()->create();
    }

    private function createInvoiceForBuyer(): Invoice
    {
        $product = Product::factory()->create(['user_id' => $this->supplier->id]);

        $order = Order::create([
            'user_id' => $this->buyer->id,
            'product_id' => $product->id,
            'order_number' => 'ORD-' . strtoupper(uniqid()),
            'status' => 'confirmed',
            'unit_selling_price' => 100.00,
            'quantity' => 1,
            'subtotal' => 100.00,
            'total_amount' => 100.00,
            'currency' => 'USD',
            'payment_method' => 'payment_protected_by_komi',
            'generate_invoice' => true,
        ]);

        return app(InvoiceService::class)->createInvoiceForOrder($order);
    }

    public function test_customer_can_submit_payment_proof()
    {
        $invoice = $this->createInvoiceForBuyer();

        $response = $this->actingAs($this->buyer)
            ->postJson("/api/v1/invoices/{$invoice->id}/payment-proofs", [
                'proof' => UploadedFile::fake()->image('paiement.jpg'),
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('payment_proofs', [
            'invoice_id' => $invoice->id,
            'user_id' => $this->buyer->id,
            'status' => 'pending',
        ]);

        $proof = PaymentProof::first();
        Storage::disk('public')->assertExists($proof->proof);
    }

    public function test_proof_can_include_payment_method_and_reference()
    {
        $invoice = $this->createInvoiceForBuyer();

        $this->actingAs($this->buyer)
            ->postJson("/api/v1/invoices/{$invoice->id}/payment-proofs", [
                'proof' => UploadedFile::fake()->image('paiement.jpg'),
                'payment_method' => 'airtel_money',
                'transaction_reference' => 'TXN123456',
            ])
            ->assertStatus(201);

        $this->assertDatabaseHas('payment_proofs', [
            'invoice_id' => $invoice->id,
            'payment_method' => 'airtel_money',
            'transaction_reference' => 'TXN123456',
        ]);
    }

    public function test_supplier_cannot_submit_payment_proof()
    {
        $invoice = $this->createInvoiceForBuyer();

        $this->actingAs($this->supplier)
            ->postJson("/api/v1/invoices/{$invoice->id}/payment-proofs", [
                'proof' => UploadedFile::fake()->image('paiement.jpg'),
            ])
            ->assertStatus(403);
    }

    public function test_unrelated_user_cannot_submit_payment_proof()
    {
        $invoice = $this->createInvoiceForBuyer();

        $this->actingAs($this->otherUser)
            ->postJson("/api/v1/invoices/{$invoice->id}/payment-proofs", [
                'proof' => UploadedFile::fake()->image('paiement.jpg'),
            ])
            ->assertStatus(403);
    }

    public function test_unauthenticated_user_cannot_submit_payment_proof()
    {
        $invoice = $this->createInvoiceForBuyer();

        $this->postJson("/api/v1/invoices/{$invoice->id}/payment-proofs", [
            'proof' => UploadedFile::fake()->image('paiement.jpg'),
        ])->assertStatus(401);
    }

    public function test_proof_is_required_and_must_be_an_image()
    {
        $invoice = $this->createInvoiceForBuyer();

        $this->actingAs($this->buyer)
            ->postJson("/api/v1/invoices/{$invoice->id}/payment-proofs", [])
            ->assertStatus(422);

        $this->actingAs($this->buyer)
            ->postJson("/api/v1/invoices/{$invoice->id}/payment-proofs", [
                'proof' => UploadedFile::fake()->create('document.pdf', 100, 'application/pdf'),
            ])
            ->assertStatus(422);

        $this->assertEquals(0, PaymentProof::count());
    }

    public function test_cannot_submit_when_pending_proof_exists()
    {
        $invoice = $this->createInvoiceForBuyer();

        PaymentProof::create([
            'invoice_id' => $invoice->id,
            'user_id' => $this->buyer->id,
            'proof' => 'payment-proofs/old.jpg',
            'status' => 'pending',
        ]);

        $this->actingAs($this->buyer)
            ->postJson("/api/v1/invoices/{$invoice->id}/payment-proofs", [
                'proof' => UploadedFile::fake()->image('paiement.jpg'),
            ])
            ->assertStatus(422);

        $this->assertEquals(1, PaymentProof::count());
    }

    public function test_cannot_submit_when_proof_was_accepted()
    {
        $invoice = $this->createInvoiceForBuyer();

        PaymentProof::create([
            'invoice_id' => $invoice->id,
            'user_id' => $this->buyer->id,
            'proof' => 'payment-proofs/old.jpg',
            'status' => 'accepted',
        ]);

        $this->actingAs($this->buyer)
            ->postJson("/api/v1/invoices/{$invoice->id}/payment-proofs", [
                'proof' => UploadedFile::fake()->image('paiement.jpg'),
            ])
            ->assertStatus(422);
    }

    public function test_customer_can_resubmit_after_rejection()
    {
        $invoice = $this->createInvoiceForBuyer();

        PaymentProof::create([
            'invoice_id' => $invoice->id,
            'user_id' => $this->buyer->id,
            'proof' => 'payment-proofs/old.jpg',
            'status' => 'rejected',
            'reason' => 'Photo illisible',
        ]);

        $this->actingAs($this->buyer)
            ->postJson("/api/v1/invoices/{$invoice->id}/payment-proofs", [
                'proof' => UploadedFile::fake()->image('nouvelle.jpg'),
            ])
            ->assertStatus(201);

        $this->assertEquals(2, PaymentProof::count());
        $this->assertEquals('pending', PaymentProof::latest('id')->first()->status);
    }

    public function test_invoice_resource_exposes_latest_payment_proof()
    {
        $invoice = $this->createInvoiceForBuyer();

        $this->actingAs($this->buyer)
            ->postJson("/api/v1/invoices/{$invoice->id}/payment-proofs", [
                'proof' => UploadedFile::fake()->image('paiement.jpg'),
            ]);

        $proof = PaymentProof::first();

        $this->actingAs($this->buyer)
            ->getJson("/api/v1/invoices/{$invoice->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.payment_proof.id', $proof->id)
            ->assertJsonPath('data.payment_proof.status', 'pending')
            ->assertJsonPath('data.payment_proof.reason', null);
    }
}
