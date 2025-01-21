//app/page.js

'use client';

import Canvas from '@/components/Canvas';
import CodeWindow from '@/components/CodeWindow';
import Editor from '@/components/Editor';
import { runCode } from '@/lib/Coderunner';
import { formatSVGCode } from '@/lib/codeWindowUtils';
import { useRef, useState } from 'react';

export default function Home() {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const [svgCode, setSvgCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const canvasRef = useRef(null);

  const handleRunCode = async () => {
    if (!canvasRef.current || !code || isRunning) return;
    setIsRunning(true);
    setError(null);

    try {
      await runCode({ code, canvas: canvasRef.current, onError: setError });
      setSvgCode(formatSVGCode(canvasRef.current));
    } catch (err) {
      setError(err);
    }
    setIsRunning(false);
  };

  const handleViewToggle = showCodeView => {
    setShowCode(showCodeView);
    setTimeout(handleRunCode, 0);
  };

  return (
    <main className="flex h-screen w-full">
      <div className="w-2/5 border-r">
        <Editor
          code={code}
          setCode={setCode}
          onRun={handleRunCode}
          error={error}
          onViewToggle={handleViewToggle}
          isRunning={isRunning}
          showCode={showCode}
        />
      </div>
      <div className="w-3/5">
        {showCode ? (
          <CodeWindow code={svgCode} />
        ) : (
          <Canvas canvasRef={canvasRef} />
        )}
      </div>
    </main>
  );
}
