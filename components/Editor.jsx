// Editor.js
'use client';

import { useEditor } from '@/hooks/useEditor';

export default function Editor({ code, setCode, onRun, error }) {
  const { textareaRef, handleKeyDown } = useEditor(code, setCode, onRun);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-t bg-white">
        <button
          onClick={onRun}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
        >
          Run Code
        </button>
        {error && (
          <div className="mt-2 p-2 text-sm text-red-600 bg-red-50 rounded">
            {error}
          </div>
        )}
      </div>
      <textarea
        ref={textareaRef}
        value={code}
        onChange={e => setCode(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 w-full p-4 font-mono text-sm bg-gray-50 resize-none focus:outline-none text-black placeholder:text-gray-500"
        placeholder="Enter your code here..."
      />
    </div>
  );
}
