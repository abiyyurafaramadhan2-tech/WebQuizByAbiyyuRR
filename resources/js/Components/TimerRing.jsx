import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function TimerRing({ duration, onExpire, isPaused = false }) {
    const [timeLeft, setTimeLeft] = useState(duration);
    const radius = 36;
    const circ   = 2 * Math.PI * radius;
    const pct    = timeLeft / duration;
    const color  = timeLeft > 10 ? '#22c55e' : timeLeft > 5 ? '#f59e0b' : '#ef4444';

    useEffect(() => {
        setTimeLeft(duration);
    }, [duration]);

    useEffect(() => {
        if (isPaused || timeLeft <= 0) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    onExpire?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft, isPaused, onExpire]);

    return (
        <div className="relative flex items-center justify-center">
            <svg width="90" height="90" viewBox="0 0 90 90">
                {/* Background ring */}
                <circle cx="45" cy="45" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                {/* Progress ring */}
                <motion.circle
                    cx="45" cy="45" r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={circ * (1 - pct)}
                    transform="rotate(-90 45 45)"
                    style={{ filter: `drop-shadow(0 0 6px ${color})` }}
                    transition={{ duration: 1, ease: 'linear' }}
                />
            </svg>

            {/* Time number */}
            <motion.div
                className="absolute text-2xl font-black"
                style={{ color }}
                animate={timeLeft <= 5 ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5, repeat: timeLeft <= 5 ? Infinity : 0 }}
            >
                {timeLeft}
            </motion.div>
        </div>
    );
}
