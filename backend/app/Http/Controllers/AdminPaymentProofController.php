<?php

namespace App\Http\Controllers;

use App\Http\Resources\AdminPaymentProofResource;
use App\Models\PaymentProof;
use Illuminate\Http\Request;

class AdminPaymentProofController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'per_page' => 'sometimes|integer|in:10,20,25,30,50',
            'status' => 'sometimes|in:pending,accepted,rejected,refunded',
            'search' => 'sometimes|nullable|string|max:255',
        ]);

        $proofs = PaymentProof::query()
            ->with(['user', 'reviewer', 'invoice.order'])
            ->when($validated['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($validated['search'] ?? null, function ($q, $search) {
                $q->where(function ($query) use ($search) {
                    $query->where('transaction_reference', 'like', "%{$search}%")
                        ->orWhereHas('invoice', fn ($q2) => $q2->where('invoice_number', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate($validated['per_page'] ?? 25);

        return AdminPaymentProofResource::collection($proofs);
    }
}
