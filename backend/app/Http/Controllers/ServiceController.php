<?php

namespace App\Http\Controllers;

use App\Http\Resources\ServiceResource;
use App\Models\Service;
use App\Services\ServiceService;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    protected ServiceService $serviceService;

    public function __construct(ServiceService $serviceService)
    {
        $this->serviceService = $serviceService;
    }
    public function index(Request $request)
    {
        $services = $this->serviceService->index($request, $request->user()->id);
        return ServiceResource::collection($services);
    }

    public function store(Request $request)
    {
        try {
            $service = $this->serviceService->store($request, $request->user()->id);
            return new ServiceResource($service->load('user'));
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function show(Request $request, $id)
    {
        $service = $this->serviceService->show($id, $request->user()->id);

        if (!$service) {
            return response()->json(['message' => 'Service not found'], 404);
        }

        return new ServiceResource($service);
    }

    public function update(Request $request, $id)
    {
        try {
            $service = $this->serviceService->update($request, $id, $request->user()->id);
            return new ServiceResource($service->load('user'));
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Service not found'], 404);
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
            $this->serviceService->destroy($id, $request->user()->id);
            return response()->json(['message' => 'Service deleted successfully']);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Service not found'], 404);
        }
    }
}
