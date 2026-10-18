<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Order;
use App\Models\Setting;
use Illuminate\Support\Str;

class InvoiceService
{
    /**
     * Create or refresh the invoice for an order. The invoice snapshots the
     * order state at send time so the printed document stays valid even if
     * the order, item or users change later. Re-sending refreshes the
     * snapshot but keeps the original invoice number.
     */
    public function createInvoiceForOrder(Order $order): Invoice
    {
        $order->refresh();
        $order->loadMissing(['user', 'product.user', 'rental.user', 'service.user']);

        $item = $order->item();
        $supplier = $item?->user;

        [$itemType, $itemName] = match (true) {
            $order->product !== null => ['product', $order->product->name],
            $order->rental !== null => ['rental', $order->rental->title],
            $order->service !== null => ['service', $order->service->title],
            default => [null, null],
        };

        $invoice = Invoice::firstOrNew(['order_id' => $order->id]);

        if (!$invoice->exists) {
            $invoice->invoice_number = $this->generateInvoiceNumber();
            $invoice->status = 'sent';
            $invoice->sent_at = now();
        }

        $invoice->fill([
            'user_id' => $order->user_id,
            'supplier_id' => $supplier?->id,
            'item_type' => $itemType,
            'item_name' => $itemName,
            'item_image' => $item?->images[0] ?? null,
            'quantity' => $order->quantity,
            'unit_selling_price' => $order->unit_selling_price,
            'subtotal' => $order->subtotal,
            'tax_amount' => $order->tax_amount,
            'shipping_amount' => $order->shipping_amount,
            'discount_amount' => $order->discount_amount,
            'total_amount' => $order->total_amount,
            'commission_amount' => $order->commission_amount,
            // frais plateforme snapshotés à l'émission : un changement de taux
            // ultérieur ne doit pas modifier une facture déjà envoyée
            'komi_fees' => round((float) $order->total_amount * Setting::komiFeePercentage() / 100, 2),
            'currency' => $order->currency,
            'payment_method' => $order->payment_method,
            'shipping_address' => $order->shipping_address,
            'billing_address' => $order->billing_address,
            'notes' => $order->notes,
            'specifications' => $order->specifications,
            'options' => $order->options,
            'customer_name' => $order->user?->name,
            'customer_email' => $order->user?->email,
            'customer_phone' => $order->user?->phone,
            'supplier_name' => $supplier?->name,
            'supplier_email' => $supplier?->email,
            'supplier_phone' => $supplier?->phone,
        ])->save();

        return $invoice;
    }

    /**
     * Keep the invoice status in sync when the parent order changes status.
     */
    public function syncInvoiceStatusForOrder(Order $order): void
    {
        $invoice = $order->invoice;

        if (!$invoice) {
            return;
        }

        $updates = match ($order->status) {
            'paid' => ['status' => 'paid', 'paid_at' => $invoice->paid_at ?? now()],
            'cancelled' => ['status' => 'cancelled'],
            'refunded' => ['status' => 'refunded'],
            default => null,
        };

        if ($updates !== null) {
            $invoice->update($updates);
        }
    }

    private function generateInvoiceNumber(): string
    {
        do {
            $number = 'INV-' . Str::upper(Str::random(8));
        } while (Invoice::where('invoice_number', $number)->exists());

        return $number;
    }
}
