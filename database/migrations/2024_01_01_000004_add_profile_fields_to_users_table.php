<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar_color', 7)->default('#6366f1')->after('email');
            $table->string('avatar_emoji', 10)->default('🧠')->after('avatar_color');
            $table->integer('total_score')->default(0)->after('avatar_emoji');
            $table->integer('total_sessions')->default(0)->after('total_score');
            $table->integer('best_streak')->default(0)->after('total_sessions');
            $table->string('preferred_language', 5)->default('id')->after('best_streak');
            $table->string('grade')->nullable()->after('preferred_language');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'avatar_color', 'avatar_emoji', 'total_score',
                'total_sessions', 'best_streak', 'preferred_language', 'grade'
            ]);
        });
    }
};
