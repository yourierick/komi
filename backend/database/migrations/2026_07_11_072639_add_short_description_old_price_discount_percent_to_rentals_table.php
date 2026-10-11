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
        Schema::table('rentals', function (Blueprint $table) {
            $table->string('short_description')->nullable()->after('description');
            $table->decimal('old_price', 10, 2)->nullable()->after('price');
            $table->decimal('discount_percent', 5, 2)->nullable()->after('old_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->dropColumn(['short_description', 'old_price', 'discount_percent']);
        });
    }
};
