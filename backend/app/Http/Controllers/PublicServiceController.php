<?php

namespace App\Http\Controllers;

use App\Http\Resources\PublicServiceResource;
use App\Models\Service;
use Illuminate\Http\Request;

class PublicServiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Service::where('status', 'available');

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('supplier')) {
            $query->where('user_id', $request->supplier);
        }

        $services = $query->withCount('approvedComments')->get();

        return PublicServiceResource::collection($services);
    }

    public function show($id)
    {
        $service = Service::where('status', 'available')->withCount('approvedComments')->with('user')->find($id);

        if (!$service) {
            return response()->json(['message' => 'Service not found'], 404);
        }

        return new PublicServiceResource($service);
    }

    public function categories()
    {
        $categories = Service::where('status', 'available')
            ->selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->category,
                    'count' => $item->count,
                ];
            });

        return response()->json(['data' => $categories]);
    }
}
