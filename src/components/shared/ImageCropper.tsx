// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Crop, ZoomIn, ZoomOut, RotateCw, AlertTriangle } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface ImageCropperProps {
  imageFile: File;
  onCrop: (file: File) => void;
  onCancel: () => void;
  qualitySuggestions?: string[];
}

export default function ImageCropper({ imageFile, onCrop, onCancel, qualitySuggestions = [] }: ImageCropperProps) {
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const TARGET_WIDTH = 1080;
  const TARGET_HEIGHT = 1350; // 4:5 ratio

  const loadImage = useCallback(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      // Center the image initially
      setPanOffset({ x: 0, y: 0 });
      drawCanvas(1, { x: 0, y: 0 });
    };
    img.src = URL.createObjectURL(imageFile);
    return () => URL.revokeObjectURL(img.src);
  }, [imageFile]);

  useEffect(() => {
    const cleanup = loadImage();
    return cleanup;
  }, [loadImage]);

  const drawCanvas = useCallback((currentZoom = zoom, offset = panOffset) => {
    if (!canvasRef.current || !imageRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = imageRef.current;

    canvas.width = TARGET_WIDTH;
    canvas.height = TARGET_HEIGHT;

    const scale = Math.max(TARGET_WIDTH / img.width, TARGET_HEIGHT / img.height) * currentZoom;
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const x = (TARGET_WIDTH - scaledWidth) / 2 + offset.x;
    const y = (TARGET_HEIGHT - scaledHeight) / 2 + offset.y;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

    // Subtle safe-zone guide (top third for face visibility)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(0, TARGET_HEIGHT * 0.4);
    ctx.lineTo(TARGET_WIDTH, TARGET_HEIGHT * 0.4);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [zoom, panOffset]);

  useEffect(() => {
    drawCanvas();
  }, [zoom, panOffset, drawCanvas]);

  // Touch/mouse drag for panning
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleCrop = async () => {
    setLoading(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas unavailable');
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.9)
      );
      if (!blob) throw new Error('Crop failed');
      const file = new File([blob], imageFile.name.replace(/\.[^.]+$/, '.jpg'), {
        type: 'image/jpeg',
      });
      onCrop(file);
    } catch (error) {
      console.error('Crop failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/95 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 bg-primary text-primary-foreground">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Crop size={20} /> Adjust Your Photo
          </h3>
          <p className="text-sm opacity-80 mt-1">
            Drag to position • Pinch or slide to zoom
          </p>
        </div>

        {qualitySuggestions.length > 0 && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-accent/10 border border-accent/20 flex items-start gap-2">
            <AlertTriangle size={16} className="text-accent mt-0.5 shrink-0" />
            <div className="text-xs text-accent">
              {qualitySuggestions.map((s, i) => (
                <p key={i}>{s}</p>
              ))}
              <p className="mt-1 opacity-70">You can still use this photo</p>
            </div>
          </div>
        )}

        <div className="p-4 space-y-4">
          <div
            ref={containerRef}
            className="relative bg-foreground rounded-xl overflow-hidden cursor-grab active:cursor-grabbing touch-none"
            style={{ aspectRatio: '4/5' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{ aspectRatio: '4/5' }}
            />
          </div>

          <div className="flex items-center gap-3">
            <ZoomOut size={18} className="text-muted-foreground" />
            <Slider
              value={[zoom]}
              onValueChange={(val) => setZoom(val[0])}
              min={0.5}
              max={3}
              step={0.05}
              className="flex-1"
            />
            <ZoomIn size={18} className="text-muted-foreground" />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCrop}
              disabled={loading}
              className="flex-1 rounded-xl bg-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} /> Processing...
                </>
              ) : (
                <>
                  <Crop size={18} className="mr-2" /> Use Photo
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
