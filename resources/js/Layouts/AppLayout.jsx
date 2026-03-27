import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';

export default function AppLayout({ title, children }) {
    return (
        <>
            <Head title={title} />
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
                {/* Ambient particles */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 rounded-full bg-indigo-400/20"
                            style={{
                                left:  `${Math.random() * 100}%`,
                                top:   `${Math.random() * 100}%`,
                            }}
                            animate={{
                                y:       [0, -30, 0],
                                opacity: [0.1, 0.5, 0.1],
                                scale:   [1, 1.5, 1],
                            }}
                            transition={{
                                duration:    3 + Math.random() * 3,
                                repeat:      Infinity,
                                delay:       Math.random() * 3,
                                ease:        'easeInOut',
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10">{children}</div>
            </div>
        </>
    );
}
