import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const MOODS = {
    idle:       { eyes: 'normal', mouth: 'smile',   color: '#6366f1', emoji: '🧠' },
    happy:      { eyes: 'happy',  mouth: 'big',      color: '#22c55e', emoji: '🎉' },
    cheering:   { eyes: 'star',   mouth: 'wow',      color: '#f59e0b', emoji: '🔥' },
    thinking:   { eyes: 'squint', mouth: 'hmm',      color: '#8b5cf6', emoji: '🤔' },
    explaining: { eyes: 'open',   mouth: 'talking',  color: '#3b82f6', emoji: '💡' },
    sad:        { eyes: 'sad',    mouth: 'frown',    color: '#ef4444', emoji: '😅' },
    // Exam mode
    focused:    { eyes: 'glasses',mouth: 'straight', color: '#1e293b', emoji: '🎓' },
    urgent:     { eyes: 'glasses',mouth: 'tense',    color: '#dc2626', emoji: '⏰' },
    proud:      { eyes: 'glasses',mouth: 'nod',      color: '#059669', emoji: '✅' },
};

export default function ChubbyTutor({ mood = 'idle', message = '', mode = 'learning', size = 120 }) {
    const [bounce, setBounce] = useState(false);
    const [visible, setVisible] = useState(false);
    const moodData = MOODS[mood] || MOODS.idle;

    useEffect(() => {
        setVisible(true);
        if (['cheering', 'happy', 'proud'].includes(mood)) {
            setBounce(true);
            setTimeout(() => setBounce(false), 1000);
        }
    }, [mood]);

    // SVG face parts
    const Eyes = () => {
        if (moodData.eyes === 'glasses') {
            return (
                <>
                    {/* Glasses frames */}
                    <rect x="22" y="28" width="18" height="12" rx="4" fill="none" stroke="#1e293b" strokeWidth="2.5" />
                    <rect x="46" y="28" width="18" height="12" rx="4" fill="none" stroke="#1e293b" strokeWidth="2.5" />
                    <line x1="40" y1="34" x2="46" y2="34" stroke="#1e293b" strokeWidth="2" />
                    {/* Pupils */}
                    <circle cx="31" cy="34" r="3" fill="#1e293b" />
                    <circle cx="55" cy="34" r="3" fill="#1e293b" />
                    {/* Lenses */}
                    <rect x="22" y="28" width="18" height="12" rx="4" fill="rgba(200,230,255,0.3)" />
                    <rect x="46" y="28" width="18" height="12" rx="4" fill="rgba(200,230,255,0.3)" />
                </>
            );
        }

        if (moodData.eyes === 'star') {
            return (
                <>
                    <text x="22" y="42" fontSize="16" textAnchor="middle">⭐</text>
                    <text x="64" y="42" fontSize="16" textAnchor="middle">⭐</text>
                </>
            );
        }

        if (moodData.eyes === 'happy') {
            return (
                <>
                    <path d="M23 38 Q31 30 39 38" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                    <path d="M47 38 Q55 30 63 38" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                </>
            );
        }

        if (moodData.eyes === 'sad') {
            return (
                <>
                    <circle cx="31" cy="34" r="5" fill="#1e293b" />
                    <circle cx="55" cy="34" r="5" fill="#1e293b" />
                    <circle cx="33" cy="32" r="1.5" fill="white" />
                    <circle cx="57" cy="32" r="1.5" fill="white" />
                    {/* Tears */}
                    <path d="M31 39 Q29 45 31 47" fill="rgba(100,160,255,0.6)" stroke="rgba(100,160,255,0.6)" strokeWidth="1" />
                </>
            );
        }

        return (
            <>
                <circle cx="31" cy="34" r="5" fill="#1e293b" />
                <circle cx="55" cy="34" r="5" fill="#1e293b" />
                <circle cx="33" cy="32" r="1.5" fill="white" />
                <circle cx="57" cy="32" r="1.5" fill="white" />
            </>
        );
    };

    const Mouth = () => {
        if (moodData.mouth === 'big') {
            return <path d="M25 58 Q43 72 61 58" fill="#1e293b" />;
        }
        if (moodData.mouth === 'wow') {
            return <ellipse cx="43" cy="60" rx="10" ry="8" fill="#1e293b" />;
        }
        if (moodData.mouth === 'frown') {
            return <path d="M28 64 Q43 55 58 64" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />;
        }
        if (moodData.mouth === 'talking') {
            return (
                <>
                    <path d="M28 60 Q43 68 58 60" fill="#1e293b" strokeLinecap="round" />
                    <path d="M33 60 Q43 55 53 60" fill="#ff9999" strokeLinecap="round" />
                </>
            );
        }
        if (moodData.mouth === 'straight') {
            return <path d="M30 62 L56 62" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />;
        }
        if (moodData.mouth === 'tense') {
            return <path d="M28 63 Q43 60 58 63" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />;
        }
        return <path d="M28 60 Q43 68 58 60" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />;
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <motion.div
                animate={{
                    y:     bounce ? [0, -20, 0, -10, 0] : [0, -5, 0],
                    scale: bounce ? [1, 1.1, 1] : [1, 1.02, 1],
                    rotate: mood === 'cheering' ? [-5, 5, -5, 0] : 0,
                }}
                transition={{
                    duration: bounce ? 0.6 : 3,
                    repeat:   bounce ? 0 : Infinity,
                    ease:     'easeInOut',
                }}
            >
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 86 100"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Body shadow */}
                    <ellipse cx="43" cy="98" rx="28" ry="4" fill="rgba(0,0,0,0.15)" />

                    {/* Body */}
                    <ellipse cx="43" cy="70" rx="28" ry="22" fill={moodData.color} />

                    {/* Arms */}
                    {mood === 'cheering' ? (
                        <>
                            <path d="M15 60 Q5 40 10 30" stroke={moodData.color} strokeWidth="10" fill="none" strokeLinecap="round" />
                            <path d="M71 60 Q81 40 76 30" stroke={moodData.color} strokeWidth="10" fill="none" strokeLinecap="round" />
                            <circle cx="10" cy="29" r="6" fill={moodData.color} />
                            <circle cx="76" cy="29" r="6" fill={moodData.color} />
                        </>
                    ) : mode === 'exam' ? (
                        <>
                            <path d="M15 68 Q8 72 10 80" stroke={moodData.color} strokeWidth="9" fill="none" strokeLinecap="round" />
                            <path d="M71 68 Q78 72 76 80" stroke={moodData.color} strokeWidth="9" fill="none" strokeLinecap="round" />
                        </>
                    ) : (
                        <>
                            <path d="M15 65 Q6 68 8 76" stroke={moodData.color} strokeWidth="9" fill="none" strokeLinecap="round" />
                            <path d="M71 65 Q80 68 78 76" stroke={moodData.color} strokeWidth="9" fill="none" strokeLinecap="round" />
                        </>
                    )}

                    {/* Legs */}
                    <rect x="28" y="86" width="10" height="12" rx="5" fill={moodData.color} />
                    <rect x="48" y="86" width="10" height="12" rx="5" fill={moodData.color} />

                    {/* Head */}
                    <circle cx="43" cy="40" r="30" fill={moodData.color} />

                    {/* Cheeks */}
                    <circle cx="18" cy="46" r="8" fill="rgba(255,200,200,0.4)" />
                    <circle cx="68" cy="46" r="8" fill="rgba(255,200,200,0.4)" />

                    {/* Face highlight */}
                    <circle cx="36" cy="22" r="8" fill="rgba(255,255,255,0.15)" />

                    {/* Eyes */}
                    <Eyes />

                    {/* Mouth */}
                    <Mouth />

                    {/* Emoji badge */}
                    <motion.text
                        x="58" y="18"
                        fontSize="18"
                        textAnchor="middle"
                        animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    >
                        {moodData.emoji}
                    </motion.text>
                </svg>
            </motion.div>

            {/* Message bubble */}
            <AnimatePresence mode="wait">
                {message && (
                    <motion.div
                        key={message}
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.9 }}
                        className="max-w-xs text-center"
                    >
                        <div
                            className="relative px-4 py-3 rounded-2xl text-sm font-medium shadow-lg"
                            style={{
                                background: `${moodData.color}22`,
                                border: `2px solid ${moodData.color}44`,
                                color: '#e2e8f0',
                            }}
                        >
                            {/* Speech bubble triangle */}
                            <div
                                className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-0 h-0"
                                style={{
                                    borderLeft:  '8px solid transparent',
                                    borderRight: '8px solid transparent',
                                    borderBottom: `10px solid ${moodData.color}44`,
                                }}
                            />
                            {message}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
