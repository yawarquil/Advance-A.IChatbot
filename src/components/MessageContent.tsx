import React from 'react';
import CodeBlock from './CodeBlock';

interface MessageContentProps {
  text: string;
}

const MessageContent: React.FC<MessageContentProps> = ({ text }) => {
  // Parse message content to extract code blocks
  const parseContent = (content: string) => {
    const parts = [];
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    const inlineCodeRegex = /`([^`]+)`/g;
    
    let lastIndex = 0;
    let match;

    // Find code blocks
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textBefore = content.slice(lastIndex, match.index);
        parts.push({ type: 'text', content: textBefore });
      }

      // Add code block
      const language = match[1] || 'text';
      const code = match[2].trim();
      parts.push({ type: 'code', content: code, language });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.slice(lastIndex) });
    }

    return parts;
  };

  // Process inline code in text parts
  const processInlineCode = (text: string) => {
    const parts = [];
    const inlineCodeRegex = /`([^`]+)`/g;
    let lastIndex = 0;
    let match;

    while ((match = inlineCodeRegex.exec(text)) !== null) {
      // Add text before inline code
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }

      // Add inline code
      parts.push({
        type: 'inline-code',
        content: match[1]
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    return parts;
  };

  const contentParts = parseContent(text);

  return (
    <div>
      {contentParts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <CodeBlock
              key={index}
              code={part.content}
              language={part.language}
            />
          );
        } else if (part.type === 'text') {
          const inlineParts = processInlineCode(part.content);
          return (
            <span key={index}>
              {inlineParts.map((inlinePart, inlineIndex) => {
                if (inlinePart.type === 'inline-code') {
                  return (
                    <code
                      key={inlineIndex}
                      className="bg-gray-800 text-gray-100 px-1.5 py-0.5 rounded text-sm font-mono border border-gray-700"
                    >
                      {inlinePart.content}
                    </code>
                  );
                } else {
                  return (
                    <span key={inlineIndex} className="whitespace-pre-wrap">
                      {inlinePart.content}
                    </span>
                  );
                }
              })}
            </span>
          );
        }
        return null;
      })}
    </div>
  );
};

export default MessageContent;