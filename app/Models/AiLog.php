<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiLog extends Model
{
    protected $fillable = [
        'user_id', 'quiz_session_id', 'provider', 'model', 'action',
        'prompt_summary', 'tokens_used', 'response_time_ms',
        'success', 'error_message', 'cost_usd',
    ];

    protected $casts = [
        'success'  => 'boolean',
        'cost_usd' => 'float',
    ];
}
