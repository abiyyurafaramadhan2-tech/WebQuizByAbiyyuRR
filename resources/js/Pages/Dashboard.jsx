import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/Layouts/AppLayout';

const GRADES = Array.from({ length: 12 }, (_, i) => ({
    id:      `grade_${i + 1}`,
    label:   `Kelas ${i + 1}`,
    emoji:   ['🐣','🐥','🌱','🌿','🌲','🌳','🎓','🚀','⚡','🔥','💎','👑'][i],
    color:   ['#4ade80','#22d3ee','#818cf8','#c084fc','#fb7185','#f97316','#facc15','#34d399','#60a5fa','#a78bfa','#f472b6','#fbbf24'][i],
}));

const SUBJECTS = [
    { id:'math',       label:'Matematika',    emoji:'🔢', color:'#6366f1' },
    { id:'science',    label:'IPA',           emoji:'🔬', color:'#22c55e' },
    { id:'indonesian', label:'Bahasa Indonesia',emoji:'📚',color:'#f59e0b' },
    { id:'english',    label:'Bahasa Inggris', emoji:'🌐', color:'#06b6d4' },
    { id:'history',    label:'Sejarah',        emoji:'🏛️', color:'#84cc16' },
    { id:'civics',     label:'PKN',            emoji:'🏳️', color:'#ef4444' },
    { id:'geography',  label:'Geografi',       emoji:'🌍', color:'#8b5cf6' },
    { id:'biology',    label:'Biologi',        emoji:'🧬', color:'#10b981' },
    { id:'chemistry',  label:'Kimia',          emoji:'⚗️', color:'#f59e0b' },
    { id:'physics',    label:'Fisika',         emoji:'⚛️', color:'#3b82f6' },
    { id:'economics',  label:'Ekonomi',        emoji:'📊', color:'#f97316' },
    { id:'arts',       label:'Seni Budaya',    emoji:'🎨', color:'#ec4899' },
];

