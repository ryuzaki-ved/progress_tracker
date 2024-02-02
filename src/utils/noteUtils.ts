import React from 'react';

// Types for the handler
export type CheckboxToggleHandler = (
  noteId: string,
  lineIndex: number,
  charIndex: number,
  isChecked: boolean
) => void;

// Markdown parsing utility
export function renderMarkdownContent(
  content: string,
  noteId: string,
  handleCheckboxToggle?: CheckboxToggleHandler
): React.ReactNode[] {
  if (!content) return [];
  const lines = content.split(/\r?\n/);
  // Return an array of React elements, each line separated by <br /> except the last
  const elements: React.ReactNode[] = [];
  lines.forEach((line, lineIndex) => {
    // Checkbox pattern: [ ] or [x] at start of line
    const checkboxMatch = line.match(/^\s*\[( |x)\]\s(.*)$/i);
    if (checkboxMatch) {
      const isChecked = checkboxMatch[1].toLowerCase() === 'x';
      const text = checkboxMatch[2];
      // Render the rest of the line as markdown
      const renderedText = parseInlineMarkdown(text);
      elements.push(
        React.createElement(
          'span',
          {
            key: `checkbox-${lineIndex}`,
            className: 'flex items-center cursor-pointer select-none gap-2 text-sm text-gray-600 dark:text-gray-300',
            onClick: () => {
              if (handleCheckboxToggle) {
                handleCheckboxToggle(noteId, lineIndex, 0, !isChecked);
              }
            }
          },
          [
            React.createElement('input', {
              type: 'checkbox',
              checked: isChecked,
              readOnly: true,
              'data-line-index': lineIndex,
              'data-char-index': 0,
              className: 'accent-primary cursor-pointer',
              tabIndex: -1,
              key: 'input'
            }),
            React.createElement('span', { key: 'text' }, renderedText)
          ]
        )
      );
    } else {
      // Render normal line with inline markdown and previous text styling
      elements.push(
        React.createElement(
          'span',
          { key: `line-${lineIndex}`, className: 'text-sm text-gray-600 dark:text-gray-300' },
          parseInlineMarkdown(line)
        )
      );
    }
    // Add <br /> after each line except the last
    if (lineIndex < lines.length - 1) {
      elements.push(React.createElement('br', { key: `br-${lineIndex}` }));
    }
  });
  return elements;
}

// Helper to parse inline markdown (bold, italic, strikethrough, underline)
function parseInlineMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];
  // Order: bold, italic, strikethrough, underline
  let nodes: React.ReactNode[] = [text];

  // Bold: **text**
  nodes = nodes.flatMap(node =>
    typeof node === 'string'
      ? splitAndWrap(node, /\*\*(.+?)\*\*/g, (m, i) => React.createElement('strong', { key: `b-${i}` }, m))
      : [node]
  );
  // Italic: *text*
  nodes = nodes.flatMap(node =>
    typeof node === 'string'
      ? splitAndWrap(node, /\*(.+?)\*/g, (m, i) => React.createElement('em', { key: `i-${i}` }, m))
      : [node]
  );
  // Strikethrough: ~~text~~
  nodes = nodes.flatMap(node =>
    typeof node === 'string'
      ? splitAndWrap(node, /~~(.+?)~~/g, (m, i) => React.createElement('del', { key: `d-${i}` }, m))
      : [node]
  );
  // Underline: __text__
  nodes = nodes.flatMap(node =>
    typeof node === 'string'
      ? splitAndWrap(node, /__(.+?)__/g, (m, i) => React.createElement('u', { key: `u-${i}` }, m))
      : [node]
  );
  return nodes;
}

// Helper to split and wrap matches
function splitAndWrap(
  text: string,
  regex: RegExp,
  wrap: (match: string, idx: number) => React.ReactNode
): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let idx = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }
    result.push(wrap(match[1], idx++));
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }
  return result;
} 