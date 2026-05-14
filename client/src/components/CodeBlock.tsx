import React from "react";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  copyable?: boolean;
  className?: string;
}

export function CodeBlock({
  code,
  language = "plaintext",
  copyable = true,
  className = "",
}: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative bg-slate-900 border border-slate-700 rounded-lg overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-xs text-slate-400 font-medium">{language}</span>
        {copyable && (
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
            title="Copy code"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-slate-400" />
            )}
          </button>
        )}
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-cyan-300 text-sm font-mono leading-relaxed whitespace-pre-wrap break-words">
          {code}
        </code>
      </pre>
    </div>
  );
}
