import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, Zap, Star } from 'lucide-react';

const ProfileTierDecoration = ({ tier = 'free', children }: { tier?: string; children: React.ReactNode }) => {
  if (!tier || tier === 'free') return <div className="relative h-full">{children}</div>;

  if (tier === 'premium') {
    return (
      <div className="relative h-full">
        <motion.div
          className="absolute -inset-[3px] rounded-[28px] bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 opacity-75"
          animate={{ background: ['linear-gradient(90deg, #c084fc, #a855f7, #9333ea)', 'linear-gradient(180deg, #a855f7, #9333ea, #c084fc)', 'linear-gradient(270deg, #9333ea, #c084fc, #a855f7)', 'linear-gradient(360deg, #c084fc, #a855f7, #9333ea)'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <div className="relative h-full">{children}</div>
        <motion.div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-1 rounded-full shadow-lg flex items-center gap-1.5 z-10" initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <Crown size={14} /><span className="text-xs font-bold">PREMIUM</span>
        </motion.div>
        <motion.div className="absolute -top-1 -right-1 text-purple-400" animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ duration: 4, repeat: Infinity }}>
          <Sparkles size={16} />
        </motion.div>
      </div>
    );
  }

  if (tier === 'elite') {
    return (
      <div className="relative h-full">
        <motion.div
          className="absolute -inset-[4px] rounded-[28px] bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500"
          animate={{ background: ['linear-gradient(45deg, #fbbf24, #f59e0b, #d97706, #fbbf24)', 'linear-gradient(135deg, #f59e0b, #d97706, #fbbf24, #f59e0b)', 'linear-gradient(225deg, #d97706, #fbbf24, #f59e0b, #d97706)', 'linear-gradient(315deg, #fbbf24, #f59e0b, #d97706, #fbbf24)'] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute -inset-[4px] rounded-[28px] bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 blur-md opacity-50" />
        <div className="relative h-full">{children}</div>
        <motion.div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-amber-950 px-5 py-1.5 rounded-full shadow-xl flex items-center gap-2 z-10 border-2 border-amber-300" initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <Zap size={16} className="fill-current" /><span className="text-sm font-black tracking-wide">ELITE</span><Zap size={16} className="fill-current" />
        </motion.div>
        {[0, 1, 2, 3].map((i) => (
          <motion.div key={i} className="absolute text-amber-400" style={{ top: i < 2 ? '-8px' : 'auto', bottom: i >= 2 ? '-8px' : 'auto', left: i % 2 === 0 ? '-8px' : 'auto', right: i % 2 === 1 ? '-8px' : 'auto' }}
            animate={{ rotate: 360, scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}>
            <Sparkles size={18} />
          </motion.div>
        ))}
        <motion.div className="absolute top-1/4 -right-2 text-yellow-300" animate={{ y: [-5, 5, -5], rotate: [0, 180, 360] }} transition={{ duration: 4, repeat: Infinity }}>
          <Star size={14} className="fill-current" />
        </motion.div>
      </div>
    );
  }

  if (tier === 'vip') {
    return (
      <div className="relative h-full">
        <motion.div className="absolute -inset-[5px] rounded-[28px]" style={{ background: 'linear-gradient(90deg, #ff0080, #ff8c00, #40e0d0, #ff0080, #ff8c00, #40e0d0)', backgroundSize: '200% 200%' }} animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
        <motion.div className="absolute -inset-[5px] rounded-[28px] blur-lg opacity-60" style={{ background: 'linear-gradient(45deg, #ff0080, #7928ca, #ff0080, #ffaa00, #ff0080)', backgroundSize: '400% 400%' }} animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }} transition={{ duration: 5, repeat: Infinity }} />
        <div className="absolute -inset-[8px] rounded-[32px] bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 blur-xl opacity-40" />
        <div className="relative h-full">{children}</div>
        <motion.div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10" initial={{ y: -20, opacity: 0, scale: 0.8 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 rounded-full blur-md opacity-75" />
            <motion.div className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white px-6 py-2 rounded-full shadow-2xl flex items-center gap-2 border-2 border-card/30"
              animate={{ boxShadow: ['0 0 20px rgba(236, 72, 153, 0.6)', '0 0 30px rgba(168, 85, 247, 0.6)', '0 0 20px rgba(34, 211, 238, 0.6)', '0 0 20px rgba(236, 72, 153, 0.6)'] }} transition={{ duration: 3, repeat: Infinity }}>
              <motion.div animate={{ rotate: [0, -15, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}><Crown size={20} className="fill-white" /></motion.div>
              <span className="text-sm font-black tracking-widest">VIP</span>
              <motion.div animate={{ rotate: [0, 15, -15, 15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}><Crown size={20} className="fill-white" /></motion.div>
            </motion.div>
          </div>
        </motion.div>
        {[0, 1, 2, 3].map((i) => (
          <motion.div key={`star-${i}`} className="absolute z-20" style={{ top: i < 2 ? '-12px' : 'auto', bottom: i >= 2 ? '-12px' : 'auto', left: i % 2 === 0 ? '-12px' : 'auto', right: i % 2 === 1 ? '-12px' : 'auto' }}
            animate={{ scale: [1, 1.8, 1], rotate: [0, 180, 360], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}>
            <Star size={22} className="drop-shadow-lg" style={{ fill: i % 2 === 0 ? '#fbbf24' : '#ec4899', color: i % 2 === 0 ? '#fbbf24' : '#ec4899' }} />
          </motion.div>
        ))}
      </div>
    );
  }

  return <>{children}</>;
};

export default ProfileTierDecoration;
