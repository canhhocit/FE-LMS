import React, { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';

interface AvatarUploaderProps {
  currentAvatar?: string | null;
  onUpload: (file: File) => Promise<void> | void;
  label?: string;
}

const RotateIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6" />
    <path d="M21.34 15.57a10 10 0 11-.57-8.38l5.67-5.67" />
  </svg>
);

const ZoomInIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const ZoomOutIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const CenterIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const UploadIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const VIEWPORT_SIZE = 280;

export function AvatarUploader({ currentAvatar, onUpload, label = 'Lưu ảnh' }: AvatarUploaderProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDropActive, setIsDropActive] = useState(false);

  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const inputRef = useRef<HTMLInputElement | null>(null);

  const loadFile = (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result);
      const img = new Image();
      img.onload = () => {
        setImageObj(img);
        setImageSrc(src);
        setZoom(1.0);
        setPan({ x: 0, y: 0 });
        setRotation(0);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    loadFile(event.target.files?.[0] ?? null);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDropActive(false);
    loadFile(event.dataTransfer.files?.[0] ?? null);
  };

  const getClampedPan = (newPan: { x: number; y: number }, currentZoom: number, currentRot: number) => {
    if (!imageObj) return newPan;

    const isSwapped = currentRot === 90 || currentRot === 270;
    const nw = isSwapped ? imageObj.naturalHeight : imageObj.naturalWidth;
    const nh = isSwapped ? imageObj.naturalWidth : imageObj.naturalHeight;

    const baseScale = Math.max(VIEWPORT_SIZE / nw, VIEWPORT_SIZE / nh);
    const scale = baseScale * currentZoom;

    const dw = nw * scale;
    const dh = nh * scale;

    const maxPanX = Math.max(0, (dw - VIEWPORT_SIZE) / 2);
    const maxPanY = Math.max(0, (dh - VIEWPORT_SIZE) / 2);

    return {
      x: Math.min(Math.max(newPan.x, -maxPanX), maxPanX),
      y: Math.min(Math.max(newPan.y, -maxPanY), maxPanY),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!imageSrc) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPanStart({ ...pan });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    const rawPan = {
      x: panStart.x + deltaX,
      y: panStart.y + deltaY,
    };
    setPan(getClampedPan(rawPan, zoom, rotation));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!imageSrc) return;
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
    const newZoom = Math.min(Math.max(1.0, zoom + zoomDelta), 3.5);
    setZoom(newZoom);
    setPan((prevPan) => getClampedPan(prevPan, newZoom, rotation));
  };

  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);
    setPan((prevPan) => getClampedPan(prevPan, zoom, nextRot));
  };

  const handleReset = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  const applyCropAndSave = async () => {
    if (!imageObj || !imageSrc) return;
    setIsSaving(true);

    try {
      const canvas = document.createElement('canvas');
      const OUTPUT_SIZE = 512;
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const ratio = OUTPUT_SIZE / VIEWPORT_SIZE;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      ctx.save();
      ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      const isSwapped = rotation === 90 || rotation === 270;
      const nw = imageObj.naturalWidth;
      const nh = imageObj.naturalHeight;

      const effNw = isSwapped ? nh : nw;
      const effNh = isSwapped ? nw : nh;

      const baseScale = Math.max(VIEWPORT_SIZE / effNw, VIEWPORT_SIZE / effNh);
      const scale = baseScale * zoom;

      const dw = nw * scale * ratio;
      const dh = nh * scale * ratio;

      let canvasPanX = pan.x * ratio;
      let canvasPanY = pan.y * ratio;

      if (rotation === 90) {
        canvasPanX = pan.y * ratio;
        canvasPanY = -pan.x * ratio;
      } else if (rotation === 180) {
        canvasPanX = -pan.x * ratio;
        canvasPanY = -pan.y * ratio;
      } else if (rotation === 270) {
        canvasPanX = -pan.y * ratio;
        canvasPanY = pan.x * ratio;
      }

      ctx.drawImage(imageObj, -dw / 2 + canvasPanX, -dh / 2 + canvasPanY, dw, dh);
      ctx.restore();

      canvas.toBlob(
        async (blob) => {
          if (!blob) return;
          const file = new File([blob], 'avatar.png', { type: 'image/png' });
          await onUpload(file);
          setIsSaving(false);
          setImageSrc(null);
        },
        'image/png',
        0.95
      );
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  let imgStyle: React.CSSProperties = {};
  if (imageObj) {
    const isSwapped = rotation === 90 || rotation === 270;
    const nw = isSwapped ? imageObj.naturalHeight : imageObj.naturalWidth;
    const nh = isSwapped ? imageObj.naturalWidth : imageObj.naturalHeight;

    const baseScale = Math.max(VIEWPORT_SIZE / nw, VIEWPORT_SIZE / nh);
    const scale = baseScale * zoom;

    const dw = imageObj.naturalWidth * scale;
    const dh = imageObj.naturalHeight * scale;

    imgStyle = {
      width: dw + 'px',
      height: dh + 'px',
      transform: 'translate(' + pan.x + 'px, ' + pan.y + 'px) rotate(' + rotation + 'deg)',
      transformOrigin: 'center center',
      transition: isDragging ? 'none' : 'transform 0.1s ease-out',
    };
  }

  return (
    <div className="space-y-4">
      <input ref={inputRef} type="file" accept="image/*" onChange={handleInputChange} className="hidden" />

      {!imageSrc ? (
        <div className="flex flex-col items-center justify-center gap-3">
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDropActive(true);
            }}
            onDragLeave={() => setIsDropActive(false)}
            onDrop={handleDrop}
            className={'group relative h-44 w-44 cursor-pointer overflow-hidden rounded-full border-4 border-white shadow-md transition hover:shadow-lg ' + (isDropActive ? 'ring-4 ring-indigo-400 bg-indigo-50' : 'bg-slate-100')}
          >
            {currentAvatar ? (
              <img src={currentAvatar} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-[#00376f] text-white">
                <UploadIcon className="h-10 w-10 opacity-80" />
                <span className="mt-1 text-xs font-semibold">Tải ảnh lên</span>
              </div>
            )}

            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 text-white opacity-0 transition group-hover:opacity-100">
              <UploadIcon className="h-8 w-8 mb-1" />
              <span className="text-xs font-bold">Tải ảnh mới</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95"
          >
            <UploadIcon className="h-4 w-4 text-[#00376f]" />
            <span>Chọn ảnh từ máy tính</span>
          </button>
          <p className="text-[11px] text-slate-400">Hỗ trợ JPG, PNG, WEBP. Tối đa 5MB.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-xs max-w-sm mx-auto">
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
            className="relative h-[280px] w-[280px] cursor-grab overflow-hidden rounded-full border-4 border-[#00376f] shadow-md active:cursor-grabbing bg-slate-900 flex items-center justify-center touch-none select-none"
            title="Kéo để di chuyển ảnh, cuộn chuột để phóng to/thu nhỏ"
          >
            <img
              src={imageSrc}
              alt="Cropping target"
              style={imgStyle}
              className="pointer-events-none max-w-none select-none"
            />

            <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-white/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.3)]" />
          </div>

          <div className="w-full space-y-3 px-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const newZ = Math.max(1.0, zoom - 0.2);
                  setZoom(newZ);
                  setPan((p) => getClampedPan(p, newZ, rotation));
                }}
                className="p-1.5 rounded text-slate-600 hover:bg-slate-200 transition"
                title="Thu nhỏ"
              >
                <ZoomOutIcon />
              </button>

              <input
                type="range"
                min="1.0"
                max="3.5"
                step="0.05"
                value={zoom}
                onChange={(e) => {
                  const newZ = parseFloat(e.target.value);
                  setZoom(newZ);
                  setPan((p) => getClampedPan(p, newZ, rotation));
                }}
                className="h-2 flex-1 cursor-pointer accent-[#00376f] rounded-lg bg-slate-200"
              />

              <button
                type="button"
                onClick={() => {
                  const newZ = Math.min(3.5, zoom + 0.2);
                  setZoom(newZ);
                  setPan((p) => getClampedPan(p, newZ, rotation));
                }}
                className="p-1.5 rounded text-slate-600 hover:bg-slate-200 transition"
                title="Phóng to"
              >
                <ZoomInIcon />
              </button>
            </div>

            <div className="flex items-center justify-center gap-3 text-xs font-semibold">
              <button
                type="button"
                onClick={handleRotate}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 shadow-2xs hover:bg-slate-100 transition"
              >
                <RotateIcon className="h-3.5 w-3.5 text-slate-500" />
                <span>Xoay 90°</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 shadow-2xs hover:bg-slate-100 transition"
              >
                <CenterIcon className="h-3.5 w-3.5 text-slate-500" />
                <span>Về giữa</span>
              </button>
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-500 font-medium px-2">
            💡 <b>Mẹo:</b> Kéo ảnh trực tiếp bằng chuột để di chuyển, cuộn chuột hoặc dùng thanh trượt để phóng to/thu nhỏ.
          </p>

          <div className="flex items-center gap-3 pt-2 w-full justify-center">
            <button
              type="button"
              onClick={() => setImageSrc(null)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-2xs hover:bg-slate-100 transition"
            >
              Chọn ảnh khác
            </button>
            <button
              type="button"
              onClick={() => void applyCropAndSave()}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-lg bg-[#00376f] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#002852] active:scale-95 disabled:opacity-50 transition"
            >
              {isSaving ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>{label}</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
