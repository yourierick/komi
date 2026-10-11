<?php

namespace App\Observers;

use App\Models\Order;
use App\Services\InvoiceService;
use App\Services\OrderService;

class OrderObserver
{
    public function __construct(
        protected OrderService $orderService,
        protected InvoiceService $invoiceService,
    ) {
    }

    public function updated(Order $order): void
    {
        if (!$order->wasChanged('status')) {
            return;
        }

        if ($order->status === 'paid') {
            $this->orderService->createCommissionForPaidOrder($order);
        }

        $this->invoiceService->syncInvoiceStatusForOrder($order);
    }
}
