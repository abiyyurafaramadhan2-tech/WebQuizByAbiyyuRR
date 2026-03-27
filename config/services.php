<?php

return [

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    /*
    |--------------------------------------------------------------------------
    | AI Service Configuration (Custom for Abiyyu)
    |--------------------------------------------------------------------------
    */
    'ai' => [
        'provider' => env('AI_PROVIDER', 'gemini'),
        'model'    => env('AI_PROVIDER', 'gemini') === 'openai'
            ? env('OPENAI_MODEL', 'gpt-4o-mini')
            : env('GEMINI_MODEL', 'gemini-1.5-flash'),
        'api_key'  => env('AI_PROVIDER', 'gemini') === 'openai'
            ? env('OPENAI_API_KEY')
            : env('GEMINI_API_KEY'),
    ],

];
