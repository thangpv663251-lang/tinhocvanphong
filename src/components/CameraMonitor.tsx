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
  const [isFaceDetected, setIsFaceDetected] = useState(true);

  useEffect(() => {
    if (!isMonitoring) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsLoaded(true);
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };

    startCamera();

    const interval = setInterval(async () => {
      if (videoRef.current && window.faceapi && isLoaded) {
        const detections = await window.faceapi.detectAllFaces(
          videoRef.current,
          new window.faceapi.TinyFaceDetectorOptions()
        );

        if (detections.length === 0) {
          setIsFaceDetected(false);
          const newCount = violationCount + 1;
          setViolationCount(newCount);
          onViolation(newCount);
        } else {
          setIsFaceDetected(true);
        }
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [isMonitoring, isLoaded, violationCount]);

  if (!isMonitoring) return null;

  return (
    <div className="fixed bottom-6 right-6 w-64 bg-white rounded-2xl shadow-2xl border-2 border-slate-200 overflow-hidden z-50">
      <div className="relative aspect-video bg-slate-900">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          className="w-full h-full object-cover scale-x-[-1]"
        />
        {!isFaceDetected && (
          <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center backdrop-blur-sm">
            <ShieldAlert className="w-12 h-12 text-white animate-pulse" />
          </div>
        )}
      </div>
      
      <div className="p-3 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isFaceDetected ? 'bg-emerald-500' : 'bg-red-500 animate-ping'}`} />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Monitoring</span>
        </div>
        {violationCount > 0 && (
          <div className="flex items-center gap-1 text-red-600 font-bold text-xs">
            <AlertTriangle className="w-3 h-3" />
            <span>{violationCount}</span>
          </div>
        )}
      </div>
    </div>
  );
}
