import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AppLayout from '@/Layouts/AppLayout';

const MEDAL_COLORS = { 1: '#fbbf24', 2: '#94a3b8', 3: '#d97706' };
const MEDAL_EMOJI  = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function Leaderboard({ entries, filters, myBestScore, myRank }) {
    const [period,  setPeriod]  = useState(filters.period  || 'all');
    const [grade,   setGrade]   = useState(filters.grade   || '');
    const [subject, setSubject] = useState(filters.subject || '');

    const applyFilter = (newFilters) => {
        router.get(route('leaderboard'), { ...filters, ...newFilters }, { preserveState: true });
    };

    const topThree = entries.slice(0, 3);
    const rest     = entries.slice(3);

    return (
        <AppLayout title="Leaderboard">
            <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl font-black text-white mb-2">
                        🏆 Leaderboard
                    </h1>
                    <p className="text-slate-400">
                        Rank-mu: <span className="text-indigo-400 font-bold">#{myRank}</span>
                        {' · '}Best Score: <span className="text-yellow-400 font-bold">{myBestScore.toLocaleString()}</span>
                    </p>
                </motion.div>

                {/* Filter tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {[
                        { id:'today', label:'Hari Ini' },
                        { id:'week',  label:'Minggu Ini' },
                        { id:'month', label:'Bulan Ini' },
                        { id:'all',   label:'Semua' },
                    ].map(p => (
                        <button
                            key={p.id}
                            onClick={() => { setPeriod(p.id); applyFilter({ period: p.id }); }}
                            className="px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all"
                            style={{
                                background: period === p.id ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)',
                                border: `2px solid ${period === p.id ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                                color: period === p.id ? 'white' : '#94a3b8',
                            }}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                {/* Top 3 Podium */}
                {topThree.length >= 3 && (
                    <div className="flex items-end justify-center gap-3 mb-8 h-48">
                        {/* 2nd place */}
                        {[topThree[1], topThree[0], topThree[2]].map((entry, podiumIdx) => {
                            const rank   = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
                            const height = rank === 1 ? 160 : rank === 2 ? 120 : 90;
                            return entry ? (
                                <motion.div
                                    key={entry.rank}
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: rank === 1 ? 0 : rank === 2 ? 0.2 : 0.1 }}
                                    className="flex flex-col items-center flex-1"
                                >
                                    {/* Avatar */}
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center text-xl mb-2 border-2"
                                        style={{
                                            background: `${entry.avatar_color}33`,
                                            borderColor: MEDAL_COLORS[rank],
                                            boxShadow: `0 0 15px ${MEDAL_COLORS[rank]}66`,
                                        }}
                                    >
                                        {entry.avatar_emoji}
                                    </div>

                                    {/* Name */}
                                    <div className="text-white font-bold text-xs text-center mb-1 truncate w-full px-1">
                                        {entry.user_name}
                                    </div>
                                    <div className="text-yellow-400 font-black text-sm mb-2">
                                        {entry.score.toLocaleString()}
                                    </div>

                                    {/* Podium block */}
                                    <div
                                        className="w-full rounded-t-2xl flex items-center justify-center font-black text-2xl"
                                        style={{
                                            height,
                                            background: `linear-gradient(135deg, ${MEDAL_COLORS[rank]}33, ${MEDAL_COLORS[rank]}11)`,
                                            border: `2px solid ${MEDAL_COLORS[rank]}66`,
                                        }}
                                    >
                                        {MEDAL_EMOJI[rank]}
                                    </div>
                                </motion.div>
                            ) : null;
                        })}
                    </div>
                )}

                {/* Full rankings */}
                <div className="space-y-2">
                    {entries.map((entry, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                                entry.is_current_user ? 'ring-2 ring-indigo-500' : ''
                            }`}
                            style={{
                                background: entry.is_current_user
                                    ? 'rgba(99,102,241,0.2)'
                                    : 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                            }}
                        >
                            {/* Rank */}
                            <div className="w-10 text-center font-black text-lg"
                                style={{ color: MEDAL_COLORS[entry.rank] || '#64748b' }}>
                                {entry.rank <= 3 ? MEDAL_EMOJI[entry.rank] : `#${entry.rank}`}
                            </div>

                            {/* Avatar */}
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                                style={{ background: `${entry.avatar_color}33`, border: `2px solid ${entry.avatar_color}` }}
                            >
                                {entry.avatar_emoji}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-bold text-sm truncate">
                                        {entry.user_name}
                                        {entry.is_current_user && <span className="text-indigo-400 text-xs ml-1">(You)</span>}
                                    </span>
                                </div>
                                <div className="text-slate-500 text-xs">
                                    🔥 {entry.max_streak} streak · ✓ {entry.accuracy}%
                                </div>
                            </div>

                            {/* Score */}
                            <div className="text-right flex-shrink-0">
                                <div className="text-yellow-400 font-black">{entry.score.toLocaleString()}</div>
                                <div className="text-slate-500 text-xs">{entry.date}</div>
                            </div>
                        </motion.div>
                    ))}

                    {entries.length === 0 && (
                        <div className="text-center py-16 text-slate-500">
                            <div className="text-5xl mb-4">🏆</div>
                            <p>Belum ada data. Jadilah yang pertama!</p>
                        </div>
                    )}
                </div>

                {/* CTA */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.visit(route('dashboard'))}
                    className="w-full mt-8 py-4 rounded-2xl font-black text-white text-lg"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                    🚀 Main Lagi!
                </motion.button>
            </div>
        </AppLayout>
    );
}
