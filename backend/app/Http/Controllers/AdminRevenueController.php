<?php

namespace App\Http\Controllers;

use App\Http\Resources\AdminKomiRevenueResource;
use App\Models\KomiRevenue;
use App\Models\Setting;
use Illuminate\Http\Request;

class AdminRevenueController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'per_page' => 'sometimes|integer|in:10,20,25,30,50',
            'status' => 'sometimes|in:collected,refunded',
            'search' => 'sometimes|nullable|string|max:255',
        ]);

        $revenues = KomiRevenue::query()
            ->with(['order', 'invoice'])
            ->when($validated['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($validated['search'] ?? null, function ($q, $search) {
                $q->whereHas('order', fn ($q2) => $q2->where('order_number', 'like', "%{$search}%"))
                    ->orWhereHas('invoice', fn ($q2) => $q2->where('invoice_number', 'like', "%{$search}%"));
            })
            ->latest('collected_at')
            ->paginate($validated['per_page'] ?? 25);

        return AdminKomiRevenueResource::collection($revenues);
    }

    public function stats()
    {
        $statuses = KomiRevenue::query()
            ->selectRaw('status, COUNT(*) as count, COALESCE(SUM(amount), 0) as amount')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $collected = fn ($date) => KomiRevenue::where('status', 'collected')
            ->where('collected_at', '>=', $date)
            ->sum('amount');

        $daily = KomiRevenue::where('status', 'collected')
            ->where('collected_at', '>=', today()->subDays(29))
            ->selectRaw('DATE(collected_at) as date, COALESCE(SUM(amount), 0) as amount, COUNT(*) as count')
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        // jours sans encaissement rebouchés pour une série continue de 30 points
        $series = collect(range(29, 0))->map(function ($offset) use ($daily) {
            $date = today()->subDays($offset)->toDateString();

            return [
                'date' => $date,
                'amount' => round((float) ($daily[$date]->amount ?? 0), 2),
                'count' => (int) ($daily[$date]->count ?? 0),
            ];
        });

        return response()->json([
            'data' => [
                'statuses' => [
                    'collected' => [
                        'count' => (int) ($statuses['collected']->count ?? 0),
                        'amount' => round((float) ($statuses['collected']->amount ?? 0), 2),
                    ],
                    'refunded' => [
                        'count' => (int) ($statuses['refunded']->count ?? 0),
                        'amount' => round((float) ($statuses['refunded']->amount ?? 0), 2),
                    ],
                ],
                'collected_totals' => [
                    'today' => (float) $collected(today()),
                    'this_week' => (float) $collected(now()->startOfWeek()),
                    'this_month' => (float) $collected(now()->startOfMonth()),
                    'this_year' => (float) $collected(now()->startOfYear()),
                ],
                'daily' => $series,
                'current_fee_percentage' => Setting::komiFeePercentage(),
            ],
        ]);
    }
}
