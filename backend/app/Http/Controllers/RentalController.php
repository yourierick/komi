<?php

namespace App\Http\Controllers;

use App\Http\Resources\RentalResource;
use App\Models\Rental;
use App\Services\RentalService;
use Illuminate\Http\Request;

class RentalController extends Controller
{
    protected RentalService $rentalService;

    public function __construct(RentalService $rentalService)
    {
        $this->rentalService = $rentalService;
    }
    public function index(Request $request)
    {
        $rentals = $this->rentalService->index($request, $request->user()->id);
        return RentalResource::collection($rentals);
    }

    public function store(Request $request)
    {
        try {
            $rental = $this->rentalService->store($request, $request->user()->id);
            return new RentalResource($rental->load('user'));
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function show(Request $request, $id)
    {
        $rental = $this->rentalService->show($id, $request->user()->id);

        if (!$rental) {
            return response()->json(['message' => 'Rental not found'], 404);
        }

        return new RentalResource($rental);
    }

    public function update(Request $request, $id)
    {
        try {
            $rental = $this->rentalService->update($request, $id, $request->user()->id);
            return new RentalResource($rental->load('user'));
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Rental not found'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $this->rentalService->destroy($id, $request->user()->id);
            return response()->json(['message' => 'Rental deleted successfully']);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Rental not found'], 404);
        }
    }
}
