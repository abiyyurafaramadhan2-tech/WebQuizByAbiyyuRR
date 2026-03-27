import { motion, AnimatePresence } from 'framer-motion';

const STREAK_MESSAGES = {
    3:  { text: '🔥 On Fire!',        color: '#f59e0b', emoji: '🔥' },
    5:  { text: '⚡ Lightning Fast!', color: '#6366f1', emoji: '⚡' },
    7:  { text: '🚀 Unstoppable!',    color: '#8b5cf6', emoji: '🚀' },
    10: { text: '👑 LEGENDARY!',      color: '#f59e0b', emoji: '👑' },
};

export default function StreakEffect({ streak, show }) {
    const msg = Object.entries(STREAK_MESSAGES)
        .reverse()
        .find(([k]) => streak >= Number(k));

    return (
        <AnimatePresence>
            {show && msg && (
                <motion.div
                    initial={{ scale: 0, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.5, opacity: 0, y: -40 }}
                    className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                >
                    <motion.div
                        className="flex flex-col items-center gap-2"
                        animate={{ y: [0, -15, 0] }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    >
                        {/* Giant emoji */}
                        <motion.div
                            className="text-7xl"
                            animate={{ rotate: [-10, 10, -5, 5, 0], scale: [0.8, 1.2, 1] }}
                            transition={{ duration: 0.5 }}
                        >
                            {msg[1].emoji}
                        </motion.div>

                        {/* Streak text */}
                        <motion.div
                            className="px-8 py-3 rounded-2xl font-black text-2xl text-center"
                            style={{
                                background: `linear-gradient(135deg, ${msg[1].color}33, ${msg[1].color}55)`,
                                border: `2px solid ${msg[1].color}`,
                                color: msg[1].color,
                                textShadow: `0 0 20px ${msg[1].color}`,
                                boxShadow: `0 0 40px ${msg[1].color}44`,
                            }}
                        >
                            {msg[1].text}
                        </motion.div>

                        {/* Streak count */}
                        <div className="text-white/60 font-bold text-lg">
                            {streak}x Streak!
                        </div>
                    </motion.div>

                    {/* Particle burst */}
                    {[...Array(12)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-3 h-3 rounded-full"
                            style={{ background: msg[1].color }}
                            initial={{ x: 0, y: 0, opacity: 1 }}
                            animate={{
                                x: Math.cos((i / 12) * Math.PI * 2) * 150,
                                y: Math.sin((i / 12) * Math.PI * 2) * 150,
                                opacity: 0,
                                scale: 0,
                            }}
                            transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                        />
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
