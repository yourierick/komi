<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_creates_user_and_returns_user_resource()
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'user' => [
                    'id',
                    'name',
                    'email',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
            'name' => 'John Doe',
        ]);
    }

    public function test_register_requires_name_email_and_password()
    {
        $response = $this->postJson('/api/v1/auth/register', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_register_requires_valid_email()
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'John Doe',
            'email' => 'invalid-email',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_register_requires_unique_email()
    {
        User::factory()->create(['email' => 'john@example.com']);

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_register_requires_minimum_password_length()
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => '123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_login_with_valid_credentials()
    {
        $user = User::factory()->create([
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => [
                    'id',
                    'name',
                    'email',
                ],
            ]);
    }

    public function test_login_with_invalid_credentials()
    {
        $user = User::factory()->create([
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'The provided credentials are incorrect.',
            ]);
    }

    public function test_login_requires_email_and_password()
    {
        $response = $this->postJson('/api/v1/auth/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_logout_authenticated_user()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/auth/logout');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Logged out successfully',
            ]);
    }

    public function test_profile_returns_authenticated_user()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->getJson('/api/v1/auth/profile');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'email',
                ],
            ]);
    }

    public function test_profile_requires_authentication()
    {
        $response = $this->getJson('/api/v1/auth/profile');

        $response->assertStatus(401);
    }

    public function test_update_profile_with_valid_data()
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/auth/profile', [
                '_method' => 'PUT',
                'name' => 'Updated Name',
                'address' => '123 Main St',
                'phone' => '+1234567890',
                'nationality' => 'French',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Profile updated successfully',
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
            'address' => '123 Main St',
            'phone' => '+1234567890',
            'nationality' => 'French',
        ]);
    }

    public function test_update_profile_with_picture()
    {
        if (!function_exists('imagecreatetruecolor')) {
            $this->markTestSkipped('GD extension is not installed.');
        }

        Storage::fake('public');

        $user = User::factory()->create();

        $file = \Illuminate\Http\UploadedFile::fake()->image('profile.jpg');

        $response = $this->actingAs($user)
            ->postJson('/api/v1/auth/profile', [
                '_method' => 'PUT',
                'picture' => $file,
            ]);

        $response->assertStatus(200);

        Storage::disk('public')->assertExists('profile-pictures/' . $file->hashName());
    }

    public function test_update_profile_with_identity_card()
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $file = \Illuminate\Http\UploadedFile::fake()->create('id_card.pdf', 1000);

        $response = $this->actingAs($user)
            ->postJson('/api/v1/auth/profile', [
                '_method' => 'PUT',
                'identity_card_type' => 'passport',
                'id_card_number' => 'AB123456',
                'identity_card' => $file,
            ]);

        $response->assertStatus(200);

        Storage::disk('public')->assertExists('identity-cards/' . $file->hashName());

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'identity_card_type' => 'passport',
            'id_card_number' => 'AB123456',
        ]);
    }

    public function test_update_profile_requires_authentication()
    {
        $response = $this->postJson('/api/v1/auth/profile', [
            '_method' => 'PUT',
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(401);
    }

    public function test_update_profile_validates_email_uniqueness()
    {
        $user1 = User::factory()->create(['email' => 'user1@example.com']);
        $user2 = User::factory()->create(['email' => 'user2@example.com']);

        $response = $this->actingAs($user1)
            ->postJson('/api/v1/auth/profile', [
                '_method' => 'PUT',
                'email' => 'user2@example.com',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_update_profile_validates_identity_card_type()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/auth/profile', [
                '_method' => 'PUT',
                'identity_card_type' => 'invalid_type',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['identity_card_type']);
    }

    public function test_update_profile_validates_picture_file_type()
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $file = \Illuminate\Http\UploadedFile::fake()->create('document.pdf', 1000);

        $response = $this->actingAs($user)
            ->postJson('/api/v1/auth/profile', [
                '_method' => 'PUT',
                'picture' => $file,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['picture']);
    }
}
