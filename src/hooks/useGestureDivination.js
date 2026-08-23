/**
 * useGestureDivination.js — React Hook for gesture-based divination
 *
 * Wraps gestureDetector.js for React lifecycle management.
 * Handles camera stream, MediaPipe initialization, and throw detection.
 */
import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * @returns {{
 *   isGestureMode: boolean,
 *   isCameraReady: boolean,
 *   currentGesture: 'fist'|'palm'|'point'|'none',
 *   throwDetected: boolean,
 *   videoRef: React.RefObject<HTMLVideoElement>,
 *   startCamera: () => Promise<void>,
 *   stopCamera: () => void,
 *   cameraError: string|null,
 *   clearThrow: () => void,
 * }}
 */
export default function useGestureDivination() {
  const [isGestureMode, setIsGestureMode] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [currentGesture, setCurrentGesture] = useState('none');
  const [throwDetected, setThrowDetected] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cleanupRef = useRef(null);

  const clearThrow = useCallback(() => {
    setThrowDetected(false);
  }, []);

  const stopCamera = useCallback(() => {
    // Stop MediaPipe processing
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsGestureMode(false);
    setIsCameraReady(false);
    setCurrentGesture('none');
    setThrowDetected(false);
    setCameraError(null);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);

    // Request camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          const v = videoRef.current;
          if (!v) { reject(new Error('no video')); return; }
          v.onloadedmetadata = () => {
            v.play().then(resolve).catch(resolve); // play may be blocked but that's ok
          };
          v.onerror = reject;
        });
      }

      setIsCameraReady(true);
      setIsGestureMode(true);

      // Dynamic import to keep gestureDetector lazy
      const { initHandTracking } = await import('../utils/gestureDetector.js');

      const cleanup = await initHandTracking(
        videoRef.current,
        (gesture, _landmarks, isThrow) => {
          setCurrentGesture(gesture);
          if (isThrow) {
            setThrowDetected(true);
          }
        }
      );

      cleanupRef.current = cleanup;
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? '摄像头权限被拒绝，请在浏览器设置中允许'
        : err.name === 'NotFoundError'
          ? '未检测到摄像头'
          : `摄像头启动失败：${err.message}`;
      setCameraError(msg);
      setIsGestureMode(false);
      // Clean up partial state
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) cleanupRef.current();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return {
    isGestureMode,
    isCameraReady,
    currentGesture,
    throwDetected,
    videoRef,
    startCamera,
    stopCamera,
    cameraError,
    clearThrow,
  };
}
