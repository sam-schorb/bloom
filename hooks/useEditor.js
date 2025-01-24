// useEditor.js
import {
  handleAutoComplete,
  handleCommandEnter,
  handlePairedDeletion,
  PAIRED_CHARS,
} from '@/lib/editorUtils';
import { useCallback, useRef } from 'react';

// useEditor.js
export const useEditor = (code, setCode, onRun) => {
  const textareaRef = useRef(null);

  const setCursorPosition = useCallback(position => {
    if (!textareaRef.current) return;
    setTimeout(() => {
      textareaRef.current.setSelectionRange(position, position);
    }, 0);
  }, []);

  const getLineIndentation = useCallback((text, lineStart) => {
    const lineEnd = text.indexOf('\n', lineStart);
    const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd);
    const match = line.match(/^[\t ]*/);
    return match ? match[0] : '';
  }, []);

  const handleKeyDown = useCallback(
    e => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Handle tab key
      if (e.key === 'Tab') {
        e.preventDefault();
        const tabChar = '\t';
        const newCode = code.slice(0, start) + tabChar + code.slice(end);
        setCode(newCode);
        setCursorPosition(start + 1);
        return;
      }

      // Handle command+enter first
      if (handleCommandEnter(e, onRun)) return;

      // Handle regular Enter key
      if (e.key === 'Enter') {
        e.preventDefault();

        // Find start of current line
        const lineStart = code.lastIndexOf('\n', start - 1) + 1;

        // Get current line's indentation
        const indentation = getLineIndentation(code, lineStart);

        // Check if current line is empty except for indentation
        const lineEnd = code.indexOf('\n', start);
        const currentLine = code.slice(
          lineStart,
          lineEnd === -1 ? code.length : lineEnd
        );
        const isEmptyLine = currentLine === indentation;

        // If line is empty, remove indentation
        const newLineContent = isEmptyLine ? '\n' : '\n' + indentation;

        const newCode = code.slice(0, start) + newLineContent + code.slice(end);
        setCode(newCode);
        setCursorPosition(start + newLineContent.length);
        return;
      }

      // Handle auto-completion
      if (PAIRED_CHARS.hasOwnProperty(e.key)) {
        e.preventDefault();
        const result = handleAutoComplete(code, start, end, e.key);
        if (result) {
          setCode(result.newCode);
          setCursorPosition(result.newCursorPosition);
        }
        return;
      }

      // Handle paired deletion
      if (e.key === 'Backspace' || e.key === 'Delete') {
        const result = handlePairedDeletion(code, start, end, e.key);
        if (result) {
          e.preventDefault();
          setCode(result.newCode);
          setCursorPosition(result.newCursorPosition);
        }
      }
    },
    [code, setCode, onRun, setCursorPosition, getLineIndentation]
  );

  return {
    textareaRef,
    handleKeyDown,
  };
};
