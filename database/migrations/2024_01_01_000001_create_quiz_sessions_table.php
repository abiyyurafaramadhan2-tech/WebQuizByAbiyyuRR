<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('session_token', 64)->unique();
            $table->string('grade');               // 'grade_1' to 'grade_12'
            $table->string('subject');             // 'math', 'science', etc.
            $table->string('language', 5)->default('id'); // 'id' or 'en'
            $table->string('mode', 20)->default('learning'); // 'learning' or 'exam'
            $table->integer('difficulty')->default(1); // 1=easy, 2=medium, 3=hard
            $table->integer('current_question')->default(0);
            $table->integer('correct_answers')->default(0);
            $table->integer('incorrect_answers')->default(0);
            $table->integer('streak')->default(0);
            $table->integer('max_streak')->default(0);
            $table->integer('score')->default(0);
            $table->integer('total_time_spent')->default(0); // seconds
            $table->json('questions')->nullable();   // cached AI questions
            $table->json('answers_log')->nullable(); // user answer history
            $table->string('status', 20)->default('active'); // active, completed, abandoned
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('session_token');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_sessions');
    }
};
