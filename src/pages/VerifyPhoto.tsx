// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

type Pose = 'center' | 'left' | 'right';
type Step = 'intro' | Pose | 'verifying' | 'success' | 'failed';

interface VerificationResult {
  verified: boolean;
  confidence: number;
  reason: string;
}

function useCamera(active: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!active) {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        setStream(null);
      }
      return;
    }

    let cancelled = false;
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 640, height: 640 }
    }).then(s => {
      if (cancelled) { s.getTracks().forEach(t => t.stop()); return; }
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    }).catch(() => toast.error("Camera access denied. Please enable camera permissions."));

    return () => {
      cancelled = true;
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [active]);

  return { videoRef, stream };
}

async function uploadCapture(videoEl: HTMLVideoElement): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  canvas.getContext('2d')!.drawImage(videoEl, 0, 0);

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.85)
  );

  const fileName = `verification/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
  const { error } = await supabase.storage.from('photos').upload(fileName, blob);
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName);
  return publicUrl;
}

export default function VerifyPhoto() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('intro');
  const [captures, setCaptures] = useState<Record<Pose, string | null>>({ center: null, left: null, right: null });
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [capturing, setCapturing] = useState(false);

  const cameraActive = ['center', 'left', 'right'].includes(step);
  const { videoRef } = useCamera(cameraActive);

  const captureAndAdvance = useCallback(async (pose: Pose) => {
    if (!videoRef.current || capturing) return;
    setCapturing(true);
    try {
      const url = await uploadCapture(videoRef.current);
      setCaptures(prev => ({ ...prev, [pose]: url }));

      if (pose === 'center') setStep('left');
      else if (pose === 'left') setStep('right');
      else if (pose === 'right') {
        // All captured — verify
        setStep('verifying');
        setCaptures(prev => {
          // Use latest captures including current
          const finalCaptures = { ...prev, [pose]: url };
          runVerification(finalCaptures);
          return finalCaptures;
        });
      }
    } catch {
      toast.error('Failed to capture photo. Please try again.');
    } finally {
      setCapturing(false);
    }
  }, [capturing]);

  const runVerification = async (caps: Record<Pose, string | null>) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-photo', {
        body: {
          centerUrl: caps.center,
          leftUrl: caps.left,
          rightUrl: caps.right,
        },
      });

      if (error) throw error;

      setResult({
        verified: data.verified,
        confidence: data.confidence || 0,
        reason: data.reason || '',
      });
      setStep(data.verified ? 'success' : 'failed');
    } catch (err: any) {
      console.error('Verification error:', err);
      setResult({ verified: false, confidence: 0, reason: err.message || 'Verification request failed' });
      setStep('failed');
    }
  };

  const reset = () => {
    setCaptures({ center: null, left: null, right: null });
    setResult(null);
    setStep('intro');
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary flex items-center justify-center shadow-xl">
            <CheckCircle size={48} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Identity Verified! ✓</h2>
          <p className="text-muted-foreground mb-2">Your video verification was successful.</p>
          <p className="text-sm text-muted-foreground mb-8">Confidence: {result?.confidence}%</p>
          <Button onClick={() => navigate('/home')} className="w-full">Continue to Afrinnect</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 text-center">
          <h1 className="text-lg font-bold text-foreground">Video Verification</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {step === 'intro' && (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Camera size={40} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Let's verify it's really you</h2>
              <p className="text-muted-foreground mb-6">
                We'll ask you to perform 3 simple head movements to confirm you're a real person.
              </p>
              <div className="space-y-4 mb-8 text-left max-w-xs mx-auto">
                {['Center your face', 'Turn head Left', 'Turn head Right'].map((text, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-foreground">{i + 1}</div>
                    <p className="text-foreground">{text}</p>
                  </div>
                ))}
              </div>
              <Button onClick={() => setStep('center')} className="w-full py-6 text-lg">Start Verification</Button>
            </CardContent>
          </Card>
        )}

        {cameraActive && (
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-center text-foreground">
              {step === 'center' && "Look Straight Ahead"}
              {step === 'left' && "Turn Head Left ←"}
              {step === 'right' && "Turn Head Right →"}
            </h2>
            <div className="relative w-64 h-80 bg-black rounded-3xl overflow-hidden shadow-xl mb-8 border-4 border-primary">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
              <div className="absolute inset-0 border-2 border-white/50 rounded-full m-8 pointer-events-none" />
            </div>
            <Button onClick={() => captureAndAdvance(step as Pose)} disabled={capturing} className="w-full max-w-xs py-6 text-lg">
              {capturing ? <Loader2 className="mr-2 animate-spin" /> : <Camera className="mr-2" />}
              {capturing ? 'Uploading...' : 'Capture & Continue'}
            </Button>
          </div>
        )}

        {step === 'verifying' && (
          <div className="text-center py-12">
            <Loader2 size={64} className="text-primary animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-bold mb-2 text-foreground">Verifying Identity...</h2>
            <p className="text-muted-foreground">Analyzing your photos. This may take a few seconds.</p>
          </div>
        )}

        {step === 'failed' && (
          <div className="space-y-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong className="text-lg block mb-2">Verification Failed</strong>
                <p>{result?.reason || "We couldn't verify your identity. Please try again with good lighting."}</p>
              </AlertDescription>
            </Alert>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 text-foreground">Captured Photos</h3>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {(['center', 'left', 'right'] as Pose[]).map(pose => (
                    <div key={pose}>
                      {captures[pose] ? (
                        <img src={captures[pose]!} alt={pose} className="w-full aspect-square object-cover rounded-lg" />
                      ) : (
                        <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
                          <Camera size={20} className="text-muted-foreground" />
                        </div>
                      )}
                      <p className="text-xs text-center mt-1 capitalize text-muted-foreground">{pose}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button onClick={reset} className="w-full"><Camera className="mr-2" size={18} />Retake Photos</Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/editprofile')}>
                Update Profile Photo First
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
