'use client';

import Canvas from '@/components/Canvas';
import Editor from '@/components/Editor';
import { runCode } from '@/lib/Coderunner';
import { useRef, useState } from 'react';

export default function Home() {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  const handleRunCode = () => {
    setError(null);

    runCode({
      code,
      canvas: canvasRef.current,
      onError: setError,
    });
  };

  return (
    <main className="flex h-screen w-full">
      <div className="w-2/5 border-r">
        <Editor
          code={code}
          setCode={setCode}
          onRun={handleRunCode}
          error={error}
        />
      </div>
      <div className="w-3/5">
        <Canvas canvasRef={canvasRef} />
      </div>
    </main>
  );
}
