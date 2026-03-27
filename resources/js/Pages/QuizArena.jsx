import { useState, useEffect, useCallback, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import ChubbyTutor  from '@/Components/ChubbyTutor';
import TimerRing    from '@/Components/TimerRing';
import StreakEffect from '@/Components/StreakEffect';
import AppLayout    from '@/Layouts/AppLayout';

const OPTION_COLORS = { A: '#6366f1', B: '#22c55e', C: '#f59e0b', D: '#ef4444' };

export default function QuizArena({ session, config }) {
    const [questions, setQuestions]       = useState(session.questions);
    const [currentIdx, setCurrentIdx]     = useState(session.current_question);
    const [score, setScore]               = useState(session.score);
    const [streak, setStreak]             = useState(session.streak);
    const [difficulty, setDifficulty]     = useState(session.difficulty);
    const [selectedAnswer, setSelected]   = useState(null);
    const [result, setResult]             = useState(null);   // { is_correct, explanation, ... }
    const [tutorMood, setTutorMood]       = useState('idle');
    const [tutorMsg, setTutorMsg]         = useState('');
    const [showStreak, setShowStreak]     = useState(false);
    const [timerKey, setTimerKey]         = useState(0);
    const [timeLeft, setTimeLeft]         = useState(config.timePerQuestion);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pointsPopup, setPointsPopup]   = useState(null);
    const timeStartRef = useRef(Date.now());

    const currentQ = questions[currentIdx];
    const isLast   = currentIdx >= questions.length - 1;
    const mode     = session.mode;
    const lang     = session.language;

    // Intro message
    useEffect(() => {
        if (mode === 'learning') {
            setTutorMood('happy');
            setTutorMsg(lang === 'id'
                ? 'Siap mulai? Aku di sini buat bantuin! 🧠'
                : "Ready to start? I'm here to help! 🧠"
            );
        } else {
            setTutorMood('focused');
            setTutorMsg(lang === 'id'
                ? 'Mode ujian aktif. Fokus, jangan panik! 📝'
                : 'Exam mode active. Stay focused! 📝'
            );
        }
    }, []);

    const submitAnswer = useCallback(async (answer, timeTaken) => {
        if (isSubmitting || result) return;
        setIsSubmitting(true);
        setSelected(answer);

        try {
            const { data } = await axios.post(route('quiz.answer', session.session_token), {
                question_index: currentIdx,
                answer,
                time_taken: Math.floor(timeTaken),
            });

            setResult(data);
            setScore(data.total_score);
            setStreak(data.new_streak);
            if (data.difficulty_up) setDifficulty(d => Math.min(3, d + 1));

            // Points popup
            setPointsPopup({
                points: data.points_earned,
                bonus: data.streak_bonus + data.time_bonus,
            });
            setTimeout(() => setPointsPopup(null), 2000);

            // Streak effect
            if (data.new_streak > 0 && data.new_streak % config.streakThreshold === 0) {
                setShowStreak(true);
                setTimeout(() => setShowStreak(false), 1500);
            }

            // Tutor reaction
            if (mode === 'learning') {
                if (data.is_correct) {
                    if (data.new_streak >= 5) {
                        setTutorMood('cheering');
                        setTutorMsg(lang === 'id' ? '🔥 MANTAP BANGET! Kamu lagi on fire!' : '🔥 AMAZING! You\'re on fire!');
                    } else {
                        setTutorMood('happy');
                        setTutorMsg(lang === 'id' ? '✨ Betul! Kamu hebat!' : '✨ Correct! Great job!');
                    }
                } else {
                    setTutorMood('explaining');
                    setTutorMsg(data.explanation || '');
                }
            } else {
                // Exam mode
                setTutorMood(data.is_correct ? 'proud' : 'focused');
                setTutorMsg(data.is_correct
                    ? (lang === 'id' ? '✓ Tepat!' : '✓ Correct!')
                    : (lang === 'id' ? 'Ingat untuk review materi ini.' : 'Remember to review this topic.')
                );
            }

        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    }, [currentIdx, session.session_token, isSubmitting, result, mode, lang, config.streakThreshold]);

    const handleTimerExpire = useCallback(() => {
        const elapsed = Math.floor((Date.now() - timeStartRef.current) / 1000);
        submitAnswer('A', config.timePerQuestion); // Auto-submit wrong on timeout

        if (mode === 'exam') {
            setTutorMood('urgent');
            setTutorMsg(lang === 'id' ? 'Waktu habis! ⏰ Lebih cepat!' : 'Time\'s up! ⏰ Be quicker!');
        } else {
            setTutorMood('sad');
            setTutorMsg(lang === 'id' ? '⏰ Waktunya habis! Tapi gapapa, belajar lagi ya!' : '⏰ Time\'s up! That\'s okay, keep learning!');
        }
    }, [submitAnswer, mode, lang, config.timePerQuestion]);

    const nextQuestion = useCallback(() => {
        if (isLast) {
            router.post(route('quiz.complete', session.session_token));
            return;
        }
        setCurrentIdx(i => i + 1);
        setSelected(null);
        setResult(null);
        setTutorMood(mode === 'exam' ? 'focused' : 'idle');
        setTutorMsg('');
        setTimerKey(k => k + 1);
        timeStartRef.current = Date.now();
    }, [isLast, session.session_token, mode]);

    if (!currentQ) return null;

    const progressPct = ((currentIdx) / questions.length) * 100;
    const diffLabels  = { 1:'Easy', 2:'Medium', 3:'Hard' };
    const diffColors  = { 1:'#22c55e', 2:'#f59e0b', 3:'#ef4444' };

    return (
        <AppLayout title="Quiz Arena">
            <StreakEffect streak={streak} show={showStreak} />

            <div className="min-h-screen flex flex-col max-w-2xl mx-auto p-4">

                {/* Top HUD */}
                <div className="flex items-center gap-3 mb-4">
                    {/* Back / quit */}
                    <button
                        onClick={() => {
                            if (confirm('Keluar dari quiz?')) {
                                axios.post(route('quiz.abandon', session.session_token))
                                    .then(() => router.visit(route('dashboard')));
                            }
                        }}
                        className="text-slate-500 hover:text-white text-xl"
                    >
                        ✕
                    </button>

                    {/* Progress bar */}
                    <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <motion.div
                            className="h-full rounded-full"
                            style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', width: `${progressPct}%` }}
                            animate={{ width: `${progressPct}%` }}
                        />
                    </div>

                    {/* Q counter */}
                    <div className="text-slate-400 text-sm font-mono whitespace-nowrap">
                        {currentIdx + 1}/{questions.length}
                    </div>
                </div>

                {/* Score & Streak row */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        {/* Score */}
                        <div className="px-4 py-2 rounded-xl font-black text-white"
                            style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)' }}>
                            <motion.span key={score} initial={{ scale: 1.4 }} animate={{ scale: 1 }}>
                                ⭐ {score.toLocaleString()}
                            </motion.span>
                        </div>

                        {/* Streak */}
                        {streak > 0 && (
                            <motion.div
                                className="px-3 py-2 rounded-xl font-bold text-sm"
                                style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b' }}
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 0.5 }}
                            >
                                🔥 ×{streak}
                            </motion.div>
                        )}
                    </div>

                    {/* Difficulty badge */}
                    <div className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{ background: `${diffColors[difficulty]}22`, border: `1px solid ${diffColors[difficulty]}`, color: diffColors[difficulty] }}>
                        {diffLabels[difficulty]}
                    </div>

                    {/* Timer */}
                    <TimerRing
                        key={timerKey}
                        duration={config.timePerQuestion}
                        onExpire={handleTimerExpire}
                        isPaused={!!result}
                    />
                </div>

                {/* Chubby Tutor */}
                <div className="flex justify-center mb-4">
                    <ChubbyTutor mood={tutorMood} message={tutorMsg} mode={mode} size={90} />
                </div>

                {/* Points popup */}
                <AnimatePresence>
                    {pointsPopup && (
                        <motion.div
                            className="fixed top-1/3 left-1/2 -translate-x-1/2 text-center z-40 pointer-events-none"
                            initial={{ y: 0, opacity: 1, scale: 0.8 }}
                            animate={{ y: -60, opacity: 0, scale: 1.2 }}
                            transition={{ duration: 1.5 }}
                        >
                            <div className="text-3xl font-black text-yellow-400">
                                +{pointsPopup.points}
                            </div>
                            {pointsPopup.bonus > 0 && (
                                <div className="text-sm text-orange-300 font-bold">
                                    +{pointsPopup.bonus} bonus!
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Question card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIdx}
                        initial={{ opacity: 0, y: 30, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.97 }}
                        className="rounded-3xl p-6 mb-5 flex-1"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(20px)',
                        }}
                    >
                        {/* Topic chip */}
                        {currentQ.topic && (
                            <div className="text-xs text-indigo-400 font-semibold mb-3 uppercase tracking-wider">
                                📌 {currentQ.topic}
                            </div>
                        )}

                        {/* Question text */}
                        <p className="text-white font-semibold text-lg leading-relaxed mb-6">
                            {currentQ.question}
                        </p>

                        {/* Options */}
                        <div className="grid grid-cols-1 gap-3">
                            {Object.entries(currentQ.options).map(([key, text]) => {
                                const isSelected = selectedAnswer === key;
                                const isCorrect  = result?.correct_answer === key;
                                const isWrong    = isSelected && !result?.is_correct;

                                let bg = 'rgba(255,255,255,0.05)';
                                let border = 'rgba(255,255,255,0.15)';
                                let glow = '';

                                if (result) {
                                    if (isCorrect) {
                                        bg = 'rgba(34,197,94,0.2)';
                                        border = '#22c55e';
                                        glow = '0 0 20px rgba(34,197,94,0.4)';
                                    } else if (isWrong) {
                                        bg = 'rgba(239,68,68,0.2)';
                                        border = '#ef4444';
                                        glow = '0 0 20px rgba(239,68,68,0.3)';
                                    }
                                } else if (isSelected) {
                                    bg = `${OPTION_COLORS[key]}33`;
                                    border = OPTION_COLORS[key];
                                }

                                return (
                                    <motion.button
                                        key={key}
                                        whileHover={!result ? { scale: 1.02, x: 4 } : {}}
                                        whileTap={!result ? { scale: 0.98 } : {}}
                                        onClick={() => {
                                            if (result) return;
                                            const elapsed = (Date.now() - timeStartRef.current) / 1000;
                                            submitAnswer(key, elapsed);
                                        }}
                                        className="flex items-center gap-4 p-4 rounded-2xl text-left font-semibold transition-all"
                                        style={{ background: bg, border: `2px solid ${border}`, boxShadow: glow, color: 'white' }}
                                        disabled={!!result || isSubmitting}
                                    >
                                        {/* Option letter */}
                                        <span
                                            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                                            style={{ background: OPTION_COLORS[key] }}
                                        >
                                            {key}
                                        </span>
                                        <span className="flex-1">{text}</span>
                                        {result && isCorrect && <span className="text-green-400 text-xl">✓</span>}
                                        {result && isWrong   && <span className="text-red-400 text-xl">✗</span>}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Next button */}
                <AnimatePresence>
                    {result && (
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(99,102,241,0.5)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={nextQuestion}
                            className="w-full py-5 rounded-2xl font-black text-xl text-white"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                        >
                            {isLast
                                ? (lang === 'id' ? '🏆 Lihat Hasil!' : '🏆 See Results!')
                                : (lang === 'id' ? '⚡ Soal Berikutnya →' : '⚡ Next Question →')
                            }
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </AppLayout>
    );
                    }
