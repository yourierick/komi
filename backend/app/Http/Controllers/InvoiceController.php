<?php

namespace App\Http\Controllers;

use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class InvoiceController extends Controller
{
    /**
     * List invoices where the user is the customer or the supplier
     */
    public function index(Request $request)
    {
        $userId = Auth::id();

        $query = Invoice::where('user_id', $userId)
            ->orWhere('supplier_id', $userId);

        if ($request->has('search')) {
            $query->where('invoice_number', 'like', '%' . $request->search . '%');
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $invoices = $query->orderBy('created_at', 'desc')->paginate(20);

        return InvoiceResource::collection($invoices);
    }

    public function show(Invoice $invoice)
    {
        $userId = Auth::id();

        if ($invoice->user_id !== $userId && $invoice->supplier_id !== $userId) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        return new InvoiceResource($invoice->load('paymentProof'));
    }

    /**
     * Get the invoice attached to an order
     */
    public function forOrder(Order $order)
    {
        $userId = Auth::id();

        if ($order->user_id !== $userId && $order->supplierId() !== $userId) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $invoice = $order->invoice;

        if (!$invoice) {
            return response()->json([
                'message' => 'No invoice for this order',
            ], 404);
        }

        return new InvoiceResource($invoice->load('paymentProof'));
    }
}