export default function Dashboard({ userStats, recentSessions, user }) {
    const [selectedGrade,   setSelectedGrade]   = useState(user.grade || null);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedLang,    setSelectedLang]    = useState(user.preferred_language || 'id');
    const [selectedMode,    setSelectedMode]    = useState('learning');
    const [isLoading,       setIsLoading]       = useState(false);
    const [step, setStep] = useState(1); // 1=grade, 2=subject, 3=config

    const canStart = selectedGrade && selectedSubject;

    const handleStart = () => {
        if (!canStart) return;
        setIsLoading(true);
        router.post(route('quiz.start'), {
            grade:    selectedGrade,
            subject:  selectedSubject,
            language: selectedLang,
            mode:     selectedMode,
        }, {
            onError: () => setIsLoading(false),
        });
    };

    const gradeObj   = GRADES.find(g => g.id === selectedGrade);
    const subjectObj = SUBJECTS.find(s => s.id === selectedSubject);

    return (
        <AppLayout title="Dashboard">
            <div className="min-h-screen p-4 md:p-8">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-8"
                >
                    <div className="flex items-center gap-4">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2"
                            style={{ background: `${user.avatar_color}22`, borderColor: user.avatar_color }}
                        >
                            {user.avatar_emoji}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white">
                                Halo, {user.name}! 👋
                            </h1>
                            <p className="text-slate-400 text-sm">
                                Skor Total: <span className="text-indigo-400 font-bold">{userStats.total_score.toLocaleString()}</span>
                                {' · '}Rank #{userStats.global_rank}
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex gap-4">
                        {[
                            { label: 'Sesi',   value: userStats.total_sessions, emoji: '🎮' },
                            { label: 'Streak', value: userStats.best_streak,    emoji: '🔥' },
                        ].map(stat => (
                            <div key={stat.label}
                                className="px-4 py-3 rounded-2xl backdrop-blur text-center"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                <div className="text-xl font-black text-white">{stat.emoji} {stat.value}</div>
                                <div className="text-xs text-slate-400">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-8">
                    {[
                        { n:1, label:'Pilih Kelas'    },
                        { n:2, label:'Pilih Mapel'    },
                        { n:3, label:'Konfigurasi'    },
                    ].map(s => (
                        <div key={s.n} className="flex items-center gap-2">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                    step >= s.n
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-white/10 text-slate-500'
                                }`}
                            >
                                {step > s.n ? '✓' : s.n}
                            </div>
                            <span className={`text-sm hidden sm:block ${step >= s.n ? 'text-white' : 'text-slate-500'}`}>
                                {s.label}
                            </span>
                            {s.n < 3 && <div className="w-8 h-px bg-white/10 mx-1" />}
                        </div>
                    ))}
                </div>

                {/* Step 1: Grade Selection */}
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                        >
                            <h2 className="text-xl font-bold text-white mb-4">
                                📚 Pilih Kelasmu
                            </h2>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                {GRADES.map(grade => (
                                    <motion.button
                                        key={grade.id}
                                        whileHover={{ scale: 1.05, y: -3 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            setSelectedGrade(grade.id);
                                            setStep(2);
                                        }}
                                        className={`p-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${
                                            selectedGrade === grade.id
                                                ? 'border-opacity-100 shadow-lg'
                                                : 'border-white/10 hover:border-white/30'
                                        }`}
                                        style={{
                                            background: selectedGrade === grade.id ? `${grade.color}22` : 'rgba(255,255,255,0.05)',
                                            borderColor: selectedGrade === grade.id ? grade.color : undefined,
                                            boxShadow: selectedGrade === grade.id ? `0 0 20px ${grade.color}44` : undefined,
                                        }}
                                    >
                                        <span className="text-3xl">{grade.emoji}</span>
                                        <span className="text-xs font-bold text-white">{grade.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Subject Selection */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-slate-400 hover:text-white text-sm"
                                >
                                    ← Kembali
                                </button>
                                <h2 className="text-xl font-bold text-white">
                                    🎯 Pilih Mata Pelajaran
                                    {gradeObj && <span className="text-indigo-400"> ({gradeObj.label})</span>}
                                </h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {SUBJECTS.map(subject => (
                                    <motion.button
                                        key={subject.id}
                                        whileHover={{ scale: 1.03, y: -2 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => {
                                            setSelectedSubject(subject.id);
                                            setStep(3);
                                        }}
                                        className="p-4 rounded-2xl flex items-center gap-3 border-2 text-left transition-all"
                                        style={{
                                            background: selectedSubject === subject.id ? `${subject.color}22` : 'rgba(255,255,255,0.05)',
                                            borderColor: selectedSubject === subject.id ? subject.color : 'rgba(255,255,255,0.1)',
                                        }}
                                    >
                                        <span className="text-2xl">{subject.emoji}</span>
                                        <span className="text-sm font-semibold text-white">{subject.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Config & Start */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="max-w-lg mx-auto"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <button onClick={() => setStep(2)} className="text-slate-400 hover:text-white text-sm">
                                    ← Kembali
                                </button>
                                <h2 className="text-xl font-bold text-white">⚙️ Konfigurasi Quiz</h2>
                            </div>

                            {/* Summary card */}
                            <div
                                className="p-5 rounded-2xl mb-6 flex items-center gap-4"
                                style={{ background: 'rgba(99,102,241,0.15)', border: '2px solid rgba(99,102,241,0.3)' }}
                            >
                                <div className="text-4xl">{subjectObj?.emoji}</div>
                                <div>
                                    <div className="text-white font-bold">{subjectObj?.label}</div>
                                    <div className="text-slate-400 text-sm">{gradeObj?.label}</div>
                                </div>
                                <div className="ml-auto text-2xl">{gradeObj?.emoji}</div>
                            </div>

                            {/* Mode */}
                            <div className="mb-5">
                                <label className="text-sm font-semibold text-slate-300 mb-3 block">🎮 Mode</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id:'learning', label:'Belajar', icon:'📖', desc:'Dapat penjelasan AI', color:'#22c55e' },
                                        { id:'exam',     label:'Ujian',   icon:'📝', desc:'Serius & tertekan!',  color:'#ef4444' },
                                    ].map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => setSelectedMode(m.id)}
                                            className="p-4 rounded-xl border-2 text-left transition-all"
                                            style={{
                                                background: selectedMode === m.id ? `${m.color}22` : 'rgba(255,255,255,0.05)',
                                                borderColor: selectedMode === m.id ? m.color : 'rgba(255,255,255,0.1)',
                                            }}
                                        >
                                            <div className="text-xl mb-1">{m.icon}</div>
                                            <div className="font-bold text-white text-sm">{m.label}</div>
                                            <div className="text-xs text-slate-400">{m.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Language */}
                            <div className="mb-8">
                                <label className="text-sm font-semibold text-slate-300 mb-3 block">🌐 Bahasa</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id:'id', label:'🇮🇩 Indonesia' },
                                        { id:'en', label:'🇬🇧 English'  },
                                    ].map(l => (
                                        <button
                                            key={l.id}
                                            onClick={() => setSelectedLang(l.id)}
                                            className="py-3 rounded-xl border-2 font-semibold text-sm transition-all"
                                            style={{
                                                background: selectedLang === l.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                                                borderColor: selectedLang === l.id ? '#6366f1' : 'rgba(255,255,255,0.1)',
                                                color: selectedLang === l.id ? 'white' : '#94a3b8',
                                            }}
                                        >
                                            {l.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Start button */}
                            <motion.button
                                whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(99,102,241,0.6)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleStart}
                                disabled={isLoading}
                                className="w-full py-5 rounded-2xl font-black text-xl text-white relative overflow-hidden"
                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <motion.div
                                            className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                        />
                                        AI sedang menyiapkan soal...
                                    </div>
                                ) : (
                                    <span>🚀 MULAI QUIZ!</span>
                                )}

                                {/* Shine effect */}
                                {!isLoading && (
                                    <motion.div
                                        className="absolute inset-0"
                                        style={{ background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)' }}
                                        animate={{ x: ['-100%', '200%'] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                    />
                                )}
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </AppLayout>
    );
                  }
