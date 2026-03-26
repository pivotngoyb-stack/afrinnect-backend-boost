import React, { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone || 
                       document.referrer.includes('android-app://');
    
    setIsStandalone(standalone);
    
    if (standalone) return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPrompt(true), 5000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    if (ios && !localStorage.getItem('installPromptDismissed')) {
      setTimeout(() => setShowPrompt(true), 5000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 left-4 right-4 z-40 md:left-auto md:right-4 md:w-96"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="bg-background rounded-2xl shadow-2xl p-4 border border-primary/10 backdrop-blur-lg">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <div className="bg-gradient-to-br from-primary to-accent w-14 h-14 rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg">
                A
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg">Get Afrinnect</h3>
                <p className="text-sm text-muted-foreground">
                  {isIOS 
                    ? "Add to Home Screen for the best experience" 
                    : "Install the app for faster access"}
                </p>
              </div>
            </div>
            <button 
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground p-1 -mt-1 -mr-1 touch-manipulation"
            >
              <X size={22} />
            </button>
          </div>

          {isIOS ? (
            <div className="mt-4 bg-muted p-4 rounded-xl text-sm text-foreground">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 bg-background rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-primary font-bold">1</span>
                </div>
                <span>Tap <Share size={18} className="inline text-primary mx-1" /> Share button below</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-background rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-primary font-bold">2</span>
                </div>
                <span>Select <span className="font-semibold bg-background px-2 py-0.5 rounded text-xs">Add to Home Screen</span></span>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex gap-3">
              <Button 
                onClick={handleInstall}
                className="flex-1 h-12 text-base font-semibold rounded-xl touch-manipulation active:scale-95 transition-all"
              >
                <Download size={18} className="mr-2" />
                Install
              </Button>
              <Button 
                onClick={handleDismiss}
                variant="outline"
                className="flex-1 h-12 rounded-xl touch-manipulation"
              >
                Later
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
