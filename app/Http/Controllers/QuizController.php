<?php

namespace App\Http\Controllers;

use App\Models\QuizSession;
use App\Models\Leaderboard;
use App\Services\AiQuestionService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class QuizController extends Controller
{
    public function __construct(private AiQuestionService $aiService)
    {
    }

    /**
     * Show the dashboard / segment selector.
     */
    public function dashboard()
    {
        $user = Auth::user();

        $recentSessions = QuizSession::where('user_id', $user->id)
            ->where('status', 'completed')
            ->orderBy('completed_at', 'desc')
            ->take(5)
            ->get(['id', 'grade', 'subject', 'score', 'correct_answers', 'completed_at']);

        $userStats = [
            'total_sessions' => $user->total_sessions,
            'total_score'    => $user->total_score,
            'best_streak'    => $user->best_streak,
            'global_rank'    => Leaderboard::where('score', '>', $user->total_score)->count() + 1,
        ];

        return Inertia::render('Dashboard', [
            'userStats'      => $userStats,
            'recentSessions' => $recentSessions,
            'user'           => $user->only(['name', 'avatar_emoji', 'avatar_color', 'grade', 'preferred_language']),
        ]);
    }

    /**
     * Start a new quiz session — generates questions via AI.
     */
    public function start(Request $request)
    {
        $validated = $request->validate([
            'grade'    => 'required|in:' . implode(',', $this->validGrades()),
            'subject'  => 'required|in:' . implode(',', $this->validSubjects()),
            'language' => 'required|in:id,en',
            'mode'     => 'required|in:learning,exam',
        ]);

        $user = Auth::user();

        // Generate questions via AI
        try {
            $questions = $this->aiService->generateQuestions(
                grade:      $validated['grade'],
                subject:    $validated['subject'],
                language:   $validated['language'],
                difficulty: 1,
                count:      (int) config('quiz.questions_per_session', 10),
                userId:     $user->id
            );
        } catch (\Throwable $e) {
            return back()->withErrors(['ai' => 'Failed to generate questions. Please try again.']);
        }

        // Create session
        $session = QuizSession::create([
            'user_id'       => $user->id,
            'session_token' => Str::random(32),
            'grade'         => $validated['grade'],
            'subject'       => $validated['subject'],
            'language'      => $validated['language'],
            'mode'          => $validated['mode'],
            'difficulty'    => 1,
            'questions'     => $questions,
            'answers_log'   => [],
            'started_at'    => now(),
        ]);

        return redirect()->route('quiz.arena', $session->session_token);
    }

    /**
     * Show the quiz arena page.
     */
    public function arena(string $token)
    {
        $session = QuizSession::where('session_token', $token)
            ->where('user_id', Auth::id())
            ->where('status', 'active')
            ->firstOrFail();

        return Inertia::render('QuizArena', [
            'session'   => $session->only([
                'id', 'session_token', 'grade', 'subject', 'language',
                'mode', 'difficulty', 'current_question', 'score',
                'correct_answers', 'streak', 'questions'
            ]),
            'config' => [
                'timePerQuestion'  => (int) config('quiz.time_per_question', 30),
                'streakThreshold'  => (int) config('quiz.streak_threshold', 3),
                'totalQuestions'   => count($session->questions),
            ],
        ]);
    }

    /**
     * Submit an answer for the current question.
     */
    public function answer(Request $request, string $token)
    {
        $validated = $request->validate([
            'question_index' => 'required|integer|min:0',
            'answer'         => 'required|in:A,B,C,D',
            'time_taken'     => 'required|integer|min:0|max:60',
        ]);

        $session = QuizSession::where('session_token', $token)
            ->where('user_id', Auth::id())
            ->where('status', 'active')
            ->lockForUpdate()
            ->firstOrFail();

        $questions    = $session->questions;
        $qIndex       = $validated['question_index'];
        $userAnswer   = $validated['answer'];

        // Guard: question must exist and be unanswered
        if (!isset($questions[$qIndex]) || $questions[$qIndex]['answered'] !== null) {
            return response()->json(['error' => 'Invalid question'], 422);
        }

        $question     = $questions[$qIndex];
        $isCorrect    = $userAnswer === $question['correct'];
        $timeTaken    = $validated['time_taken'];

        // Calculate points
        $basePoints   = $isCorrect ? 100 : 0;
        $timeBonus    = $isCorrect ? max(0, (30 - $timeTaken) * 2) : 0;
        $streakBonus  = ($isCorrect && $session->streak >= 2) ? 50 : 0;
        $pointsEarned = $basePoints + $timeBonus + $streakBonus;

        // Update streak
        $newStreak = $isCorrect ? $session->streak + 1 : 0;
        $maxStreak = max($session->max_streak, $newStreak);

        // Update question record
        $questions[$qIndex]['answered']   = $userAnswer;
        $questions[$qIndex]['is_correct'] = $isCorrect;

        // Build answer log
        $answersLog   = $session->answers_log ?? [];
        $answersLog[] = [
            'q_index'       => $qIndex,
            'answer'        => $userAnswer,
            'correct'       => $question['correct'],
            'is_correct'    => $isCorrect,
            'time_taken'    => $timeTaken,
            'points_earned' => $pointsEarned,
            'streak_at'     => $newStreak,
        ];

        // Adaptive difficulty: increase if streak >= threshold
        $streakThreshold = (int) config('quiz.streak_threshold', 3);
        $newDifficulty   = $session->difficulty;

        if ($newStreak >= $streakThreshold && $session->difficulty < 3) {
            $newDifficulty = min(3, $session->difficulty + 1);
        }

        // Check if we need to regenerate questions for increased difficulty
        $questionsRemaining = count($questions) - ($qIndex + 1);
        $needsNewQuestions  = ($newDifficulty > $session->difficulty) && $questionsRemaining >= 3;

        if ($needsNewQuestions) {
            // Replace remaining questions with harder ones
            try {
                $newQuestions = $this->aiService->generateQuestions(
                    grade:      $session->grade,
                    subject:    $session->subject,
                    language:   $session->language,
                    difficulty: $newDifficulty,
                    count:      $questionsRemaining,
                    sessionId:  $session->id,
                    userId:     Auth::id()
                );

                // Replace remaining questions
                for ($i = 0; $i < $questionsRemaining; $i++) {
                    $targetIndex = $qIndex + 1 + $i;
                    if (isset($questions[$targetIndex]) && $i < count($newQuestions)) {
                        $questions[$targetIndex] = array_merge($newQuestions[$i], ['id' => $targetIndex + 1]);
                    }
                }
            } catch (\Throwable $e) {
                // Silently fail — keep existing questions
                $newDifficulty = $session->difficulty;
            }
        }

        // Update session
        $session->update([
            'questions'         => $questions,
            'answers_log'       => $answersLog,
            'current_question'  => $qIndex + 1,
            'correct_answers'   => $session->correct_answers + ($isCorrect ? 1 : 0),
            'incorrect_answers' => $session->incorrect_answers + ($isCorrect ? 0 : 1),
            'streak'            => $newStreak,
            'max_streak'        => $maxStreak,
            'score'             => $session->score + $pointsEarned,
            'total_time_spent'  => $session->total_time_spent + $timeTaken,
            'difficulty'        => $newDifficulty,
        ]);

        // Generate explanation for wrong answers in learning mode
        $explanation = null;
        if (!$isCorrect && $session->mode === 'learning') {
            try {
                $explanation = $this->aiService->explainWrongAnswer(
                    question:     $question['question'],
                    correctAnswer: $question['options'][$question['correct']],
                    userAnswer:   $question['options'][$userAnswer],
                    language:     $session->language,
                    grade:        $session->grade
                );
            } catch (\Throwable) {
                $explanation = $question['explanation'] ?? null;
            }
        }

        return response()->json([
            'is_correct'        => $isCorrect,
            'correct_answer'    => $question['correct'],
            'correct_text'      => $question['options'][$question['correct']],
            'explanation'       => $explanation ?? $question['explanation'],
            'points_earned'     => $pointsEarned,
            'new_streak'        => $newStreak,
            'difficulty_up'     => $newDifficulty > ($session->difficulty),
            'total_score'       => $session->score + $pointsEarned,
            'time_bonus'        => $timeBonus,
            'streak_bonus'      => $streakBonus,
        ]);
    }

    /**
     * Complete the quiz session and save to leaderboard.
     */
    public function complete(string $token)
    {
        $session = QuizSession::where('session_token', $token)
            ->where('user_id', Auth::id())
            ->where('status', 'active')
            ->firstOrFail();

        $totalQuestions = count($session->questions);
        $accuracy = $totalQuestions > 0
            ? round(($session->correct_answers / $totalQuestions) * 100, 2)
            : 0;

        DB::transaction(function () use ($session, $totalQuestions, $accuracy) {
            // Complete the session
            $session->update([
                'status'       => 'completed',
                'completed_at' => now(),
            ]);

            // Save to leaderboard
            Leaderboard::create([
                'user_id'         => $session->user_id,
                'quiz_session_id' => $session->id,
                'grade'           => $session->grade,
                'subject'         => $session->subject,
                'mode'            => $session->mode,
                'score'           => $session->score,
                'correct_answers' => $session->correct_answers,
                'total_questions' => $totalQuestions,
                'max_streak'      => $session->max_streak,
                'time_spent'      => $session->total_time_spent,
                'accuracy'        => $accuracy,
            ]);

            // Update user stats
            $user = $session->user;
            $user->increment('total_sessions');
            $user->increment('total_score', $session->score);
            if ($session->max_streak > $user->best_streak) {
                $user->update(['best_streak' => $session->max_streak]);
            }
        });

        return Inertia::render('QuizResult', [
            'session'  => $session->fresh()->only([
                'id', 'grade', 'subject', 'mode', 'score',
                'correct_answers', 'max_streak', 'total_time_spent',
            ]),
            'accuracy' => $accuracy,
            'totalQuestions' => $totalQuestions,
        ]);
    }

    /**
     * Abandon a session.
     */
    public function abandon(string $token)
    {
        QuizSession::where('session_token', $token)
            ->where('user_id', Auth::id())
            ->where('status', 'active')
            ->update(['status' => 'abandoned']);

        return redirect()->route('dashboard');
    }

    private function validGrades(): array
    {
        return array_map(fn($n) => "grade_{$n}", range(1, 12));
    }

    private function validSubjects(): array
    {
        return [
            'math', 'science', 'indonesian', 'english', 'history',
            'civics', 'geography', 'biology', 'chemistry', 'physics',
            'economics', 'arts', 'sports', 'religion',
        ];
    }
}
