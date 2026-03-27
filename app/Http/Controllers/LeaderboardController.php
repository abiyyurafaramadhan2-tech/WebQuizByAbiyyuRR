<?php

namespace App\Http\Controllers;

use App\Models\Leaderboard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class LeaderboardController extends Controller
{
    public function index(Request $request)
    {
        $filter = $request->only(['grade', 'subject', 'period']);
        $period = $filter['period'] ?? 'all';

        $cacheKey = "leaderboard_{$period}_" . ($filter['grade'] ?? 'all') . "_" . ($filter['subject'] ?? 'all');

        $leaderboard = Cache::remember($cacheKey, 300, function () use ($filter, $period) {
            $query = Leaderboard::with('user:id,name,avatar_emoji,avatar_color')
                ->select(['id', 'user_id', 'grade', 'subject', 'score', 'accuracy', 'max_streak', 'correct_answers', 'total_questions', 'created_at']);

            if (!empty($filter['grade'])) {
                $query->where('grade', $filter['grade']);
            }
            if (!empty($filter['subject'])) {
                $query->where('subject', $filter['subject']);
            }

            if ($period === 'today') {
                $query->whereDate('created_at', today());
            } elseif ($period === 'week') {
                $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
            } elseif ($period === 'month') {
                $query->whereMonth('created_at', now()->month);
            }

            return $query->orderByDesc('score')
                ->take(50)
                ->get()
                ->map(function ($entry, $index) {
                    return [
                        'rank'           => $index + 1,
                        'user_name'      => $entry->user->name,
                        'avatar_emoji'   => $entry->user->avatar_emoji,
                        'avatar_color'   => $entry->user->avatar_color,
                        'score'          => $entry->score,
                        'accuracy'       => $entry->accuracy,
                        'max_streak'     => $entry->max_streak,
                        'correct'        => $entry->correct_answers,
                        'total'          => $entry->total_questions,
                        'grade'          => $entry->grade,
                        'subject'        => $entry->subject,
                        'date'           => $entry->created_at->diffForHumans(),
                        'is_current_user'=> $entry->user_id === Auth::id(),
                    ];
                });
        });

        $myBestScore = Leaderboard::where('user_id', Auth::id())->max('score') ?? 0;
        $myRank      = Leaderboard::where('score', '>', $myBestScore)->count() + 1;

        return Inertia::render('Leaderboard', [
            'entries'     => $leaderboard,
            'filters'     => $filter,
            'myBestScore' => $myBestScore,
            'myRank'      => $myRank,
        ]);
    }
}
