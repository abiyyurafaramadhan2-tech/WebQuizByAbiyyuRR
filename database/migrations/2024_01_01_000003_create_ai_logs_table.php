<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('quiz_session_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider', 20); // 'openai' or 'gemini'
            $table->string('model', 50);
            $table->string('action', 50); // 'generate_questions', 'explain_answer'
            $table->text('prompt_summary');
            $table->integer('tokens_used')->default(0);
            $table->integer('response_time_ms')->default(0);
            $table->boolean('success')->default(true);
            $table->text('error_message')->nullable();
            $table->decimal('cost_usd', 10, 6)->default(0);
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['provider', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_logs');
    }
};
