<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Product;
use App\Models\Rental;
use App\Models\Service;
use App\Services\InvoiceService;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    protected $orderService;
    protected $invoiceService;

    public function __construct(OrderService $orderService, InvoiceService $invoiceService)
    {
        $this->orderService = $orderService;
        $this->invoiceService = $invoiceService;
    }

    public function index(Request $request)
    {
        $query = Order::where('user_id', Auth::id())
            ->with(['product.user', 'rental.user', 'service.user', 'resellerUser', 'shop', 'invoice.paymentProof']);

        // Search by order number
        if ($request->has('search')) {
            $query->where('order_number', 'like', '%' . $request->search . '%');
        }

        // Filter by date range
        if ($request->has('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }

        if ($request->has('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $orders = $query->orderBy('created_at', 'desc')->paginate(20);

        return OrderResource::collection($orders);
    }

    public function store(Request $request)
    {
        // Convert empty date strings to null
        $request->merge([
            'shipped_at' => $request->input('shipped_at') === '' ? null : $request->input('shipped_at'),
            'delivered_at' => $request->input('delivered_at') === '' ? null : $request->input('delivered_at'),
        ]);

        $validated = $request->validate([
            'product_id' => 'nullable|exists:products,id',
            'rental_id' => 'nullable|exists:rentals,id',
            'service_id' => 'nullable|exists:services,id',
            'shop_id' => 'nullable|exists:shops,id',
            'quantity' => 'required|integer|min:1',
            'unit_selling_price' => 'required|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'currency' => 'required|string|max:3',
            'reseller_id' => 'nullable|exists:users,id',
            'order_number' => 'nullable|string|unique:orders,order_number',
            'shipping_address' => 'nullable|string',
            'billing_address' => 'nullable|string',
            'notes' => 'nullable|string',
            'specifications' => 'nullable|array',
            'options' => 'nullable|array',
            'shipped_at' => 'nullable|date',
            'delivered_at' => 'nullable|date',
        ]);

        // Ensure either product_id, rental_id or service_id is provided
        if (empty($validated['product_id']) && empty($validated['rental_id']) && empty($validated['service_id'])) {
            return response()->json([
                'message' => 'Either product_id, rental_id or service_id is required',
            ], 422);
        }

        $item = null;
        if (!empty($validated['product_id'])) {
            $item = Product::find($validated['product_id']);
        } elseif (!empty($validated['rental_id'])) {
            $item = Rental::find($validated['rental_id']);
        } elseif (!empty($validated['service_id'])) {
            $item = Service::find($validated['service_id']);
        }

        // Calculate subtotal and total_amount automatically
        $validated['subtotal'] = $validated['quantity'] * $validated['unit_selling_price'];
        $validated['total_amount'] = $validated['subtotal'] 
            + ($validated['tax_amount'] ?? 0) 
            + ($validated['shipping_amount'] ?? 0) 
            - ($validated['discount_amount'] ?? 0);

        
        $validated['commission_amount'] = $item?->commission_value ?? 0;

        $hasCommission = $item && $item->commission_type && $item->commission_type !== 'none' && ($item->commission_value ?? 0) > 0;
        if ($hasCommission) {
            $validated['payment_method'] = 'payment_protected_by_komi';
        }

        // Check for existing orders
        $existingOrder = $this->orderService->checkExistingOrder($validated);

        if ($existingOrder) {
            $itemType = !empty($validated['product_id']) ? 'produit' : (!empty($validated['rental_id']) ? 'location' : 'service');
            
            if ($existingOrder->status === 'under_negotiation') {
                return response()->json([
                    'message' => 'Vous avez déjà une commande existante pour ce ' . $itemType,
                    'existing_order' => new OrderResource($existingOrder),
                ], 409);
            }
        }

        // Create order using service
        $order = $this->orderService->createOrder($validated);

        return new OrderResource($order);
    }

    public function show(Order $order)
    {
        $userId = Auth::id();
        
        // Check if user is the customer
        if ($order->user_id == $userId) {
            return new OrderResource($order->load(['user', 'product.user', 'rental.user', 'service.user', 'resellerUser', 'shop', 'invoice.paymentProof']));
        }
        
        // Check if user is the supplier
        $isSupplier = false;
        if ($order->product && $order->product->user_id == $userId) {
            $isSupplier = true;
        } elseif ($order->rental && $order->rental->user_id == $userId) {
            $isSupplier = true;
        } elseif ($order->service && $order->service->user_id == $userId) {
            $isSupplier = true;
        }
        
        if ($isSupplier) {
            return new OrderResource($order->load(['product.user', 'rental.user', 'service.user', 'user', 'resellerUser', 'shop', 'invoice.paymentProof']));
        }

        return response()->json([
            'message' => 'Unauthorized',
        ], 403);
    }

    public function update(Request $request, Order $order)
    {
        if ($order->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $validated = $request->validate([
            'status' => 'nullable|in:under_negotiation,confirmed,paid,refunded,cancelled,completed',
            'shipping_address' => 'nullable|string',
            'billing_address' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $order->update($validated);

        return new OrderResource($order->load(['product', 'rental', 'resellerUser', 'shop', 'invoice.paymentProof']));
    }

    public function destroy(Order $order)
    {
        if ($order->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $order->delete();

        return response()->json([
            'message' => 'Order deleted successfully',
        ]);
    }

    /**
     * List orders received by the authenticated user (as supplier)
     */
    public function receivedOrders(Request $request)
    {
        $userId = Auth::id();

        $query = Order::where(function ($q) use ($userId) {
            $q->whereHas('product', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->orWhereHas('rental', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->orWhereHas('service', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            });
        })
        ->with(['product.user', 'rental.user', 'service.user', 'user', 'resellerUser', 'shop', 'invoice.paymentProof']);

        // Search by order number
        if ($request->has('search')) {
            $query->where('order_number', 'like', '%' . $request->search . '%');
        }

        // Filter by date range
        if ($request->has('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }

        if ($request->has('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $orders = $query->orderBy('created_at', 'desc')->paginate(20);

        return OrderResource::collection($orders);
    }

    /**
     * Update a received order (supplier can update)
     */
    public function updateReceivedOrder(Request $request, Order $order)
    {
        // Check if authenticated user is the supplier of the product/rental/service
        $userId = Auth::id();
        $isSupplier = false;

        if ($order->product && $order->product->user_id === $userId) {
            $isSupplier = true;
        } elseif ($order->rental && $order->rental->user_id === $userId) {
            $isSupplier = true;
        } elseif ($order->service && $order->service->user_id === $userId) {
            $isSupplier = true;
        }

        if (!$isSupplier) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // Convert empty date strings to null
        $request->merge([
            'shipped_at' => $request->input('shipped_at') === '' ? null : $request->input('shipped_at'),
            'delivered_at' => $request->input('delivered_at') === '' ? null : $request->input('delivered_at'),
        ]);

        // once the customer confirms, negotiated data is frozen; only
        // lifecycle fields (status, shipped/delivered dates) may still change
        if ($order->status !== 'under_negotiation') {
            $lockedFields = [
                'quantity', 'unit_selling_price', 'tax_amount', 'shipping_amount',
                'discount_amount', 'commission_amount', 'payment_method',
                'shipping_address', 'billing_address', 'notes', 'specifications', 'options',
            ];

            if ($request->hasAny($lockedFields)) {
                return response()->json([
                    'message' => 'Les données de la commande ne sont plus modifiables une fois la commande confirmée',
                ], 422);
            }
        }

        // order status is driven by the customer (confirm/cancel) and by komi
        // admin operations (paid/refunded/completed) — never by the supplier
        $validated = $request->validate([
            'payment_method' => 'nullable|in:cash_on_delivery,payment_in_store,manual_payment_via_mobile_money,payment_by_bank_transfer,payment_by_physical_deposit,payment_protected_by_komi',
            'shipping_address' => 'nullable|string',
            'billing_address' => 'nullable|string',
            'notes' => 'nullable|string',
            'specifications' => 'nullable|array',
            'options' => 'nullable|array',
            'shipped_at' => 'nullable|date',
            'delivered_at' => 'nullable|date',
            'unit_selling_price' => 'nullable|numeric|min:0',
            'quantity' => 'nullable|integer|min:1',
            'tax_amount' => 'nullable|numeric|min:0',
            'shipping_amount' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'commission_amount' => 'nullable|numeric|min:0',
        ]);

        // Calculate subtotal and total_amount automatically if quantity or unit_selling_price changed
        if (isset($validated['quantity']) || isset($validated['unit_selling_price'])) {
            $quantity = $validated['quantity'] ?? $order->quantity;
            $unitSellingPrice = $validated['unit_selling_price'] ?? $order->unit_selling_price;
            $validated['subtotal'] = $quantity * $unitSellingPrice;
        }

        if (isset($validated['subtotal']) || isset($validated['tax_amount']) || isset($validated['shipping_amount']) || isset($validated['discount_amount'])) {
            $subtotal = $validated['subtotal'] ?? $order->subtotal;
            $taxAmount = $validated['tax_amount'] ?? $order->tax_amount;
            $shippingAmount = $validated['shipping_amount'] ?? $order->shipping_amount;
            $discountAmount = $validated['discount_amount'] ?? $order->discount_amount;
            $validated['total_amount'] = $subtotal + $taxAmount + $shippingAmount - $discountAmount;
        }

        $order->update($validated);

        return new OrderResource($order->load(['product.user', 'rental.user', 'service.user', 'user', 'resellerUser', 'shop', 'invoice.paymentProof']));
    }

    /**
     * Send invoice to customer
     */
    public function sendInvoice(Order $order)
    {
        if ($order->supplierId() !== Auth::id()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // an invoice may only be sent or re-sent during negotiation; once the
        // customer confirms, the snapshot is final
        if ($order->status !== 'under_negotiation') {
            return response()->json([
                'message' => 'La facture ne peut être envoyée que pendant la négociation',
            ], 422);
        }

        $this->invoiceService->createInvoiceForOrder($order);

        $order->generate_invoice = 1;
        $order->update();

        return new OrderResource($order->load(['product.user', 'rental.user', 'service.user', 'user', 'resellerUser', 'shop', 'invoice.paymentProof']));
    }

    /**
     * Cancel a Order : by the customer
     */
    public function cancel (Order $order)
    {
      $order->status = "cancelled";
      $order->update();
      return new OrderResource($order->load(['product.user', 'rental.user', 'service.user', 'user', 'resellerUser', 'shop', 'invoice.paymentProof']));  
    }

    /**
     * Update order status : by the customer
     */
    public function updateStatus(Request $request, Order $order)
    {
        if ($order->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // the customer can only confirm or cancel: paid/refunded/completed are
        // set by komi admin operations (payment validation, refund, fulfillment)
        try {
            $validated = $request->validate([
                'status' => 'required|in:confirmed,cancelled',
            ]);
        } catch (ValidationException $e) {
            Log::warning('Order status validation failed', [
                'order_id' => $order->id,
                'errors' => $e->errors(),
                'payload' => $request->all(),
            ]);
            throw $e;
        }

        $order->update($validated);

        return new OrderResource($order->load(['product.user', 'rental.user', 'service.user', 'user', 'resellerUser', 'shop', 'invoice.paymentProof']));
    }
}
