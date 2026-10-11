<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\CommissionResource;
use App\Models\Commission;
use Illuminate\Support\Facades\Auth;

class CommissionController extends Controller
{
    /**
     * List commissions of the authenticated reseller
     */
    public function index()
    {
        $commissions = Commission::where('user_id', Auth::id())
            ->with('order')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return CommissionResource::collection($commissions);
    }
}
