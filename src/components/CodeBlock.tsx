import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'javascript' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  // Detect language from code content if not provided
  const detectLanguage = (code: string): string => {
    if (code.includes('import ') || code.includes('export ') || code.includes('const ') || code.includes('function ')) {
      if (code.includes('<') && code.includes('>')) return 'jsx';
      return 'javascript';
    }
    if (code.includes('def ') || code.includes('import ') && code.includes('from ')) return 'python';
    if (code.includes('#include') || code.includes('int main')) return 'cpp';
    if (code.includes('public class') || code.includes('System.out')) return 'java';
    if (code.includes('SELECT') || code.includes('CREATE TABLE')) return 'sql';
    if (code.includes('<!DOCTYPE') || code.includes('<html')) return 'html';
    if (code.includes('{') && code.includes('}') && code.includes(':')) return 'css';
    return 'text';
  };

  const detectedLanguage = language === 'javascript' ? detectLanguage(code) : language;

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden my-3 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-sm text-gray-300 font-medium capitalize">
          {detectedLanguage}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={detectedLanguage}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.875rem',
            lineHeight: '1.5',
          }}
          showLineNumbers={code.split('\n').length > 5}
          lineNumberStyle={{
            color: '#6b7280',
            paddingRight: '1rem',
            minWidth: '2rem',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodeBlock;