// @/components/Canvas.js
'use client';

import { setupCanvas } from '@/lib/svg/utils';
import { useEffect } from 'react';

export default function Canvas({ canvasRef }) {
  useEffect(() => {
    if (canvasRef.current) {
      setupCanvas(canvasRef.current);
    }
  }, [canvasRef]);

  return (
    <div className="h-full w-full bg-gray-50 flex items-center justify-center">
      <svg
        ref={canvasRef}
        className="bg-white shadow-lg"
        width="800"
        height="600"
      />
    </div>
  );
}
