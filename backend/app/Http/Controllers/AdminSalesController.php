<?php

namespace App\Http\Controllers;

use App\Services\SalesAnalyticsService;
use Illuminate\Http\Request;

class AdminSalesController extends Controller
{
    public function __construct(private SalesAnalyticsService $analytics)
    {
    }

    public function stats(Request $request)
    {
        $validated = $request->validate([
            'days' => 'sometimes|integer|in:7,30,90,365',
        ]);

        return response()->json([
            'data' => $this->analytics->build($validated['days'] ?? 30),
        ]);
    }
}
