import React, { useState, useEffect, useRef } from 'react';
import { 
  Fingerprint, 
  Scan, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  X, 
  KeyRound, 
  Smartphone,
  Eye,
  EyeOff,
  AlertCircle,
  Video,
  VideoOff,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BiometricLog } from '../types';

interface BiometricShieldProps {
  isOpen: boolean;
  onUnlock: () => void;
  attemptType?: 'app_launch' | 'transaction';
  isTransactionAuth?: boolean;
  transactionAmount?: number;
  transactionDescription?: string;
  onCancelTransaction?: () => void;
  primaryMode?: 'fingerprint' | 'faceid';
  onAuthResult?: (result: Omit<BiometricLog, 'id' | 'timestamp'>) => void;
}

export default function BiometricShield({
  isOpen,
  onUnlock,
  attemptType = 'app_launch',
  isTransactionAuth = false,
  transactionAmount,
  transactionDescription,
  onCancelTransaction,
  primaryMode = 'fingerprint',
  onAuthResult
}: BiometricShieldProps) {
  const [authMode, setAuthMode] = useState<'fingerprint' | 'faceid'>(primaryMode);
  const [authState, setAuthState] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const [forceFail, setForceFail] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('Touch sensor to authenticate');
  
  // Custom secure PIN lock fallback state
  const [usePin, setUsePin] = useState(false);
  const [pin, setPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Video Streaming state for live "auto-selfie"
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [cameraPermissionError, setCameraPermissionError] = useState<boolean>(false);

  // Sync auth mode with primaryMode on change
  useEffect(() => {
    setAuthMode(primaryMode);
    setUsePin(false);
    resetAuth();
  }, [primaryMode, isOpen]);

  // Handle active webcam stream during biometric scanning mode to allow "selfie" capture
  useEffect(() => {
    if (isOpen && authState === 'scanning' && authMode === 'faceid') {
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
         console.warn('Camera access unavailable/denied in preview: mediaDevices undefined');
         setHasCamera(false);
         setCameraPermissionError(true);
         return;
      }
      navigator.mediaDevices.getUserMedia({
 
        video: { 
          width: { ideal: 320 }, 
          height: { ideal: 240 },
          facingMode: 'user'
        } 
      })
      .then(activeStream => {
        setStream(activeStream);
        setHasCamera(true);
        setCameraPermissionError(false);
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
        }
      })
      .catch(err => {
        console.warn('Camera access unavailable/denied in preview:', err);
        setHasCamera(false);
        setCameraPermissionError(true);
      });
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [authState, isOpen]);

  const stopCameraStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const resetAuth = () => {
    setAuthState('idle');
    setPin('');
    setPinError(null);
    if (authMode === 'fingerprint') {
      setFeedback('Place finger on the sensor');
    } else {
      setFeedback('Position face in front of screen camera');
    }
  };

  // Capture user face snapshot or draw a gorgeous cyber security vector avatar in high contrast
  const captureSelfiePhoto = (isSuccess: boolean): string => {
    // 1. Try real camera snapshot first
    if (hasCamera && videoRef.current) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, 320, 240);
          
          // Print cyber security HUD directly onto captured file
          ctx.strokeStyle = isSuccess ? '#10b981' : '#ef4444';
          ctx.lineWidth = 4;
          ctx.strokeRect(10, 10, 300, 220);
          
          ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
          ctx.fillRect(10, 10, 300, 35);
          
          ctx.fillStyle = isSuccess ? '#34d399' : '#f87171';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(`CHALO SHIELD SECURE INTAKE - ${isSuccess ? 'PASS' : 'BREACH'}`, 20, 30);
          
          return canvas.toDataURL('image/jpeg');
        }
      } catch (err) {
        console.error('Camera snapshot rendering failed:', err);
      }
    }

    // 2. High fidelity visual design fallback if webcam is blocked or unavailable
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Elegant dark vector background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 300, 240);

      // Cybersecurity grid layout
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let i = 0; i < 300; i += 20) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 240); ctx.stroke();
      }
      for (let j = 0; j < 240; j += 20) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(300, j); ctx.stroke();
      }

      // Scanner alignment boxes
      ctx.strokeStyle = isSuccess ? '#10b981' : '#f43f5e';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(40, 30, 220, 180);

      // Profile visual humanoid blueprint
      ctx.fillStyle = isSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';
      ctx.beginPath();
      ctx.arc(150, 105, 40, 0, Math.PI * 2); // Head
      ctx.fill();
      ctx.stroke();

      // Shoulders
      ctx.beginPath();
      ctx.moveTo(80, 210);
      ctx.quadraticCurveTo(150, 160, 220, 210);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing scanner bar overlays
      ctx.strokeStyle = isSuccess ? '#34d399' : '#fb7185';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(50, 105);
      ctx.lineTo(250, 105);
      ctx.stroke();

      // Status text prints
      ctx.fillStyle = isSuccess ? '#10b981' : '#ef4444';
      ctx.font = 'bold 9.5px monospace';
      ctx.fillText(`CAPTURE: ${isSuccess ? 'OWNER_VERIFIED' : 'INT_UNIDENTIFIED_ERR'}`, 50, 50);
      ctx.fillText(`SYS_LOG: ${isSuccess ? 'ACCESS_GRANTED_SECURE' : 'ACCESS_DENIED_BREACH'}`, 50, 190);
      ctx.fillText(`TIME: ${new Date().toLocaleTimeString()}`, 50, 205);

      // Cyber lock details
      ctx.fillStyle = '#64748b';
      ctx.fillText(`IP_GEO: 127.0.0.1 • BENGALURU`, 50, 65);

      return canvas.toDataURL('image/jpeg');
    }

    return '';
  };

  const handleTriggerMockBiometrics = () => {
    if (authState === 'scanning' || authState === 'success') return;

    setAuthState('scanning');
    setFeedback(authMode === 'fingerprint' ? 'Analyzing fingerprint ridges...' : 'Detecting depth map points...');

    let scanProgress = 0;
    const interval = setInterval(() => {
      scanProgress += 25;
      if (scanProgress === 50) {
        setFeedback(authMode === 'fingerprint' ? 'Matching credential vault...' : 'Looking at facial landmarks...');
      }
      if (scanProgress >= 100) {
        clearInterval(interval);
        
        const isSuccess = !forceFail;
        const capturedSelfie = captureSelfiePhoto(isSuccess);

        if (!isSuccess) {
          setAuthState('failed');
          setFeedback('Biometrics mismatch. Try again or enter fallback PIN.');
          
          if (onAuthResult) {
            onAuthResult({
              attemptType,
              authMethod: authMode,
              status: 'failed',
              selfieUrl: capturedSelfie,
              details: `Biometric mismatch reported via Chalo One Shield lock panel (${authMode.toUpperCase()})`
            });
          }
        } else {
          setAuthState('success');
          setFeedback('Identity Verified Successfully!');
          
          if (onAuthResult) {
            onAuthResult({
              attemptType,
              authMethod: authMode,
              status: 'success',
              selfieUrl: capturedSelfie,
              details: `Secure biometric verification passed successfully (${authMode.toUpperCase()})`
            });
          }

          setTimeout(() => {
            onUnlock();
            resetAuth();
          }, 1200);
        }
      }
    }, 450);
  };

  const handlePinSubmit = () => {
    // PIN submission inside biometric shield
    const isSuccess = pin === '1234';
    const capturedSelfie = captureSelfiePhoto(isSuccess);

    if (isSuccess) {
      setAuthState('success');
      setPinError(null);
      setFeedback('PIN Verified!');
      
      if (onAuthResult) {
        onAuthResult({
          attemptType,
          authMethod: 'pin',
          status: 'success',
          selfieUrl: capturedSelfie,
          details: 'Authorized secure PIN unlocked the shield'
        });
      }

      setTimeout(() => {
        onUnlock();
        resetAuth();
      }, 1000);
    } else {
      setPinError('Incorrect Secret PIN. Default matches: 1234');
      
      if (onAuthResult) {
        onAuthResult({
          attemptType,
          authMethod: 'pin',
          status: 'failed',
          selfieUrl: capturedSelfie,
          details: `Failed fallback security entry try with PIN "${pin}"`
        });
      }

      setPin('');
    }
  };

  const addPinNumber = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setPinError(null);
      
      // Auto-submit on 4th digit
      if (nextPin.length === 4) {
        // Wait slightly for visual response feedback key highlight
        setTimeout(() => {
          const isSuccess = nextPin === '1234';
          const capturedSelfie = captureSelfiePhoto(isSuccess);

          if (isSuccess) {
            setAuthState('success');
            setFeedback('PIN Verified!');
            
            if (onAuthResult) {
              onAuthResult({
                attemptType,
                authMethod: 'pin',
                status: 'success',
                selfieUrl: capturedSelfie,
                details: 'Authorized secure PIN unlocked the shield'
              });
            }

            setTimeout(() => {
              onUnlock();
              resetAuth();
            }, 1000);
          } else {
            setPinError('Incorrect Secret PIN. Default matches: 1234');
            
            if (onAuthResult) {
              onAuthResult({
                attemptType,
                authMethod: 'pin',
                status: 'failed',
                selfieUrl: capturedSelfie,
                details: `Failed fallback security entry with PIN "${nextPin}"`
              });
            }
            setPin('');
          }
        }, 300);
      }
    }
  };

  const handlePinClear = () => {
    setPin('');
    setPinError(null);
  };

  if (!isOpen) return null;

  return (
    <div 
      id="biometric_shield_full_overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/93 backdrop-blur-xl p-4 transition-all duration-300 overflow-y-auto"
    >
      <div 
        className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 flex flex-col items-center"
        id="biometric_shield_lock_panel"
      >
        {/* Top security header status badges */}
        <div className="w-full flex items-center justify-between mb-6">
          <div className="flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-750 text-[10px] text-amber-400 font-mono font-bold tracking-wider uppercase">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Chalo One Shield V2.4</span>
          </div>

          <div className="flex space-x-1">
            {isTransactionAuth && onCancelTransaction && (
              <button 
                type="button" 
                onClick={onCancelTransaction}
                className="p-1 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-full border border-rose-500/20 text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* Branding & Subtitle Context */}
        <div className="text-center mb-5 space-y-1">
          <h2 className="text-xl font-display font-black text-white tracking-widest uppercase flex items-center justify-center space-x-2">
            <span>CHALO</span>
            {authState === 'success' ? (
              <Unlock className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
            ) : (
              <Lock className="w-4.5 h-4.5 text-amber-500 shrink-0 animate-bounce" />
            )}
          </h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            {isTransactionAuth ? 'Authorize Payment Transaction' : 'Secured Core Environment'}
          </p>

          {isTransactionAuth && transactionAmount && (
            <div className="mt-2.5 bg-amber-500/10 border border-amber-500/20 py-2.5 px-4 rounded-xl inline-block max-w-[90%]">
              <span className="text-[9px] font-mono text-amber-400 font-bold uppercase tracking-wider block">Confirming Amount</span>
              <strong className="text-lg font-mono font-black text-amber-400 font-bold">₹{transactionAmount.toFixed(2)}</strong>
              {transactionDescription && (
                <span className="block text-[10px] text-zinc-400 font-semibold mt-0.5 truncate max-w-xs">{transactionDescription}</span>
              )}
            </div>
          )}
        </div>

        {/* Biometric Interactive Core Area */}
        <div className="w-full min-h-[240px] flex flex-col items-center justify-center mb-4">
          <AnimatePresence mode="wait">
            {!usePin ? (
              <motion.div 
                key="biometrics"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center space-y-5 w-full"
              >
                {/* Visual interactive sensor screen */}
                <div className="relative">
                  {/* Outer breathing background circle */}
                  <div className={`p-6 rounded-full border transition-all duration-300 flex items-center justify-center ${
                    authState === 'scanning' 
                      ? 'bg-amber-500/5 border-amber-400/30' 
                      : authState === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : authState === 'failed'
                      ? 'bg-rose-500/10 border-rose-500/40'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600/80'
                  }`}>
                    
                    {/* Visual biometrics selection */}
                    <button
                      type="button"
                      id="biometric_sensor_interactive"
                      onClick={handleTriggerMockBiometrics}
                      className="relative w-32 h-32 bg-slate-900 border border-slate-700 hover:border-amber-400 rounded-full text-zinc-300 hover:text-white shadow-xl transition duration-200 cursor-pointer flex items-center justify-center overflow-hidden focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {/* Live Camera Feed directly in face lock */}
                      {authState === 'scanning' && hasCamera ? (
                        <div className="relative w-full h-full">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover scale-110"
                          />
                          {/* Radial Scanning reticle */}
                          <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-full animate-pulse pointer-events-none" />
                          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-scan-beam pointer-events-none" />
                        </div>
                      ) : (
                        authMode === 'fingerprint' ? (
                          <Fingerprint className={`w-16 h-16 ${
                            authState === 'scanning' ? 'text-amber-400 animate-pulse' :
                            authState === 'success' ? 'text-emerald-400' :
                            authState === 'failed' ? 'text-rose-550' : 'text-slate-400 hover:text-amber-400'
                          }`} />
                        ) : (
                          <div className="flex flex-col items-center">
                            <Scan className={`w-16 h-16 ${
                              authState === 'scanning' ? 'text-amber-400 animate-spin-slow' :
                              authState === 'success' ? 'text-emerald-400' :
                              authState === 'failed' ? 'text-rose-550' : 'text-slate-400 hover:text-amber-400'
                            }`} />
                            <span className="text-[8px] uppercase tracking-widest text-slate-500 mt-1.5 font-bold">Face Scanner</span>
                          </div>
                        )
                      )}

                      {/* Moving laser scan simulation beam */}
                      {authState === 'scanning' && !hasCamera && (
                        <span className="absolute left-2 right-2 border-b-2 border-amber-400 animate-scan-beam" />
                      )}
                    </button>
                  </div>

                  {/* Radiating sound waves when scanning */}
                  {authState === 'scanning' && (
                    <>
                      <span className="absolute -inset-2 border border-amber-500/20 rounded-full animate-ping pointer-events-none" />
                      <span className="absolute -inset-4 border border-amber-500/10 rounded-full animate-ping pointer-events-none" style={{ animationDelay: '0.4s' }} />
                    </>
                  )}
                </div>

                {/* Secure auth state feedback status labels */}
                <div className="text-center px-4 max-w-xs">
                  <p className={`text-xs font-semibold leading-normal font-sans tracking-wide ${
                    authState === 'success' ? 'text-emerald-400 font-bold' :
                    authState === 'failed' ? 'text-rose-400 font-bold' :
                    authState === 'scanning' ? 'text-amber-400 animate-pulse font-bold' : 'text-slate-350'
                  }`}>
                    {feedback}
                  </p>
                  
                  {authState === 'idle' && (
                    <span className="text-[10px] uppercase tracking-wider text-amber-500 font-extrabold font-mono mt-1.5 block animate-pulse">
                      Tap Sensor to scanning
                    </span>
                  )}

                  {authState === 'scanning' && hasCamera && (
                    <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold font-mono mt-1 block">
                      📷 AUTO SELFIE SCANNING ENABLED
                    </span>
                  )}
                  {authState === 'scanning' && !hasCamera && (
                    <span className="text-[9px] uppercase tracking-wider text-amber-500/80 font-mono mt-1 block">
                      ⚡ GRAPHIC SECURE SCAN RUNNING
                    </span>
                  )}
                </div>

                {/* Custom feedback mock settings bar inside biometric panel */}
                <div className="flex space-x-2 pt-2 text-[10px] items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === 'fingerprint' ? 'faceid' : 'fingerprint');
                      resetAuth();
                    }}
                    className="p-1 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-full text-slate-300 font-bold tracking-wide uppercase transition cursor-pointer"
                  >
                    Use {authMode === 'fingerprint' ? 'FaceID Mode' : 'TouchID Mode'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextFail = !forceFail;
                      setForceFail(nextFail);
                      resetAuth();
                    }}
                    className={`p-1 px-3 border rounded-full font-bold tracking-wide uppercase transition cursor-pointer ${
                      forceFail 
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-400' 
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700/60 text-slate-400'
                    }`}
                  >
                    {forceFail ? 'Fail On Direct (Scan Fail Demo)' : 'Simulate Fail'}
                  </button>
                </div>
              </motion.div>
            ) : (
              // PIN CODE FALLBACK FRAME VIEW
              <motion.div 
                key="pin-code"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full flex flex-col items-center"
              >
                <div className="text-center mb-4">
                  <p className="text-xs font-bold text-gray-300">Enter secure 4-digit PIN</p>
                  <p className="text-[9px] font-semibold text-gray-500 uppercase font-mono mt-1">Default Demo PIN: 1234</p>
                </div>

                {/* Secret PIN bullet cells display */}
                <div className="flex space-x-3 mb-6">
                  {[0, 1, 2, 3].map((idx) => {
                    const entered = pin.length > idx;
                    return (
                      <div 
                        key={idx} 
                        className={`w-4 h-4 rounded-full border transition-all duration-150 ${
                          entered 
                            ? 'bg-amber-500 border-amber-400 scale-110 shadow-md shadow-amber-500/20' 
                            : 'bg-slate-800 border-slate-700'
                        }`} 
                      />
                    );
                  })}
                </div>

                {/* Custom virtual numeric keypad */}
                <div className="grid grid-cols-3 gap-3 max-w-[200px] mb-4">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => addPinNumber(num)}
                      className="w-12 h-12 bg-slate-800 hover:bg-slate-750 active:bg-slate-700 border border-slate-755 text-white font-mono font-bold rounded-full text-sm transition flex items-center justify-center cursor-pointer"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handlePinClear}
                    className="w-12 h-12 bg-slate-850 hover:bg-slate-850 text-[10px] text-zinc-400 uppercase font-black rounded-full transition flex items-center justify-center cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => addPinNumber('0')}
                    className="w-12 h-12 bg-slate-800 hover:bg-slate-750 border border-slate-755 text-white font-mono font-bold rounded-full text-sm transition flex items-center justify-center cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (pin.length < 4) {
                        setPinError('Input complete 4-digit PIN first.');
                        return;
                      }
                      handlePinSubmit();
                    }}
                    className="w-12 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase rounded-full tracking-wide transition flex items-center justify-center cursor-pointer"
                  >
                    Enter
                  </button>
                </div>

                {pinError && (
                  <div className="flex items-center space-x-1 text-rose-450 border border-rose-500/20 bg-rose-500/5 py-1 px-3 rounded-lg text-[10.5px] font-bold text-center">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{pinError}</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Toggle between biometric check and pin fallback */}
        <div className="pt-2 border-t border-slate-850 w-full flex justify-center">
          <button
            type="button"
            onClick={() => {
              setUsePin(!usePin);
              setPin('');
              setPinError(null);
            }}
            className="flex items-center space-x-1 text-[10.5px] text-amber-500 hover:text-amber-450 font-bold transition hover:underline cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Use {usePin ? 'Biometrics scanner' : 'Secret Security PIN Fallback'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
