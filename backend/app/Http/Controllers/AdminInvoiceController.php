<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminInvoiceController extends Controller
{
    // transitions autorisées depuis l'admin : envoyée → payée, payée → remboursée
    private const TRANSITIONS = [
        'paid' => ['sent'],
        'refunded' => ['paid'],
    ];

    public function updateStatus(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'status' => 'required|in:paid,refunded',
        ]);

        $target = $validated['status'];

        abort_unless(
            in_array($invoice->status, self::TRANSITIONS[$target]),
            422,
            "Cannot mark a {$invoice->status} invoice as {$target}."
        );

        DB::transaction(function () use ($invoice, $target, $request) {
            $invoice->update(array_merge(
                ['status' => $target],
                $target === 'paid' ? ['paid_at' => now()] : [],
            ));

            // la commande suit la facture — l'observer re-synchronise la facture
            // (idempotent) et déclenche la commission revendeur sur 'paid'
            $invoice->order->update(['status' => $target]);

            $invoice->paymentProof?->update([
                'status' => $target === 'paid' ? 'accepted' : 'refunded',
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);
        });

        return response()->json([
            'data' => [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'status' => $invoice->fresh()->status,
                'paid_at' => $invoice->fresh()->paid_at?->toISOString(),
                'order' => [
                    'id' => $invoice->order_id,
                    'status' => $invoice->order->fresh()->status,
                ],
            ],
        ]);
    }
}
