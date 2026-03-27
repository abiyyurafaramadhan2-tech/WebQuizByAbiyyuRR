<?php

use App\Http\Controllers\QuizController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin'    => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard
    Route::get('/dashboard', [QuizController::class, 'dashboard'])->name('dashboard');

    // Quiz Routes
    Route::prefix('quiz')->name('quiz.')->group(function () {
        Route::post('/start',             [QuizController::class, 'start'])->name('start');
        Route::get('/arena/{token}',      [QuizController::class, 'arena'])->name('arena');
        Route::post('/answer/{token}',    [QuizController::class, 'answer'])->name('answer');
        Route::post('/complete/{token}',  [QuizController::class, 'complete'])->name('complete');
        Route::post('/abandon/{token}',   [QuizController::class, 'abandon'])->name('abandon');
    });

    // Leaderboard
    Route::get('/leaderboard', [LeaderboardController::class, 'index'])->name('leaderboard');

    // Profile
    Route::get('/profile',   [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile',[ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
