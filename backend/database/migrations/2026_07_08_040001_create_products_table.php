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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('shop_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->enum('category', ['Electronics and Components', 'Applications and New Technologies', 'Phones and Accessories', 'Agriculture, Livestock, and Fishing', 'Wearables and Accessories', 'Home and decor', 'Makeup', 'Parents, Children, and Games', 'Jewelry, Eyewear, and Watches', 'Luggage, Bags, Cases', 'Sports and Fitness', 'Books, Media, and Games', 'office supplies', 'Food and Beverages', 'Buildings', 'Home Appliances', 'shoes and accessories', 'Vehicles and Transportation', 'Electrical Equipment and Supplies', 'Renewable Energy', 'hardware and home improvement', 'vehicle parts and accessories', 'Construction and Real Estate', 'Medical and Health', 'Packaging and Printing', 'Computers and Accessories']);
            $table->string('sub_category')->nullable();
            $table->string('location')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('currency')->default('USD');
            $table->integer('min_order')->default(1);
            $table->boolean('verified')->default(false);
            $table->enum('status', ['available', 'unavailable'])->default('available');
            $table->enum('commission_type', ['none', 'fixed', 'percentage'])->default('none');
            $table->decimal('commission_value', 10, 2)->nullable();
            $table->json('features')->nullable();
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
        Schema::dropIfExists('products');
    }
};
