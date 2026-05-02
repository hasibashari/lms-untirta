import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

const GlobalLoadingBar = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const MotionDiv = motion.div;

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setLoading(true);
    }, 0);

    const endTimer = setTimeout(() => {
      setLoading(false);
    }, 500); // Short pulse to indicate navigation started

    return () => {
      clearTimeout(startTimer);
      clearTimeout(endTimer);
    };
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {loading && (
        <MotionDiv
          initial={{ width: 0, opacity: 1 }}
          animate={{ width: "100%", opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed top-0 left-0 right-0 h-1 bg-primary z-9999 shadow-[0_0_10px_rgba(var(--primary),0.5)]"
          style={{
            background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 50%, #3b82f6 100%)',
            backgroundSize: '200% 100%'
          }}
        />
      )}
    </AnimatePresence>
  );
};

export default GlobalLoadingBar;
