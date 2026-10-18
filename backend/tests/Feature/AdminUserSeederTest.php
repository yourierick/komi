<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminUserSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_user_seeder_creates_admin_account()
    {
        $this->seed(AdminUserSeeder::class);

        $this->assertDatabaseHas('users', [
            'email' => 'admin@komi.com',
            'is_admin' => true,
        ]);

        $admin = User::where('email', 'admin@komi.com')->first();
        $this->assertTrue(Hash::check('password', $admin->password));
    }

    public function test_admin_user_seeder_promotes_existing_user()
    {
        User::factory()->create(['email' => 'admin@komi.com']);

        $this->seed(AdminUserSeeder::class);

        $this->assertEquals(1, User::where('email', 'admin@komi.com')->count());
        $this->assertTrue(User::where('email', 'admin@komi.com')->first()->is_admin);
    }

    public function test_admin_user_seeder_is_idempotent()
    {
        $this->seed(AdminUserSeeder::class);
        $this->seed(AdminUserSeeder::class);

        $this->assertEquals(1, User::where('email', 'admin@komi.com')->count());
    }
}
