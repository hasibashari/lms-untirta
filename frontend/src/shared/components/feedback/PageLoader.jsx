import { motion } from 'motion/react';

/**
 * PageLoader - Komponen loading untuk lazy-loaded pages
 * Digunakan sebagai fallback Suspense saat page sedang dimuat
 */
const MotionDiv = motion.div;
const MotionP = motion.p;

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
    <div className="relative">
      <MotionDiv
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full"
      />
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-2 h-2 bg-primary rounded-full" />
      </MotionDiv>
    </div>
    <MotionP
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-4 text-slate-500 font-medium text-sm animate-pulse"
    >
      Menyiapkan halaman...
    </MotionP>
  </div>
);

export default PageLoader;

