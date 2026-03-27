<?php

return [
    'questions_per_session' => env('QUIZ_QUESTIONS_PER_SESSION', 10),
    'time_per_question'     => env('QUIZ_TIME_PER_QUESTION', 30),
    'streak_threshold'      => env('QUIZ_STREAK_THRESHOLD', 3),
];
