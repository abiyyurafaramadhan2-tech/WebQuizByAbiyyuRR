<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leaderboards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quiz_session_id')->constrained()->cascadeOnDelete();
            $table->string('grade');
            $table->string('subject');
            $table->string('mode', 20);
            $table->integer('score');
            $table->integer('correct_answers');
            $table->integer('total_questions');
            $table->integer('max_streak');
            $table->integer('time_spent'); // seconds
            $table->decimal('accuracy', 5, 2); // percentage
            $table->integer('rank')->nullable();
            $table->timestamps();

            $table->index(['grade', 'subject', 'score']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leaderboards');
    }
};
