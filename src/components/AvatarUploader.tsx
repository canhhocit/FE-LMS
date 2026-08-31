import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

interface AvatarUploaderProps {
  currentAvatar?: string | null;
  onUpload: (file: File) => Promise<void> | void;
  label?: string;
}

export function AvatarUploader({ currentAvatar, onUpload, label = 'Đổi ảnh' }: AvatarUploaderProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(currentAvatar ?? null);
  const [crop, setCrop] = useState({ x: 0.15, y: 0.15, w: 0.7, h: 0.7 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isDropActive, setIsDropActive] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setImageSrc(currentAvatar ?? null);
  }, [currentAvatar]);

  const handleFile = (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(String(reader.result));
      setCrop({ x: 0.15, y: 0.15, w: 0.7, h: 0.7 });
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0] ?? null);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDropActive(false);
    handleFile(event.dataTransfer.files?.[0] ?? null);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!previewRef.current || !imageSrc) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    setDragStart({ x, y });
    setDragging(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !previewRef.current || !dragStart) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);

    const x1 = Math.min(dragStart.x, x);
    const y1 = Math.min(dragStart.y, y);
    const size = Math.min(Math.abs(x - dragStart.x), Math.abs(y - dragStart.y));

    const nextX = clamp(x1, 0, 1 - size);
    const nextY = clamp(y1, 0, 1 - size);
    const nextSize = clamp(size, 0.15, 1);

    setCrop({
      x: nextX,
      y: nextY,
      w: nextSize,
      h: nextSize,
    });
  };

  const stopDragging = () => {
    setDragging(false);
    setDragStart(null);
  };

  const applyCrop = async () => {
    if (!imageSrc) return;

    const image = new Image();
    image.onload = async () => {
      const canvas = document.createElement('canvas');
      const size = 512;
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const sx = crop.x * image.naturalWidth;
      const sy = crop.y * image.naturalHeight;
      const sw = crop.w * image.naturalWidth;
      const sh = crop.h * image.naturalHeight;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, size, size);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'avatar.png', { type: 'image/png' });
        await onUpload(file);
      }, 'image/png', 0.92);
    };

    image.src = imageSrc;
  };

  const selectionStyle = {
    left: `${crop.x * 100}%`,
    top: `${crop.y * 100}%`,
    width: `${crop.w * 100}%`,
    height: `${crop.h * 100}%`,
  };

  return (
    <div className="space-y-3">
      <div
        ref={previewRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDragging}
        onPointerLeave={stopDragging}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDropActive(true);
        }}
        onDragLeave={() => setIsDropActive(false)}
        onDrop={handleDrop}
        className={`relative mx-auto h-64 w-64 cursor-crosshair overflow-hidden rounded-full border-2 border-dashed transition ${isDropActive ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 bg-slate-50'}`}
      >
        {imageSrc ? (
          <img src={imageSrc} alt="avatar preview" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">Chưa có ảnh</div>
        )}

        <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/70" />

        <div
          className="pointer-events-none absolute rounded-full border-2 border-indigo-500 bg-indigo-500/10 shadow-[0_0_0_9999px_rgba(15,23,42,0.25)]"
          style={selectionStyle}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Chọn ảnh
        </button>
        <button
          type="button"
          onClick={() => void applyCrop()}
          disabled={!imageSrc}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {label}
        </button>
      </div>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleInputChange} className="hidden" />
      <div className="text-center text-xs text-slate-500">Kéo để chọn vùng cắt vuông, sau đó nhấn “{label}”.</div>
    </div>
  );
}
