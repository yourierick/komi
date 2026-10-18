<?php

namespace App\Http\Controllers;

use App\Http\Resources\AdminCommissionResource;
use App\Models\Commission;
use Illuminate\Http\Request;

class AdminCommissionController extends Controller
{
    public function stats()
    {
        $statuses = Commission::query()
            ->selectRaw('status, COUNT(*) as count, COALESCE(SUM(commission_amount), 0) as amount')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $paidTotals = fn ($from) => (float) Commission::where('status', 'paid')
            ->where('paid_at', '>=', $from)
            ->sum('commission_amount');

        // la requête ne renvoie que les jours non vides — les jours sans
        // paiement sont re-bouchés côté php pour une série continue de 30 points
        $dailyRows = Commission::where('status', 'paid')
            ->where('paid_at', '>=', today()->subDays(29))
            ->selectRaw('DATE(paid_at) as date, COALESCE(SUM(commission_amount), 0) as amount, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $daily = collect(range(29, 0))->map(function ($i) use ($dailyRows) {
            $date = today()->subDays($i)->toDateString();

            return [
                'date' => $date,
                'amount' => (float) ($dailyRows[$date]->amount ?? 0),
                'count' => (int) ($dailyRows[$date]->count ?? 0),
            ];
        })->values();

        return response()->json([
            'data' => [
                'statuses' => collect(['unpaid', 'paid', 'rejected'])->mapWithKeys(fn ($s) => [
                    $s => [
                        'count' => (int) ($statuses[$s]->count ?? 0),
                        'amount' => (float) ($statuses[$s]->amount ?? 0),
                    ],
                ]),
                'paid_totals' => [
                    'today' => $paidTotals(today()),
                    'this_week' => $paidTotals(now()->startOfWeek()),
                    'this_month' => $paidTotals(now()->startOfMonth()),
                    'this_year' => $paidTotals(now()->startOfYear()),
                ],
                'daily' => $daily,
            ],
        ]);
    }

    public function show(string $code)
    {
        // les codes sont générés en majuscules, on normalise la saisie admin
        $commission = Commission::with(['user', 'order'])
            ->where('code', strtoupper(trim($code)))
            ->firstOrFail();

        return new AdminCommissionResource($commission);
    }

    public function pay(Commission $commission)
    {
        abort_unless($commission->status === 'unpaid', 422, 'This commission has already been processed.');

        $commission->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        return new AdminCommissionResource($commission->load(['user', 'order']));
    }

    public function reject(Request $request, Commission $commission)
    {
        abort_unless($commission->status === 'unpaid', 422, 'This commission has already been processed.');

        $validated = $request->validate([
            'notes' => 'required|string|min:3|max:2000',
        ]);

        $commission->update([
            'status' => 'rejected',
            'notes' => $validated['notes'],
        ]);

        return new AdminCommissionResource($commission->load(['user', 'order']));
    }
}
