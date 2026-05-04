import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';

const GlobalLoadingBar = () => {
  const location = useLocation();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [apiActive, setApiActive] = useState(false);

  // Listen for custom API loading events (from Axios interceptor)
  useEffect(() => {
    const handleApiLoading = (e) => {
      setApiActive(e.detail);
    };
    window.addEventListener('api-loading', handleApiLoading);
    return () => window.removeEventListener('api-loading', handleApiLoading);
  }, []);

  // Trigger on route change
  useEffect(() => {
    setActive(true);
    setProgress(30); 
    
    const timer = setTimeout(() => {
      if (isFetching === 0 && isMutating === 0 && !apiActive) {
        setProgress(100);
        setTimeout(() => setActive(false), 200);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Sync with global fetching state
  useEffect(() => {
    const isSomethingLoading = isFetching > 0 || isMutating > 0 || apiActive;
    
    if (isSomethingLoading) {
      setActive(true);
      if (progress < 90) {
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 95) return prev;
            return prev + (95 - prev) * 0.1;
          });
        }, 300);
        return () => clearInterval(interval);
      }
    } else {
      const timer = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setActive(false);
          setProgress(0);
        }, 300);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isFetching, isMutating, apiActive]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 h-[3px] z-[9999] pointer-events-none"
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ 
              type: 'spring', 
              stiffness: 40, 
              damping: 15,
              mass: 0.5
            }}
            className="h-full shadow-[0_0_10px_#3b82f6,0_0_5px_#3b82f6]"
            style={{
              background: 'linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6)',
              backgroundSize: '200% 100%'
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalLoadingBar;
