// Add inside the return array:
'ai' => [
    'provider' => env('AI_PROVIDER', 'gemini'),
    'model'    => env('AI_PROVIDER', 'gemini') === 'openai'
        ? env('OPENAI_MODEL', 'gpt-4o-mini')
        : env('GEMINI_MODEL', 'gemini-1.5-flash'),
    'api_key'  => env('AI_PROVIDER', 'gemini') === 'openai'
        ? env('OPENAI_API_KEY')
        : env('GEMINI_API_KEY'),
],
