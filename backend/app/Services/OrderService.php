<?php

namespace App\Services;

use App\Models\Commission;
use App\Models\KomiRevenue;
use App\Models\Order;
use App\Models\Setting;
use App\Models\Product;
use App\Models\Rental;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class OrderService
{
    /**
     * Check if user has an existing order for the same product/rental/service
     * with under_negotiation
     */
    public function checkExistingOrder(array $validated): ?Order
    {
        $existingOrderQuery = Order::where('user_id', Auth::id())
            ->whereIn('status', ['under_negotiation']);

        if (!empty($validated['product_id'])) {
            $existingOrderQuery->where('product_id', $validated['product_id']);
        } elseif (!empty($validated['rental_id'])) {
            $existingOrderQuery->where('rental_id', $validated['rental_id']);
        } else {
            $existingOrderQuery->where('service_id', $validated['service_id']);
        }

        $existingOrder = $existingOrderQuery->first();

        if ($existingOrder) {
            $existingOrder->load(['product.user', 'rental.user', 'service.user', 'resellerUser', 'shop']);
        }

        return $existingOrder;
    }

    /**
     * Generate a unique order number
     */
    public function generateOrderNumber(): string
    {
        return 'ORD-' . strtoupper(uniqid());
    }

    /**
     * Map reseller_id to reseller field
     */
    public function mapResellerField(array &$validated): void
    {
        if (isset($validated['reseller_id'])) {
            $validated['reseller'] = $validated['reseller_id'];
            unset($validated['reseller_id']);
        }
    }

    /**
     * Calculate commission amount based on product/rental/service commission settings
     */
    public function calculateCommission(array &$validated): void
    {
        if (empty($validated['reseller'])) {
            return;
        }

        // les services ne portent pas de commission revendeur (pas de colonnes
        // commission_type/commission_value sur la table services)
        if (!empty($validated['product_id'])) {
            $this->calculateProductCommission($validated);
        } elseif (!empty($validated['rental_id'])) {
            $this->calculateRentalCommission($validated);
        }
    }

    /**
     * Calculate commission for product
     */
    private function calculateProductCommission(array &$validated): void
    {
        $product = Product::find($validated['product_id']);
        
        if (!$product || !$product->commission_type || $product->commission_type === 'none') {
            return;
        }

        if ($product->commission_type === 'fixed') {
            $validated['commission_amount'] = $product->commission_value ?? 0;
        } elseif ($product->commission_type === 'percentage') {
            $commissionPercentage = $product->commission_value ?? 0;
            $validated['commission_amount'] = ($validated['total_amount'] * $commissionPercentage) / 100;
        }
    }

    /**
     * Calculate commission for rental
     */
    private function calculateRentalCommission(array &$validated): void
    {
        $rental = Rental::find($validated['rental_id']);
        
        if (!$rental || !$rental->commission_type || $rental->commission_type === 'none') {
            return;
        }

        if ($rental->commission_type === 'fixed') {
            $validated['commission_amount'] = $rental->commission_value ?? 0;
        } elseif ($rental->commission_type === 'percentage') {
            $commissionPercentage = $rental->commission_value ?? 0;
            $validated['commission_amount'] = ($validated['total_amount'] * $commissionPercentage) / 100;
        }
    }

    /**
     * Create a commission for the reseller when an order is marked as paid.
     * The amount is recalculated on the current total_amount at payment time,
     * so it reflects any price renegotiation that happened after creation.
     */
    public function createCommissionForPaidOrder(Order $order): ?Commission
    {
        if (empty($order->reseller)) {
            return null;
        }

        $item = $order->product ?? $order->rental;

        if (!$item || !$item->commission_type || $item->commission_type === 'none') {
            return null;
        }

        $commissionAmount = $item->commission_type === 'fixed'
            ? (float) ($item->commission_value ?? 0)
            : ((float) $order->total_amount * (float) ($item->commission_value ?? 0)) / 100;

        return Commission::firstOrCreate(
            ['order_id' => $order->id],
            [
                'code' => $this->generateCommissionCode(),
                'user_id' => $order->reseller,
                'commission_amount' => $commissionAmount,
                'currency' => $order->currency,
                'status' => 'unpaid',
            ]
        );
    }

    /**
     * Record Komi's platform fee when an order is paid. The applied rate and
     * amount are snapshotted so later rate changes never rewrite history.
     */
    public function recordKomiRevenue(Order $order): ?KomiRevenue
    {
        $order->loadMissing('invoice');
        $percentage = Setting::komiFeePercentage();

        // invoice->komi_fees is snapshotted at invoice creation; recompute only
        // when the order was paid without an invoice
        $amount = $order->invoice
            ? (float) $order->invoice->komi_fees
            : round((float) $order->total_amount * $percentage / 100, 2);

        return KomiRevenue::firstOrCreate(
            ['order_id' => $order->id],
            [
                'invoice_id' => $order->invoice?->id,
                'amount' => $amount,
                'fee_percentage' => $percentage,
                'currency' => $order->currency,
                'status' => 'collected',
                'collected_at' => now(),
            ],
        );
    }

    /**
     * Reverse the platform revenue when a paid order is refunded.
     */
    public function refundKomiRevenue(Order $order): void
    {
        $order->komiRevenue?->update(['status' => 'refunded']);
    }

    /**
     * Generate a unique 8-char uppercase alphanumeric commission code
     */
    private function generateCommissionCode(): string
    {
        do {
            $code = Str::upper(Str::random(8));
        } while (Commission::where('code', $code)->exists());

        return $code;
    }

    /**
     * Create a new order
     */
    public function createOrder(array $validated): Order
    {
        // Generate order number if not provided
        if (empty($validated['order_number'])) {
            $validated['order_number'] = $this->generateOrderNumber();
        }

        // Set default values
        $validated['user_id'] = Auth::id();
        $validated['status'] = 'under_negotiation';

        // Map reseller_id to reseller
        $this->mapResellerField($validated);

        // Calculate commission
        $this->calculateCommission($validated);

        // Create order
        $order = Order::create($validated);

        // Load relationships
        $order->load(['product.user', 'rental.user', 'service.user', 'resellerUser', 'shop']);

        return $order;
    }
}
