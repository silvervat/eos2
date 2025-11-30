'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, CameraOff, Volume2, VolumeX, Vibrate } from 'lucide-react';
import { useTransferBasket, TransferBasketItem } from '@/hooks/use-transfer-basket';
import { BasketPreview } from './BasketPreview';

interface FastScannerProps {
  basketId: string;
  onClose: () => void;
  onComplete: () => void;
}

export function FastScanner({ basketId, onClose, onComplete }: FastScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [flashColor, setFlashColor] = useState<'green' | 'red' | null>(null);
  const [scanFeedback, setScanFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { basket, items, addItem, isAddingItem, error, clearError } = useTransferBasket(basketId);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Play beep sound
  const playBeep = useCallback((frequency: number = 800, duration: number = 100) => {
    if (!soundEnabled || !audioContextRef.current) return;

    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration / 1000);

      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration / 1000);
    } catch (e) {
      console.debug('Audio playback failed:', e);
    }
  }, [soundEnabled]);

  // Vibrate device
  const vibrate = useCallback((pattern: number | number[]) => {
    if (!vibrationEnabled || !navigator.vibrate) return;
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      console.debug('Vibration failed:', e);
    }
  }, [vibrationEnabled]);

  // Flash screen
  const flashScreen = useCallback((color: 'green' | 'red') => {
    setFlashColor(color);
    setTimeout(() => setFlashColor(null), 150);
  }, []);

  // Handle successful scan
  const handleScan = useCallback(async (decodedText: string) => {
    // Prevent duplicate scans within 1 second
    const now = Date.now();
    if (decodedText === lastScannedCode && now - lastScanTime < 1000) {
      return;
    }

    setLastScannedCode(decodedText);
    setLastScanTime(now);

    try {
      const result = await addItem(decodedText);

      if (result) {
        // Success feedback
        playBeep(800, 100);
        vibrate(50);
        flashScreen('green');

        const action = result.action === 'incremented' ? 'Kogus suurendatud' : 'Lisatud';
        setScanFeedback({
          message: `${action}: ${result.item.assetName}`,
          type: 'success',
        });
      }
    } catch (err) {
      // Error feedback
      playBeep(200, 200);
      vibrate(200);
      flashScreen('red');

      setScanFeedback({
        message: err instanceof Error ? err.message : 'Tundmatu viga',
        type: 'error',
      });
    }

    // Clear feedback after 2 seconds
    setTimeout(() => setScanFeedback(null), 2000);
  }, [lastScannedCode, lastScanTime, addItem, playBeep, vibrate, flashScreen]);

  // Start scanner
  const startScanner = useCallback(async () => {
    if (scannerRef.current || !containerRef.current) return;

    try {
      setCameraError(null);
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 30,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScan(decodedText);
        },
        () => {
          // Ignore scan errors (continuous scanning)
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Scanner start error:', err);
      setCameraError(
        err instanceof Error
          ? err.message
          : 'Kaamera käivitamine ebaõnnestus. Kontrolli õigusi.'
      );
    }
  }, [handleScan]);

  // Stop scanner
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (e) {
        console.debug('Scanner stop error:', e);
      }
    }
    setIsScanning(false);
  }, []);

  // Auto-start scanner on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startScanner();
    }, 500);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    stopScanner();
    onClose();
  }, [stopScanner, onClose]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col" ref={containerRef}>
      {/* Flash overlay */}
      {flashColor && (
        <div
          className={`absolute inset-0 pointer-events-none z-50 transition-opacity duration-150 ${
            flashColor === 'green' ? 'bg-green-500' : 'bg-red-500'
          } opacity-30`}
        />
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 bg-black/70 text-white p-4 z-40">
        <div className="flex items-center justify-between">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 text-white hover:text-gray-300"
          >
            <X className="h-6 w-6" />
            <span>Sulge</span>
          </button>

          <div className="flex items-center gap-4">
            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-full ${soundEnabled ? 'bg-white/20' : 'bg-white/10'}`}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>

            {/* Vibration toggle */}
            <button
              onClick={() => setVibrationEnabled(!vibrationEnabled)}
              className={`p-2 rounded-full ${vibrationEnabled ? 'bg-white/20' : 'bg-white/10'}`}
            >
              <Vibrate className={`h-5 w-5 ${vibrationEnabled ? '' : 'opacity-50'}`} />
            </button>
          </div>

          <div className="text-sm">
            Korvis: <span className="font-bold">{items.length}</span> toodet
          </div>
        </div>
      </div>

      {/* Scanner area */}
      <div className="flex-1 relative">
        {/* QR Reader container */}
        <div id="qr-reader" className="w-full h-full" />

        {/* Camera error */}
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center p-6 max-w-sm">
              <CameraOff className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <p className="text-white text-lg mb-4">{cameraError}</p>
              <button
                onClick={startScanner}
                className="px-6 py-3 bg-[#279989] text-white rounded-lg font-medium"
              >
                Proovi uuesti
              </button>
            </div>
          </div>
        )}

        {/* Not scanning overlay */}
        {!isScanning && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <button
              onClick={startScanner}
              className="flex items-center gap-3 px-8 py-4 bg-[#279989] text-white rounded-xl font-medium text-lg"
            >
              <Camera className="h-6 w-6" />
              Alusta skannimist
            </button>
          </div>
        )}

        {/* Crosshair overlay */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 border-4 border-white/50 rounded-lg relative">
              {/* Corner markers */}
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-[#279989] rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-[#279989] rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-[#279989] rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-[#279989] rounded-br-lg" />
            </div>
          </div>
        )}

        {/* Scan feedback toast */}
        {scanFeedback && (
          <div
            className={`absolute top-20 left-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
              scanFeedback.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            <p className="font-medium text-center">{scanFeedback.message}</p>
          </div>
        )}

        {/* Loading indicator */}
        {isAddingItem && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white rounded-full p-3 shadow-lg z-50">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#279989]" />
          </div>
        )}
      </div>

      {/* Bottom basket preview */}
      <BasketPreview
        basketId={basketId}
        onComplete={onComplete}
      />
    </div>
  );
}
