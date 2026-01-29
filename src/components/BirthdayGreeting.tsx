import { useState, useEffect, useRef } from 'react';
import { Cake, X, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicBackground } from './DynamicBackground';

interface BirthdayGreetingProps {
    onDismiss: () => void;
}

export const BirthdayGreeting = ({ onDismiss }: BirthdayGreetingProps) => {
    const [stage, setStage] = useState<'envelope' | 'opening' | 'celebration'>('envelope');
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const chromeRuntime = (typeof chrome !== 'undefined' && chrome.runtime) as { getURL?: (path: string) => string } | undefined;
        const audioUrl = chromeRuntime?.getURL 
            ? chromeRuntime.getURL('birthday-song.mp3')
            : '/birthday-song.mp3';
        console.log('[BirthdayGreeting] Audio URL:', audioUrl);
        audioRef.current = new Audio(audioUrl); 
        audioRef.current.loop = true;
        
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const wishes = [
        "愿你的每一天都充满阳光与欢笑",
        "新的一岁，奔赴热爱",
        "愿所有美好如期而至",
        "生日快乐，我的朋友"
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { duration: 1 }
        },
        exit: { 
            opacity: 0, 
            transition: { duration: 0.5 } 
        }
    };

    const letterVariants = {
        initial: { scale: 0.8, rotate: -5, opacity: 0 },
        animate: { 
            scale: 1, 
            rotate: 0, 
            opacity: 1,
            transition: { 
                type: "spring" as const,
                stiffness: 100,
                damping: 10,
                delay: 0.5
            }
        },
        hover: { 
            scale: 1.05, 
            rotate: 2,
            transition: { duration: 0.3 }
        },
        tap: { scale: 0.95 },
        exit: { 
            scale: 1.5, 
            opacity: 0, 
            rotateX: 180,
            transition: { duration: 0.8, ease: "easeInOut" as const } 
        }
    };

    const cardVariants = {
        hidden: { 
            clipPath: "inset(50% 0 50% 0)",
            opacity: 0,
            scale: 0.9
        },
        visible: { 
            clipPath: "inset(0% 0 0% 0)",
            opacity: 1,
            scale: 1,
            transition: { 
                duration: 1.5, 
                ease: [0.77, 0, 0.175, 1] as const,
                delay: 0.2
            }
        }
    };

    const cakeVariants = {
        hidden: { y: 50, opacity: 0, scale: 0.8 },
        visible: { 
            y: 0, 
            opacity: 1, 
            scale: 1,
            transition: { 
                type: "spring" as const,
                bounce: 0.4,
                duration: 1.5,
                delay: 1.5 
            }
        }
    };

    const textContainerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 1.2,
                delayChildren: 2.5
            }
        }
    };

    const sentenceVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.8, ease: "easeOut" as const }
        }
    };

    const handleOpen = () => {
        setStage('opening');
        setTimeout(() => setStage('celebration'), 800);
        // Play music
        if (audioRef.current) {
            audioRef.current.volume = 0.5;
            audioRef.current.play().catch(e => console.error("Audio play failed", e));
        }
    };

    const [isVisible, setIsVisible] = useState(true);

    const handleDismiss = () => {
        setIsVisible(false);
        // Fade out music
        if (audioRef.current) {
            const fadeOut = setInterval(() => {
                if (audioRef.current && audioRef.current.volume > 0.05) {
                    audioRef.current.volume -= 0.05;
                } else {
                    clearInterval(fadeOut);
                    audioRef.current?.pause();
                }
            }, 100);
        }
    };

    return (
        <motion.div 
            className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
            initial="hidden"
            animate={isVisible ? "visible" : "exit"}
            variants={containerVariants}
            onAnimationComplete={(definition) => {
                if (definition === 'exit') onDismiss();
            }}
        >
            <DynamicBackground />
            
            <div className="absolute inset-0 bg-black/20 z-[1]" />

            <div className="relative z-10 w-full max-w-2xl px-4">
                <AnimatePresence mode="wait">
                    {stage === 'envelope' && (
                        <motion.div 
                            key="envelope"
                            className="w-full flex flex-col items-center justify-center cursor-pointer"
                            variants={letterVariants}
                            initial="initial"
                            animate="animate"
                            whileHover="hover"
                            whileTap="tap"
                            exit="exit"
                            onClick={handleOpen}
                        >
                            <div className="w-64 h-48 bg-[#fdfbf7] rounded-lg shadow-2xl relative overflow-hidden flex items-center justify-center border-4 border-[#e6e2d3] shadow-black/20">
                                {/* Envelope details - paper texture color */}
                                <div className="absolute top-0 left-0 w-full h-full border-b-[96px] border-l-[128px] border-r-[128px] border-b-[#e6e2d3] border-l-transparent border-r-transparent border-t-0 absolute top-0"></div>
                                <div className="absolute bottom-0 left-0 w-full h-0 border-b-[96px] border-l-[128px] border-r-[128px] border-b-[#fdfbf7] border-l-transparent border-r-transparent border-t-0 shadow-sm"></div>
                                <div className="z-10 bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg font-serif font-bold text-lg ring-2 ring-red-200">
                                    Open
                                </div>
                            </div>
                            <p className="mt-8 text-white/90 font-medium tracking-widest text-sm animate-pulse flex items-center gap-2">
                                <Music size={14} /> 点击开启你的生日惊喜
                            </p>
                        </motion.div>
                    )}

                    {stage === 'celebration' && (
                        <motion.div 
                            key="card"
                            className="relative w-full bg-[#fdfbf7] border border-[#e6e2d3] rounded-sm shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto custom-scrollbar"
                            style={{ 
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                backgroundImage: 'radial-gradient(#e6e2d3 1px, transparent 1px)',
                                backgroundSize: '20px 20px'
                            }}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <div className="p-8 md:p-12 flex flex-col items-center text-center">
                                {/* Close Button */}
                                <button 
                                    onClick={handleDismiss}
                                    className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 transition-colors rounded-full hover:bg-black/5"
                                >
                                    <X size={20} />
                                </button>

                                {/* Cake Section */}
                                <motion.div 
                                    variants={cakeVariants}
                                    className="mb-10 relative"
                                >
                                    <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg ring-4 ring-pink-100 relative z-10">
                                        <Cake size={40} className="text-pink-500" />
                                    </div>
                                    {/* Glow effect - adjusted for light background */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-pink-200/40 blur-3xl -z-0 rounded-full"></div>
                                </motion.div>

                                {/* Wishes Section */}
                                <motion.div 
                                    className="space-y-6 w-full"
                                    variants={textContainerVariants}
                                >
                                    {wishes.map((text, index) => (
                                        <motion.p 
                                            key={index}
                                            variants={sentenceVariants}
                                            className={`font-serif tracking-wide ${
                                                index === wishes.length - 1 
                                                    ? "text-xl md:text-2xl text-red-500 mt-6 font-bold" 
                                                    : "text-base md:text-lg text-zinc-700"
                                            }`}
                                        >
                                            {text}
                                        </motion.p>
                                    ))}
                                </motion.div>

                                {/* Button Section */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ 
                                        opacity: 1, 
                                        y: 0,
                                        transition: { delay: 6, duration: 1 } 
                                    }}
                                    className="pt-12 pb-4"
                                >
                                    <button 
                                        onClick={handleDismiss}
                                        className="group relative px-10 py-3 overflow-hidden rounded-full bg-zinc-900 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                                    >
                                        <span className="relative z-10 text-xs font-medium tracking-widest uppercase group-hover:text-pink-200 transition-colors">
                                            进入工作区
                                        </span>
                                    </button>
                                </motion.div>
                            </div>
                            
                            {/* Decorative footer */}
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1, transition: { delay: 7 } }}
                                className="absolute bottom-3 left-0 w-full text-center text-[10px] text-zinc-400 uppercase tracking-[0.3em]"
                            >
                                Designed for you
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};