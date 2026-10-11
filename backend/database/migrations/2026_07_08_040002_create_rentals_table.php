<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('rentals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->enum('category', ['real estate', 'Vehicles', 'Machinery', 'Electronics', 'Events', 'Leisure', 'Furniture', 'Logistics', 'Agriculture', 'other'])->default('other');
            $table->string('sub_category')->nullable();
            $table->string('location')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('currency')->default('USD');
            $table->enum('payment_frequency', ['daily', 'weekly', 'monthly'])->default('daily');
            $table->enum('status', ['available', 'rented', 'maintenance', 'unavailable'])->default('available');
            $table->boolean('verified')->default(false);
            $table->decimal('rating', 3, 2)->default(0);
            $table->json('conditions')->nullable();
            $table->json('specifications')->nullable();
            $table->json('images')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rentals');
    }
};
