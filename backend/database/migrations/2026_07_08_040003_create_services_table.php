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
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->enum('category', ['consulting', 'maintenance', 'delivery', 'cleaning', 'education', 'health', 'beauty', 'tech', 'legal', 'finance', 'printing', 'software engineering', 'electrical', 'electronic and repair', 'painting', 'musician']);
            $table->string('sub_category')->nullable();
            $table->string('location')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('currency')->default('USD');
            $table->enum('payment_frequency', ['hourly', 'daily', 'weekly', 'monthly', 'per_project'])->default('hourly');
            $table->enum('status', ['available', 'unavailable'])->default('available');
            $table->boolean('verified')->default(false);
            $table->decimal('rating', 3, 2)->default(0);
            $table->json('features')->nullable();
            $table->json('specifications')->nullable();
            $table->json('images')->nullable();
            $table->string('video')->nullable();
            $table->json('availability')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
