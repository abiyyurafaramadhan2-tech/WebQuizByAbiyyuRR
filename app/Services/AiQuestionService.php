<?php

namespace App\Services;

use App\Models\AiLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class AiQuestionService
{
    private string $provider;
    private string $model;
    private string $apiKey;

    // Subject translations for prompts
    private const SUBJECTS = [
        'math'       => ['en' => 'Mathematics', 'id' => 'Matematika'],
        'science'    => ['en' => 'Natural Science (IPA)', 'id' => 'Ilmu Pengetahuan Alam (IPA)'],
        'indonesian' => ['en' => 'Indonesian Language', 'id' => 'Bahasa Indonesia'],
        'english'    => ['en' => 'English Language', 'id' => 'Bahasa Inggris'],
        'history'    => ['en' => 'History', 'id' => 'Sejarah'],
        'civics'     => ['en' => 'Civic Education (PKN)', 'id' => 'Pendidikan Kewarganegaraan (PKN)'],
        'geography'  => ['en' => 'Geography', 'id' => 'Geografi'],
        'biology'    => ['en' => 'Biology', 'id' => 'Biologi'],
        'chemistry'  => ['en' => 'Chemistry', 'id' => 'Kimia'],
        'physics'    => ['en' => 'Physics', 'id' => 'Fisika'],
        'economics'  => ['en' => 'Economics', 'id' => 'Ekonomi'],
        'arts'       => ['en' => 'Arts & Culture', 'id' => 'Seni Budaya'],
        'sports'     => ['en' => 'Physical Education', 'id' => 'Pendidikan Jasmani (PJOK)'],
        'religion'   => ['en' => 'Religious Education', 'id' => 'Pendidikan Agama'],
    ];

    private const DIFFICULTY_MAP = [
        1 => ['label' => 'Easy', 'label_id' => 'Mudah', 'instruction' => 'simple, foundational, basic recall'],
        2 => ['label' => 'Medium', 'label_id' => 'Sedang', 'instruction' => 'moderate complexity, application of concepts'],
        3 => ['label' => 'Hard', 'label_id' => 'Sulit', 'instruction' => 'challenging, analytical thinking, multi-step problems'],
    ];

    public function __construct()
    {
        $this->provider = config('services.ai.provider', 'gemini');
        $this->model    = config('services.ai.model');
        $this->apiKey   = config('services.ai.api_key');
    }

    /**
     * Generate 10 MCQ questions for a quiz session.
     */
    public function generateQuestions(
        string $grade,
        string $subject,
        string $language = 'id',
        int $difficulty = 1,
        int $count = 10,
        ?int $sessionId = null,
        ?int $userId = null
    ): array {
        $cacheKey = "quiz_questions_{$grade}_{$subject}_{$language}_{$difficulty}_" . uniqid();

        $startTime = microtime(true);
        $prompt    = $this->buildQuestionPrompt($grade, $subject, $language, $difficulty, $count);

        try {
            $response = $this->callAI($prompt);
            $questions = $this->parseQuestions($response['content']);

            $elapsed = (int)((microtime(true) - $startTime) * 1000);

            // Log AI usage
            $this->logUsage(
                action: 'generate_questions',
                promptSummary: "Grade:{$grade} Subject:{$subject} Lang:{$language} Diff:{$difficulty} Count:{$count}",
                tokensUsed: $response['tokens'] ?? 0,
                responseTimeMs: $elapsed,
                success: true,
                sessionId: $sessionId,
                userId: $userId
            );

            return $questions;

        } catch (\Throwable $e) {
            Log::error('AI Question Generation Failed', [
                'error' => $e->getMessage(),
                'grade' => $grade,
                'subject' => $subject,
            ]);

            $this->logUsage(
                action: 'generate_questions',
                promptSummary: "Grade:{$grade} Subject:{$subject}",
                tokensUsed: 0,
                responseTimeMs: (int)((microtime(true) - $startTime) * 1000),
                success: false,
                errorMessage: $e->getMessage(),
                sessionId: $sessionId,
                userId: $userId
            );

            throw $e;
        }
    }

    /**
     * Generate a funny, educational explanation for a wrong answer.
     */
    public function explainWrongAnswer(
        string $question,
        string $correctAnswer,
        string $userAnswer,
        string $language = 'id',
        string $grade = 'grade_7'
    ): string {
        $gradeNum = (int) filter_var($grade, FILTER_SANITIZE_NUMBER_INT);
        $isKid    = $gradeNum <= 6;

        $langInstruction = $language === 'id'
            ? 'Respond in Indonesian (Bahasa Indonesia). Use fun, informal Indonesian language.'
            : 'Respond in English. Use fun, informal language.';

        $audienceInstruction = $isKid
            ? 'The student is a young child (elementary school). Use very simple words, cute analogies like comparing to toys, food, or cartoons.'
            : 'The student is a teenager. Use cool, relatable analogies like social media, games, or pop culture.';

        $prompt = <<<PROMPT
You are ChubbyGenius, a cute and funny AI tutor. A student just got a quiz question wrong.

Question: {$question}
Correct Answer: {$correctAnswer}
Student's Wrong Answer: {$userAnswer}

{$langInstruction}
{$audienceInstruction}

Write a SHORT (2-3 sentences max), funny, encouraging explanation:
1. Acknowledge their answer kindly (don't make them feel bad).
2. Explain WHY the correct answer is right using a creative, memorable analogy.
3. End with a cheerful motivational sentence with an emoji.

Be concise, warm, and entertaining. NO markdown, just plain text.
PROMPT;

        try {
            $response = $this->callAI($prompt, 300);
            return trim($response['content']);
        } catch (\Throwable $e) {
            return $language === 'id'
                ? "Hampir benar! Jawaban yang tepat adalah: {$correctAnswer}. Terus semangat! 💪"
                : "So close! The correct answer is: {$correctAnswer}. Keep going! 💪";
        }
    }

    /**
     * Build the system + user prompt for question generation.
     */
    private function buildQuestionPrompt(
        string $grade,
        string $subject,
        string $language,
        int $difficulty,
        int $count
    ): string {
        $gradeNum    = (int) filter_var($grade, FILTER_SANITIZE_NUMBER_INT);
        $subjectName = self::SUBJECTS[$subject][$language] ?? $subject;
        $diffInfo    = self::DIFFICULTY_MAP[$difficulty] ?? self::DIFFICULTY_MAP[1];
        $diffLabel   = $language === 'id' ? $diffInfo['label_id'] : $diffInfo['label'];
        $diffInstruction = $diffInfo['instruction'];

        $langInstruction = $language === 'id'
            ? 'ALL questions and answers MUST be in Indonesian (Bahasa Indonesia). Use age-appropriate Indonesian vocabulary.'
            : 'ALL questions and answers MUST be in English. Use age-appropriate English vocabulary.';

        $ageContext = match(true) {
            $gradeNum <= 3  => "Very simple language for ages 6-9. Focus on basic concepts.",
            $gradeNum <= 6  => "Simple language for ages 10-12. Focus on fundamental understanding.",
            $gradeNum <= 9  => "Clear language for ages 13-15. Include some application questions.",
            default          => "Advanced language for ages 16-18. Include critical thinking and analysis.",
        };

        return <<<PROMPT
You are an expert Indonesian curriculum teacher creating a quiz for Grade {$gradeNum} students.

Subject: {$subjectName}
Grade: {$gradeNum} (Indonesian K-12 curriculum)
Difficulty: {$diffLabel} ({$diffInstruction})
Language: {$langInstruction}
Age Context: {$ageContext}

Generate exactly {$count} multiple choice questions. Follow this EXACT JSON format with NO extra text:

{
  "questions": [
    {
      "id": 1,
      "question": "The question text here?",
      "options": {
        "A": "First option",
        "B": "Second option",
        "C": "Third option",
        "D": "Fourth option"
      },
      "correct": "A",
      "explanation": "Brief explanation of why A is correct (1-2 sentences, same language)",
      "topic": "Specific topic within the subject"
    }
  ]
}

RULES:
1. Questions MUST be unique and varied — no repetition of topics
2. All 4 options must be plausible (no obviously wrong answers)
3. Questions must align with the Indonesian national curriculum (Kurikulum Merdeka)
4. Difficulty {$diffLabel}: {$diffInstruction}
5. Return ONLY valid JSON — no markdown, no extra text
6. Ensure correct answer is distributed randomly (not always A or B)
7. Make questions engaging and practical where possible
PROMPT;
    }

    /**
     * Call the configured AI provider.
     */
    private function callAI(string $prompt, int $maxTokens = 4000): array
    {
        return match($this->provider) {
            'openai' => $this->callOpenAI($prompt, $maxTokens),
            'gemini' => $this->callGemini($prompt, $maxTokens),
            default  => throw new \InvalidArgumentException("Unknown AI provider: {$this->provider}"),
        };
    }

    private function callOpenAI(string $prompt, int $maxTokens): array
    {
        $response = Http::withHeaders([
            'Authorization' => "Bearer {$this->apiKey}",
            'Content-Type'  => 'application/json',
        ])->timeout(60)->post('https://api.openai.com/v1/chat/completions', [
            'model'       => $this->model ?? 'gpt-4o-mini',
            'messages'    => [
                ['role' => 'system', 'content' => 'You are an expert educational content creator. Always respond with valid JSON only.'],
                ['role' => 'user',   'content' => $prompt],
            ],
            'max_tokens'  => $maxTokens,
            'temperature' => 0.7,
        ]);

        if ($response->failed()) {
            throw new \RuntimeException("OpenAI API error: " . $response->body());
        }

        $data = $response->json();
        return [
            'content' => $data['choices'][0]['message']['content'] ?? '',
            'tokens'  => $data['usage']['total_tokens'] ?? 0,
        ];
    }

    private function callGemini(string $prompt, int $maxTokens): array
    {
        $model    = $this->model ?? 'gemini-1.5-flash';
        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$this->apiKey}";

        $response = Http::timeout(60)->post($endpoint, [
            'contents' => [
                ['parts' => [['text' => $prompt]]],
            ],
            'generationConfig' => [
                'maxOutputTokens'  => $maxTokens,
                'temperature'      => 0.7,
                'responseMimeType' => 'application/json',
            ],
        ]);

        if ($response->failed()) {
            throw new \RuntimeException("Gemini API error: " . $response->body());
        }

        $data    = $response->json();
        $content = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
        $tokens  = $data['usageMetadata']['totalTokenCount'] ?? 0;

        return ['content' => $content, 'tokens' => $tokens];
    }

    /**
     * Parse and validate the AI response into a clean array.
     */
    private function parseQuestions(string $content): array
    {
        // Strip markdown code blocks if present
        $content = preg_replace('/```json\s*|\s*```/', '', $content);
        $content = trim($content);

        $data = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException("AI returned invalid JSON: " . json_last_error_msg());
        }

        $questions = $data['questions'] ?? [];

        if (empty($questions)) {
            throw new \RuntimeException("AI returned no questions");
        }

        // Validate and sanitize each question
        return array_values(array_map(function ($q, $index) {
            return [
                'id'          => $index + 1,
                'question'    => strip_tags($q['question'] ?? "Question " . ($index + 1)),
                'options'     => [
                    'A' => strip_tags($q['options']['A'] ?? 'Option A'),
                    'B' => strip_tags($q['options']['B'] ?? 'Option B'),
                    'C' => strip_tags($q['options']['C'] ?? 'Option C'),
                    'D' => strip_tags($q['options']['D'] ?? 'Option D'),
                ],
                'correct'     => strtoupper($q['correct'] ?? 'A'),
                'explanation' => strip_tags($q['explanation'] ?? ''),
                'topic'       => $q['topic'] ?? '',
                'answered'    => null,
                'is_correct'  => null,
            ];
        }, $questions, array_keys($questions)));
    }

    private function logUsage(
        string $action,
        string $promptSummary,
        int $tokensUsed,
        int $responseTimeMs,
        bool $success,
        ?string $errorMessage = null,
        ?int $sessionId = null,
        ?int $userId = null
    ): void {
        try {
            AiLog::create([
                'user_id'          => $userId,
                'quiz_session_id'  => $sessionId,
                'provider'         => $this->provider,
                'model'            => $this->model,
                'action'           => $action,
                'prompt_summary'   => $promptSummary,
                'tokens_used'      => $tokensUsed,
                'response_time_ms' => $responseTimeMs,
                'success'          => $success,
                'error_message'    => $errorMessage,
                'cost_usd'         => $this->estimateCost($tokensUsed),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to log AI usage: ' . $e->getMessage());
        }
    }

    private function estimateCost(int $tokens): float
    {
        return match($this->provider) {
            'openai' => $tokens * 0.00000015, // gpt-4o-mini pricing
            'gemini' => $tokens * 0.000000075, // gemini-flash pricing
            default  => 0,
        };
    }
}
