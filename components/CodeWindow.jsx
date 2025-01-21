// components/CodeWindow.js
'use client';

export default function CodeWindow({ code }) {
  return (
    <div className="h-full w-full bg-gray-50 overflow-y-auto">
      <pre className="p-4 text-sm text-black font-mono whitespace-pre">
        {code}
      </pre>
    </div>
  );
}
