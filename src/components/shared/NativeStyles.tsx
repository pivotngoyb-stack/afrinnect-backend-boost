import React from 'react';

export const NativeStyles = () => (
  <style>{`
    * {
      -webkit-user-select: none;
      user-select: none;
      -webkit-touch-callout: none;
    }
    
    input, textarea, [contenteditable="true"], .selectable {
      -webkit-user-select: text;
      user-select: text;
    }

    * {
      -webkit-overflow-scrolling: touch;
    }

    html, body {
      overscroll-behavior: none;
      position: fixed;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    
    #root {
      width: 100%;
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
    }

    * {
      -webkit-tap-highlight-color: transparent;
    }

    button, a, [role="button"], input[type="submit"], .touchable {
      touch-action: manipulation;
    }

    button:active, .btn-press:active {
      transform: scale(0.97);
      transition: transform 0.1s ease-out;
    }

    img, a {
      -webkit-touch-callout: none;
    }

    .safe-top { padding-top: env(safe-area-inset-top); }
    .safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
    .safe-left { padding-left: env(safe-area-inset-left); }
    .safe-right { padding-right: env(safe-area-inset-right); }

    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    .native-transition {
      transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    .glass {
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }

    input, select, textarea {
      font-size: 16px !important;
    }

    @supports (-webkit-touch-callout: none) {
      .keyboard-fix {
        padding-bottom: env(keyboard-inset-height, 0px);
      }
    }
  `}</style>
);

export const useHaptics = () => {
  const light = () => { if (navigator.vibrate) navigator.vibrate(10); };
  const medium = () => { if (navigator.vibrate) navigator.vibrate(30); };
  const heavy = () => { if (navigator.vibrate) navigator.vibrate(50); };
  const success = () => { if (navigator.vibrate) navigator.vibrate([30, 50, 30]); };
  const error = () => { if (navigator.vibrate) navigator.vibrate([50, 100, 50]); };
  return { light, medium, heavy, success, error };
};

export const PullIndicator = ({ progress }) => (
  <div 
    className="flex items-center justify-center py-4"
    style={{ 
      opacity: Math.min(progress / 100, 1),
      transform: `rotate(${progress * 3.6}deg)`
    }}
  >
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export default NativeStyles;
