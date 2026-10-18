<?php

namespace App\Http\Controllers;

use App\Http\Resources\AdminUserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminUserController extends Controller
{
    private const ALLOWED_PAGE_SIZES = '10,20,25,30,50';

    public function stats()
    {
        return response()->json([
            'data' => [
                'total' => User::count(),
                'today' => User::whereDate('created_at', today())->count(),
                'this_week' => User::where('created_at', '>=', now()->startOfWeek())->count(),
                'this_month' => User::where('created_at', '>=', now()->startOfMonth())->count(),
                'this_year' => User::where('created_at', '>=', now()->startOfYear())->count(),
            ],
        ]);
    }

    public function index(Request $request)
    {
        $validated = $request->validate([
            'per_page' => 'sometimes|integer|in:' . self::ALLOWED_PAGE_SIZES,
            'search' => 'sometimes|nullable|string|max:255',
        ]);

        $users = User::query()
            ->withCount(['shops', 'products', 'rentals', 'services'])
            ->when($validated['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($validated['per_page'] ?? 25);

        return AdminUserResource::collection($users);
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return response()->json([
                'message' => 'You cannot delete your own account.',
            ], 403);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    public function updateStatus(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return response()->json([
                'message' => 'You cannot change the status of your own account.',
            ], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:active,inactive',
        ]);

        $user->update(['status' => $validated['status']]);

        return response()->json([
            'message' => 'User status updated',
            'data' => new AdminUserResource($user),
        ]);
    }

    public function updateCertification(Request $request, User $user)
    {
        $validated = $request->validate([
            'certified' => 'sometimes|boolean',
        ]);

        $user->update([
            'certified' => $validated['certified'] ?? !$user->certified,
        ]);

        return response()->json([
            'message' => 'User certification updated',
            'data' => new AdminUserResource($user),
        ]);
    }

    public function resetPassword(User $user)
    {
        $newPassword = Str::random(16);
        $user->update(['password' => Hash::make($newPassword)]);

        return response()->json([
            'message' => 'Password reset successfully',
            'data' => ['password' => $newPassword],
        ]);
    }

    public function catalogue(User $user)
    {
        $user->loadCount(['shops', 'products', 'rentals', 'services']);

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'counts' => [
                    'shops' => $user->shops_count,
                    'products' => $user->products_count,
                    'rentals' => $user->rentals_count,
                    'services' => $user->services_count,
                ],
            ],
        ]);
    }

    public function catalogueSection(Request $request, User $user, string $section)
    {
        // colonne de recherche : name pour shops/products, title pour rentals/services
        $config = [
            'shops' => ['relation' => 'shops', 'search_column' => 'name', 'has_price' => false],
            'products' => ['relation' => 'products', 'search_column' => 'name', 'has_price' => true],
            'rentals' => ['relation' => 'rentals', 'search_column' => 'title', 'has_price' => true],
            'services' => ['relation' => 'services', 'search_column' => 'title', 'has_price' => true],
        ];

        abort_unless(array_key_exists($section, $config), 404);

        $validated = $request->validate([
            'per_page' => 'sometimes|integer|min:1|max:50',
            'search' => 'sometimes|nullable|string|max:255',
            'page' => 'sometimes|integer|min:1',
        ]);

        $sectionConfig = $config[$section];

        $paginator = $user->{$sectionConfig['relation']}()
            ->when($validated['search'] ?? null, function ($query) use ($sectionConfig, $validated) {
                $query->where($sectionConfig['search_column'], 'like', "%{$validated['search']}%");
            })
            ->latest()
            ->paginate($validated['per_page'] ?? 10);

        $items = $paginator->getCollection()->map(fn ($item) => [
            'id' => $item->id,
            'name' => $item->name ?? null,
            'title' => $item->title ?? null,
            'price' => $sectionConfig['has_price'] ? $item->price : null,
            'currency' => $sectionConfig['has_price'] ? $item->currency : null,
            'verified' => $item->verified,
            'status' => $item->status,
        ])->values();

        return response()->json([
            'data' => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
            ],
        ]);
    }
}
