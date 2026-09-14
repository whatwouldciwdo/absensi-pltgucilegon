import React, { useRef, useState, useEffect, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  onSignatureChange: (dataUrl: string | null) => void;
  width?: number;
  height?: number;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ 
  onSignatureChange, 
  width = 500, 
  height = 200 
}) => {
  const sigRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(width);

  // Responsive canvas width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        setCanvasWidth(Math.min(containerWidth - 4, width)); // -4 for border
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [width]);

  const handleEnd = useCallback(() => {
    setIsDrawing(false);
    if (sigRef.current && !sigRef.current.isEmpty()) {
      setIsEmpty(false);
      onSignatureChange(sigRef.current.toDataURL('image/png'));
    }
  }, [onSignatureChange]);

  const handleBegin = useCallback(() => {
    setIsDrawing(true);
    setIsEmpty(false);
  }, []);

  const handleClear = useCallback(() => {
    if (sigRef.current) {
      sigRef.current.clear();
      setIsEmpty(true);
      onSignatureChange(null);
    }
  }, [onSignatureChange]);

  return (
    <div className="form-group">
      <label className="form-label">
        Tanda Tangan <span className="required">*</span>
      </label>
      <div 
        ref={containerRef}
        className={`signature-pad-wrapper ${isDrawing ? 'active' : ''}`}
      >
        <SignatureCanvas
          ref={sigRef}
          penColor="#e2e8f0"
          backgroundColor="transparent"
          canvasProps={{
            width: canvasWidth,
            height: height,
            style: { width: '100%', height: `${height}px` }
          }}
          onBegin={handleBegin}
          onEnd={handleEnd}
        />
        {isEmpty && (
          <div className="signature-pad-placeholder">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              <path d="m15 5 4 4"/>
            </svg>
            <span>Coret di sini untuk tanda tangan</span>
          </div>
        )}
      </div>
      <div className="signature-pad-actions">
        <button 
          type="button"
          className="btn btn-ghost btn-sm" 
          onClick={handleClear}
          disabled={isEmpty}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
          Hapus Tanda Tangan
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;
