<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
        ]);

        $user = $this->authService->register($validated);

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json([
            'user' => new UserResource($user),
        ], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = $this->authService->login($credentials);

        if (!$user) {
            return response()->json([
                'message' => 'The provided credentials are incorrect.',
            ], 401);
        }

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json([
            'user' => new UserResource($user),
        ]);
    }

    public function logout(Request $request)
    {
        $this->authService->logout($request);

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function profile(Request $request)
    {
        return response()->json([
            'data' => new UserResource($request->user()),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $this->authService->updateProfile($request, $request->user());

        return response()->json([
            'data' => new UserResource($user),
            'message' => 'Profile updated successfully',
        ]);
    }
}
