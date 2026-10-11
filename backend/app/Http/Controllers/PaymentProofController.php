<?php

namespace App\Http\Controllers;

use App\Http\Resources\PaymentProofResource;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PaymentProofController extends Controller
{
    /**
     * Submit a payment proof for an invoice (customer only). A new proof can
     * only be sent when none exists yet or the latest one was rejected.
     */
    public function store(Request $request, Invoice $invoice)
    {
        if ($invoice->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $latestProof = $invoice->paymentProof;

        if ($latestProof && $latestProof->status !== 'rejected') {
            return response()->json([
                'message' => 'Une preuve de paiement existe déjà pour cette facture',
            ], 422);
        }

        $validated = $request->validate([
            'proof' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
            'payment_method' => 'nullable|string|max:100',
            'transaction_reference' => 'nullable|string|max:255',
        ]);

        $path = $request->file('proof')->store('payment-proofs', 'public');

        $proof = $invoice->paymentProofs()->create([
            'user_id' => Auth::id(),
            'proof' => $path,
            'status' => 'pending',
            'payment_method' => $validated['payment_method'] ?? null,
            'transaction_reference' => $validated['transaction_reference'] ?? null,
        ]);

        return (new PaymentProofResource($proof))->response()->setStatusCode(201);
    }
}
