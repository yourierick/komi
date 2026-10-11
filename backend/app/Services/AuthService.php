<?php

namespace App\Services;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    public function register(array $data): User
    {
        $userData = [
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ];

        $user = User::create($userData);

        auth()->login($user);

        return $user;
    }

    public function login(array $credentials): ?User
    {
        if (!Auth::attempt($credentials)) {
            return null;
        }

        return Auth::user();
    }

    public function logout(Request $request): void
    {
        auth()->guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }
    }

    public function updateProfile(Request $request, User $user): User
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'address' => 'sometimes|nullable|string|max:255',
            'phone' => 'sometimes|nullable|string|max:255',
            'nationality' => 'sometimes|nullable|string|max:255',
            'picture' => 'sometimes|nullable|image|max:2048',
            'identity_card_type' => 'sometimes|nullable|in:passport,id_card,other',
            'identity_card' => 'sometimes|nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'id_card_number' => 'sometimes|nullable|string|max:255',
        ]);

        if ($request->has('name')) {
            $user->name = $validated['name'];
        }

        if ($request->has('email')) {
            $user->email = $validated['email'];
        }

        if ($request->has('address')) {
            $user->address = $validated['address'];
        }

        if ($request->has('phone')) {
            $user->phone = $validated['phone'];
        }

        if ($request->has('nationality')) {
            $user->nationality = $validated['nationality'];
        }

        if ($request->hasFile('picture')) {
            $picturePath = $request->file('picture')->store('profile-pictures', 'public');
            $user->picture = $picturePath;
        }

        if ($request->has('identity_card_type')) {
            $user->identity_card_type = $validated['identity_card_type'];
        }

        if ($request->hasFile('identity_card')) {
            $identityCardPath = $request->file('identity_card')->store('identity-cards', 'public');
            $user->identity_card = $identityCardPath;
        }

        if ($request->has('id_card_number')) {
            $user->id_card_number = $validated['id_card_number'];
        }

        $user->save();

        return $user;
    }
}
