import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, X, CheckCircle2, Trash2, Plus, AlertCircle, FileText } from 'lucide-react';

export default function CameraScannerModal({ isOpen, onClose, onPagesCaptured }) {
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [capturedPages, setCapturedPages] = useState([]);
  const [cameraError, setCameraError] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileFallbackRef = useRef(null);

  // Check if multiple camera devices exist
  useEffect(() => {
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        if (videoInputs.length > 1) {
          setHasMultipleCameras(true);
        }
      }).catch(() => {});
    }
  }, []);

  // Start or restart camera stream
  const startCamera = useCallback(async (mode) => {
    try {
      setCameraError('');
      // Stop any existing tracks
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this browser or requires HTTPS.');
      }

      const constraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(e => console.warn('Video play error:', e));
      }
    } catch (err) {
      console.error('Camera error:', err);
      let msg = 'Could not access camera. Please verify camera permissions in your browser.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera found on this device.';
      }
      setCameraError(msg);
    }
  }, [stream]);

  // Lifecycle: open camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      // Cleanup tracks on modal close
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      setCapturedPages([]);
      setCameraError('');
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  // Switch between Front and Back camera
  const toggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture current video frame
  const captureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    setIsCapturing(true);
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // If front camera, un-mirror captured photo
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      setIsCapturing(false);
      if (!blob) return;

      const pageNumber = capturedPages.length + 1;
      const file = new File([blob], `scanned_page_${pageNumber}.jpg`, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);

      setCapturedPages(prev => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          pageNumber,
          file,
          previewUrl
        }
      ]);
    }, 'image/jpeg', 0.95);
  };

  // Remove a captured page
  const deletePage = (id) => {
    setCapturedPages(prev => {
      const filtered = prev.filter(p => p.id !== id);
      return filtered.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    });
  };

  // Finish and send captured files to workspace
  const handleFinish = () => {
    if (capturedPages.length === 0) return;
    const files = capturedPages.map(p => p.file);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    onPagesCaptured(files);
    onClose();
  };

  // Fallback native photo capture
  const handleNativeFiles = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      onPagesCaptured(newFiles);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.88)',
      backdropFilter: 'blur(6px)',
      zIndex: 100000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: '#0f172a',
        color: '#ffffff',
        width: '100%',
        maxWidth: '720px',
        maxHeight: '92vh',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Top Header */}
        <div style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: '#1e293b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              backgroundColor: 'rgba(229, 36, 36, 0.2)',
              color: 'var(--primary-red)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Camera size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#ffffff' }}>
                Camera Document Scanner
              </h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                {facingMode === 'environment' ? '📷 Back Camera (Document)' : '🤳 Front Camera (Selfie)'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Toggle Camera (Front/Back) */}
            <button
              type="button"
              onClick={toggleCamera}
              title="Switch Camera (Front / Back)"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <RefreshCw size={15} />
              <span>Flip {facingMode === 'environment' ? 'Front' : 'Back'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                color: '#94a3b8',
                border: 'none',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Viewfinder / Camera Feed */}
        <div style={{
          position: 'relative',
          backgroundColor: '#000000',
          width: '100%',
          height: 'clamp(280px, 45vh, 420px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {cameraError ? (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              maxWidth: '420px'
            }}>
              <AlertCircle size={44} style={{ color: '#ef4444' }} />
              <h4 style={{ margin: 0, fontSize: '17px', color: '#ffffff' }}>Camera Unavailable</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
                {cameraError}
              </p>
              <button
                type="button"
                onClick={() => fileFallbackRef.current?.click()}
                style={{
                  marginTop: '10px',
                  backgroundColor: 'var(--primary-red)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Choose Photo from Device
              </button>
              <input
                ref={fileFallbackRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                style={{ display: 'none' }}
                onChange={handleNativeFiles}
              />
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
                }}
              />

              {/* Shutter flash animation overlay */}
              {flashActive && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: '#ffffff',
                  opacity: 0.8,
                  zIndex: 20
                }} />
              )}

              {/* Document Alignment Frame Guides */}
              <div style={{
                position: 'absolute',
                top: '8%',
                left: '8%',
                right: '8%',
                bottom: '8%',
                border: '2px dashed rgba(255, 255, 255, 0.45)',
                borderRadius: '12px',
                pointerEvents: 'none',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ width: '18px', height: '18px', borderTop: '3px solid var(--primary-red)', borderLeft: '3px solid var(--primary-red)' }} />
                  <span style={{ width: '18px', height: '18px', borderTop: '3px solid var(--primary-red)', borderRight: '3px solid var(--primary-red)' }} />
                </div>
                <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', fontWeight: '600' }}>
                  Position document inside the frame
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ width: '18px', height: '18px', borderBottom: '3px solid var(--primary-red)', borderLeft: '3px solid var(--primary-red)' }} />
                  <span style={{ width: '18px', height: '18px', borderBottom: '3px solid var(--primary-red)', borderRight: '3px solid var(--primary-red)' }} />
                </div>
              </div>
            </>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* Shutter / Capture Bar */}
        <div style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          backgroundColor: '#0f172a'
        }}>
          {/* Main Shutter Button */}
          <button
            type="button"
            onClick={captureFrame}
            disabled={isCapturing || !!cameraError}
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-red)',
              border: '4px solid #ffffff',
              boxShadow: '0 0 20px rgba(229, 36, 36, 0.6)',
              cursor: cameraError ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              transition: 'transform 0.1s',
              opacity: cameraError ? 0.4 : 1
            }}
            title="Capture Page"
          >
            <Camera size={28} />
          </button>
        </div>

        {/* Scanned Pages Carousel / Preview Tray */}
        <div style={{
          padding: '14px 20px',
          backgroundColor: '#1e293b',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#e2e8f0' }}>
              Scanned Pages ({capturedPages.length})
            </span>
            {capturedPages.length > 0 && (
              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>
                ✓ {capturedPages.length} page{capturedPages.length > 1 ? 's' : ''} ready
              </span>
            )}
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '6px',
            minHeight: '75px',
            alignItems: 'center'
          }}>
            {capturedPages.length === 0 ? (
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>
                No pages captured yet. Tap the red camera shutter button above to scan page 1.
              </p>
            ) : (
              capturedPages.map((page) => (
                <div
                  key={page.id}
                  style={{
                    position: 'relative',
                    width: '64px',
                    height: '84px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    flexShrink: 0,
                    backgroundColor: '#000'
                  }}
                >
                  <img
                    src={page.previewUrl}
                    alt={`Page ${page.pageNumber}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0, left: 0, right: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: '800',
                    textAlign: 'center',
                    padding: '2px 0'
                  }}>
                    P{page.pageNumber}
                  </div>
                  <button
                    type="button"
                    onClick={() => deletePage(page.id)}
                    title="Delete this page"
                    style={{
                      position: 'absolute',
                      top: '3px', right: '3px',
                      width: '20px', height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(239, 68, 68, 0.9)',
                      color: '#ffffff',
                      border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0f172a',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              color: '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleFinish}
            disabled={capturedPages.length === 0}
            style={{
              backgroundColor: capturedPages.length > 0 ? 'var(--primary-red)' : '#334155',
              color: '#ffffff',
              border: 'none',
              padding: '10px 22px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: capturedPages.length > 0 ? 'pointer' : 'not-allowed',
              boxShadow: capturedPages.length > 0 ? '0 4px 14px rgba(229, 36, 36, 0.4)' : 'none'
            }}
          >
            <CheckCircle2 size={16} />
            Finish & Convert to PDF ({capturedPages.length})
          </button>
        </div>
      </div>
    </div>
  );
}
