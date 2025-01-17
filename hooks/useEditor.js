// useEditor.js
import {
  handleAutoComplete,
  handleCommandEnter,
  handlePairedDeletion,
  PAIRED_CHARS,
} from '@/lib/editorUtils';
import { useCallback, useRef } from 'react';

export const useEditor = (code, setCode, onRun) => {
  const textareaRef = useRef(null);

  const setCursorPosition = useCallback(position => {
    if (!textareaRef.current) return;

    setTimeout(() => {
      textareaRef.current.setSelectionRange(position, position);
    }, 0);
  }, []);

  const handleKeyDown = useCallback(
    e => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Handle command+enter
      if (handleCommandEnter(e, onRun)) return;

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
    [code, setCode, onRun, setCursorPosition]
  );

  return {
    textareaRef,
    handleKeyDown,
  };
};
