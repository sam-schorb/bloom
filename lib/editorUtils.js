// editorUtils.js
export const PAIRED_CHARS = {
  '(': ')',
  "'": "'",
  // Can be extended with more pairs like:
  // '{': '}',
  // '[': ']',
  // '"': '"'
};

export const handleAutoComplete = (code, selectionStart, selectionEnd, key) => {
  const closeChar = PAIRED_CHARS[key];
  if (!closeChar) return null;

  const insertText = key + closeChar;
  const newCode =
    code.slice(0, selectionStart) + insertText + code.slice(selectionEnd);
  const newCursorPosition = selectionStart + 1;

  return {
    newCode,
    newCursorPosition,
  };
};

export const handlePairedDeletion = (
  code,
  selectionStart,
  selectionEnd,
  key
) => {
  if (selectionStart !== selectionEnd) return null;

  const prevChar = code[selectionStart - 1];
  const nextChar = code[selectionStart];

  const isPaired = Object.entries(PAIRED_CHARS).some(
    ([open, close]) => prevChar === open && nextChar === close
  );

  if (!isPaired) return null;

  const newCode =
    code.slice(0, selectionStart - 1) + code.slice(selectionStart + 1);
  const newCursorPosition = selectionStart - 1;

  return {
    newCode,
    newCursorPosition,
  };
};

export const handleCommandEnter = (event, onRun) => {
  if (event.metaKey && event.key === 'Enter') {
    event.preventDefault();
    onRun();
    return true;
  }
  return false;
};
