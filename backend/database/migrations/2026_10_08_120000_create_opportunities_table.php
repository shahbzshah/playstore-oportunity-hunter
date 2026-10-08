<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opportunities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('app_id')->index();
            $table->string('title');
            $table->string('developer')->nullable();
            $table->string('icon_url')->nullable();
            $table->float('rating')->nullable();
            $table->string('installs')->nullable();
            $table->unsignedBigInteger('installs_min')->nullable();
            $table->unsignedBigInteger('reviews_count')->nullable();
            $table->float('score')->default(0);
            $table->string('category')->nullable();
            $table->text('summary')->nullable();
            $table->string('url')->nullable();
            $table->boolean('is_bookmarked')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'app_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opportunities');
    }
};
