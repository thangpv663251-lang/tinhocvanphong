import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Camera, ShieldAlert } from 'lucide-react';

interface CameraMonitorProps {
  onViolation: (count: number) => void;
  isMonitoring: boolean;
}

declare global {
  interface Window {
    faceapi: any;
  }
}

export default function CameraMonitor({ onViolation, isMonitoring }: CameraMonitorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [faceError, setFaceError] = useState<string | null>(null);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  useEffect(() => {
    if (!isMonitoring) return;

    const loadModels = async () => {
      try {
        await window.faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading face-api models:', error);
      }
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };

    loadModels();
    startCamera();

    const interval = setInterval(async () => {
      if (videoRef.current && window.faceapi && isLoaded) {
        const detections = await window.faceapi.detectAllFaces(
          videoRef.current,
          new window.faceapi.TinyFaceDetectorOptions()
        );

        let currentError: string | null = null;
        if (detections.length === 0) {
          currentError = 'KHÔNG PHÁT HIỆN KHUÔN MẶT';
        } else if (detections.length > 1) {
          currentError = 'PHÁT HIỆN NHIỀU KHUÔN MẶT';
        }

        if (currentError) {
          setFaceError(currentError);
          setConsecutiveFailures(prev => {
            const next = prev + 1;
            if (next >= 3) { // Grace period: 3 consecutive failures (approx 6 seconds)
              setViolationCount(v => {
                const newV = v + 1;
                // Important: Only trigger violation if we haven't reached the limit yet
                if (newV <= 3) {
                  onViolation(newV);
                }
                return newV;
              });
              return 0; // Reset after violation
            }
            return next;
          });
        } else {
          setFaceError(null);
          setConsecutiveFailures(0);
        }
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [isMonitoring, isLoaded, onViolation]);

  if (!isMonitoring) return null;

  return (
    <div className="fixed bottom-6 right-6 w-72 bg-white rounded-3xl shadow-2xl border-2 border-slate-200 overflow-hidden z-50">
      <div className="relative aspect-video bg-slate-900">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          className="w-full h-full object-cover scale-x-[-1]"
        />
        {faceError && (
          <div className="absolute inset-0 bg-red-600/60 flex flex-col items-center justify-center backdrop-blur-md p-4 text-center">
            <ShieldAlert className="w-12 h-12 text-white animate-bounce mb-2" />
            <span className="text-xs font-black text-white uppercase leading-tight drop-shadow-lg">{faceError}</span>
            <div className="mt-2 flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i < consecutiveFailures ? 'bg-white' : 'bg-white/30'}`} />
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${!faceError ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-ping'}`} />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">AI Monitoring</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-black">
            <AlertTriangle className="w-3 h-3" />
            VI PHẠM: {violationCount}/3
          </div>
        </div>
        
        {violationCount > 0 && (
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 transition-all duration-500" 
              style={{ width: `${(violationCount / 3) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
